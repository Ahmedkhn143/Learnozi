import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { updateCourse } from '@/lib/academicsStore';

export const dynamic = 'force-dynamic';

export async function PUT(req, { params }) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const resolvedParams = await params;
    const courseId = resolvedParams.id;
    const { actualGrade } = await req.json();

    const course = await updateCourse(user.id, courseId, { actualGrade });
    return NextResponse.json({ course });
  } catch (error) {
    console.error('Update Course Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
