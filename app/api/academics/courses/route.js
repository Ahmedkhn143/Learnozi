import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { addCourse, createSemester, getSemesters } from '@/lib/academicsStore';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    let { semesterId, name, code, creditHours, targetGrade } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Course name is required' }, { status: 400 });
    }

    // If no semester provided, ensure user has at least one semester
    if (!semesterId) {
      const existingSemesters = await getSemesters(user.id);
      if (existingSemesters && existingSemesters.length > 0) {
        semesterId = existingSemesters[0].id || existingSemesters[0]._id;
      } else {
        const newSem = await createSemester(user.id, {
          name: 'Current Semester',
          startDate: new Date().toISOString().slice(0, 10),
          endDate: new Date(Date.now() + 120 * 86400000).toISOString().slice(0, 10),
        });
        semesterId = newSem.id || newSem._id;
      }
    }

    const course = await addCourse(user.id, semesterId, {
      name: name.trim(),
      code: code ? code.trim() : '',
      creditHours: Number(creditHours) || 3,
      targetGrade: targetGrade || 'A',
    });

    return NextResponse.json({ course }, { status: 201 });
  } catch (error) {
    console.error('Create Course Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
