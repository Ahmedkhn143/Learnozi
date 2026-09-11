import { NextResponse } from 'next/server';
import { findUserByEmail, createPasswordResetToken } from '@/lib/userStore';
import { sendPasswordResetEmail } from '@/lib/emailService';

export async function POST(req) {
  try {
    const { email } = await req.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await findUserByEmail(cleanEmail);

    if (!user) {
      return NextResponse.json(
        { error: 'No account found with this email address.' },
        { status: 404 }
      );
    }

    const { token, expiresAt } = await createPasswordResetToken(cleanEmail);

    // Send email dispatch
    await sendPasswordResetEmail({
      to: cleanEmail,
      name: user.name || 'Student',
      code: token,
    });

    return NextResponse.json({
      success: true,
      message: 'Password reset code has been sent to your email.',
      resetToken: token,
      resetUrl: `/reset-password/${token}`,
      previewCode: token,
      expiresAt,
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process password reset request.' },
      { status: 500 }
    );
  }
}
