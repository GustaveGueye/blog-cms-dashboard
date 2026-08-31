import express from 'express';
import { body, query, validationResult } from 'express-validator';
import { 
  createPost,
  getPostById,
  getPostBySlug,
  getPosts,
  updatePost,
  deletePost,
  getPublishedPosts,
  getPostStats
} from '../posts.js';
import { verifyToken, COOKIE_NAME } from '../auth.js';

const router = express.Router();

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Auth middleware
const authenticate = (req, res, next) => {
  const token = req.cookies[COOKIE_NAME];
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
  
  req.user = payload;
  next();
};

// ============================================
// PUBLIC ROUTES (no auth required)
// ============================================

// Get published posts (public blog listing)
router.get('/posts/published', 
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
  query('search').optional().trim(),
  query('sortBy').optional().isIn(['created_at', 'updated_at', 'published_at', 'title']),
  query('sortOrder').optional().isIn(['ASC', 'DESC']),
  validate,
  async (req, res) => {
    try {
      const result = await getPublishedPosts(req.query);
      res.json(result);
    } catch (error) {
      console.error('Get published posts error:', error);
      res.status(500).json({ error: 'Failed to get posts' });
    }
  }
);

// Get single published post by slug
router.get('/posts/published/:slug', async (req, res) => {
  try {
    const post = await getPostBySlug(req.params.slug);
    if (!post || post.status !== 'published') {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.json({ post });
  } catch (error) {
    console.error('Get post by slug error:', error);
    res.status(500).json({ error: 'Failed to get post' });
  }
});

// ============================================
// AUTHENTICATED ROUTES
// ============================================

// Create a new post
router.post('/posts',
  authenticate,
  body('title').trim().isLength({ min: 1, max: 200 }),
  body('content').trim().isLength({ min: 1 }),
  body('excerpt').optional().trim().isLength({ max: 500 }),
  body('cover_image').optional().trim().isURL(),
  body('status').optional().isIn(['draft', 'published', 'archived']),
  validate,
  async (req, res) => {
    try {
      const post = await createPost(req.user.userId, req.body);
      res.status(201).json({ post });
    } catch (error) {
      console.error('Create post error:', error);
      res.status(400).json({ error: error.message });
    }
  }
);

// Get all posts (admin view with pagination & filters)
router.get('/posts',
  authenticate,
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('status').optional().isIn(['draft', 'published', 'archived']),
  query('search').optional().trim(),
  query('sortBy').optional().isIn(['created_at', 'updated_at', 'published_at', 'title']),
  query('sortOrder').optional().isIn(['ASC', 'DESC']),
  validate,
  async (req, res) => {
    try {
      const result = await getPosts({
        ...req.query,
        userId: req.user.userId
      });
      res.json(result);
    } catch (error) {
      console.error('Get posts error:', error);
      res.status(500).json({ error: 'Failed to get posts' });
    }
  }
);

// Get post stats for current user
router.get('/posts/stats/summary', authenticate, async (req, res) => {
  try {
    const stats = await getPostStats(req.user.userId);
    res.json({ stats });
  } catch (error) {
    console.error('Get post stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// Get single post by ID (owner only)
router.get('/posts/:id', authenticate, async (req, res) => {
  try {
    const post = await getPostById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    if (post.user_id !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized to view this post' });
    }
    res.json({ post });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ error: 'Failed to get post' });
  }
});

// Update a post
router.put('/posts/:id',
  authenticate,
  body('title').optional().trim().isLength({ min: 1, max: 200 }),
  body('content').optional().trim().isLength({ min: 1 }),
  body('excerpt').optional().trim().isLength({ max: 500 }),
  body('cover_image').optional().trim().isURL(),
  body('status').optional().isIn(['draft', 'published', 'archived']),
  validate,
  async (req, res) => {
    try {
      const post = await updatePost(req.params.id, req.user.userId, req.body);
      res.json({ post });
    } catch (error) {
      console.error('Update post error:', error);
      res.status(400).json({ error: error.message });
    }
  }
);

// Delete a post
router.delete('/posts/:id', authenticate, async (req, res) => {
  try {
    await deletePost(req.params.id, req.user.userId);
    res.json({ success: true, message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(400).json({ error: error.message });
  }
});

export default router;