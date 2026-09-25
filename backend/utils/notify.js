const User = require('../models/User');

/**
 * Notify: creates DB notification and emits it over Socket.IO in real time.
 * userId can be a real ObjectId or the special 'ROLE::NGO' broadcast to all users with a role.
 */
const notify = async (io, { userId, text, type = 'SYSTEM', donationId = null, ...extra }) => {
  try {
    if (!userId) return;

    // Broadcast to all users of a role (e.g. NGOs getting "new donation" alerts)
    if (typeof userId === 'string' && userId.startsWith('ROLE::')) {
      const role = userId.split('::')[1];
      const users = await User.find({ role }).select('_id');
      if (!users.length) return;
      const Notification = require('../models/Notification');
      const docs = await Notification.insertMany(
        users.map(u => ({ userId: u._id, text, type, donationId, ...extra }))
      );
      docs.forEach(doc =>
        io?.to(`user:${doc.userId}`).emit('notification', doc)
      );
      return;
    }

    const Notification = require('../models/Notification');
    const doc = await Notification.create({ userId, text, type, donationId, ...extra });
    io?.to(`user:${doc.userId}`).emit('notification', doc);
  } catch (err) {
    console.error('notify error:', err.message);
  }
};

module.exports = { notify };
