import connectDB from '@/lib/mongoose';
import User from '@/models/User';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const subscriptionSchema = z.object({
  user_name: z.string().min(3),
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

    const { user_name, plan, duration, payment_method, payment_id } = validation.data;

    const user = await User.findOne({ 'subs_credentials.user_name': user_name });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Calculate expiry date
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + duration);

    // Update user's subscription
    user.other_preferences.plan = plan;
    user.other_preferences.plan_expiry = expiryDate;

    // Track payment details
    user.payment = {
      method: payment_method,
      transaction_id: payment_id,
      date: new Date()
    };

    await user.save();

    return NextResponse.json({
      success: true,
      other_preferences: {
        plan: user.other_preferences.plan,
        plan_expiry: user.other_preferences.plan_expiry
      }
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
    const user_name = searchParams.get('user_name');

    if (!user_name) {
      return NextResponse.json(
        { error: 'user_name parameter is required' },
        { status: 400 }
      );
    }

    const user = await User.findOne({
      'subs_credentials.user_name': user_name
    }).select('other_preferences devices');

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const isActive = user.other_preferences.plan_expiry > new Date();
    const remainingDays = isActive
      ? Math.ceil(
          (user.other_preferences.plan_expiry.getTime() - Date.now()) /
          (1000 * 60 * 60 * 24)
        )
      : 0;

    return NextResponse.json({
      other_preferences: {
        plan: user.other_preferences.plan,
        plan_expiry: user.other_preferences.plan_expiry,
      },
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
