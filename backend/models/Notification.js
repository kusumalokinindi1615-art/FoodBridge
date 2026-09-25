const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    text: { type: String, required: true },
    type: {
      type: String,
      enum: ['NEW_DONATION', 'ACCEPTED', 'VOLUNTEER', 'DELIVERED', 'EXPIRED', 'SYSTEM'],
      default: 'SYSTEM',
    },
    donationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Donation' },
    /** Denormalized snapshot for real-time "Accepted by {name}" display without a refetch */
    acceptedByName: { type: String },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
