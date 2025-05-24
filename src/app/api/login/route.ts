import connectDB from '@/lib/mongoose';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function POST(req: NextRequest) {
  try {
    const { username, password, deviceId } = await req.json();

    // Connect to DB explicitly (in case connection drops)
    await connectDB();

    // 1. Find user with proper null check
    const user = await User.findOne({ 'subs_credentials.user_name': username });
    if (!user) {
      console.log('User not found:', username);
      return NextResponse.json(
        { code: 'INVALID_CREDENTIALS', error: 'User not found' },
        { status: 401, headers: corsHeaders }
      );
    }

    // 2. Compare passwords safely
    const validPass = await bcrypt.compare(
      password,
      user.subs_credentials.password
    ).catch((bcryptError) => {
      console.error('Bcrypt compare error:', bcryptError);
      return false;
    });

    if (!validPass) {
      console.log('Invalid password for user:', username);
      return NextResponse.json(
        { code: 'INVALID_CREDENTIALS', error: 'Invalid password' },
        { status: 401, headers: corsHeaders }
      );
    }

    // 3. Validate device ID format
    if (!user.devices.some(d => d.trim() === deviceId?.trim())) {
      console.log('Device mismatch:', deviceId, 'User devices:', user.devices);
      return NextResponse.json(
        { code: 'DEVICE_MISMATCH', error: 'Device not registered' },
        { status: 403, headers: corsHeaders }
      );
    }

    // 4. Handle nested expiry date safely
    const planExpiry = user.other_preferences?.plan_expiry
      ? new Date(user.other_preferences.plan_expiry).toISOString()
      : new Date().toISOString();

    return NextResponse.json(
      {
        plan: user.plan || 'free',
        plan_expiry: planExpiry,
        other_preferences: user.other_preferences
      },
      { status: 200, headers: corsHeaders }
    );

  } catch (error) {
    // Improved error logging
    console.error('Server error details:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : null,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json(
      { code: 'SERVER_ERROR', error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json(null, {
    status: 204,
    headers: corsHeaders
  });
}
