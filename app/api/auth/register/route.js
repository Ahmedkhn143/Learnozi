import { NextResponse } from 'next/server';
import { findUserByEmail, createUser } from '@/lib/userStore';
import { sendVerificationEmail } from '@/lib/emailService';

export async function POST(req) {
  try {
    const { name, email, password, educationLevel, institution, fieldOfStudy } = await req.json();

    if (!email || !name) {
      return NextResponse.json(
        { error: 'Full name and email are required.' },
        { status: 400 }
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existing = await findUserByEmail(cleanEmail);
    if (existing) {
      if (existing.isVerified) {
        return NextResponse.json(
          { error: 'An account with this email already exists. Please log in.' },
          { status: 409 }
        );
      }
      // If user exists but is NOT verified, we can resend them a verification code
      const newCode = Math.floor(100000 + Math.random() * 900000).toString();
      existing.verificationCode = newCode;
      existing.verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      await sendVerificationEmail({ to: cleanEmail, name: existing.name, code: newCode });

      return NextResponse.json(
        {
          message: 'Account is pending email verification. A new 6-digit code has been sent to your email.',
          requiresVerification: true,
          email: cleanEmail,
          previewCode: newCode,
        },
        { status: 200 }
      );
    }

    // Generate 6-digit verification passcode
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Create user with isVerified = false
    const newUser = await createUser({
      name: name.trim(),
      email: cleanEmail,
      password,
      isVerified: false,
      verificationCode,
      academicProfile: {
        educationLevel: educationLevel || 'University',
        institution: institution || '',
        university: institution || '',
        fieldOfStudy: fieldOfStudy || '',
      },
    });

    // Send email dispatch
    await sendVerificationEmail({
      to: cleanEmail,
      name: name.trim(),
      code: verificationCode,
    });

    return NextResponse.json(
      {
        message: 'Student account created! We sent a 6-digit verification code to your email.',
        requiresVerification: true,
        email: cleanEmail,
        previewCode: verificationCode,
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
