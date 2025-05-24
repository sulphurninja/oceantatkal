import connectDB from '@/lib/mongoose';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const { username, password, deviceId } = await req.json();

  try {
    const user = await User.findOne({
      'subs_credentials.user_name': username
    });

    if (!user) {
      return new Response(JSON.stringify({
        code: 'INVALID_CREDENTIALS',
        error: 'User not found'
      }), { status: 401 });
    }

    const validPass = await bcrypt.compare(
      password,
      user.subs_credentials.password
    );

    if (!validPass) {
      return new Response(JSON.stringify({
        code: 'INVALID_CREDENTIALS',
        error: 'Invalid password'
      }), { status: 401 });
    }

    // Device check
    if (!user.devices.includes(deviceId)) {
      return new Response(JSON.stringify({
        code: 'DEVICE_MISMATCH',
        error: 'Device not registered'
      }), { status: 403 });
    }

    return new Response(JSON.stringify({
      plan: user.plan || 'A',
      plan_expiry: user.plan_expiry || new Date().toISOString(),
      other_preferences: {
        plan: user.other_preferences?.plan || 'A',
        plan_expiry: user.other_preferences?.plan_expiry || new Date().toISOString()
      }
    }), { status: 200 });

  } catch (error) {
    console.error('Login error:', error);
    return new Response(JSON.stringify({
      code: 'SERVER_ERROR',
      error: 'Internal server error'
    }), { status: 500 });
  }
}
