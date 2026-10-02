const express = require('express');
const User = require('../models/User');
const Donation = require('../models/Donation');
const { protect, authorize } = require('../middleware/auth');
const { notify } = require('../utils/notify');
const Notification = require('../models/Notification');
const mongoose = require('mongoose');

const router = express.Router();

router.use(protect, authorize('ADMIN'));

/* ─── GET /api/admin/stats ───────────────────────────── */
router.get('/stats', async (req, res) => {
  try {
    const [donors, ngos, verifiedNgos, volunteers, total, delivered, active, available, expired, meals] = await Promise.all([
      User.countDocuments({ role: 'DONOR' }),
      User.countDocuments({ role: 'NGO' }),
      User.countDocuments({ role: 'NGO', isVerified: true }),
      User.countDocuments({ role: 'VOLUNTEER' }),
      Donation.countDocuments({}),
      Donation.countDocuments({ status: { $in: ['DELIVERED', 'COMPLETED'] } }),
      Donation.countDocuments({ status: { $in: ['NGO_ACCEPTED', 'VOLUNTEER_ASSIGNED', 'PICKUP_STARTED', 'FOOD_COLLECTED', 'DELIVERY_STARTED'] } }),
      Donation.countDocuments({ status: 'AVAILABLE' }),
      Donation.countDocuments({ status: 'EXPIRED' }),
      Donation.aggregate([{ $match: { status: { $in: ['DELIVERED', 'COMPLETED'] } } }, { $group: { _id: null, meals: { $sum: '$servings' } } }]),
    ]);
    res.json({ stats: { donors, ngos, verifiedNgos, pendingNgos: ngos - verifiedNgos, volunteers, total, delivered, active, available, expired, mealsShared: meals[0]?.meals || 0 } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ─── GET /api/admin/users ───────────────────────────── */
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('name email phone role location contactPerson isVerified createdAt').sort({ createdAt: -1 });
    res.json({ users });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ─── PATCH /api/admin/users/:id/verify ──────────────── */
router.patch('/users/:id/verify', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid user id' });
    if (typeof req.body.isVerified !== 'boolean') return res.status(400).json({ message: 'isVerified must be true or false' });
    const user = await User.findOneAndUpdate({ _id: req.params.id, role: 'NGO' }, { isVerified: req.body.isVerified }, { new: true }).select('name email role isVerified');
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
    const { status, search } = req.query;
    const filter = {};
    if (status && status !== 'ALL') {
      if (!['AVAILABLE','NGO_ACCEPTED','VOLUNTEER_ASSIGNED','PICKUP_STARTED','FOOD_COLLECTED','DELIVERY_STARTED','DELIVERED','COMPLETED','EXPIRED','CLOSED'].includes(status)) return res.status(400).json({ message: 'Invalid donation status' });
      filter.status = status;
    }
    if (search) {
      const rx = new RegExp(String(search).slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      const matchingUsers = await User.find({ role: { $in: ['DONOR','NGO','VOLUNTEER'] }, $or: [{ name: rx }, { email: rx }] }).distinct('_id');
      filter.$or = [{ title: rx }, { _id: mongoose.isValidObjectId(search) ? search : null }, { donorId: { $in: matchingUsers } }, { ngoId: { $in: matchingUsers } }, { volunteerId: { $in: matchingUsers } }];
    }
    const donations = await Donation.find(filter).populate('donorId', 'name email phone location').populate('ngoId', 'name email phone location').populate('volunteerId', 'name email phone location').sort({ createdAt: -1 });
    res.json({ donations });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/activity', async (req, res) => {
  try {
    const ids = await User.find({ role: 'ADMIN' }).distinct('_id');
    const notifications = await Notification.find({ userId: { $in: ids } }).populate('donationId', 'title status').sort({ createdAt: -1 }).limit(50);
    res.json({ notifications });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
