// Blog CMS Dashboard - Backend Entry Point
// Express + JSON File DB + JWT Auth (dev mode, remplace par PostgreSQL au deploy)

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import db from './src/db.js';  // default export

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8081;

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Initialize database
db.initDB();

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// --- AUTH ROUTES ---

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    
    const user = await db.createUser({ email, password, name });
    
    const { sign } = await import('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'blog-cms-secret';
    const token = sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/'
    });
    
    res.status(201).json({ user: { id: user.id, email: user.email, name: user.name }, token });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    
    const user = await db.findUserByEmail(email);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    
    const valid = user.password === password;  // JSON file: plain compare (prod: bcrypt)
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    
    const { sign } = await import('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'blog-cms-secret';
    const token = sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/'
    });
    
    res.json({ user: { id: user.id, email: user.email, name: user.name }, token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /api/auth/me
app.get('/api/auth/me', async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: 'Not authenticated' });
    
    const { verify } = await import('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'blog-cms-secret';
    const payload = verify(token, JWT_SECRET);
    
    const user = await db.getUserById(payload.userId);
    if (!user) return res.status(401).json({ error: 'User not found' });
    
    res.json({ user });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// --- POSTS ROUTES ---

// GET /api/posts
app.get('/api/posts', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const published = req.query.published !== undefined ? req.query.published === 'true' : true;
    
    const posts = await db.findPublishedPosts({ limit, offset, published });
    const total = await db.countPublishedPosts(published);
    
    res.json({
      posts,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error('List posts error:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// GET /api/posts/:id
app.get('/api/posts/:id', async (req, res) => {
  try {
    const post = await db.getPostById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json({ post });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

// POST /api/posts (protected)
app.post('/api/posts', async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: 'Authentication required' });
    
    const { verify } = await import('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'blog-cms-secret';
    const payload = verify(token, JWT_SECRET);
    
    const { title, content, published } = req.body;
    const post = await db.createPost({ title, content, published, authorId: payload.userId });
    
    res.status(201).json({ post });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// PUT /api/posts/:id
app.put('/api/posts/:id', async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: 'Authentication required' });
    
    const { verify } = await import('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'blog-cms-secret';
    const payload = verify(token, JWT_SECRET);
    
    const { title, content, published } = req.body;
    const post = await db.updatePost(req.params.id, { title, content, published });
    if (!post) return res.status(404).json({ error: 'Post not found' });
    
    res.json({ post });
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({ error: 'Failed to update post' });
  }
});

// DELETE /api/posts/:id
app.delete('/api/posts/:id', async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: 'Authentication required' });
    
    const { verify } = await import('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'blog-cms-secret';
    const payload = verify(token, JWT_SECRET);
    
    const deleted = await db.deletePost(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Post not found' });
    
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// Export for testing
export default app;
