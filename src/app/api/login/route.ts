import connectDB from '@/lib/mongoose';
import User from '@/models/User';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  await connectDB();

  try {
    const { username, password, device_id } = await req.json();
    const user = await User.findOne({ 'subs_credentials.user_name': username });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    if (user.plan_expiry < new Date()) {
      return NextResponse.json(
        { error: 'Subscription expired' },
        { status: 403 }
      );
    }

    const validPassword = await bcrypt.compare(
      password,
      user.subs_credentials.password
    );

    if (!validPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    if (user.devices.length > 0) {
      // Check if device is already registered
      if (!user.devices.includes(device_id)) {
        return NextResponse.json(
          { error: 'Device limit reached. Logout from other device first.' },
          { status: 403 }
        );
      }
    } else {
      // Add first device
      user.devices.push(device_id);
      await user.save();
    }
    // Recheck expiry after potential updates
    const isActive = user.plan_expiry > new Date();
    return NextResponse.json({
      success: true,
      plan_expiry: user.plan_expiry,
      isActive,
      remainingDays: Math.ceil((user.plan_expiry.getTime() - Date.now()) / 86400000)
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
