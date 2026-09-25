import React, { useState, useEffect } from 'react';
import { Button, Card, StatusBadge } from '../components/PublicUI';
import { FormInput, Modal } from '../components/PublicUI2';
import { useGlobalState } from '../context/GlobalState';
import { TrackingUI } from '../components/TrackingUI';
import { donationsAPI } from '../api/api';

/* Resolve a ref that may arrive as id string OR populated object */
const refId = (v) => String(v?._id ?? v ?? '');

export const NGODashboard = () => {
  const { currentUser, donations, notifications, updateDonationStatus, markNotificationsRead, refreshDonations } = useGlobalState();
  const [selected, setSelected] = useState(null);
  const [dest, setDest] = useState(currentUser?.location || '');
  const [showModal, setShowModal] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [actionError, setActionError] = useState('');
  // per-order live GPS sharing state
  const [sharingId, setSharingId] = useState(null);
  const [shareMsg, setShareMsg] = useState('');
  const [sharingRequestId, setSharingRequestId] = useState(null);

  const available = donations.filter(d => d.status === 'AVAILABLE');
  const myAccepted = donations.filter(d => refId(d.ngoId) === currentUser?.id);
  const myNotifs = notifications;

  /* Stop any running GPS interval when the dashboard unmounts */
  useEffect(() => () => {
    Object.values(window.__ngoShareTimer || {}).forEach(clearInterval);
    window.__ngoShareTimer = {};
  }, []);

  const handleAcceptClick = (d) => { setSelected(d); setDest(currentUser?.location || ''); setShowModal(true); setActionError(''); };
  const confirmAccept = async () => {
    setAccepting(true); setActionError('');
    try {
      // capture NGO GPS at accept time (best-effort — order is still accepted without it)
      let ngoLat, ngoLng;
      try {
        const pos = await new Promise((res, rej) =>
          navigator.geolocation ? navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 }) : rej(new Error('no gps')));
        ngoLat = pos.coords.latitude; ngoLng = pos.coords.longitude;
      } catch { /* permission denied / unavailable → proceed without GPS */ }
      await updateDonationStatus(selected.id, 'NGO_ACCEPTED', { deliveryLocation: dest, ngoLat, ngoLng });
      setShowModal(false); setSelected(null);
    } catch (err) {
      setActionError(err?.response?.data?.message || 'Could not accept this donation.');
    } finally {
      setAccepting(false);
    }
  };

  /* NGO confirms delivery (with or without a volunteer) */
  const markDelivered = async (d) => {
    setActionError('');
    try {
      await updateDonationStatus(d.id, 'DELIVERED');
      clearInterval(window.__ngoShareTimer?.[d.id]); delete window.__ngoShareTimer?.[d.id];
      setSharingId(s => (s === d.id ? null : s));
      setShareMsg(`"${d.title}" marked as delivered ✓`);
    } catch (err) {
      setActionError(err?.response?.data?.message || 'Could not mark as delivered.');
    }
  };

  const shareRequest = async (d) => {
    setSharingRequestId(d.id); setShareMsg('');
    try {
      const result = await donationsAPI.shareWithVolunteers(d.id);
      setShareMsg(result.notified ? `Shared with ${result.notified} available volunteers.` : 'This request was already shared with all available volunteers.');
      await refreshDonations();
    } catch (err) { setShareMsg(err?.response?.data?.message || 'Could not share this request.'); }
    finally { setSharingRequestId(null); }
  };

  /* Share/cancel live GPS for one accepted order — donor sees it in My Orders */
  const toggleShareLocation = async (d) => {
    setShareMsg('');
    if (sharingId === d.id) { // stop sharing
      clearInterval(window.__ngoShareTimer?.[d.id]); delete window.__ngoShareTimer?.[d.id];
      setSharingId(null);
      setShareMsg(`Stopped sharing live location for "${d.title}".`);
      return;
    }
    if (!('geolocation' in navigator)) {
      setShareMsg('Geolocation is not supported by your browser.');
      return;
    }
    try {
      const pos = await new Promise((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { enableHighAccuracy: true, timeout: 8000 }));
      await donationsAPI.pushNgoLocation(d.id, pos.coords.latitude, pos.coords.longitude);
      setSharingId(d.id);
      setShareMsg(`Sharing live location for "${d.title}"`);
      // keep pushing every 30s while sharing this order
      const timer = setInterval(async () => {
        navigator.geolocation.getCurrentPosition(async (p) => {
          try { await donationsAPI.pushNgoLocation(d.id, p.coords.latitude, p.coords.longitude); } catch { /* order gone */ }
        }, () => {}, { enableHighAccuracy: true });
      }, 30000);
      window.__ngoShareTimer?.[d.id] && clearInterval(window.__ngoShareTimer[d.id]);
      (window.__ngoShareTimer ||= {})[d.id] = timer;
    } catch (err) {
      if (err?.code === 1) setShareMsg('Location permission denied — enable it in your browser to share GPS.');
      else if (err?.code === 2) setShareMsg('GPS unavailable right now.');
      else if (err?.code === 3) setShareMsg('GPS timed out. Try again.');
      else setShareMsg(err?.response?.data?.message || 'Could not share location.');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">NGO Dashboard 🏢</h1>
        <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
          <i className="fas fa-location-dot text-teal"></i>{currentUser?.name} — {currentUser?.location}
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Available food */}
          <section>
            <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <i className="fas fa-bell text-yellow-500"></i> Nearby Available Food
            </h2>
            {available.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {available.map(d => (
                  <Card key={d.id} className="p-5 border-l-4 border-l-yellow-400">
                    <img src={d.imageUrl} onError={(e) => { e.target.style.display = 'none'; }} className="w-full h-32 object-cover rounded-2xl mb-3" alt={d.title}/>
                    <h3 className="font-bold text-gray-900">{d.title}</h3>
                    <p className="text-xs text-gray-500 mb-1">#{String(d.id).slice(-8)} · {d.category} • {d.qty}</p>
                    <p className="text-xs text-gray-500 mb-4 flex items-center gap-1">
                      <i className="fas fa-location-dot text-teal"></i>{d.location}
                    </p>
                    <Button variant="primary" className="w-full text-sm" onClick={() => handleAcceptClick(d)}>
                      <i className="fas fa-handshake mr-2"></i>Accept Food
                    </Button>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center text-gray-400 text-sm">No new food donations nearby.</Card>
            )}
          </section>

          {/* Accepted & tracking */}
          {myAccepted.length > 0 && (
            <section>
              <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <i className="fas fa-truck text-teal"></i> Accepted & Tracking
              </h2>
              <div className="space-y-5">
                {myAccepted.map(d => (
                  <div key={d.id}>
                    {/* Food photo from the donor's actual upload */}
                    {d.imageUrl && (
                      <img src={d.imageUrl} alt={d.title}
                        onError={(e) => { e.target.style.display = 'none'; }}
                        className="w-full h-40 object-cover rounded-3xl mb-3 shadow-sm" />
                    )}
                    <TrackingUI donation={d} />
                    {d.status === 'NGO_ACCEPTED' && (
                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        <Button variant="primary" onClick={() => shareRequest(d)} disabled={sharingRequestId === d.id}>
                          {sharingRequestId === d.id ? 'Sharing…' : 'Share with Volunteers'}
                        </Button>
                        {!d.volunteerId && <Button variant="outline" onClick={() => updateDonationStatus(d.id, 'NGO_ACCEPTED')}>
                          Accept / Take Responsibility
                        </Button>}
                      </div>
                    )}
                    {d.status === 'NGO_ACCEPTED' && !d.volunteerId && (
                      <p className="mt-2 text-xs text-gray-500"><i className="fas fa-hourglass-half mr-1.5"></i>No volunteer has accepted this request yet.</p>
                    )}
                    {d.volunteerId && (
                      <p className="mt-2 text-xs text-purple-700 font-semibold"><i className="fas fa-person-biking mr-1.5"></i>Accepted by {d.volunteerName}</p>
                    )}
                    {['NGO_ACCEPTED','VOLUNTEER_ASSIGNED','PICKUP_STARTED','FOOD_COLLECTED','DELIVERY_STARTED'].includes(d.status) && (
                      <div className="mt-3 flex items-center gap-3 flex-wrap">
                        <Button variant={sharingId === d.id ? 'outline' : 'primary'} className="text-sm"
                          onClick={() => toggleShareLocation(d)}>
                          <i className={`fas ${sharingId === d.id ? 'fa-location-crosshairs-slash' : 'fa-location-crosshairs'} mr-2`}></i>
                          {sharingId === d.id ? 'Stop Sharing GPS' : 'Share Live Location'}
                        </Button>
                        <Button variant="teal" className="text-sm" onClick={() => markDelivered(d)}>
                          <i className="fas fa-circle-check mr-2"></i>Mark as Delivered ✓
                        </Button>
                        {sharingId === d.id && (
                          <span className="text-xs text-teal font-semibold"><i className="fas fa-circle animate-pulse mr-1 text-[6px]"></i>Donor can see your GPS</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {shareMsg && <p className="mt-3 text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2">{shareMsg}</p>}
            </section>
          )}
        </div>

        {/* Notifications sidebar */}
        <Card className="p-6 h-fit sticky top-24">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-gray-800 flex items-center gap-2">
              <i className="fas fa-bell text-accent"></i> Notifications
            </h2>
            {myNotifs.some(n => !n.read) && (
              <button onClick={markNotificationsRead} className="text-xs text-teal font-semibold hover:underline">Mark all read</button>
            )}
          </div>
          {myNotifs.slice(0,10).map(n => {
            const donation = donations.find(d => String(d.id) === String(n.donationId));
            return (
              <div key={n.id} className={`py-3 border-b border-gray-100 last:border-0 ${n.read ? '' : 'bg-teal/5 -mx-2 px-2 rounded-lg'}`}>
                <p className="text-sm text-gray-700">{n.text}</p>
                <p className="text-xs text-gray-400 mt-0.5">{new Date(n.date).toLocaleString()}</p>
                {donation && (
                  <details className="mt-2 text-xs text-gray-600">
                    <summary className="cursor-pointer text-teal font-semibold">View donation details</summary>
                    {donation.imageUrl && <img src={donation.imageUrl} alt={donation.title} className="w-full max-h-32 object-cover rounded-lg my-2" onError={(e) => { e.target.style.display = 'none'; }} />}
                    <p className="mt-1"><b>Donation ID:</b> #{String(donation.id).slice(-8)}</p>
                    <p><b>Food:</b> {donation.title} · {donation.category} · {donation.qty}</p>
                    <p><b>Pickup:</b> {donation.location}</p>
                    <p><b>Destination:</b> {donation.deliveryLocation || 'Not set yet'}</p>
                    <p className="mt-1 flex items-center gap-2"><b>Status:</b> <StatusBadge status={donation.status} /></p>
                    {donation.volunteerId && <p className="text-purple-700 font-semibold"><b>Accepted by</b> {donation.volunteerName}</p>}
                    {donation.status === 'COMPLETED' && <p className="text-green-700 font-semibold mt-1">✓ Completed {donation.completedAt ? new Date(donation.completedAt).toLocaleString() : ''}</p>}
                  </details>
                )}
              </div>
            );
          })}
          {myNotifs.length === 0 && <p className="text-sm text-gray-400 italic">No notifications.</p>}
        </Card>
      </div>

      {/* Accept + Destination Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Accept Donation & Set Destination">
        {selected && (
          <div>
            <div className="bg-teal/5 border border-teal/20 rounded-2xl p-4 mb-5">
              <h4 className="font-bold text-gray-900">{selected.title}</h4>
              <p className="text-xs text-gray-500 mt-1">Pickup: {selected.location}</p>
            </div>
            <FormInput label="Delivery Address (Needy People Location)" value={dest} onChange={e => setDest(e.target.value)} required/>
            <button type="button" className="text-xs text-teal font-semibold mb-5 hover:underline"
              onClick={() => setDest(currentUser?.location)}>
              <i className="fas fa-location-crosshairs mr-1"></i>Use my NGO address
            </button>
            {actionError && <p className="text-xs text-red-600 mb-3"><i className="fas fa-circle-exclamation mr-1"></i>{actionError}</p>}
            <div className="flex gap-3 mt-2">
              <Button variant="ghost" className="flex-1 border border-gray-200" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button variant="primary" className="flex-1" onClick={confirmAccept} disabled={accepting}>
                {accepting ? <><i className="fas fa-spinner fa-spin mr-1"></i>Accepting…</> : 'Confirm Acceptance'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
