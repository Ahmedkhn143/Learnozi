import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import {
  getUserFlashcardSets,
  createFlashcardSet,
  updateCardMastery,
  deleteFlashcardSet
} from '@/lib/flashcardStore';

export async function GET(req) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const sets = await getUserFlashcardSets(user.id);
    return NextResponse.json({ sets });
  } catch (error) {
    console.error('Flashcards GET Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { title, subject, cards, isAIGenerated } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    if (!cards || !Array.isArray(cards) || cards.length === 0) {
      return NextResponse.json({ error: 'At least one flashcard is required' }, { status: 400 });
    }

    const set = await createFlashcardSet(user.id, {
      title,
      subject: subject || 'General',
      cards,
      isAIGenerated: Boolean(isAIGenerated)
    });

    return NextResponse.json({ set }, { status: 201 });
  } catch (error) {
    console.error('Flashcards POST Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { setId, cardIndex, mastery } = body;

    if (!setId || cardIndex === undefined || !mastery) {
      return NextResponse.json({ error: 'setId, cardIndex, and mastery are required' }, { status: 400 });
    }

    const updatedSet = await updateCardMastery(user.id, setId, Number(cardIndex), mastery);
    return NextResponse.json({ set: updatedSet });
  } catch (error) {
    console.error('Flashcards PATCH Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const setId = searchParams.get('id');

    if (!setId) {
      return NextResponse.json({ error: 'Deck id is required' }, { status: 400 });
    }

    await deleteFlashcardSet(user.id, setId);
    return NextResponse.json({ success: true, deletedId: setId });
  } catch (error) {
    console.error('Flashcards DELETE Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
