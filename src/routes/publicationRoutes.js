const express = require('express');
const { Publication } = require('../models');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// List publications
router.get('/', async (req, res) => {
  const pubs = await Publication.findAll({ order: [['createdAt', 'DESC']] });
  res.json(pubs);
});

// Create publication (admin)
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { title, description, url, type } = req.body;
    const pub = await Publication.create({ title, description, url, type });
    res.json(pub);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creating publication' });
  }
});

// Delete publication (admin)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  const pub = await Publication.findByPk(req.params.id);
  if (!pub) return res.status(404).json({ message: 'Not found' });
  await pub.destroy();
  res.json({ message: 'Deleted' });
});

module.exports = router;