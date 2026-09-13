import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { updateUserPreferences, findUserById } from '@/lib/userStore';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const fullUser = await findUserById(user.id);
    const tasks = fullUser?.preferences?.tasks || [];
    return NextResponse.json({ tasks });
  } catch (error) {
    console.error('Tasks GET Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { tasks } = await req.json();
    if (!Array.isArray(tasks)) {
      return NextResponse.json({ error: 'Tasks must be an array' }, { status: 400 });
    }

    await updateUserPreferences(user.id, { tasks });
    return NextResponse.json({ success: true, tasks });
  } catch (error) {
    console.error('Tasks POST Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
