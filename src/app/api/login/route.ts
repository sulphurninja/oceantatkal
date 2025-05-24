import connectDB from '@/lib/mongoose';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const { subs_credentials, deviceId } = await req.json();

  try {
    const user = await User.findOne({
      'subs_credentials.user_name': subs_credentials.user_name
    });

    const validPass = await bcrypt.compare(
      subs_credentials.password,
      user.subs_credentials.password
    );

    // Device check remains same
    if (!user.devices.includes(deviceId)) {
      return new Response(JSON.stringify({
        code: 'DEVICE_MISMATCH',
        error: 'Device not registered'
      }), { status: 403 });
    }

    return new Response(JSON.stringify({
      other_preferences: {
        plan: user.other_preferences.plan,
        plan_expiry: user.other_preferences.plan_expiry
      }
    }), { status: 200 });
  } catch (error) {
    console.error('Login error:', error);
  }
}
