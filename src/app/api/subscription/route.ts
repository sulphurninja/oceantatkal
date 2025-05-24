import connectDB from '@/lib/mongoose';
import User from '@/models/User';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const subscriptionSchema = z.object({
  username: z.string().min(3),
  plan: z.enum(['free', 'basic', 'premium']),
  duration: z.number().min(1).max(12),
  payment_method: z.enum(['stripe', 'razorpay']),
  payment_id: z.string()
});

export async function POST(req: Request) {
  await connectDB();

  try {
    const body = await req.json();
    const validation = subscriptionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { username, plan, duration, payment_method, payment_id } = validation.data;

    const user = await User.findOne({ 'subs_credentials.user_name': username });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update root-level fields
    user.plan = plan;
    user.plan_expiry = new Date();
    user.plan_expiry.setMonth(user.plan_expiry.getMonth() + duration);

    // Track payment details
    user.payment = {
      method: payment_method,
      transaction_id: payment_id,
      date: new Date()
    };

    await user.save();

    return NextResponse.json({
      success: true,
      plan: user.plan,
      plan_expiry: user.plan_expiry
    });

  } catch (error) {
    console.error('Subscription update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  await connectDB();

  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json(
        { error: 'username parameter is required' },
        { status: 400 }
      );
    }

    const user = await User.findOne({
      'subs_credentials.user_name': username
    }).select('plan plan_expiry devices');

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const isActive = user.plan_expiry > new Date();
    const remainingDays = isActive
      ? Math.ceil(
          (user.plan_expiry.getTime() - Date.now()) /
          (1000 * 60 * 60 * 24)
        )
      : 0;

    return NextResponse.json({
      plan: user.plan,
      plan_expiry: user.plan_expiry,
      devices: user.devices,
      isActive,
      remainingDays
    });

  } catch (error) {
    console.error('Subscription check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
