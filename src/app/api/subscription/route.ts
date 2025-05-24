import connectDB from '@/lib/mongoose';
import User from '@/models/User';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const subscriptionSchema = z.object({
  username: z.string().min(3),
});

export async function GET(req: Request) {
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

    const { username} = validation.data;
    const user = await User.findOne({ 'subs_credentials.user_name': username });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }



    const isActive = user.plan_expiry > new Date();
    const remainingDays = Math.ceil(
      (user.plan_expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    return NextResponse.json({
      valid: isActive,
      expiry: user.plan_expiry,
      remaining_days: remainingDays > 0 ? remainingDays : 0
    });

  } catch (error) {
    console.error('Subscription check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
