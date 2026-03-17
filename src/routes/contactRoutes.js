const express = require('express');
const { ContactMessage } = require('../models');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Submit new contact message
router.post('/messages', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    const contact = await ContactMessage.create({ name, email, message });
    // TODO: send email to admin or auto reply
    res.json(contact);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error sending message' });
  }
});

// List contact messages (admin)
router.get('/messages', authenticate, requireAdmin, async (req, res) => {
  const messages = await ContactMessage.findAll({ order: [['createdAt', 'DESC']] });
  res.json(messages);
});

// Update responded status (admin)
router.put('/messages/:id', authenticate, requireAdmin, async (req, res) => {
  const msg = await ContactMessage.findByPk(req.params.id);
  if (!msg) return res.status(404).json({ message: 'Not found' });
  await msg.update(req.body);
  res.json(msg);
});

module.exports = router;