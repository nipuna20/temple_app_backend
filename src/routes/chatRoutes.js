const express = require('express');
const { authenticate } = require('../middleware/auth');
const { ChatMessage, Event, User } = require('../models');

// Router for chat functionality. Allows authenticated users to post and fetch messages.
const router = express.Router();

// GET /api/chat/:eventId? -> Fetch chat messages.
// If eventId provided, return messages for that event. Otherwise, return global messages.
router.get('/:eventId?', authenticate, async (req, res) => {
  const { eventId } = req.params;
  try {
    const where = {};
    if (eventId) where.eventId = eventId;
    const messages = await ChatMessage.findAll({
      where,
      order: [['createdAt', 'ASC']],
      include: [{ model: User, attributes: ['firstName', 'lastName', 'role'] }, { model: Event, attributes: ['title'] }],
    });
    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching messages' });
  }
});

// POST /api/chat/:eventId? -> Post a new chat message.
router.post('/:eventId?', authenticate, async (req, res) => {
  const { eventId } = req.params;
  const { message } = req.body;
  if (!message || message.trim() === '') {
    return res.status(400).json({ message: 'Message is required' });
  }
  try {
    const newMessage = await ChatMessage.create({
      userId: req.user.id,
      eventId: eventId || null,
      message,
    });
    // Fetch the created message with user and event details
    const messageWithDetails = await ChatMessage.findByPk(newMessage.id, {
      include: [{ model: User, attributes: ['firstName', 'lastName', 'role'] }, { model: Event, attributes: ['title'] }],
    });
    res.status(201).json(messageWithDetails);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error posting message' });
  }
});

module.exports = router;