const express = require('express');
const { CommunityPost } = require('../models');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// List community posts
router.get('/', async (req, res) => {
  const posts = await CommunityPost.findAll({ order: [['createdAt', 'DESC']] });
  res.json(posts);
});

// Create community post (admin)
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { title, description, mediaUrls } = req.body;
    const post = await CommunityPost.create({ title, description, mediaUrls });
    res.json(post);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creating community post' });
  }
});

// Update community post (admin)
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  const post = await CommunityPost.findByPk(req.params.id);
  if (!post) return res.status(404).json({ message: 'Not found' });
  await post.update(req.body);
  res.json(post);
});

// Delete community post (admin)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  const post = await CommunityPost.findByPk(req.params.id);
  if (!post) return res.status(404).json({ message: 'Not found' });
  await post.destroy();
  res.json({ message: 'Deleted' });
});

module.exports = router;