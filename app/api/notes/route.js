import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { updateUserPreferences, findUserById } from '@/lib/userStore';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const fullUser = await findUserById(user.id);
    const notes = fullUser?.preferences?.notes || [];
    return NextResponse.json({ notes });
  } catch (error) {
    console.error('Notes GET Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { notes } = await req.json();
    if (!Array.isArray(notes)) {
      return NextResponse.json({ error: 'Notes must be an array' }, { status: 400 });
    }

    await updateUserPreferences(user.id, { notes });
    return NextResponse.json({ success: true, notes });
  } catch (error) {
    console.error('Notes POST Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
