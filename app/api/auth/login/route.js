import { NextResponse } from 'next/server';
import { findUserByEmail, verifyPassword } from '@/lib/userStore';
import { signToken } from '@/lib/auth';

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    // Quick demo student handler
    if ((cleanEmail === 'demo@learnozi.com' || cleanEmail === 'demo') && (password === 'demo1234' || password === 'demo')) {
      const demoUser = {
        id: 'demo_user_123',
        name: 'Demo Student',
        email: 'demo@learnozi.com',
        isOnboarded: true,
        academicProfile: { educationLevel: 'University', university: 'NUST' },
      };
      const token = signToken({ id: demoUser.id, email: demoUser.email });
      return NextResponse.json({ token, user: demoUser });
    }

    // Find user in store
    const user = await findUserByEmail(cleanEmail);
    if (!user) {
      return NextResponse.json(
        { error: 'No account found with this email. Please check your email or sign up.' },
        { status: 401 }
      );
    }

    // Check if user registered via Google without a local password
    if (!user.password && user.provider === 'google') {
      return NextResponse.json(
        { error: 'This account was created with Google. Please use "Continue with Google" to log in.' },
        { status: 400 }
      );
    }

    // Verify password
    const isMatch = await verifyPassword(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Invalid email or password. Please try again.' },
        { status: 401 }
      );
    }

    // Sign JWT token
    const token = signToken({ id: user.id, email: user.email });

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        isOnboarded: user.isOnboarded !== undefined ? user.isOnboarded : true,
        academicProfile: user.academicProfile || user.academic_profile || { educationLevel: 'University' },
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
