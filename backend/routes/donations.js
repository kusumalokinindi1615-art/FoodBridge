const express = require('express');
const mongoose = require('mongoose');
const Donation = require('../models/Donation');
const { protect, authorize } = require('../middleware/auth');
const { notify } = require('../utils/notify');
const { geocodeAddress } = require('../utils/geocode');

const router = express.Router();

/** Socket.IO instance is injected by server.js via app.set('io') */
const getIo = (req) => req.app.get('io');

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&q=80',
  'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80',
  'https://images.unsplash.com/photo-1490818387583-1baba5e638ca?w=800&q=80',
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
];

/* ─── GET /api/donations ───────────────────────────────
   Query: ?status=AVAILABLE&mine=1&nearby=1&lat=&lng=&radiusKm=&search=&category= */
router.get('/', async (req, res) => {
  try {
    const { status, mine, lat, lng, radiusKm, search, category } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (mine && req.headers.authorization?.startsWith('Bearer')) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(
          req.headers.authorization.split(' ')[1],
          process.env.JWT_SECRET
        );
        filter.donorId = decoded.id;
      } catch (_) { /* treat as public list */ }
    }

    if (search) {
      const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ title: rx }, { location: rx }, { description: rx }];
    }

    let query = Donation.find(filter).sort({ createdAt: -1 }).limit(100);

    // Nearby sorting: geo query within radius, or plain list
    if (lat != null && lng != null && !isNaN(Number(lat)) && !isNaN(Number(lng))) {
      query = Donation.find({
        ...filter,
        locationCoords: {
          $near: {
            $geometry: { type: 'Point', coordinates: [Number(lng), Number(lat)] },
            $maxDistance: (Number(radiusKm) || 25) * 1000,
          },
        },
      }).sort({ createdAt: -1 }).limit(100);
    }

    // NOTE: donorId intentionally left as raw ObjectId so client-side filters like
    // donation.donorId === currentUser.id work directly.
    const donations = await query;
    res.json({ donations });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ─── GET /api/donations/:id ─────────────────────────── */
router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid donation id' });
    const donation = await Donation.findById(req.params.id);
    if (!donation) return res.status(404).json({ message: 'Donation not found' });
    res.json({ donation });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ─── POST /api/donations (DONOR) ────────────────────── */
router.post('/', protect, authorize('DONOR'), async (req, res) => {
  try {
    const {
      title, category, description, qty, servings,
      preparedDate, safeHours, storageType,
      location, lat, lng, imageUrl,
    } = req.body;

    if (!title || !category || !qty || !servings || !location || !safeHours) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const safeUntil = new Date(Date.now() + Number(safeHours) * 60 * 60 * 1000);
    if (Number(safeHours) <= 0) {
      return res.status(400).json({ message: 'safeHours must be at least 1' });
    }

    // If the donor used "Current location" the browser already gives us coords;
    // otherwise geocode the typed address so nearby queries still work.
    let coords = lat != null && lng != null ? { lat: Number(lat), lng: Number(lng) } : null;
    if (!coords) {
      coords = await geocodeAddress(location);
    }

    const donation = await Donation.create({
      title,
      category,
      description,
      qty,
      servings: Number(servings),
      preparedDate: preparedDate ? new Date(preparedDate) : new Date(),
      safeUntil,
      storageType,
      location,
      locationCoords:
        coords ? { type: 'Point', coordinates: [coords.lng, coords.lat] } : undefined,
      imageUrl: imageUrl || FALLBACK_IMAGES[Math.floor(Math.random() * FALLBACK_IMAGES.length)],
      donorId: req.user._id,
    });

    // Real-time broadcast to every NGO
    await notify(getIo(req), {
      userId: 'ROLE::NGO',
      text: `New food donation nearby: ${donation.title} (${donation.qty})`,
      type: 'NEW_DONATION',
      donationId: donation._id,
    });

    res.status(201).json({ donation });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

/* ─── PATCH /api/donations/:id/status ──────────────────
   Lifecycle transitions with role guards + notifications */
router.patch('/:id/status', protect, async (req, res) => {
  const { status, deliveryLocation } = req.body;
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid donation id' });
    const donation = await Donation.findById(req.params.id);
  if (!donation) return res.status(404).json({ message: 'Donation not found' });
  const io = getIo(req);

  try {
    switch (status) {
      case 'NGO_ACCEPTED': {
        if (req.user.role !== 'NGO') {
          return res.status(403).json({ message: 'Only NGOs can accept donations' });
        }
        if (donation.status !== 'AVAILABLE') {
          return res.status(400).json({ message: `Donation is no longer available (currently ${donation.status})` });
        }
        donation.status = 'NGO_ACCEPTED';
        donation.ngoId = req.user._id;
        donation.ngoName = req.user.name;
        donation.deliveryLocation = deliveryLocation || req.user.location || 'NGO address';
        await notify(io, {
          userId: donation.donorId,
          text: `Your donation "${donation.title}" was accepted by ${req.user.name}!`,
          type: 'ACCEPTED',
          donationId: donation._id,
        });
        break;
      }

      case 'VOLUNTEER_ASSIGNED': {
        if (req.user.role !== 'VOLUNTEER') {
          return res.status(403).json({ message: 'Only volunteers can claim pickups' });
        }
        if (donation.status !== 'NGO_ACCEPTED') {
          return res.status(400).json({ message: `Donation must be NGO_ACCEPTED (currently ${donation.status})` });
        }
        donation.status = 'VOLUNTEER_ASSIGNED';
        donation.volunteerId = req.user._id;
        donation.volunteerName = req.user.name;
        await notify(io, {
          userId: donation.ngoId,
          text: `Volunteer ${req.user.name} assigned to "${donation.title}"`,
          type: 'VOLUNTEER',
          donationId: donation._id,
        });
        await notify(io, {
          userId: donation.donorId,
          text: `A volunteer is picking up "${donation.title}"`,
          type: 'VOLUNTEER',
          donationId: donation._id,
        });
        break;
      }

      case 'PICKUP_STARTED':
      case 'FOOD_COLLECTED':
      case 'DELIVERY_STARTED': {
        if (donation.volunteerId?.toString() !== req.user._id.toString()) {
          return res.status(403).json({ message: 'Only the assigned volunteer can update progress' });
        }
        donation.status = status;
        break;
      }

      case 'DELIVERED': {
        if (donation.volunteerId?.toString() !== req.user._id.toString()) {
          return res.status(403).json({ message: 'Only the assigned volunteer can confirm delivery' });
        }
        donation.status = 'DELIVERED';
        donation.deliveredAt = new Date();
        await notify(io, {
          userId: donation.donorId,
          text: `Your donation "${donation.title}" has been delivered successfully!`,
          type: 'DELIVERED',
          donationId: donation._id,
        });
        await notify(io, {
          userId: donation.ngoId,
          text: `Food delivery for "${donation.title}" has arrived!`,
          type: 'DELIVERED',
          donationId: donation._id,
        });
        break;
      }

      default:
        return res.status(400).json({ message: 'Invalid status transition' });
    }

    await donation.save();

    // Emit live status update to every connected client (all dashboards refresh)
    io?.emit('donationUpdated', donation);

    res.json({ donation });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
