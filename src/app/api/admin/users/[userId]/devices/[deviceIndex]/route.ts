import { NextResponse } from 'next/server';
import User from '@/models/User';
import connectDB from '@/lib/mongoose';

export async function DELETE(
  req: Request,
  { params }: { params: { userId: string; deviceIndex: string } }
) {
  await connectDB();

  try {
    const { userId, deviceIndex } = params;
    const index = parseInt(deviceIndex);

    console.log("Removing device", { userId, deviceIndex, index }); // Add debugging

    if (isNaN(index)) {
      return NextResponse.json(
        { error: 'Invalid device index' },
        { status: 400 }
      );
    }

    // Find the user
    const user = await User.findById(userId);

    if (!user) {
      console.log("User not found:", userId);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    console.log("Found user:", user._id, "with devices:", user.devices);

    // Check if the device index is valid
    if (index < 0 || index >= user.devices.length) {
      return NextResponse.json(
        { error: 'Device index out of bounds' },
        { status: 400 }
      );
    }

    // Remove the device at the specified index
    user.devices.splice(index, 1);
    await user.save();

    console.log("Device removed successfully");

    return NextResponse.json(
      { message: 'Device removed successfully' }
    );

  } catch (error) {
    console.error('Device removal error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
