// Express + SQLite backend for Project 5 Dashboard
import express from 'express';
import cookieParser from 'cookie-parser';
import { db, get, all, run, initDb } from './src/db.js';
import authRoutes from './src/routes/auth.js';
import postsRoutes from './src/routes/posts.js';
import usersRoutes from './src/routes/users.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cookieParser());
app.use(express.json());

// Initialize database
initDb().then(() => {
  console.log('✅ Database initialized');
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/users', usersRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Root
app.get('/', (req, res) => {
  res.json({ message: 'Project 5 Dashboard API' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});