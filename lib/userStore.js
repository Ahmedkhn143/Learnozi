import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { supabase } from './supabase.js';

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// Initialize default users storage
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(USERS_FILE)) {
    const defaultUsers = [
      {
        id: 'demo_user_123',
        name: 'Demo Student',
        email: 'demo@learnozi.com',
        password: bcrypt.hashSync('demo1234', 10),
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
        isOnboarded: true,
        academicProfile: { educationLevel: 'University', university: 'NUST' },
        createdAt: new Date().toISOString(),
      }
    ];
    fs.writeFileSync(USERS_FILE, JSON.stringify(defaultUsers, null, 2), 'utf-8');
  }
}

function readLocalUsers() {
  ensureDataDir();
  try {
    const data = fs.readFileSync(USERS_FILE, 'utf-8');
    return JSON.parse(data) || [];
  } catch (err) {
    console.error('Error reading local users file:', err);
    return [];
  }
}

function writeLocalUsers(users) {
  ensureDataDir();
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing local users file:', err);
    return false;
  }
}

// Fast timeout helper so offline or DNS-failing Supabase calls don't hang HTTP requests
function withTimeout(promise, ms = 1200) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Supabase timeout')), ms)),
  ]);
}

export async function findUserByEmail(email) {
  if (!email) return null;
  const cleanEmail = email.toLowerCase().trim();

  // Try Supabase first (with fast timeout)
  try {
    const { data: user } = await withTimeout(
      supabase
        .from('users')
        .select('*')
        .eq('email', cleanEmail)
        .maybeSingle()
    );

    if (user) return user;
  } catch (err) {
    // Supabase unreachable, fallback to local storage
  }

  // Fallback to local store
  const localUsers = readLocalUsers();
  return localUsers.find((u) => u.email.toLowerCase() === cleanEmail) || null;
}

export async function findUserById(id) {
  if (!id) return null;

  // Try Supabase first
  try {
    const { data: user } = await withTimeout(
      supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .maybeSingle()
    );

    if (user) return user;
  } catch (err) {
    // Supabase unreachable
  }

  // Fallback to local store
  const localUsers = readLocalUsers();
  return localUsers.find((u) => u.id === id) || null;
}

export async function findUserByResetToken(token) {
  if (!token) return null;

  // Try Supabase first
  try {
    const { data: user } = await withTimeout(
      supabase
        .from('users')
        .select('*')
        .eq('reset_password_token', token)
        .maybeSingle()
    );

    if (user && (!user.reset_password_expires || new Date(user.reset_password_expires) > new Date())) {
      return user;
    }
  } catch (err) {
    // Supabase unreachable
  }

  // Fallback to local store
  const localUsers = readLocalUsers();
  const found = localUsers.find((u) => u.resetPasswordToken === token);
  if (found) {
    if (found.resetPasswordTokenExpires && new Date(found.resetPasswordTokenExpires) < new Date()) {
      return null; // Expired
    }
    return found;
  }
  return null;
}

export async function createUser({ name, email, password, avatar = null, provider = 'local' }) {
  const cleanEmail = email.toLowerCase().trim();
  const userId = crypto.randomUUID();
  const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

  const newUserRecord = {
    id: userId,
    name: name.trim(),
    email: cleanEmail,
    password: hashedPassword,
    avatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cleanEmail)}`,
    provider,
    isOnboarded: true,
    academic_profile: {
      educationLevel: 'University',
      fieldOfStudy: '',
      currentYear: '',
      institution: '',
    },
    academicProfile: {
      educationLevel: 'University',
      fieldOfStudy: '',
      currentYear: '',
      institution: '',
    },
    preferences: {
      studyHoursPerDay: 4,
      subjects: [],
    },
    createdAt: new Date().toISOString(),
  };

  // Try Supabase first
  try {
    const { data, error } = await withTimeout(
      supabase
        .from('users')
        .insert({
          id: newUserRecord.id,
          name: newUserRecord.name,
          email: newUserRecord.email,
          password: newUserRecord.password || '',
          academic_profile: newUserRecord.academic_profile,
          preferences: newUserRecord.preferences,
        })
        .select()
        .single()
    );

    if (data && !error) {
      // Also cache in local users
      const users = readLocalUsers();
      users.push(newUserRecord);
      writeLocalUsers(users);
      return data;
    }
  } catch (err) {
    // Supabase failed, save locally
  }

  // Local write
  const users = readLocalUsers();
  users.push(newUserRecord);
  writeLocalUsers(users);

  return newUserRecord;
}

export async function verifyPassword(plainPassword, hashedPassword) {
  if (!plainPassword || !hashedPassword) return false;
  try {
    return await bcrypt.compare(plainPassword, hashedPassword);
  } catch (err) {
    return false;
  }
}

export async function createPasswordResetToken(email) {
  const cleanEmail = email.toLowerCase().trim();
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 3600000).toISOString(); // 1 hour

  // Try Supabase
  try {
    await withTimeout(
      supabase
        .from('users')
        .update({
          reset_password_token: token,
          reset_password_expires: expiresAt,
        })
        .eq('email', cleanEmail)
    );
  } catch (err) {
    // Continue
  }

  // Update local store
  const users = readLocalUsers();
  const userIdx = users.findIndex((u) => u.email.toLowerCase() === cleanEmail);
  if (userIdx !== -1) {
    users[userIdx].resetPasswordToken = token;
    users[userIdx].resetPasswordTokenExpires = expiresAt;
    writeLocalUsers(users);
  }

  return { token, expiresAt };
}

export async function resetPassword(token, newPassword) {
  if (!token || !newPassword) return null;
  const user = await findUserByResetToken(token);
  if (!user) return null;

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Try Supabase
  try {
    await withTimeout(
      supabase
        .from('users')
        .update({
          password: hashedPassword,
          reset_password_token: null,
          reset_password_expires: null,
        })
        .eq('id', user.id)
    );
  } catch (err) {
    // Continue
  }

  // Update local store
  const users = readLocalUsers();
  const userIdx = users.findIndex((u) => u.id === user.id);
  if (userIdx !== -1) {
    users[userIdx].password = hashedPassword;
    users[userIdx].resetPasswordToken = null;
    users[userIdx].resetPasswordTokenExpires = null;
    writeLocalUsers(users);
    return users[userIdx];
  }

  user.password = hashedPassword;
  return user;
}

export async function upsertGoogleUser({ name, email, avatar = null, googleId = null }) {
  const cleanEmail = email.toLowerCase().trim();
  let user = await findUserByEmail(cleanEmail);

  if (user) {
    // Update avatar/provider if not set
    if (!user.avatar && avatar) {
      user.avatar = avatar;
      const users = readLocalUsers();
      const userIdx = users.findIndex((u) => u.id === user.id);
      if (userIdx !== -1) {
        users[userIdx].avatar = avatar;
        writeLocalUsers(users);
      }
    }
    return user;
  }

  // Create new Google user
  const newUser = await createUser({
    name: name || cleanEmail.split('@')[0],
    email: cleanEmail,
    password: crypto.randomBytes(16).toString('hex'), // Random secure password
    avatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cleanEmail)}`,
    provider: 'google',
  });

  return newUser;
}
