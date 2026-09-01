// JSON File Database - Développement rapide
// Remplacer par PostgreSQL (Neon) au deploy final

import fs from 'fs';
import path from 'path';

const dbPath = process.env.DATABASE_URL || './data/db.json';

// Helper: Read database file
function readDB() {
  const data = fs.readFileSync(dbPath, 'utf-8');
  return JSON.parse(data);
}

// Helper: Write database file
function writeDB(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

// Initialize tables (just ensure structure exists)
function initDB() {
  const data = readDB();
  if (!data.users) data.users = [];
  if (!data.posts) data.posts = [];
  writeDB(data);
  console.log('✅ JSON database initialized at', dbPath);
  return data;
}

// --- USERS CRUD ---

export async function findUserByEmail(email) {
  const data = readDB();
  return data.users.find(u => u.email === email) || null;
}

export async function createUser({ email, password, name }) {
  const data = readDB();
  const { v4: uuidv4 } = await import('uuid');
  const id = uuidv4();
  
  const newUser = { id, email, name, password, createdAt: new Date().toISOString() };
  data.users.push(newUser);
  writeDB(data);
  
  return newUser;
}

export async function getUserById(id) {
  const data = readDB();
  return data.users.find(u => u.id === id) || null;
}

// --- POSTS CRUD ---

export async function findPublishedPosts({ limit = 10, offset = 0, authorId } = {}) {
  const data = readDB();
  let results = data.posts.filter(p => p.published === true);
  
  if (authorId) {
    results = results.filter(p => p.authorId === authorId);
  }
  
  results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return results.slice(offset, offset + limit);
}

export async function countPublishedPosts() {
  const data = readDB();
  return data.posts.filter(p => p.published === true).length;
}

export async function createPost({ title, content, published, authorId }) {
  const data = readDB();
  const { v4: uuidv4 } = await import('uuid');
  const id = uuidv4();
  
  const newPost = { id, title, content, published: published || false, authorId, createdAt: new Date().toISOString() };
  data.posts.push(newPost);
  writeDB(data);
  
  return newPost;
}

export async function getPostById(id) {
  const data = readDB();
  return data.posts.find(p => p.id === id) || null;
}

export async function updatePost(id, updates) {
  const data = readDB();
  const idx = data.posts.findIndex(p => p.id === id);
  if (idx === -1) return null;
  
  data.posts[idx] = { ...data.posts[idx], ...updates, updatedAt: new Date().toISOString() };
  writeDB(data);
  return data.posts[idx];
}

export async function deletePost(id) {
  const data = readDB();
  const idx = data.posts.findIndex(p => p.id === id);
  if (idx === -1) return false;
  
  data.posts.splice(idx, 1);
  writeDB(data);
  return true;
}

// Export init
export default { initDB, readDB, writeDB, createUser, findUserByEmail, getUserById, findPublishedPosts, countPublishedPosts, createPost, getPostById, updatePost, deletePost };
