import { NextResponse } from 'next/server';
import { findUserByEmail, createUser } from '@/lib/userStore';
import { signToken } from '@/lib/auth';

export async function POST(req) {
  try {
    const { name, email, password } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existing = await findUserByEmail(cleanEmail);
    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Please log in.' },
        { status: 409 }
      );
    }

    // Create user
    const user = await createUser({
      name: name.trim(),
      email: cleanEmail,
      password,
    });

    const token = signToken({ id: user.id, email: user.email });

    return NextResponse.json(
      {
        message: 'Account created successfully!',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          isOnboarded: user.isOnboarded !== undefined ? user.isOnboarded : true,
          academicProfile: user.academicProfile || user.academic_profile || { educationLevel: 'University' },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: error.message || 'Registration failed. Please try again.' },
      { status: 500 }
    );
  }
}
