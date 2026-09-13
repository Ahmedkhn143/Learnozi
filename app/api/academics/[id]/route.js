import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { deleteSemester } from '@/lib/academicsStore';

export const dynamic = 'force-dynamic';

export async function DELETE(req, { params }) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const resolvedParams = await params;
    const { id } = resolvedParams;

    await deleteSemester(user.id, id);
    return NextResponse.json({ message: 'Semester deleted successfully' });
  } catch (error) {
    console.error('Academics DELETE Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
