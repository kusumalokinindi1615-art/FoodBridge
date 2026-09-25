const mongoose = require('mongoose');

const STATUS_FLOW = [
  'AVAILABLE',
  'NGO_ACCEPTED',
  'VOLUNTEER_ASSIGNED',
  'PICKUP_STARTED',
  'FOOD_COLLECTED',
  'DELIVERY_STARTED',
  'DELIVERED',
  'EXPIRED',
  'CLOSED',
];

const donationSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Title is required'], trim: true },
    category: { type: String, required: [true, 'Category is required'], trim: true },
    description: { type: String, trim: true },
    qty: { type: String, required: [true, 'Quantity is required'], trim: true },
    servings: { type: Number, required: [true, 'Servings is required'], min: 1 },
    // Food safety window
    preparedDate: { type: Date, required: true },
    safeUntil: { type: Date, required: true },
    storageType: { type: String, default: 'Room Temperature' },
    // Pickup / delivery
    location: { type: String, required: true, trim: true },
    locationCoords: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
    },
    deliveryLocation: { type: String, trim: true },
    imageUrl: { type: String, default: '' }, // empty → frontend falls back to placeholder
    // Lifecycle
    status: { type: String, enum: STATUS_FLOW, default: 'AVAILABLE' },
    donorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    ngoId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    ngoName: { type: String },
    acceptedAt: { type: Date },
    // Live GPS of the ASSIGNED NGO — scoped to this order only
    ngoLocation: {
      lat: { type: Number },
      lng: { type: Number },
      updatedAt: { type: Date },
    },
    volunteerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    volunteerName: { type: String },
    deliveredAt: { type: Date },
  },
  { timestamps: true }
);

// Text search + geospatial + list filters
donationSchema.index({ locationCoords: '2dsphere' });
donationSchema.index({ status: 1, safeUntil: 1 });
donationSchema.index({ title: 'text', description: 'text' });

// Frontend expects `id` (not `_id`) on every donation document

donationSchema.virtual('id').get(function () { return this._id.toHexString(); });
donationSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Donation', donationSchema);
