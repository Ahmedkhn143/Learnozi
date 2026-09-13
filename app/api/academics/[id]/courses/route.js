import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { addCourse } from '@/lib/academicsStore';

export const dynamic = 'force-dynamic';

export async function POST(req, { params }) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const resolvedParams = await params;
    const semesterId = resolvedParams.id;
    const { name, code, creditHours, targetGrade, actualGrade } = await req.json();

    if (!name || !creditHours) {
      return NextResponse.json({ error: 'Course name and credit hours are required' }, { status: 400 });
    }

    const course = await addCourse(user.id, semesterId, {
      name,
      code: code || '',
      creditHours,
      targetGrade: targetGrade || '',
      actualGrade: actualGrade || ''
    });

    return NextResponse.json({ course }, { status: 201 });
  } catch (error) {
    console.error('Add Course Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
