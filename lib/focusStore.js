import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { supabase } from './supabase.js';

const DATA_DIR = path.join(process.cwd(), 'data');
const FOCUS_FILE = path.join(DATA_DIR, 'focus_sessions.json');

// Initialize default focus storage
function ensureFocusDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(FOCUS_FILE)) {
    // Seed initial session for demo user so they see realistic history immediately
    const initialSessions = [
      {
        id: 'seed_focus_1',
        userId: 'demo_user_123',
        subject: 'Organic Chemistry',
        durationMin: 25,
        completed: true,
        completedAt: new Date(Date.now() - 3600 * 1000 * 3).toISOString()
      },
      {
        id: 'seed_focus_2',
        userId: 'demo_user_123',
        subject: 'Calculus III',
        durationMin: 50,
        completed: true,
        completedAt: new Date(Date.now() - 3600 * 1000 * 26).toISOString()
      }
    ];
    fs.writeFileSync(FOCUS_FILE, JSON.stringify(initialSessions, null, 2), 'utf-8');
  }
}

export function readLocalFocusSessions() {
  ensureFocusDataDir();
  try {
    const data = fs.readFileSync(FOCUS_FILE, 'utf-8');
    return JSON.parse(data) || [];
  } catch (err) {
    console.error('Error reading local focus sessions file:', err);
    return [];
  }
}

export function writeLocalFocusSessions(sessions) {
  ensureFocusDataDir();
  try {
    fs.writeFileSync(FOCUS_FILE, JSON.stringify(sessions, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing local focus sessions file:', err);
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
 * Calculates consecutive daily focus streak.
 * @param {Array} sessions - Completed sessions for the user
 * @returns {number} streak in days
 */
export function calculateStreak(sessions) {
  if (!sessions || sessions.length === 0) return 0;

  const dateSet = new Set();
  sessions.forEach(s => {
    if (s.completed && s.completedAt) {
      const d = new Date(s.completedAt);
      if (!isNaN(d.getTime())) {
        dateSet.add(d.toISOString().slice(0, 10)); // 'YYYY-MM-DD'
      }
    }
  });

  const dates = Array.from(dateSet).sort().reverse();
  if (dates.length === 0) return 0;

  const todayStr = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  // If user hasn't studied today or yesterday, the active streak is 0
  if (dates[0] !== todayStr && dates[0] !== yesterday) {
    return 0;
  }

  let streak = 1;
  let currDate = new Date(dates[0]);

  for (let i = 1; i < dates.length; i++) {
    const prevExpected = new Date(currDate);
    prevExpected.setDate(prevExpected.getDate() - 1);
    const prevExpectedStr = prevExpected.toISOString().slice(0, 10);

    if (dates[i] === prevExpectedStr) {
      streak++;
      currDate = prevExpected;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Log a new focus session for a user.
 */
export async function logFocusSession(userId, { subject = 'General', durationMin = 25, completed = true }) {
  const sessionId = crypto.randomUUID();
  const completedAt = new Date().toISOString();

  const newSession = {
    id: sessionId,
    userId,
    subject: subject.trim() || 'General',
    durationMin: Number(durationMin) || 25,
    completed: completed !== false,
    completedAt
  };

  // 1. Try Supabase if valid UUID
  if (isValidUUID(userId)) {
    try {
      const { data, error } = await withTimeout(
        supabase
          .from('focus_sessions')
          .insert({
            id: sessionId,
            user_id: userId,
            subject: newSession.subject,
            duration_min: newSession.durationMin,
            completed: newSession.completed,
            completed_at: completedAt
          })
          .select()
          .single()
      );

      if (!error && data) {
        // Also mirror to local store for offline resilience
        const allSessions = readLocalFocusSessions();
        allSessions.unshift(newSession);
        writeLocalFocusSessions(allSessions);
        return {
          id: data.id,
          _id: data.id,
          subject: data.subject,
          durationMin: data.duration_min,
          completed: data.completed,
          completedAt: data.completed_at
        };
      }
    } catch (err) {
      console.warn('Supabase log focus session failed or timed out, using local fallback:', err.message);
    }
  }

  // 2. Fallback to local file store
  const allSessions = readLocalFocusSessions();
  allSessions.unshift(newSession);
  writeLocalFocusSessions(allSessions);

  return {
    id: newSession.id,
    _id: newSession.id,
    subject: newSession.subject,
    durationMin: newSession.durationMin,
    completed: newSession.completed,
    completedAt: newSession.completedAt
  };
}

/**
 * Retrieve focus metrics and recent sessions for a user.
 */
export async function getFocusStats(userId) {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 86400000);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // 1. Try Supabase if valid UUID
  if (isValidUUID(userId)) {
    try {
      const { data: history, error: histErr } = await withTimeout(
        supabase
          .from('focus_sessions')
          .select('*')
          .eq('user_id', userId)
          .eq('completed', true)
          .order('completed_at', { ascending: false })
          .limit(50)
      );

      if (!histErr && Array.isArray(history)) {
        const formatted = history.map(h => ({
          id: h.id,
          _id: h.id,
          subject: h.subject,
          durationMin: h.duration_min,
          completed: h.completed,
          completedAt: h.completed_at
        }));

        let todayMinutes = 0;
        let weekMinutes = 0;

        formatted.forEach(s => {
          const sDate = new Date(s.completedAt);
          if (sDate >= todayStart) {
            todayMinutes += s.durationMin;
          }
          if (sDate >= weekAgo) {
            weekMinutes += s.durationMin;
          }
        });

        const streakDays = calculateStreak(formatted);

        return {
          todayMinutes,
          weekMinutes,
          totalSessions: formatted.length,
          weekSessionsCount: formatted.filter(s => new Date(s.completedAt) >= weekAgo).length,
          streakDays,
          sessions: formatted.slice(0, 20)
        };
      }
    } catch (err) {
      console.warn('Supabase get focus stats failed or timed out, using local fallback:', err.message);
    }
  }

  // 2. Fallback to local file store
  const allSessions = readLocalFocusSessions();
  const userSessions = allSessions.filter(s => s.userId === userId && s.completed);

  let todayMinutes = 0;
  let weekMinutes = 0;

  userSessions.forEach(s => {
    const sDate = new Date(s.completedAt);
    if (sDate >= todayStart) {
      todayMinutes += s.durationMin;
    }
    if (sDate >= weekAgo) {
      weekMinutes += s.durationMin;
    }
  });

  const streakDays = calculateStreak(userSessions);

  const formatted = userSessions.map(s => ({
    id: s.id,
    _id: s.id,
    subject: s.subject,
    durationMin: s.durationMin,
    completed: s.completed,
    completedAt: s.completedAt
  }));

  return {
    todayMinutes,
    weekMinutes,
    totalSessions: userSessions.length,
    weekSessionsCount: userSessions.filter(s => new Date(s.completedAt) >= weekAgo).length,
    streakDays,
    sessions: formatted.slice(0, 20)
  };
}
