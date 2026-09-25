const express = require('express');
const mongoose = require('mongoose');
const Donation = require('../models/Donation');
const User = require('../models/User');
const { protect, authorize, optionalProtect } = require('../middleware/auth');
const { notify } = require('../utils/notify');
const { geocodeAddress } = require('../utils/geocode');

const router = express.Router();

/** Socket.IO instance is injected by server.js via app.set('io') */
const getIo = (req) => req.app.get('io');

/* ─── GET /api/donations ───────────────────────────────
   Query: ?status=AVAILABLE&mine=1&nearby=1&lat=&lng=&radiusKm=&search=&category= */
router.get('/', optionalProtect, async (req, res) => {
  try {
    const { status, mine, lat, lng, radiusKm, search, category } = req.query;

    const filter = {};
    if (!req.user) filter.status = 'AVAILABLE';
    if (req.user?.role === 'DONOR') filter.donorId = req.user._id;
    if (req.user?.role === 'NGO') {
      const coords = req.user.locationCoords?.coordinates || [];
      const hasCoords = coords.length === 2 && (coords[0] !== 0 || coords[1] !== 0);
      const nearby = hasCoords ? await Donation.find({ locationCoords: {
        $near: { $geometry: { type: 'Point', coordinates: coords }, $maxDistance: 25000 },
      } }).distinct('_id') : [];
      filter.$or = [{ ngoId: req.user._id }, { _id: { $in: nearby }, status: 'AVAILABLE' }];
    }
    if (req.user?.role === 'VOLUNTEER') filter.$or = [
      { sharedWithVolunteers: req.user._id }, { volunteerId: req.user._id },
    ];
    if (status && req.user) filter.status = status;
    if (category) filter.category = category;
    if (req.user?.role === 'ADMIN') delete filter.$or;

    if (search) {
      const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$and = [{ $or: [{ title: rx }, { location: rx }, { description: rx }] }];
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

    // NOTE: toJSON (not toObject) so the `id` virtual is present on every list item —
    // the frontend keys donations, notifications and actions off `d.id`.
    // donorId stays as the raw ObjectId string so client-side filters like
    // donation.donorId === currentUser.id work directly.
    const donations = await query;
    const safeDonations = donations.map(d => {
      const plain = d.toJSON();
      if (req.user?.role === 'VOLUNTEER' && plain.volunteerId?.toString() !== req.user._id.toString()) delete plain.volunteerLocation;
      return plain;
    });
    res.json({ donations: safeDonations });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ─── GET /api/donations/:id ─────────────────────────── */
router.get('/:id', optionalProtect, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid donation id' });
    const donation = await Donation.findById(req.params.id);
    if (!donation) return res.status(404).json({ message: 'Donation not found' });
    if (!req.user && donation.status !== 'AVAILABLE') return res.status(404).json({ message: 'Donation not found' });
    if (!req.user) return res.json({ donation });
    if (!canViewDonation(req.user, donation)) return res.status(403).json({ message: 'Not authorized to view this donation' });
    if (req.user.role === 'VOLUNTEER' && donation.volunteerId?.toString() !== req.user._id.toString()) {
      const safeDonation = donation.toObject(); delete safeDonation.volunteerLocation;
      return res.json({ donation: safeDonation });
    }
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
      imageUrl: imageUrl || '',
      donorId: req.user._id,
    });

    // Notify only NGOs within the existing nearby radius when the donation has coordinates.
    if (coords) {
      const nearbyNgos = await User.find({ role: 'NGO', isVerified: true, locationCoords: {
        $near: { $geometry: { type: 'Point', coordinates: [coords.lng, coords.lat] }, $maxDistance: 25000 },
      } }).select('_id');
      for (const ngo of nearbyNgos) await notify(getIo(req), {
        userId: ngo._id, text: `New food donation nearby: ${donation.title} (${donation.qty})`,
        type: 'NEW_DONATION', donationId: donation._id,
      });
    }
    await notify(getIo(req), {
      userId: 'ROLE::ADMIN', text: `New donation ${donation.title} was posted`,
      type: 'NEW_DONATION', donationId: donation._id,
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
    let donation = await Donation.findById(req.params.id);
  if (!donation) return res.status(404).json({ message: 'Donation not found' });
  const io = getIo(req);

  try {
    switch (status) {
      case 'NGO_ACCEPTED': {
        if (req.user.role !== 'NGO') {
          return res.status(403).json({ message: 'Only NGOs can accept donations' });
        }
        if (donation.status !== 'AVAILABLE' && !(donation.status === 'NGO_ACCEPTED' && donation.ngoId?.toString() === req.user._id.toString())) {
          return res.status(400).json({ message: `Donation is no longer available (currently ${donation.status})` });
        }
        if (donation.status === 'AVAILABLE') {
          const updates = {
            status: 'NGO_ACCEPTED', ngoId: req.user._id, ngoName: req.user.name,
            deliveryLocation: deliveryLocation || req.user.location || 'NGO address', acceptedAt: new Date(),
          };
          if (req.body.ngoLat != null && req.body.ngoLng != null) updates.ngoLocation = {
            lat: Number(req.body.ngoLat), lng: Number(req.body.ngoLng), updatedAt: new Date(),
          };
          donation = await Donation.findOneAndUpdate({ _id: donation._id, status: 'AVAILABLE' }, { $set: updates }, { new: true });
          if (!donation) return res.status(409).json({ message: 'Donation was already accepted by another NGO' });
        }
        // Snapshot the accepting NGO's GPS (if provided) — scoped to this order only
        if (req.body.ngoLat != null && req.body.ngoLng != null) {
          donation.ngoLocation = { lat: Number(req.body.ngoLat), lng: Number(req.body.ngoLng), updatedAt: new Date() };
        }
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
        if (donation.volunteerId) return res.status(409).json({ message: `Already accepted by ${donation.volunteerName || 'another volunteer'}` });
        if (donation.status !== 'NGO_ACCEPTED' || !donation.sharedWithVolunteers.some(id => id.toString() === req.user._id.toString())) {
          return res.status(400).json({ message: `Donation must be NGO_ACCEPTED (currently ${donation.status})` });
        }
        // Atomic compare-and-set makes simultaneous accepts mutually exclusive.
        donation = await Donation.findOneAndUpdate(
          { _id: donation._id, status: 'NGO_ACCEPTED', volunteerId: { $exists: false } },
          { $set: { status: 'VOLUNTEER_ASSIGNED', volunteerId: req.user._id, volunteerName: req.user.name, acceptedAt: new Date() } },
          { new: true }
        );
        if (!donation) return res.status(409).json({ message: 'Already accepted by another volunteer' });
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
        for (const volunteerId of donation.sharedWithVolunteers) {
          await notify(io, { userId: volunteerId, text: `Accepted by ${req.user.name}: ${donation.title}`,
            type: 'ACCEPTED', donationId: donation._id, acceptedByName: req.user.name });
        }
        break;
      }

      case 'PICKUP_STARTED':
      case 'FOOD_COLLECTED':
      case 'DELIVERY_STARTED': {
        if (donation.volunteerId?.toString() !== req.user._id.toString()) {
          return res.status(403).json({ message: 'Only the assigned volunteer can update progress' });
        }
        donation.status = status;
        if (status === 'FOOD_COLLECTED') donation.pickedUpAt = new Date();
        break;
      }

      case 'DELIVERED': {
        // The assigned volunteer OR the accepting NGO may confirm delivery
        // (NGOs often do their own deliveries when no volunteer is assigned).
        const isAssignedVolunteer = donation.volunteerId?.toString() === req.user._id.toString();
        const isAcceptingNgo = !donation.volunteerId && donation.ngoId?.toString() === req.user._id.toString() && req.user.role === 'NGO';
        if (!isAssignedVolunteer && !isAcceptingNgo) {
          return res.status(403).json({ message: 'Only the assigned volunteer or the accepting NGO can confirm delivery' });
        }
        donation.status = 'DELIVERED';
        donation.deliveredAt = new Date();
        donation.completedAt = donation.deliveredAt;
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

      case 'COMPLETED': {
        if (donation.volunteerId?.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Only the assigned volunteer can complete this delivery' });
        if (!['DELIVERY_STARTED', 'FOOD_COLLECTED'].includes(donation.status)) return res.status(400).json({ message: 'Delivery must be in progress before completion' });
        donation.status = 'COMPLETED'; donation.completedAt = new Date(); donation.deliveredAt = donation.completedAt;
        for (const userId of [donation.donorId, donation.ngoId]) if (userId) await notify(io, { userId, text: `${donation.title} was completed by ${req.user.name}`, type: 'DELIVERED', donationId: donation._id });
        await notify(io, { userId: 'ROLE::ADMIN', text: `${donation.title} was completed`, type: 'DELIVERED', donationId: donation._id });
        break;
      }

      default:
        return res.status(400).json({ message: 'Invalid status transition' });
    }

    await donation.save();

    // Notify only users linked to this delivery. Clients refetch through their
    // role-scoped API, so GPS coordinates are never broadcast over the socket.
    const rooms = [donation.donorId, donation.ngoId, donation.volunteerId, ...(donation.sharedWithVolunteers || [])]
      .filter(Boolean).map(id => `user:${id}`);
    const admins = await User.find({ role: 'ADMIN' }).select('_id');
    rooms.push(...admins.map(admin => `user:${admin._id}`));
    [...new Set(rooms)].forEach(room => io?.to(room).emit('donationUpdated', { id: donation._id }));

    res.json({ donation });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

function canViewDonation(user, donation) {
  if (user.role === 'ADMIN') return true;
  const uid = user._id.toString();
  if (user.role === 'DONOR') return donation.donorId?.toString() === uid;
  if (user.role === 'NGO') return donation.ngoId?.toString() === uid || donation.status === 'AVAILABLE';
  if (user.role === 'VOLUNTEER') return donation.volunteerId?.toString() === uid || donation.sharedWithVolunteers.some(id => id.toString() === uid);
  return false;
}

router.post('/:id/share', protect, authorize('NGO'), async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);
    if (!donation) return res.status(404).json({ message: 'Donation not found' });
    if (donation.ngoId?.toString() !== req.user._id.toString() || donation.status !== 'NGO_ACCEPTED') return res.status(403).json({ message: 'Only the managing NGO can share this active donation' });
    const activeVolunteerIds = await Donation.distinct('volunteerId', {
      status: { $in: ['VOLUNTEER_ASSIGNED', 'PICKUP_STARTED', 'FOOD_COLLECTED', 'DELIVERY_STARTED'] },
      volunteerId: { $exists: true },
    });
    const volunteers = await User.find({ role: 'VOLUNTEER', _id: { $nin: activeVolunteerIds } }).select('_id');
    let notified = 0;
    for (const volunteer of volunteers) {
      const updated = await Donation.updateOne({ _id: donation._id, status: 'NGO_ACCEPTED', ngoId: req.user._id,
        sharedWithVolunteers: { $ne: volunteer._id } }, { $addToSet: { sharedWithVolunteers: volunteer._id } });
      if (updated.modifiedCount) {
        notified += 1;
        await notify(getIo(req), { userId: volunteer._id,
          text: `Delivery request: ${donation.title} from ${req.user.name}`, type: 'VOLUNTEER', donationId: donation._id });
      }
    }
    const refreshed = await Donation.findById(donation._id);
    res.json({ donation: refreshed, notified });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.patch('/:id/volunteer-location', protect, authorize('VOLUNTEER'), async (req, res) => {
  try {
    const { lat, lng } = req.body;
    if (!Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng))) return res.status(400).json({ message: 'Valid lat and lng are required' });
    const donation = await Donation.findOneAndUpdate({ _id: req.params.id, volunteerId: req.user._id },
      { $set: { volunteerLocation: { lat: Number(lat), lng: Number(lng), updatedAt: new Date() } } }, { new: true });
    if (!donation) return res.status(403).json({ message: 'Only the assigned volunteer can update delivery location' });
    res.json({ volunteerLocation: donation.volunteerLocation });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

/* ─── GET /api/donations/:id/tracking ──────────────────
   Order-scoped GPS tracking. Only the donor who owns the order, the
   assigned NGO, or the assigned volunteer may read the NGO location. */
router.get('/:id/tracking', protect, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid donation id' });
    const donation = await Donation.findById(req.params.id);
    if (!donation) return res.status(404).json({ message: 'Donation not found' });

    const uid = req.user._id.toString();
    const allowed = req.user.role === 'ADMIN' ||
      (req.user.role === 'DONOR' && donation.donorId?.toString() === uid) ||
      (req.user.role === 'NGO' && donation.ngoId?.toString() === uid) ||
      (req.user.role === 'VOLUNTEER' && donation.volunteerId?.toString() === uid);
    if (!allowed) return res.status(403).json({ message: 'Not your order' });

    res.json({
      tracking: {
        donationId: donation._id,
        status: donation.status,
        acceptedAt: donation.acceptedAt || null,
        ngoName: donation.ngoName || null,
        volunteerName: donation.volunteerName || null,
        volunteerLocation: donation.volunteerLocation || null,
        ngoLocation: donation.ngoLocation || null,
        deliveryLocation: donation.deliveryLocation || null,
        pickupLocation: donation.location,
        deliveredAt: donation.deliveredAt || null,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ─── PATCH /api/donations/:id/ngo-location ────────────
   The ASSIGNED NGO pushes live GPS for this order only. */
router.patch('/:id/ngo-location', protect, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid donation id' });
    const donation = await Donation.findById(req.params.id);
    if (!donation) return res.status(404).json({ message: 'Donation not found' });
    if (req.user.role !== 'NGO' || donation.ngoId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the assigned NGO can update its location' });
    }
    const { lat, lng } = req.body;
    if (lat == null || lng == null) return res.status(400).json({ message: 'lat and lng are required' });
    donation.ngoLocation = { lat: Number(lat), lng: Number(lng), updatedAt: new Date() };
    await donation.save();
    getIo(req)?.to(`user:${donation.donorId}`).emit('ngoLocation', {
      donationId: donation._id, ngoLocation: donation.ngoLocation,
    });
    res.json({ ngoLocation: donation.ngoLocation });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
