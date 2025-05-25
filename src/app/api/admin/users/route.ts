import { NextResponse } from 'next/server';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import connectDB from '@/lib/mongoose';
import mongoose from 'mongoose';

// Validation schema
const userSchema = z.object({
  subs_credentials: z.object({
    user_name: z.string().min(3),
    password: z.string().min(6)
  }),
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

    const { subs_credentials, isAdmin } = validation.data;

    // Check if user already exists
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

    const initialExpiry = new Date();
    initialExpiry.setDate(initialExpiry.getDate() + 30);

    // Instead of using the schema, directly insert into MongoDB with the required username field
    const usersCollection = mongoose.connection.collection('users');

    const result = await usersCollection.insertOne({
      subs_credentials: {
        user_name: subs_credentials.user_name,
        password: hashedPassword
      },
      // Add this field to satisfy the unique index constraint
      username: subs_credentials.user_name,
      plan_expiry: initialExpiry,
      isAdmin: isAdmin || false,
      devices: [],
      createdAt: new Date()
    });

    const user = await User.findById(result.insertedId);

    return NextResponse.json({
      _id: user._id,
      user_name: user.subs_credentials.user_name,
      plan_expiry: user.plan_expiry
    });

  } catch (error) {
    console.error('User creation error:', error);

    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 400 }
      );
    }

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
      .select('-subs_credentials.password -__v -payment')
      .lean();

    return NextResponse.json(users.map(user => ({
      _id: user._id,
      username: user.subs_credentials.user_name,
      plan_expiry: user.plan_expiry?.toISOString(),
      devices: user.devices,
      isAdmin: user.isAdmin,
      created_at: user.createdAt.toISOString()
    })));

  } catch (error) {
    console.error('Users fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
