import jwt from 'jsonwebtoken';
import { findUserById } from './userStore.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your_strong_random_secret_here';

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

export async function getAuthUser(req) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);
  if (!decoded || !decoded.id) {
    return null;
  }

  try {
    const user = await findUserById(decoded.id);
    if (!user) return null;

    return {
      _id: user.id,
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      preferences: user.preferences || { studyHoursPerDay: 4, subjects: [] },
      academicProfile: user.academicProfile || user.academic_profile || { educationLevel: 'University' },
      isOnboarded: user.isOnboarded !== undefined ? user.isOnboarded : true,
    };
  } catch (err) {
    return null;
  }
}

