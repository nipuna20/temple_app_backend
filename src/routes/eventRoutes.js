const express = require('express');
const stripeLib = require('stripe');
const { Op } = require('sequelize');
const { Event, EventRegistration, User } = require('../models');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();
const stripe = stripeLib(process.env.STRIPE_SECRET_KEY || '');

/**
 * List all events.
 * Query params:
 *   upcoming=true  - only events whose registrationDeadline is in the future
 *   limit=n        - limit the number of returned events
 */
router.get('/', async (req, res) => {
  try {
    const { upcoming, limit } = req.query;
    const where = {};
    if (upcoming === 'true') {
      // Use Op.gte for Sequelize date comparison
      where.registrationDeadline = { [Op.gte]: new Date() };
    }
    const events = await Event.findAll({
      where,
      limit: limit ? parseInt(limit, 10) : undefined,
      order: [['registrationDeadline', 'ASC']],
    });
    res.json(events);
  } catch (err) {
    console.error('Error fetching events:', err);
    res.status(500).json({ message: 'Error fetching events' });
  }
});

/**
 * Get the current user's event registrations with the associated event.
 * Placed before parameterised routes to avoid matching /:id.
 */
router.get('/my/registrations', authenticate, async (req, res) => {
  try {
    const registrations = await EventRegistration.findAll({
      where: { userId: req.user.id },
      include: [{ model: Event }],
      order: [['createdAt', 'DESC']],
    });
    res.json(registrations);
  } catch (err) {
    console.error('Error fetching my registrations:', err);
    res.status(500).json({ message: 'Error fetching my registrations' });
  }
});

/**
 * Get an event by id.
 */
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json(event);
  } catch (err) {
    console.error('Error fetching event:', err);
    res.status(500).json({ message: 'Error fetching event' });
  }
});

/**
 * Create a new event (admin only).
 */
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { title, registrationDeadline, description, image, agenda, amount } = req.body;
    const newEvent = await Event.create({
      title,
      registrationDeadline,
      description,
      image,
      agenda,
      amount,
    });
    res.json(newEvent);
  } catch (err) {
    console.error('Error creating event:', err);
    res.status(500).json({ message: 'Error creating event' });
  }
});

/**
 * Update an event (admin only).
 */
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    await event.update(req.body);
    res.json(event);
  } catch (err) {
    console.error('Error updating event:', err);
    res.status(500).json({ message: 'Error updating event' });
  }
});

/**
 * Delete an event (admin only).
 */
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    await event.destroy();
    res.json({ message: 'Event deleted' });
  } catch (err) {
    console.error('Error deleting event:', err);
    res.status(500).json({ message: 'Error deleting event' });
  }
});

/**
 * Register for an event.
 * Requires authentication. If the event is paid, registration is saved with paymentStatus='pending'.
 * If the event is free, registration is automatically marked as paid.
 */
router.post('/:id/register', authenticate, async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    const { firstName, lastName, email, telephone, address, additionalInfo } = req.body;
    const isPaidEvent = Number(event.amount || 0) > 0;
    // Check if this user already registered
    let registration = await EventRegistration.findOne({
      where: { eventId: event.id, userId: req.user.id },
    });
    if (registration) {
      // Update details but keep paymentStatus
      const nextPaymentStatus =
        registration.paymentStatus === 'paid'
          ? 'paid'
          : isPaidEvent
          ? 'pending'
          : 'paid';
      await registration.update({
        firstName,
        lastName,
        email,
        telephone,
        address,
        additionalInfo,
        paymentStatus: nextPaymentStatus,
        paidAt: nextPaymentStatus === 'paid' ? registration.paidAt || new Date() : null,
      });
    } else {
      registration = await EventRegistration.create({
        eventId: event.id,
        userId: req.user.id,
        firstName,
        lastName,
        email,
        telephone,
        address,
        additionalInfo,
        paymentStatus: isPaidEvent ? 'pending' : 'paid',
        paidAt: isPaidEvent ? null : new Date(),
      });
    }
    res.json({
      message: isPaidEvent
        ? 'Registration saved. Payment required.'
        : 'Registration successful.',
      registration,
      requiresPayment: isPaidEvent && registration.paymentStatus !== 'paid',
    });
  } catch (err) {
    console.error('Error registering for event:', err);
    res.status(500).json({ message: 'Error registering for event' });
  }
});

/**
 * Create a Stripe payment intent for a paid event.
 * Requires authentication and an existing registration with paymentStatus != 'paid'.
 */
router.post('/:id/create-payment-intent', authenticate, async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    const amount = Number(event.amount || 0);
    if (amount <= 0) return res.status(400).json({ message: 'This event is free' });
    const registration = await EventRegistration.findOne({
      where: { eventId: event.id, userId: req.user.id },
    });
    if (!registration) {
      return res.status(400).json({ message: 'Please register for the event before payment.' });
    }
    if (registration.paymentStatus === 'paid') {
      return res.status(400).json({ message: 'You have already paid for this event.' });
    }
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      metadata: {
        eventId: String(event.id),
        userId: String(req.user.id),
      },
    });
    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (err) {
    console.error('Failed to create payment intent:', err);
    res.status(500).json({ message: 'Failed to create payment intent' });
  }
});

/**
 * Confirm payment for an event using paymentIntentId.
 * Requires authentication. Updates the registration to paid if the payment succeeded and belongs to this user & event.
 */
router.post('/:id/confirm-payment', authenticate, async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    const { paymentIntentId } = req.body;
    if (!paymentIntentId) return res.status(400).json({ message: 'paymentIntentId is required' });
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ message: 'Payment not successful' });
    }
    // Validate metadata matches
    if (
      String(paymentIntent.metadata?.eventId || '') !== String(event.id) ||
      String(paymentIntent.metadata?.userId || '') !== String(req.user.id)
    ) {
      return res.status(403).json({ message: 'Payment does not belong to this user/event' });
    }
    const registration = await EventRegistration.findOne({
      where: { eventId: event.id, userId: req.user.id },
    });
    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }
    await registration.update({
      paymentStatus: 'paid',
      paymentIntentId,
      paidAt: new Date(),
    });
    res.json({ message: 'Payment confirmed', registration });
  } catch (err) {
    console.error('Error confirming payment:', err);
    res.status(500).json({ message: 'Error confirming payment' });
  }
});

/**
 * Check the current user's registration and payment status for an event.
 */
router.get('/:id/my-registration', authenticate, async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    const registration = await EventRegistration.findOne({
      where: { eventId: event.id, userId: req.user.id },
    });
    if (!registration) {
      return res.json({ registered: false, paid: false, registration: null });
    }
    res.json({
      registered: true,
      paid: registration.paymentStatus === 'paid',
      registration,
    });
  } catch (err) {
    console.error('Error checking registration:', err);
    res.status(500).json({ message: 'Error checking registration' });
  }
});

/**
 * Get all registrations for an event (admin only).
 */
router.get('/:id/registrations', authenticate, requireAdmin, async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    const regs = await EventRegistration.findAll({
      where: { eventId: event.id },
      order: [['createdAt', 'DESC']],
    });
    res.json(regs);
  } catch (err) {
    console.error('Error fetching registrations:', err);
    res.status(500).json({ message: 'Error fetching registrations' });
  }
});

module.exports = router;