const express = require('express');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    const existing = await User.findOne({ where: { email } });

    if (existing) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    const user = await User.create({
      firstName,
      lastName,
      email,
      passwordHash: password,
      role: 'user',
    });

    res.json({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error registering user' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const valid = await user.validPassword(password);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        email: user.email,
      },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error logging in' });
  }
});

// Get current logged-in user
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'firstName', 'lastName', 'email', 'role', 'createdAt'],
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching profile' });
  }
});

module.exports = router;