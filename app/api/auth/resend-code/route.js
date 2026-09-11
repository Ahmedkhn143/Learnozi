import { NextResponse } from 'next/server';
import { resendVerificationCode } from '@/lib/userStore';
import { sendVerificationEmail } from '@/lib/emailService';

export async function POST(req) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required.' },
        { status: 400 }
      );
    }

    const result = await resendVerificationCode(email);
    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    await sendVerificationEmail({
      to: email,
      name: result.user?.name || 'Student',
      code: result.code,
    });

    return NextResponse.json({
      message: 'A new 6-digit verification code has been sent to your email.',
      previewCode: result.code,
    });
  } catch (error) {
    console.error('Resend code error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to resend code.' },
      { status: 500 }
    );
  }
}
