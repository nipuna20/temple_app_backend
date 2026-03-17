const express = require('express');
const { BlogPost } = require('../models');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// List blog posts
router.get('/', async (req, res) => {
  const { status } = req.query;
  const where = {};
  if (status) where.status = status;
  const posts = await BlogPost.findAll({ where, order: [['createdAt', 'DESC']] });
  res.json(posts);
});

// Get single post
router.get('/:id', async (req, res) => {
  const post = await BlogPost.findByPk(req.params.id);
  if (!post) return res.status(404).json({ message: 'Not found' });
  res.json(post);
});

// Create post (admin)
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { title, description, body, authorName, authorImage, status } = req.body;
    const post = await BlogPost.create({ title, description, body, authorName, authorImage, status: status || 'draft' });
    res.json(post);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creating blog post' });
  }
});

// Update post (admin)
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  const post = await BlogPost.findByPk(req.params.id);
  if (!post) return res.status(404).json({ message: 'Not found' });
  await post.update(req.body);
  res.json(post);
});

// Delete post (admin)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  const post = await BlogPost.findByPk(req.params.id);
  if (!post) return res.status(404).json({ message: 'Not found' });
  await post.destroy();
  res.json({ message: 'Deleted' });
});

module.exports = router;