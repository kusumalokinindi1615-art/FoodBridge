const express = require('express');
const User = require('../models/User');
const Donation = require('../models/Donation');

const router = express.Router();

/* ─── GET /api/stats — public landing-page numbers ───── */
router.get('/', async (req, res) => {
  try {
    const [mealsAgg, donors, ngos, volunteers] = await Promise.all([
      Donation.aggregate([
        { $match: { status: 'DELIVERED' } },
        { $group: { _id: null, meals: { $sum: '$servings' } } },
      ]),
      User.countDocuments({ role: 'DONOR' }),
      User.countDocuments({ role: 'NGO' }),
      User.countDocuments({ role: 'VOLUNTEER' }),
    ]);

    res.json({
      stats: {
        mealsShared: mealsAgg[0]?.meals || 0,
        activeDonors: donors,
        partnerNGOs: ngos,
        volunteers,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
