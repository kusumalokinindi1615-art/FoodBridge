const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { geocodeAddress } = require('../utils/geocode');
const { sendMail } = require('../utils/mailer');

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

/* ─── POST /api/auth/forgot-password ───────────────────
   Always 200 — never reveal whether an email exists.
   Token is random, stored only as SHA-256 hash, single-use, 15-min TTL. */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ email: String(email).toLowerCase() }).select('+resetPasswordToken +resetPasswordExpires');
    if (!user) {
      // Same response shape/time as the found-user path → no user enumeration
      return res.json({ message: 'If an account with that email exists, a reset link has been sent.' });
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password/${rawToken}`;
    const delivered = await sendMail({
      to: user.email,
      subject: 'FoodBridge — Reset your password',
      text: `Hi ${user.name},\n\nA password reset was requested for your FoodBridge account.\n\nReset link (valid for 15 minutes):\n${resetUrl}\n\nIf you didn't request this, you can safely ignore this email.`,
      html: `<p>Hi ${user.name},</p><p>A password reset was requested for your <b>FoodBridge</b> account.</p><p><a href="${resetUrl}">Reset your password</a> (valid for 15 minutes)</p><p style="color:#888">If you didn't request this, you can safely ignore this email.</p>`,
    });

    // Dev fallback: no SMTP configured → surface the link so the flow is testable locally
    if (!delivered) {
      console.log(`
📧 [dev-mode] No SMTP configured — password reset link for ${user.email}:
   ${resetUrl}
`);
      return res.json({ message: 'If an account with that email exists, a reset link has been sent.', devResetUrl: resetUrl });
    }
    res.json({ message: 'If an account with that email exists, a reset link has been sent.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to process password reset request' });
  }
});

/* ─── POST /api/auth/reset-password/:token ───────────── */
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ message: 'Password is required' });
    if (String(password).length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    const hashed = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashed,
      resetPasswordExpires: { $gt: new Date() },
    }).select('+resetPasswordToken +resetPasswordExpires');
    if (!user) return res.status(400).json({ message: 'Invalid or expired reset link. Please request a new one.' });

    user.password = password; // re-hashed by the pre-save hook
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Password reset successful. You can now log in with your new password.' });
  } catch (err) {
    res.status(500).json({ message: 'Password reset failed' });
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
