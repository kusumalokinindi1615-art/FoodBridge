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
    resetPasswordToken: { type: String, select: false }, // SHA-256 hash of the one-time token
    resetPasswordExpires: { type: Date, select: false },
  },
  { timestamps: true }
);

userSchema.index({ locationCoords: '2dsphere' });

// Hash password before save
// Mongoose 9+: async pre hooks receive no `next` callback — just await and throw on error
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const bcrypt = require('bcryptjs');
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function (candidate) {
  const bcrypt = require('bcryptjs');
  return bcrypt.compare(candidate, this.password);
};

// Frontend expects `id` (not `_id`) on every user document
userSchema.virtual('id').get(function () { return this._id.toHexString(); });
userSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('User', userSchema);
