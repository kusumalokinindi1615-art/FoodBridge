/**
 * Seed script — run:  node seed.js
 * Creates demo accounts and sample donations so you can test every role immediately.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Donation = require('./models/Donation');

const MONGO_URI = process.env.MONGO_URI;

const run = async () => {
  if (!MONGO_URI || MONGO_URI.includes('<username>')) {
    console.error('❌ Set MONGO_URI in backend/.env first (see instructions in that file)');
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected. Seeding…');

  await User.deleteMany({});
  await Donation.deleteMany({});

  const users = await User.create([
    { name: 'Hotel Grand', email: 'donor@test.com', password: 'password123', role: 'DONOR', location: 'Downtown Tech Hub', isVerified: true },
    { name: 'Helping Hands NGO', email: 'ngo@test.com', password: 'password123', role: 'NGO', location: 'City Center', isVerified: true },
    { name: 'John Volunteer', email: 'vol@test.com', password: 'password123', role: 'VOLUNTEER', location: 'Westside', isVerified: true },
    { name: 'Admin User', email: 'admin@test.com', password: 'password123', role: 'ADMIN', location: 'HQ', isVerified: true },
  ]);

  const now = Date.now();
  await Donation.create([
    {
      title: 'Vegetable Biryani', category: 'Biryani', description: 'Freshly prepared vegetable biryani leftover from a corporate event. Kept in warm containers.',
      qty: '40 kg', servings: 40, preparedDate: new Date(now - 2 * 3600e3), safeUntil: new Date(now + 2 * 3600e3), storageType: 'Hot Food Container',
      location: 'Downtown Tech Hub', imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&q=80',
      donorId: users[0]._id, status: 'AVAILABLE',
    },
    {
      title: 'Assorted Bread & Pastries', category: 'Bakery', description: 'End of day surplus from our local bakery. Includes sourdough, croissants, and bagels.',
      qty: '25 packets', servings: 50, preparedDate: new Date(now - 8 * 3600e3), safeUntil: new Date(now + 24 * 3600e3), storageType: 'Room Temperature',
      location: 'Main St Bakery', imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80',
      donorId: users[0]._id, status: 'NGO_ACCEPTED', ngoId: users[1]._id, ngoName: users[1].name, deliveryLocation: 'Orphanage North',
    },
    {
      title: 'Canned Soups & Beans', category: 'Packaged Food', description: 'Overstocked canned goods close to best before date but still safe.',
      qty: '100 boxes', servings: 200, preparedDate: new Date(now - 48 * 3600e3), safeUntil: new Date(now + 30 * 86400e3), storageType: 'Room Temperature',
      location: 'North Supermarket', imageUrl: 'https://images.unsplash.com/photo-1596646549248-c2b6279f9b5c?w=800&q=80',
      donorId: users[0]._id, status: 'DELIVERED', ngoId: users[1]._id, ngoName: users[1].name,
      volunteerId: users[2]._id, volunteerName: users[2].name, deliveredAt: new Date(now - 9 * 3600e3),
    },
  ]);

  console.log('✅ Seeded! Demo logins (password for all: password123):');
  console.log('   donor@test.com  → DONOR');
  console.log('   ngo@test.com    → NGO');
  console.log('   vol@test.com    → VOLUNTEER');
  console.log('   admin@test.com  → ADMIN');
  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => { console.error(err); process.exit(1); });
