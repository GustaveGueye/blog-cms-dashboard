// Posts Routes - CRUD + Pagination + Prisma
import { Router } from 'express';
import { body, query, param, validationResult } from 'express-validator';

const router = Router();

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// GET /api/posts - List posts with pagination
router.get('/',
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
  query('published').optional().isBoolean().toBoolean(),
  validate,
  async (req, res) => {
    try {
      const page = req.query.page || 1;
      const limit = req.query.limit || 10;
      const published = req.query.published !== undefined ? req.query.published : true;
      const skip = (page - 1) * limit;

      const where = published ? { published: true } : {};

      const [posts, total] = await Promise.all([
        req.prisma.post.findMany({
          where,
          include: {
            author: { select: { id: true, name: true, email: true } }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit
        }),
        req.prisma.post.count({ where })
      ]);

      res.json({
        posts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('List posts error:', error);
      res.status(500).json({ error: 'Failed to fetch posts' });
    }
  }
);

// GET /api/posts/:id - Get single post
router.get('/:id',
  param('id').isUUID(),
  validate,
  async (req, res) => {
    try {
      const post = await req.prisma.post.findUnique({
        where: { id: req.params.id },
        include: {
          author: { select: { id: true, name: true, email: true } }
        }
      });

      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }

      res.json({ post });
    } catch (error) {
      console.error('Get post error:', error);
      res.status(500).json({ error: 'Failed to fetch post' });
    }
  }
);

// POST /api/posts - Create post (protected)
router.post('/',
  body('title').trim().isLength({ min: 1, max: 200 }),
  body('content').optional().isString(),
  body('published').optional().isBoolean(),
  validate,
  async (req, res) => {
    try {
      const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Verify token (reuse from auth routes)
      const jwt = await import('jsonwebtoken');
      const JWT_SECRET = process.env.JWT_SECRET || 'blog-cms-secret-key-change-in-production';
      
      let payload;
      try {
        payload = jwt.default.verify(token, JWT_SECRET);
      } catch {
        return res.status(401).json({ error: 'Invalid token' });
      }

      const { title, content, published = false } = req.body;

      const post = await req.prisma.post.create({
        data: {
          title,
          content,
          published,
          authorId: payload.userId
        },
        include: {
          author: { select: { id: true, name: true, email: true } }
        }
      });

      res.status(201).json({ post });
    } catch (error) {
      console.error('Create post error:', error);
      res.status(500).json({ error: 'Failed to create post' });
    }
  }
);

// PUT /api/posts/:id - Update post (protected)
router.put('/:id',
  param('id').isUUID(),
  body('title').optional().trim().isLength({ min: 1, max: 200 }),
  body('content').optional().isString(),
  body('published').optional().isBoolean(),
  validate,
  async (req, res) => {
    try {
      const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const jwt = await import('jsonwebtoken');
      const JWT_SECRET = process.env.JWT_SECRET || 'blog-cms-secret-key-change-in-production';
      
      let payload;
      try {
        payload = jwt.default.verify(token, JWT_SECRET);
      } catch {
        return res.status(401).json({ error: 'Invalid token' });
      }

      // Check ownership
      const existing = await req.prisma.post.findUnique({
        where: { id: req.params.id }
      });

      if (!existing) {
        return res.status(404).json({ error: 'Post not found' });
      }

      if (existing.authorId !== payload.userId) {
        return res.status(403).json({ error: 'Not authorized to update this post' });
      }

      const { title, content, published } = req.body;
      const updateData = {};
      if (title !== undefined) updateData.title = title;
      if (content !== undefined) updateData.content = content;
      if (published !== undefined) updateData.published = published;

      const post = await req.prisma.post.update({
        where: { id: req.params.id },
        data: updateData,
        include: {
          author: { select: { id: true, name: true, email: true } }
        }
      });

      res.json({ post });
    } catch (error) {
      console.error('Update post error:', error);
      res.status(500).json({ error: 'Failed to update post' });
    }
  }
);

// DELETE /api/posts/:id - Delete post (protected)
router.delete('/:id',
  param('id').isUUID(),
  validate,
  async (req, res) => {
    try {
      const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const jwt = await import('jsonwebtoken');
      const JWT_SECRET = process.env.JWT_SECRET || 'blog-cms-secret-key-change-in-production';
      
      let payload;
      try {
        payload = jwt.default.verify(token, JWT_SECRET);
      } catch {
        return res.status(401).json({ error: 'Invalid token' });
      }

      const existing = await req.prisma.post.findUnique({
        where: { id: req.params.id }
      });

      if (!existing) {
        return res.status(404).json({ error: 'Post not found' });
      }

      if (existing.authorId !== payload.userId) {
        return res.status(403).json({ error: 'Not authorized to delete this post' });
      }

      await req.prisma.post.delete({
        where: { id: req.params.id }
      });

      res.json({ message: 'Post deleted successfully' });
    } catch (error) {
      console.error('Delete post error:', error);
      res.status(500).json({ error: 'Failed to delete post' });
    }
  }
);

export default router;