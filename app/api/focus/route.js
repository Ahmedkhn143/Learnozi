import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { getFocusStats, logFocusSession } from '@/lib/focusStore';

export async function GET(req) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const stats = await getFocusStats(user.id);
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Focus GET API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { subject, durationMin, completed } = body;

    const duration = Number(durationMin);
    if (!duration || duration < 1) {
      return NextResponse.json({ error: 'durationMin is required and must be at least 1' }, { status: 400 });
    }

    const session = await logFocusSession(user.id, {
      subject: subject || 'General',
      durationMin: duration,
      completed: completed !== false
    });

    const updatedStats = await getFocusStats(user.id);

    return NextResponse.json({
      session,
      ...updatedStats
    }, { status: 201 });
  } catch (error) {
    console.error('Focus POST API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}


