const express = require('express');
const stripeLib = require('stripe');
const { MonthlyDonation, User } = require('../models');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();
const stripe = stripeLib(process.env.STRIPE_SECRET_KEY || 'sk_test');

// Create monthly donation plan
router.post('/', authenticate, async (req, res) => {
  try {
    const { amount, frequency } = req.body;
    const userId = req.user.id;
    // In real life, create Stripe subscription or scheduled payment
    // For now, just record in DB
    const nextChargeDate = new Date();
    const plan = await MonthlyDonation.create({ userId, amount, frequency, nextChargeDate });
    res.json(plan);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creating monthly donation' });
  }
});

// List monthly donations (admin)
router.get('/', authenticate, requireAdmin, async (req, res) => {
  const plans = await MonthlyDonation.findAll();
  res.json(plans);
});

// Update monthly donation (admin)
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  const plan = await MonthlyDonation.findByPk(req.params.id);
  if (!plan) return res.status(404).json({ message: 'Not found' });
  await plan.update(req.body);
  res.json(plan);
});

module.exports = router;