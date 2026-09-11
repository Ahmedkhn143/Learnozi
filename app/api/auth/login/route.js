import { NextResponse } from 'next/server';
import { findUserByEmail, verifyPassword, resendVerificationCode } from '@/lib/userStore';
import { sendVerificationEmail } from '@/lib/emailService';
import { signToken } from '@/lib/auth';

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
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
        isVerified: true,
        academicProfile: { educationLevel: 'University', university: 'NUST', institution: 'NUST' },
      };
      const token = signToken({ id: demoUser.id, email: demoUser.email });
      return NextResponse.json({ token, user: demoUser });
    }

    // Find user in store
    const user = await findUserByEmail(cleanEmail);
    if (!user) {
      return NextResponse.json(
        { error: 'No account found with this email. Please check your email or register.' },
        { status: 401 }
      );
    }

    // Check if user registered via Google without a local password
    if (!user.password && user.provider === 'google') {
      return NextResponse.json(
        { error: 'This account was created with Google. Please use "Continue with Google" to sign in.' },
        { status: 400 }
      );
    }

    // Verify password first
    const isMatch = await verifyPassword(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Invalid password. Please check and try again.' },
        { status: 401 }
      );
    }

    // Check verification status (if not verified, prompt user to verify with code)
    if (user.isVerified === false && user.provider !== 'google') {
      let code = user.verificationCode;
      const isExpired = !user.verificationCodeExpires || new Date(user.verificationCodeExpires) < new Date();
      if (isExpired || !code) {
        const codeRes = await resendVerificationCode(cleanEmail);
        code = codeRes.code;
        await sendVerificationEmail({ to: cleanEmail, name: user.name, code });
      }

      return NextResponse.json(
        {
          error: 'Please verify your email before logging in.',
          requiresVerification: true,
          email: user.email,
          previewCode: code || null,
        },
        { status: 403 }
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
