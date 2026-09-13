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
    const defaultDecks = [
      {
        id: 'deck_org_chem_101',
        userId: 'demo_user_123',
        title: 'Organic Chemistry Reactions',
        subject: 'Chemistry',
        progress: 60,
        isAIGenerated: false,
        createdAt: new Date().toISOString(),
        cards: [
          {
            id: 1,
            question: 'What is the Markovnikov Rule in alkene electrophilic addition?',
            answer: 'In the addition of HX to an unsymmetrical alkene, hydrogen attaches to the carbon with more hydrogens, forming the more stable carbocation intermediate.',
            mastery: 'Medium'
          },
          {
            id: 2,
            question: 'What differentiates SN1 and SN2 nucleophilic substitution reactions?',
            answer: 'SN1 is a two-step mechanism via a planar carbocation intermediate (favored in tertiary substrates). SN2 is a concerted backside attack with stereochemical inversion (favored in primary substrates).',
            mastery: 'Hard'
          },
          {
            id: 3,
            question: 'What is the role of a Lewis Acid catalyst (like AlCl3) in Friedel-Crafts alkylation?',
            answer: 'It acts as an electron pair acceptor to polarize or generate a potent carbocation electrophile from the alkyl halide.',
            mastery: 'Easy'
          },
          {
            id: 4,
            question: 'What is Zaitsev\'s Rule in elimination reactions?',
            answer: 'In β-elimination reactions, the major product is the more substituted, thermodynamically more stable alkene.',
            mastery: 'Medium'
          }
        ]
      },
      {
        id: 'deck_quantum_phys_201',
        userId: 'demo_user_123',
        title: 'Quantum Physics Principles',
        subject: 'Physics',
        progress: 40,
        isAIGenerated: false,
        createdAt: new Date().toISOString(),
        cards: [
          {
            id: 1,
            question: 'What does Heisenberg’s Uncertainty Principle state?',
            answer: 'It is impossible to simultaneously determine both the exact position and momentum of a subatomic particle (Δx · Δp ≥ ℏ/2).',
            mastery: 'Easy'
          },
          {
            id: 2,
            question: 'Explain the Photoelectric Effect and Einstein’s explanation.',
            answer: 'Electrons are ejected from a metal surface only when light frequency exceeds a threshold (work function), proving that light behaves as quantized wave packets called photons (E = hf).',
            mastery: 'Medium'
          },
          {
            id: 3,
            question: 'What is Quantum Superposition?',
            answer: 'A quantum system can exist in a linear combination of multiple distinct states simultaneously until a measurement is performed, collapsing the wave function.',
            mastery: 'Hard'
          }
        ]
      },
      {
        id: 'deck_cs_algo_301',
        userId: 'demo_user_123',
        title: 'Data Structures & Algorithms',
        subject: 'Computer Science',
        progress: 75,
        isAIGenerated: true,
        createdAt: new Date().toISOString(),
        cards: [
          {
            id: 1,
            question: 'What is the average and worst-case time complexity of QuickSort?',
            answer: 'Average case is O(N log N). Worst case is O(N²) when poorly chosen pivots cause highly unbalanced partitions.',
            mastery: 'Easy'
          },
          {
            id: 2,
            question: 'Explain how Hash Tables achieve O(1) average lookup and how collisions are resolved.',
            answer: 'A hash function computes an array index from a key. Collisions are handled via Chaining (linked lists) or Open Addressing (linear/quadratic probing).',
            mastery: 'Easy'
          },
          {
            id: 3,
            question: 'What is the primary difference between BFS and DFS traversal in graphs?',
            answer: 'BFS uses a Queue to explore neighbors level-by-level (finds shortest unweighted paths). DFS uses a Stack/recursion to explore as deep as possible before backtracking.',
            mastery: 'Medium'
          }
        ]
      }
    ];
    fs.writeFileSync(FLASHCARDS_FILE, JSON.stringify(defaultDecks, null, 2), 'utf-8');
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

function withTimeout(promise, ms = 1200) {
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

      if (!error && Array.isArray(data) && data.length > 0) {
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
      console.warn('Supabase getUserFlashcardSets fallback:', err.message);
    }
  }

  // 2. Fallback to local store
  const allSets = readLocalFlashcardSets();
  let userSets = allSets.filter((s) => s.userId === userId || s.userId === 'demo_user_123');

  // If no sets found for this user, clone default decks for them
  if (userSets.length === 0) {
    userSets = allSets.filter((s) => s.userId === 'demo_user_123');
  }

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
