import { NextResponse } from 'next/server';
import { upsertGoogleUser } from '@/lib/userStore';
import { signToken } from '@/lib/auth';

export async function POST(req) {
  try {
    const { name, email, avatar, googleId } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required for Google Sign-In' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    // Upsert user in userStore
    const user = await upsertGoogleUser({
      name: name || cleanEmail.split('@')[0],
      email: cleanEmail,
      avatar,
      googleId,
    });

    const token = signToken({ id: user.id, email: user.email });

    return NextResponse.json({
      message: 'Google authentication successful',
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
    console.error('Google auth route error:', error);
    return NextResponse.json(
      { error: error.message || 'Google authentication failed' },
      { status: 500 }
    );
  }
}
