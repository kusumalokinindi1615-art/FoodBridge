const express = require('express');
const User = require('../models/User');
const Donation = require('../models/Donation');
const { protect, authorize } = require('../middleware/auth');
const { notify } = require('../utils/notify');

const router = express.Router();

router.use(protect, authorize('ADMIN'));

/* ─── GET /api/admin/stats ───────────────────────────── */
router.get('/stats', async (req, res) => {
  try {
    const [donors, ngos, volunteers, total, delivered, active, expired] = await Promise.all([
      User.countDocuments({ role: 'DONOR' }),
      User.countDocuments({ role: 'NGO' }),
      User.countDocuments({ role: 'VOLUNTEER' }),
      Donation.countDocuments({}),
      Donation.countDocuments({ status: 'DELIVERED' }),
      Donation.countDocuments({ status: { $in: ['NGO_ACCEPTED', 'VOLUNTEER_ASSIGNED', 'PICKUP_STARTED', 'FOOD_COLLECTED', 'DELIVERY_STARTED'] } }),
      Donation.countDocuments({ status: 'EXPIRED' }),
    ]);
    res.json({ stats: { donors, ngos, volunteers, total, delivered, active, expired } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ─── GET /api/admin/users ───────────────────────────── */
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json({ users });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ─── PATCH /api/admin/users/:id/verify ──────────────── */
router.patch('/users/:id/verify', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isVerified: req.body.isVerified ?? true },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ─── DELETE /api/admin/users/:id ────────────────────── */
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role === 'ADMIN') return res.status(400).json({ message: 'Cannot delete an admin account' });
    await user.deleteOne();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ─── GET /api/admin/donations ───────────────────────── */
router.get('/donations', async (req, res) => {
  try {
    const donations = await Donation.find().sort({ createdAt: -1 }).limit(100);
    res.json({ donations });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
