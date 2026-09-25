const cron = require('node-cron');
const Donation = require('../models/Donation');

/**
 * Auto-expiry job — food safety first.
 * Every 5 minutes: any AVAILABLE donation past its safeUntil time is marked EXPIRED
 * so unsafe food is never distributed (per the abstract's requirement).
 */
const startExpiryJob = (io) => {
  cron.schedule('*/5 * * * *', async () => {
    try {
      const now = new Date();
      const result = await Donation.updateMany(
        { status: 'AVAILABLE', safeUntil: { $lt: now } },
        { $set: { status: 'EXPIRED' } }
      );

      if (result.modifiedCount > 0) {
        console.log(`[expiry-job] Auto-expired ${result.modifiedCount} donation(s) past safe consumption period`);
        io?.emit('donationUpdated', null); // ping clients to refresh
      }
    } catch (err) {
      console.error('[expiry-job] error:', err.message);
    }
  });
  console.log('[expiry-job] Auto-expiry cron started (runs every 5 min)');
};

module.exports = { startExpiryJob };
