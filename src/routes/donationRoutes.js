const express = require('express');
const stripeLib = require('stripe');
const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');
const { Donation, User } = require('../models');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();
const stripe = stripeLib(process.env.STRIPE_SECRET_KEY || 'sk_test');

// Create payment intent for one-time donation
router.post('/create-payment-intent', async (req, res) => {
  const { amount } = req.body;
  if (!amount || amount < 5) return res.status(400).json({ message: 'Invalid amount' });
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
    });
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Stripe error creating payment intent' });
  }
});

// Handle donation completion: store in DB and send receipt
router.post('/', async (req, res) => {
  try {
    const { type, amount, firstName, lastName, email, address, companyName, companyAddress } = req.body;
    if (!amount || amount < 5) return res.status(400).json({ message: 'Invalid donation amount' });
    const donation = await Donation.create({ type, amount, firstName, lastName, email, address, companyName, companyAddress, status: 'paid' });
    // Generate PDF receipt
    const doc = new PDFDocument();
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', async () => {
      const pdfBuffer = Buffer.concat(chunks);
      // Save to a URL or use path; for simplicity, not saving
      // Send email with nodemailer if email present and not anonymous
      if (email && type !== 'anonymous') {
        const transporter = nodemailer.createTransport({
          host: process.env.EMAIL_HOST || 'smtp.example.com',
          port: parseInt(process.env.EMAIL_PORT) || 587,
          secure: false,
          auth: {
            user: process.env.EMAIL_USER || 'user@example.com',
            pass: process.env.EMAIL_PASS || 'password',
          },
        });
        await transporter.sendMail({
          from: process.env.EMAIL_FROM || 'noreply@temple.org',
          to: email,
          subject: 'Donation Receipt',
          text: 'Thank you for your donation.',
          attachments: [ { filename: 'receipt.pdf', content: pdfBuffer } ],
        });
      }
    });
    doc.fontSize(16).text('Donation Receipt', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Donor: ${type === 'corporate' ? companyName : firstName + ' ' + lastName || 'Anonymous'}`);
    doc.text(`Amount: $${amount}`);
    doc.text(`Date: ${new Date().toLocaleString()}`);
    doc.end();
    res.json(donation);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error recording donation' });
  }
});

// List donations (admin)
router.get('/', authenticate, requireAdmin, async (req, res) => {
  const donations = await Donation.findAll({ order: [['createdAt', 'DESC']] });
  res.json(donations);
});

module.exports = router;