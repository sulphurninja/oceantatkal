
import connectDB from '@/lib/mongoose';
import User from '@/models/User';
import { NextResponse } from 'next/server';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  await connectDB();

  try {
    const { expiry } = await req.json();
    const user = await User.findByIdAndUpdate(
      params.id,
      { plan_expiry: new Date(expiry) },
      { new: true }
    );

    return NextResponse.json(user);

  } catch (error) {
    console.error('Update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
