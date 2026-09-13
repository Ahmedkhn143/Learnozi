import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { getSemesters, createSemester } from '@/lib/academicsStore';

export async function GET(req) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const semesters = await getSemesters(user.id);
    return NextResponse.json({ semesters });
  } catch (error) {
    console.error('Academics GET Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { name, startDate, endDate } = body;

    if (!name || !startDate || !endDate) {
      return NextResponse.json({ error: 'Name, start date, and end date are required' }, { status: 400 });
    }

    const semester = await createSemester(user.id, { name, startDate, endDate });
    return NextResponse.json({ semester }, { status: 201 });
  } catch (error) {
    console.error('Academics POST Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
