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
        isVerified: true,
        academicProfile: { educationLevel: 'University', university: 'NUST', institution: 'NUST' },
        createdAt: new Date().toISOString(),
      }
    ];
    fs.writeFileSync(USERS_FILE, JSON.stringify(defaultUsers, null, 2), 'utf-8');
  }
}

export function readLocalUsers() {
  ensureDataDir();
  try {
    const data = fs.readFileSync(USERS_FILE, 'utf-8');
    return JSON.parse(data) || [];
  } catch (err) {
    console.error('Error reading local users file:', err);
    return [];
  }
}

export function writeLocalUsers(users) {
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

export async function createUser({
  name,
  email,
  password,
  avatar = null,
  provider = 'local',
  academicProfile = null,
  isVerified = false,
  verificationCode = null,
}) {
  const cleanEmail = email.toLowerCase().trim();
  const userId = crypto.randomUUID();
  const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

  const defaultAcademicProfile = {
    educationLevel: academicProfile?.educationLevel || 'University',
    institution: academicProfile?.institution || academicProfile?.university || '',
    university: academicProfile?.institution || academicProfile?.university || '',
    fieldOfStudy: academicProfile?.fieldOfStudy || '',
    currentYear: academicProfile?.currentYear || '',
  };

  const newUserRecord = {
    id: userId,
    name: name.trim(),
    email: cleanEmail,
    password: hashedPassword,
    avatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cleanEmail)}`,
    provider,
    isOnboarded: true,
    isVerified: isVerified ?? false,
    verificationCode: verificationCode || null,
    verificationCodeExpires: verificationCode ? new Date(Date.now() + 15 * 60 * 1000).toISOString() : null,
    academic_profile: defaultAcademicProfile,
    academicProfile: defaultAcademicProfile,
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
      return newUserRecord;
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

export async function verifyUserEmail(email, code) {
  if (!email || !code) return { error: 'Email and verification code are required' };
  const cleanEmail = email.toLowerCase().trim();
  const cleanCode = code.toString().trim();

  const users = readLocalUsers();
  const userIdx = users.findIndex((u) => u.email.toLowerCase() === cleanEmail);

  if (userIdx === -1) {
    return { error: 'No account found with this email' };
  }

  const user = users[userIdx];

  // Already verified
  if (user.isVerified) {
    return { success: true, user, alreadyVerified: true };
  }

  // Check code
  const codeMatches = user.verificationCode === cleanCode;
  const isExpired = user.verificationCodeExpires && new Date(user.verificationCodeExpires) < new Date();

  if (!codeMatches) {
    return { error: 'Invalid verification code. Please check your email and try again.' };
  }

  if (isExpired) {
    return { error: 'Verification code has expired. Please click "Resend Code".' };
  }

  // Mark as verified
  user.isVerified = true;
  user.verificationCode = null;
  user.verificationCodeExpires = null;
  users[userIdx] = user;
  writeLocalUsers(users);

  // Sync to Supabase
  try {
    await withTimeout(
      supabase
        .from('users')
        .update({ is_verified: true })
        .eq('email', cleanEmail)
    );
  } catch (e) {
    // Ignore
  }

  return { success: true, user };
}

export async function resendVerificationCode(email) {
  if (!email) return { error: 'Email is required' };
  const cleanEmail = email.toLowerCase().trim();

  const users = readLocalUsers();
  const userIdx = users.findIndex((u) => u.email.toLowerCase() === cleanEmail);

  if (userIdx === -1) {
    return { error: 'No account found with this email' };
  }

  const newCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  users[userIdx].verificationCode = newCode;
  users[userIdx].verificationCodeExpires = expiresAt;
  writeLocalUsers(users);

  return { success: true, code: newCode, user: users[userIdx] };
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
  const token = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code for easy mobile/desktop entry
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins

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

  return { token, code: token, expiresAt, user: userIdx !== -1 ? users[userIdx] : null };
}

export async function resetPasswordWithCode(email, code, newPassword) {
  if (!email || !code || !newPassword) {
    return { error: 'Email, reset code, and new password are required' };
  }
  const cleanEmail = email.toLowerCase().trim();
  const cleanCode = code.toString().trim();

  const users = readLocalUsers();
  const userIdx = users.findIndex((u) => u.email.toLowerCase() === cleanEmail);

  if (userIdx === -1) {
    return { error: 'Account not found' };
  }

  const user = users[userIdx];
  if (user.resetPasswordToken !== cleanCode) {
    return { error: 'Invalid reset code. Please check your email.' };
  }

  if (user.resetPasswordTokenExpires && new Date(user.resetPasswordTokenExpires) < new Date()) {
    return { error: 'Reset code has expired. Please request a new one.' };
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;
  user.resetPasswordToken = null;
  user.resetPasswordTokenExpires = null;
  users[userIdx] = user;
  writeLocalUsers(users);

  // Sync to Supabase
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

  return { success: true, user };
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

  // Create new Google user (pre-verified)
  const newUser = await createUser({
    name: name || cleanEmail.split('@')[0],
    email: cleanEmail,
    password: crypto.randomBytes(16).toString('hex'),
    avatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cleanEmail)}`,
    provider: 'google',
    isVerified: true,
  });

  return newUser;
}
