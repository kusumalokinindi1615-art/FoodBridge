const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { geocodeAddress } = require('../utils/geocode');

const router = express.Router();

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

const publicUser = (u) => ({
  id: u._id,
  name: u.name,
  email: u.email,
  phone: u.phone,
  role: u.role,
  location: u.location,
  contactPerson: u.contactPerson,
  isVerified: u.isVerified,
  createdAt: u.createdAt,
});

/* ─── POST /api/auth/register ────────────────────────── */
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, role, location, contactPerson, lat, lng } = req.body;

    // Admins cannot self-register through public signup
    if (role === 'ADMIN') {
      return res.status(403).json({ message: 'Admin accounts are created by the system' });
    }
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Name, email, password and role are required' });
    }

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(409).json({ message: 'Email already registered' });

    let locationCoords = lat != null && lng != null
      ? { type: 'Point', coordinates: [Number(lng), Number(lat)] }
      : undefined;
    if (!locationCoords && role === 'NGO' && location) {
      const coords = await geocodeAddress(location);
      if (coords) locationCoords = { type: 'Point', coordinates: [coords.lng, coords.lat] };
    }

    const user = await User.create({
      name,
      email,
      password,
      phone,
      role,
      location,
      contactPerson,
      locationCoords,
    });

    res.status(201).json({
      token: signToken(user._id),
      user: publicUser(user),
    });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'Email already registered' });
    res.status(400).json({ message: err.message || 'Registration failed' });
  }
});

/* ─── POST /api/auth/login ───────────────────────────── */
router.post('/login', async (req, res) => {
  try {
    const { email, password, username } = req.body;
    if ((!email && !username) || !password) {
      return res.status(400).json({ message: 'Username/email and password are required' });
    }

    // Lookup by email OR username (name field) — both go through the same bcrypt check
    const user = await User.findOne({
      $or: [
        { email: (email || '').toLowerCase() },
        { name: username || email },
      ],
    }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.json({ token: signToken(user._id), user: publicUser(user) });
  } catch (err) {
    res.status(500).json({ message: 'Login failed' });
  }
});

/* ─── GET /api/auth/me ───────────────────────────────── */
router.get('/me', protect, async (req, res) => {
  res.json({ user: publicUser(req.user) });
});

/* ─── PATCH /api/auth/profile ──────────────────────────
   Edit permitted profile fields. Email/password/role are protected —
   changing them would require separate verified flows. */
router.patch('/profile', protect, async (req, res) => {
  try {
    const allowed = ['name', 'phone', 'location', 'contactPerson'];
    const updates = {};
    allowed.forEach((f) => {
      if (req.body[f] !== undefined) updates[f] = req.body[f];
    });
    if (updates.location && req.user.role === 'NGO' && updates.location !== req.user.location) {
      const coords = await geocodeAddress(updates.location);
      if (coords) updates.locationCoords = { type: 'Point', coordinates: [coords.lng, coords.lat] };
    }
    if (updates.name !== undefined && !String(updates.name).trim()) {
      return res.status(400).json({ message: 'Name cannot be empty' });
    }
    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });
    res.json({ user: publicUser(user) });
  } catch (err) {
    res.status(400).json({ message: err.message || 'Profile update failed' });
  }
});

module.exports = router;
