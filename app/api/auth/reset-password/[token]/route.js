import { NextResponse } from 'next/server';
import { resetPassword } from '@/lib/userStore';
import { signToken } from '@/lib/auth';

export async function POST(req, context) {
  try {
    const params = await context.params;
    const token = params?.token;
    const body = await req.json();
    const { password } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'Password reset token is missing.' },
        { status: 400 }
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    const updatedUser = await resetPassword(token, password);

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'This password reset link is invalid or has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    const authToken = signToken({ id: updatedUser.id, email: updatedUser.email });

    return NextResponse.json({
      success: true,
      message: 'Your password has been successfully reset!',
      token: authToken,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        avatar: updatedUser.avatar,
        isOnboarded: updatedUser.isOnboarded !== undefined ? updatedUser.isOnboarded : true,
        academicProfile: updatedUser.academicProfile || updatedUser.academic_profile || { educationLevel: 'University' },
      },
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to reset password. Please try again.' },
      { status: 500 }
    );
  }
}
