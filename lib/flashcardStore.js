import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { supabase } from './supabase.js';

const DATA_DIR = path.join(process.cwd(), 'data');
const FLASHCARDS_FILE = path.join(DATA_DIR, 'flashcards.json');

function ensureFlashcardDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(FLASHCARDS_FILE)) {
    fs.writeFileSync(FLASHCARDS_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
}

export function readLocalFlashcardSets() {
  ensureFlashcardDataDir();
  try {
    const data = fs.readFileSync(FLASHCARDS_FILE, 'utf-8');
    return JSON.parse(data) || [];
  } catch (err) {
    console.error('Error reading local flashcards file:', err);
    return [];
  }
}

export function writeLocalFlashcardSets(sets) {
  ensureFlashcardDataDir();
  try {
    fs.writeFileSync(FLASHCARDS_FILE, JSON.stringify(sets, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing local flashcards file:', err);
    return false;
  }
}

function withTimeout(promise, ms = 6000) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Supabase timeout')), ms)),
  ]);
}

function isValidUUID(str) {
  if (!str || typeof str !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
}

/**
 * Get all flashcard decks for a given user.
 */
export async function getUserFlashcardSets(userId) {
  // 1. Try Supabase if valid UUID
  if (isValidUUID(userId)) {
    try {
      const { data, error } = await withTimeout(
        supabase
          .from('flashcard_sets')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
      );

      if (!error && Array.isArray(data)) {
        return data.map((s) => ({
          id: s.id,
          _id: s.id,
          title: s.title,
          subject: s.subject || 'General',
          cards: s.cards || [],
          cardCount: s.cards ? s.cards.length : 0,
          progress: s.progress || 0,
          isAIGenerated: s.is_ai_generated || false,
          createdAt: s.created_at
        }));
      }
    } catch (err) {
      console.warn('Supabase getUserFlashcardSets notice:', err.message);
    }
  }

  // 2. Fallback to local store per user (no demo defaults)
  const allSets = readLocalFlashcardSets();
  const userSets = allSets.filter((s) => s.userId === userId);

  return userSets.map((s) => ({
    id: s.id,
    _id: s.id,
    title: s.title,
    subject: s.subject || 'General',
    cards: s.cards || [],
    cardCount: s.cards ? s.cards.length : 0,
    progress: s.progress || 0,
    isAIGenerated: s.isAIGenerated || false,
    createdAt: s.createdAt
  }));
}

/**
 * Create a new flashcard deck.
 */
export async function createFlashcardSet(userId, { title, subject = 'General', cards = [], isAIGenerated = false }) {
  const setId = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  // Normalize cards with ids and initial mastery
  const formattedCards = cards.map((c, idx) => ({
    id: c.id || idx + 1,
    question: c.question || '',
    answer: c.answer || '',
    mastery: c.mastery || 'Medium'
  }));

  const newSet = {
    id: setId,
    userId,
    title: title.trim(),
    subject: subject.trim() || 'General',
    cards: formattedCards,
    cardCount: formattedCards.length,
    progress: 0,
    isAIGenerated: Boolean(isAIGenerated),
    createdAt
  };

  // 1. Try Supabase if valid UUID
  if (isValidUUID(userId)) {
    try {
      const { data, error } = await withTimeout(
        supabase
          .from('flashcard_sets')
          .insert({
            id: setId,
            user_id: userId,
            title: newSet.title,
            subject: newSet.subject,
            cards: formattedCards,
            progress: 0,
            is_ai_generated: newSet.isAIGenerated
          })
          .select()
          .single()
      );

      if (!error && data) {
        // Also mirror to local store
        const allSets = readLocalFlashcardSets();
        allSets.unshift(newSet);
        writeLocalFlashcardSets(allSets);

        return {
          id: data.id,
          _id: data.id,
          title: data.title,
          subject: data.subject,
          cards: data.cards,
          cardCount: data.cards.length,
          progress: data.progress,
          isAIGenerated: data.is_ai_generated,
          createdAt: data.created_at
        };
      }
    } catch (err) {
      console.warn('Supabase createFlashcardSet fallback:', err.message);
    }
  }

  // 2. Fallback to local store
  const allSets = readLocalFlashcardSets();
  allSets.unshift(newSet);
  writeLocalFlashcardSets(allSets);

  return newSet;
}

/**
 * Update card mastery and recompute deck progress.
 */
export async function updateCardMastery(userId, setId, cardIndex, mastery) {
  const allSets = readLocalFlashcardSets();
  const setIndex = allSets.findIndex((s) => s.id === setId);

  if (setIndex === -1) return null;

  const set = allSets[setIndex];
  if (set.cards && set.cards[cardIndex]) {
    set.cards[cardIndex].mastery = mastery;

    // Recalculate progress: Easy = 100%, Medium = 50%, Hard = 0%
    const totalPoints = set.cards.reduce((acc, c) => {
      if (c.mastery === 'Easy') return acc + 100;
      if (c.mastery === 'Medium') return acc + 50;
      return acc;
    }, 0);

    set.progress = Math.round(totalPoints / set.cards.length);
    allSets[setIndex] = set;
    writeLocalFlashcardSets(allSets);

    // Also update Supabase if UUID
    if (isValidUUID(userId)) {
      try {
        await withTimeout(
          supabase
            .from('flashcard_sets')
            .update({
              cards: set.cards,
              progress: set.progress
            })
            .eq('id', setId)
            .eq('user_id', userId)
        );
      } catch (err) {
        // silently fallback
      }
    }

    return set;
  }

  return set;
}

/**
 * Delete a flashcard set.
 */
export async function deleteFlashcardSet(userId, setId) {
  // 1. Try Supabase
  if (isValidUUID(userId)) {
    try {
      await withTimeout(
        supabase
          .from('flashcard_sets')
          .delete()
          .eq('id', setId)
          .eq('user_id', userId)
      );
    } catch (err) {
      // fallback
    }
  }

  // 2. Local store
  const allSets = readLocalFlashcardSets();
  const filtered = allSets.filter((s) => s.id !== setId);
  writeLocalFlashcardSets(filtered);

  return true;
}
