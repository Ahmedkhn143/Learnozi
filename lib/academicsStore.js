import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { supabase } from './supabase.js';

const DATA_DIR = path.join(process.cwd(), 'data');
const ACADEMICS_FILE = path.join(DATA_DIR, 'academics.json');

function ensureAcademicsDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(ACADEMICS_FILE)) {
    fs.writeFileSync(ACADEMICS_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
}

export function readLocalAcademics() {
  ensureAcademicsDataDir();
  try {
    const data = fs.readFileSync(ACADEMICS_FILE, 'utf-8');
    return JSON.parse(data) || [];
  } catch (err) {
    console.error('Error reading local academics file:', err);
    return [];
  }
}

export function writeLocalAcademics(data) {
  ensureAcademicsDataDir();
  try {
    fs.writeFileSync(ACADEMICS_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing local academics file:', err);
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
 * Fetch all semesters and courses for a user.
 */
export async function getSemesters(userId) {
  // 1. Try Supabase
  if (isValidUUID(userId)) {
    try {
      const { data: semesters, error: semErr } = await withTimeout(
        supabase
          .from('semesters')
          .select('*')
          .eq('user_id', userId)
          .order('start_date', { ascending: false })
      );

      if (!semErr && Array.isArray(semesters)) {
        if (semesters.length === 0) return [];

        const semesterIds = semesters.map((s) => s.id);
        const { data: courseData } = await withTimeout(
          supabase
            .from('courses')
            .select('*')
            .in('semester_id', semesterIds)
        );

        const courses = courseData || [];
        return semesters.map((sem) => ({
          _id: sem.id,
          id: sem.id,
          name: sem.name,
          startDate: sem.start_date,
          endDate: sem.end_date,
          courses: courses
            .filter((c) => c.semester_id === sem.id)
            .map((c) => ({
              _id: c.id,
              id: c.id,
              name: c.name,
              code: c.code,
              creditHours: c.credit_hours,
              targetGrade: c.target_grade,
              actualGrade: c.actual_grade
            }))
        }));
      }
    } catch (err) {
      console.warn('Supabase getSemesters notice:', err.message);
    }
  }

  // 2. Fallback to local store
  const allData = readLocalAcademics();
  const userSemesters = allData.filter((s) => s.userId === userId);

  return userSemesters.map((s) => ({
    _id: s.id,
    id: s.id,
    name: s.name,
    startDate: s.startDate,
    endDate: s.endDate,
    courses: s.courses || []
  }));
}

/**
 * Create a new semester.
 */
export async function createSemester(userId, { name, startDate, endDate }) {
  const semesterId = crypto.randomUUID();
  const newSem = {
    id: semesterId,
    _id: semesterId,
    userId,
    name: name.trim(),
    startDate,
    endDate,
    courses: []
  };

  if (isValidUUID(userId)) {
    try {
      const { data, error } = await withTimeout(
        supabase
          .from('semesters')
          .insert({
            id: semesterId,
            user_id: userId,
            name: newSem.name,
            start_date: startDate,
            end_date: endDate
          })
          .select()
          .single()
      );
      if (!error && data) {
        newSem.id = data.id;
        newSem._id = data.id;
      }
    } catch (err) {
      console.warn('Supabase createSemester fallback:', err.message);
    }
  }

  const all = readLocalAcademics();
  all.unshift(newSem);
  writeLocalAcademics(all);

  return newSem;
}

/**
 * Delete a semester and its courses.
 */
export async function deleteSemester(userId, semesterId) {
  if (isValidUUID(userId)) {
    try {
      await withTimeout(
        supabase
          .from('semesters')
          .delete()
          .eq('id', semesterId)
          .eq('user_id', userId)
      );
    } catch (e) {}
  }

  const all = readLocalAcademics();
  const filtered = all.filter((s) => s.id !== semesterId);
  writeLocalAcademics(filtered);
  return true;
}

/**
 * Add a course to a semester.
 */
export async function addCourse(userId, semesterId, { name, code = '', creditHours = 3, targetGrade = '', actualGrade = '' }) {
  const courseId = crypto.randomUUID();
  const newCourse = {
    _id: courseId,
    id: courseId,
    semesterId,
    name: name.trim(),
    code: code.trim(),
    creditHours: parseInt(creditHours, 10) || 3,
    targetGrade: targetGrade || '',
    actualGrade: actualGrade || ''
  };

  if (isValidUUID(userId)) {
    try {
      const { data, error } = await withTimeout(
        supabase
          .from('courses')
          .insert({
            id: courseId,
            semester_id: semesterId,
            user_id: userId,
            name: newCourse.name,
            code: newCourse.code,
            credit_hours: newCourse.creditHours,
            target_grade: newCourse.targetGrade,
            actual_grade: newCourse.actualGrade
          })
          .select()
          .single()
      );
      if (!error && data) {
        newCourse.id = data.id;
        newCourse._id = data.id;
      }
    } catch (err) {
      console.warn('Supabase addCourse fallback:', err.message);
    }
  }

  const all = readLocalAcademics();
  const sem = all.find((s) => s.id === semesterId);
  if (sem) {
    if (!Array.isArray(sem.courses)) sem.courses = [];
    sem.courses.push(newCourse);
    writeLocalAcademics(all);
  }

  return newCourse;
}

/**
 * Update course grade.
 */
export async function updateCourse(userId, courseId, { actualGrade }) {
  if (isValidUUID(userId)) {
    try {
      await withTimeout(
        supabase
          .from('courses')
          .update({ actual_grade: actualGrade })
          .eq('id', courseId)
      );
    } catch (e) {}
  }

  const all = readLocalAcademics();
  let updatedCourse = null;
  all.forEach((sem) => {
    if (sem.courses) {
      const c = sem.courses.find((course) => course.id === courseId);
      if (c) {
        c.actualGrade = actualGrade;
        updatedCourse = c;
      }
    }
  });

  if (updatedCourse) {
    writeLocalAcademics(all);
  }

  return updatedCourse;
}
