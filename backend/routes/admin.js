const express = require('express');
const User = require('../models/User');
const Donation = require('../models/Donation');
const { protect, authorize } = require('../middleware/auth');
const { notify } = require('../utils/notify');
const Notification = require('../models/Notification');
const mongoose = require('mongoose');

const USER_ROLES = ['DONOR', 'NGO', 'VOLUNTEER'];
const DONATION_STATUSES = ['AVAILABLE','NGO_ACCEPTED','VOLUNTEER_ASSIGNED','PICKUP_STARTED','FOOD_COLLECTED','DELIVERY_STARTED','DELIVERED','COMPLETED','EXPIRED','CLOSED'];

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

// Admin-managed account creation uses the existing User model and password hash hook.
router.post('/users', async (req, res) => {
  try {
    const { name, email, password, role, phone, location, contactPerson } = req.body;
    if (!name || !email || !password || !role) return res.status(400).json({ message: 'Name, email, password and role are required' });
    if (!USER_ROLES.includes(role)) return res.status(400).json({ message: 'Role must be DONOR, NGO or VOLUNTEER' });
    if (String(password).length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters' });
    const user = await User.create({ name, email: String(email).trim().toLowerCase(), password, role, phone, location, contactPerson });
    res.status(201).json({ user: { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone, location: user.location, contactPerson: user.contactPerson, isVerified: user.isVerified, createdAt: user.createdAt } });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'Email already registered' });
    res.status(400).json({ message: err.message || 'Account creation failed' });
  }
});

router.patch('/users/:id', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid user id' });
    const user = await User.findById(req.params.id).select('+password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    const allowed = ['name', 'email', 'phone', 'location', 'contactPerson'];
    for (const field of allowed) if (req.body[field] !== undefined) user[field] = field === 'email' ? String(req.body[field]).trim().toLowerCase() : req.body[field];
    if (req.body.password !== undefined) {
      if (String(req.body.password).length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters' });
      user.password = req.body.password;
    }
    await user.save();
    res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone, location: user.location, contactPerson: user.contactPerson, isVerified: user.isVerified, createdAt: user.createdAt } });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'Email already registered' });
    res.status(400).json({ message: err.message || 'Account update failed' });
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
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid user id' });
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role === 'ADMIN') return res.status(400).json({ message: 'Cannot delete an admin account' });
    const linkedDonation = await Donation.exists({ $or: [{ donorId: user._id }, { ngoId: user._id }, { volunteerId: user._id }] });
    if (linkedDonation) return res.status(409).json({ message: 'This account is linked to donation records. Remove or reassign those records first.' });
    await user.deleteOne();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/donations', async (req, res) => {
  try {
    const { title, category, qty, servings, preparedDate, safeUntil, location, donorId } = req.body;
    if (!title || !category || !qty || !location || !donorId || !preparedDate || !safeUntil || !Number.isFinite(Number(servings)) || Number(servings) < 1) {
      return res.status(400).json({ message: 'Title, category, quantity, servings, prepared time, safe-until time, pickup location and donor are required' });
    }
    if (!mongoose.isValidObjectId(donorId)) return res.status(400).json({ message: 'Invalid donor id' });
    const donor = await User.findOne({ _id: donorId, role: 'DONOR' }).select('_id');
    if (!donor) return res.status(400).json({ message: 'Select an existing donor account' });
    const prepared = new Date(preparedDate); const safe = new Date(safeUntil);
    if (Number.isNaN(prepared.getTime()) || Number.isNaN(safe.getTime()) || safe <= prepared) return res.status(400).json({ message: 'Safe-until time must be later than the prepared time' });
    const donation = await Donation.create({
      title: String(title).trim(), category: String(category).trim(), description: req.body.description,
      qty: String(qty).trim(), servings: Number(servings), preparedDate: prepared, safeUntil: safe,
      storageType: req.body.storageType, location: String(location).trim(), deliveryLocation: req.body.deliveryLocation,
      imageUrl: req.body.imageUrl || '', donorId: donor._id, status: 'AVAILABLE',
    });
    res.status(201).json({ donation });
  } catch (err) { res.status(400).json({ message: err.message || 'Donation creation failed' }); }
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

router.patch('/donations/:id', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid donation id' });
    const donation = await Donation.findById(req.params.id);
    if (!donation) return res.status(404).json({ message: 'Donation not found' });
    const allowed = ['title','category','description','qty','servings','preparedDate','safeUntil','storageType','location','deliveryLocation','imageUrl'];
    for (const field of allowed) if (req.body[field] !== undefined) donation[field] = req.body[field];
    if (req.body.servings !== undefined) donation.servings = Number(req.body.servings);
    const nextPrepared = new Date(donation.preparedDate); const nextSafe = new Date(donation.safeUntil);
    if (Number.isNaN(nextPrepared.getTime()) || Number.isNaN(nextSafe.getTime()) || nextSafe <= nextPrepared) return res.status(400).json({ message: 'Safe-until time must be later than the prepared time' });
    await donation.save();
    res.json({ donation });
  } catch (err) { res.status(400).json({ message: err.message || 'Donation update failed' }); }
});

router.delete('/donations/:id', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid donation id' });
    const donation = await Donation.findByIdAndDelete(req.params.id);
    if (!donation) return res.status(404).json({ message: 'Donation not found' });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/activity', async (req, res) => {
  try {
    const ids = await User.find({ role: 'ADMIN' }).distinct('_id');
    const notifications = await Notification.find({ userId: { $in: ids } }).populate('donationId', 'title status').sort({ createdAt: -1 }).limit(50);
    res.json({ notifications });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
