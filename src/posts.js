// Blog posts module - CRUD for blog posts
import { db, get, all, run } from './db.js';

// Generate slug from title
export function generateSlug(title) {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .substring(0, 100);
}

// Ensure unique slug
export async function ensureUniqueSlug(baseSlug, excludeId = null) {
  let slug = baseSlug;
  let counter = 1;
  
  while (true) {
    const existing = await get('SELECT id FROM posts WHERE slug = ?' + (excludeId ? ' AND id != ?' : ''), 
      excludeId ? [slug, excludeId] : [slug]);
    if (!existing) break;
    slug = `${baseSlug}-${counter++}`;
  }
  
  return slug;
}

// Create a new post
export async function createPost(userId, postData) {
  const { title, content, excerpt, cover_image, status = 'draft' } = postData;
  
  if (!title || !title.trim()) {
    throw new Error('Title is required');
  }
  if (!content || !content.trim()) {
    throw new Error('Content is required');
  }
  
  const baseSlug = generateSlug(title);
  const slug = await ensureUniqueSlug(baseSlug);
  
  const publishedAt = status === 'published' ? new Date().toISOString() : null;
  
  const result = await run(
    `INSERT INTO posts (user_id, title, slug, content, excerpt, cover_image, status, published_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [userId, title.trim(), slug, content, excerpt?.trim() || null, cover_image?.trim() || null, status, publishedAt]
  );
  
  return await getPostById(result.lastID);
}

// Get post by ID
export async function getPostById(id) {
  return await get(
    `SELECT p.*, u.name as author_name, u.email as author_email
     FROM posts p
     JOIN users u ON p.user_id = u.id
     WHERE p.id = ?`,
    [id]
  );
}

// Get post by slug
export async function getPostBySlug(slug) {
  return await get(
    `SELECT p.*, u.name as author_name, u.email as author_email
     FROM posts p
     JOIN users u ON p.user_id = u.id
     WHERE p.slug = ?`,
    [slug]
  );
}

// Get all posts with pagination and filters
export async function getPosts(options = {}) {
  const {
    page = 1,
    limit = 10,
    status,
    userId,
    search,
    sortBy = 'created_at',
    sortOrder = 'DESC'
  } = options;
  
  const offset = (page - 1) * limit;
  
  let whereClause = 'WHERE 1=1';
  const params = [];
  
  if (status) {
    whereClause += ' AND p.status = ?';
    params.push(status);
  }
  
  if (userId) {
    whereClause += ' AND p.user_id = ?';
    params.push(userId);
  }
  
  if (search) {
    whereClause += ' AND (p.title LIKE ? OR p.content LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  
  const validSortColumns = ['created_at', 'updated_at', 'published_at', 'title'];
  const validSortOrders = ['ASC', 'DESC'];
  const safeSortBy = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
  const safeSortOrder = validSortOrders.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';
  
  const posts = await all(
    `SELECT p.*, u.name as author_name
     FROM posts p
     JOIN users u ON p.user_id = u.id
     ${whereClause}
     ORDER BY p.${safeSortBy} ${safeSortOrder}
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  
  const totalResult = await get(
    `SELECT COUNT(*) as count FROM posts p ${whereClause}`,
    params
  );
  
  return {
    posts,
    pagination: {
      page,
      limit,
      total: totalResult.count,
      totalPages: Math.ceil(totalResult.count / limit)
    }
  };
}

// Update a post
export async function updatePost(id, userId, postData) {
  const { title, content, excerpt, cover_image, status } = postData;
  
  const existing = await getPostById(id);
  if (!existing) {
    throw new Error('Post not found');
  }
  
  if (existing.user_id !== userId) {
    throw new Error('Unauthorized: You can only edit your own posts');
  }
  
  const updates = [];
  const params = [];
  
  if (title !== undefined) {
    if (!title.trim()) throw new Error('Title cannot be empty');
    updates.push('title = ?');
    params.push(title.trim());
    
    const baseSlug = generateSlug(title);
    const slug = await ensureUniqueSlug(baseSlug, id);
    updates.push('slug = ?');
    params.push(slug);
  }
  
  if (content !== undefined) {
    if (!content.trim()) throw new Error('Content cannot be empty');
    updates.push('content = ?');
    params.push(content);
  }
  
  if (excerpt !== undefined) {
    updates.push('excerpt = ?');
    params.push(excerpt?.trim() || null);
  }
  
  if (cover_image !== undefined) {
    updates.push('cover_image = ?');
    params.push(cover_image?.trim() || null);
  }
  
  if (status !== undefined) {
    const validStatuses = ['draft', 'published', 'archived'];
    if (!validStatuses.includes(status)) throw new Error('Invalid status');
    updates.push('status = ?');
    params.push(status);
    
    if (status === 'published' && existing.status !== 'published') {
      updates.push('published_at = ?');
      params.push(new Date().toISOString());
    }
  }
  
  if (updates.length === 0) {
    return existing;
  }
  
  updates.push('updated_at = ?');
  params.push(new Date().toISOString());
  
  params.push(id);
  
  await run(
    `UPDATE posts SET ${updates.join(', ')} WHERE id = ?`,
    params
  );
  
  return await getPostById(id);
}

// Delete a post
export async function deletePost(id, userId) {
  const existing = await getPostById(id);
  if (!existing) {
    throw new Error('Post not found');
  }
  
  if (existing.user_id !== userId) {
    throw new Error('Unauthorized: You can only delete your own posts');
  }
  
  await run('DELETE FROM posts WHERE id = ?', [id]);
  return { success: true };
}

// Get published posts for public blog
export async function getPublishedPosts(options = {}) {
  return await getPosts({ ...options, status: 'published' });
}

// Get user's posts (admin or own)
export async function getUserPosts(userId, options = {}) {
  return await getPosts({ ...options, userId });
}

// Get post statistics
export async function getPostStats(userId = null) {
  let whereClause = '';
  const params = [];
  
  if (userId) {
    whereClause = 'WHERE user_id = ?';
    params.push(userId);
  }
  
  const stats = await all(
    `SELECT status, COUNT(*) as count FROM posts ${whereClause} GROUP BY status`,
    params
  );
  
  const result = { draft: 0, published: 0, archived: 0, total: 0 };
  
  stats.forEach(row => {
    result[row.status] = row.count;
    result.total += row.count;
  });
  
  return result;
}