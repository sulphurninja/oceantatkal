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

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  await connectDB();

  const url = new URL(req.url);
  const deviceIndex = url.searchParams.get('deviceIndex');

  if (!deviceIndex) {
    return NextResponse.json({ error: 'Device index is required' }, { status: 400 });
  }

  try {
    const { id } = params;
    const index = parseInt(deviceIndex);

    if (isNaN(index)) {
      return NextResponse.json({ error: 'Invalid device index' }, { status: 400 });
    }

    // Find the user
    const user = await User.findById(id);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if the device index is valid
    if (index < 0 || index >= user.devices.length) {
      return NextResponse.json({ error: 'Device index out of bounds' }, { status: 400 });
    }

    // Remove the device at the specified index
    user.devices.splice(index, 1);
    await user.save();

    return NextResponse.json({ message: 'Device removed successfully' });

  } catch (error) {
    console.error('Device removal error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
