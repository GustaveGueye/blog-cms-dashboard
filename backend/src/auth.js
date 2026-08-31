// Auth module - JWT + bcrypt + SQLite (sync API)
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { run, get } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-jwt-signing';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const COOKIE_NAME = 'token';

export { COOKIE_NAME };

// Hash password
export async function hashPassword(password) {
  return await bcrypt.hash(password, 12);
}

// Verify password
export async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

// Generate JWT token
export function generateToken(user) {
  const basePayload = {
    userId: user.id,
    email: user.email
  };
  
  const nonce = Math.random().toString(36).substring(2, 15) + Date.now().toString(36) + Math.random().toString(36).substring(2, 10);
  
  return jwt.sign(
    { ...basePayload, nonce },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// Verify JWT token
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Get user by email
export async function getUserByEmail(email) {
  return await get('SELECT * FROM users WHERE email = ?', [email]);
}

// Get user by session token
export async function getUserByToken(token) {
  const payload = verifyToken(token);
  if (!payload) return null;
  
  return await get(
    `SELECT u.id, u.email, u.name, u.created_at FROM users u WHERE u.id = ?`,
    [payload.userId]
  );
}

// Delete session
export async function deleteSession(token) {
  await run('DELETE FROM sessions WHERE token = ?', [token]);
}

// Create session
export async function createSession(userId, token) {
  await run(
    'INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)',
    [userId, token, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()]
  );
}

// Cookie options
export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/'
};