const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
    },
    password: { type: String, required: [true, 'Password is required'], minlength: 8, select: false },
    phone: { type: String, trim: true },
    role: {
      type: String,
      enum: ['DONOR', 'NGO', 'VOLUNTEER', 'ADMIN'],
      required: true,
    },
    location: { type: String, trim: true },
    contactPerson: { type: String, trim: true },
    locationCoords: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] },
    },
    isVerified: { type: Boolean, default: false }, // NGOs verified by admin
  },
  { timestamps: true }
);

userSchema.index({ locationCoords: '2dsphere' });

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
    } catch (err) {
    next(err);
  }
});

userSchema.methods.comparePassword = async function (candidate) {
  const bcrypt = require('bcryptjs');
  return bcrypt.compare(candidate, this.password);
};

// Frontend expects `id` (not `_id`) on every user document
userSchema.virtual('id').get(function () { return this._id.toHexString(); });
userSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('User', userSchema);
