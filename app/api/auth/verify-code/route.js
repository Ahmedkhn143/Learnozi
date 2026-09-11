import { NextResponse } from 'next/server';
import { verifyUserEmail } from '@/lib/userStore';
import { signToken } from '@/lib/auth';

export async function POST(req) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email and verification code are required.' },
        { status: 400 }
      );
    }

    const result = await verifyUserEmail(email, code);
    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    const user = result.user;
    const token = signToken({ id: user.id, email: user.email });

    return NextResponse.json({
      message: 'Account verified successfully! Welcome to Learnozi.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        isOnboarded: user.isOnboarded ?? true,
        academicProfile: user.academicProfile || user.academic_profile || { educationLevel: 'University' },
      },
    });
  } catch (error) {
    console.error('Verify code error:', error);
    return NextResponse.json(
      { error: error.message || 'Verification failed. Please try again.' },
      { status: 500 }
    );
  }
}
