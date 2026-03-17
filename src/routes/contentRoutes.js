const express = require('express');
const { Content } = require('../models');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Ensure there is always a content row
async function getContent() {
  let content = await Content.findOne();
  if (!content) {
    content = await Content.create({});
  }
  return content;
}

// GET all content
router.get('/', async (req, res) => {
  const content = await getContent();
  res.json(content);
});

// GET about sections
router.get('/about', async (req, res) => {
  const content = await getContent();
  res.json({
    history: content.history,
    leadership: content.leadership,
    coreValues: content.coreValues,
    vision: content.vision,
    mission: content.mission,
  });
});

// POST about (admin)
router.post('/about', authenticate, requireAdmin, async (req, res) => {
  const { history, leadership, coreValues, vision, mission } = req.body;
  const content = await getContent();
  await content.update({ history, leadership, coreValues, vision, mission });
  res.json({ message: 'About content updated' });
});

// GET contact info
router.get('/contact', async (req, res) => {
  const content = await getContent();
  res.json({
    address: content.contactAddress,
    phone: content.contactPhone,
    email: content.contactEmail,
    faq: content.faq,
    googleMapEmbed: content.googleMapEmbed,  // ✅ must exist
  });
});

// POST contact (admin)
router.post('/contact', authenticate, requireAdmin, async (req, res) => {
  const { address, phone, email, faq, googleMapEmbed } = req.body;
  const content = await getContent();
  await content.update({
    contactAddress: address,
    contactPhone: phone,
    contactEmail: email,
    faq,
    googleMapEmbed, // ✅ must exist
  });
  res.json({ message: 'Contact info updated' });
});

module.exports = router;