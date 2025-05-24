import { NextResponse } from 'next/server';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import connectDB from '@/lib/mongoose';

const userSchema = z.object({
  subs_credentials: z.object({
    user_name: z.string().min(3),
    password: z.string().min(6)
  }),
  other_preferences: z.object({
    plan: z.enum(['free', 'basic', 'premium']),
    plan_expiry: z.string().datetime()
  }),
  devices: z.array(z.string()).optional(),
  isAdmin: z.boolean().optional().default(false)
});

export async function POST(req: Request) {
  await connectDB();

  try {
    const body = await req.json();
    const validation = userSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({
        error: validation.error.flatten()
      }, { status: 400 });
    }

    const { subs_credentials, other_preferences, devices, isAdmin } = validation.data;

    const exists = await User.findOne({
      'subs_credentials.user_name': subs_credentials.user_name
    });

    if (exists) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(subs_credentials.password, 10);

    const user = await User.create({
      subs_credentials: {
        user_name: subs_credentials.user_name,
        password: hashedPassword
      },
      other_preferences: {
        plan: other_preferences.plan,
        plan_expiry: new Date(other_preferences.plan_expiry)
      },
      devices: devices || [],
      isAdmin
    });

    return NextResponse.json({
      _id: user._id,
      subs_credentials: {
        user_name: user.subs_credentials.user_name
      },
      other_preferences: {
        plan: user.other_preferences.plan,
        plan_expiry: user.other_preferences.plan_expiry
      },
      devices: user.devices
    });

  } catch (error) {
    console.error('User creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  await connectDB();

  try {
    const users = await User.find()
      .select('-subs_credentials.password -__v')
      .lean();

    return NextResponse.json(users.map(user => ({
      ...user,
      other_preferences: {
        ...user.other_preferences,
        plan_expiry: user.other_preferences.plan_expiry.toISOString()
      }
    })));

  } catch (error) {
    console.error('Users fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
