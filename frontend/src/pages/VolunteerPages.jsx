import React, { useEffect, useState } from 'react';
import { Button, Card, StatusBadge } from '../components/PublicUI';
import { useGlobalState } from '../context/GlobalState';
import { TrackingUI } from '../components/TrackingUI';
import { donationsAPI } from '../api/api';

/* Resolve a ref that may arrive as id string OR populated object */
const refId = (v) => String(v?._id ?? v ?? '');

export const VolunteerDashboard = () => {
  const { currentUser, donations, updateDonationStatus, notifications } = useGlobalState();
  const [actionError, setActionError] = useState('');
  const [gpsMessage, setGpsMessage] = useState('');
  const [gpsError, setGpsError] = useState('');
  const [tracking, setTracking] = useState(false);
  const [acceptingId, setAcceptingId] = useState(null);

  const myDeliveries = donations.filter(d => refId(d.volunteerId) === currentUser?.id);
  const active = myDeliveries.find(d => ['VOLUNTEER_ASSIGNED','PICKUP_STARTED','FOOD_COLLECTED','DELIVERY_STARTED'].includes(d.status));
  const completed = myDeliveries.filter(d => ['DELIVERED', 'COMPLETED'].includes(d.status));
  const claimedByOthers = donations.filter(d => d.volunteerId &&
    refId(d.volunteerId) !== currentUser?.id &&
    (d.sharedWithVolunteers || []).some(id => refId(id) === currentUser?.id));

  /* Delivery requests that arrived as notifications (VOLUNTEER = shared, ACCEPTED = someone took it) */
  const requestNotifs = notifications.filter(n => ['VOLUNTEER', 'ACCEPTED'].includes(n.type));
  const notifCards = requestNotifs
    .map(n => ({ n, d: donations.find(dd => String(dd.id) === String(n.donationId)) }))
    .filter(({ d }) => !!d);

  useEffect(() => {
    if (!tracking || !active) return undefined;
    if (!navigator.geolocation) {
      setGpsError('This device/browser does not support geolocation.');
      setTracking(false);
      return undefined;
    }
    const watchId = navigator.geolocation.watchPosition(async ({ coords }) => {
      setGpsError('');
      try {
        await donationsAPI.pushVolunteerLocation(active.id, coords.latitude, coords.longitude);
        setGpsMessage(`Location updated: ${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`);
      } catch (err) {
        setGpsError(err?.response?.data?.message || 'Could not send your location to the server. Retrying…');
      }
    }, err => {
      if (err.code === 1) {
        setTracking(false);
        setGpsError('Location permission is required to track your delivery. Enable it in your browser settings and try again.');
      } else if (err.code === 2) {
        setGpsError('Location unavailable — check that GPS/location services are enabled on this device.');
      } else {
        setGpsError('Could not get your location. Please try again.');
      }
    }, { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 });
    return () => navigator.geolocation.clearWatch(watchId);
  }, [tracking, active?.id]);

  const act = async (id, status) => {
    setActionError('');
    try { await updateDonationStatus(id, status); if (status === 'COMPLETED') setTracking(false); }
    catch (err) { setActionError(err?.response?.data?.message || 'Action failed. Please try again.'); }
  };

  /* First volunteer whose ACCEPT hits the free document wins; losers get the
     backend 409 "Already accepted by …" message shown verbatim. */
  const accept = async (id) => {
    setActionError(''); setGpsError('');
    setAcceptingId(id);
    try { await updateDonationStatus(id, 'VOLUNTEER_ASSIGNED'); }
    catch (err) { setActionError(err?.response?.data?.message || 'Could not accept this request.'); }
    finally { setAcceptingId(null); }
  };

  const stepButtons = {
    VOLUNTEER_ASSIGNED: { label: 'Start Pickup', next: 'PICKUP_STARTED' },
    PICKUP_STARTED: { label: 'Mark Food Collected', next: 'FOOD_COLLECTED' },
    FOOD_COLLECTED: { label: 'Start Delivery', next: 'DELIVERY_STARTED' },
    DELIVERY_STARTED: { label: 'Mark as Completed', next: 'COMPLETED', variant: 'teal' },
  };

  /* ─── Shared notification card layout ─────────────── */
  const RequestCard = ({ n, d }) => {
    const acceptedBy = refId(d.volunteerId) ? (d.volunteerName || n.acceptedByName || 'another volunteer') : null;
    const canAccept = !d.volunteerId && d.status === 'NGO_ACCEPTED' && !active;
    return (
      <Card className="p-4 mb-3 border-l-4 border-l-accent">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Food Delivery Request</p>
        <p className="text-sm text-gray-800"><b>Donation ID:</b> #{String(d.id).slice(-8)}</p>
        <p className="text-sm text-gray-800"><b>Food:</b> {d.title} ({d.category} · {d.qty})</p>
        <p className="text-sm text-gray-800"><b>Pickup:</b> {d.location}</p>
        <p className="text-sm text-gray-800"><b>Destination:</b> {d.deliveryLocation || 'Not set yet'}</p>
        {d.ngoName && <p className="text-sm text-gray-800"><b>NGO:</b> {d.ngoName}</p>}
        {d.imageUrl && <img src={d.imageUrl} alt={d.title} className="w-full max-h-28 object-cover rounded-lg my-2" onError={(e) => { e.target.style.display = 'none'; }} />}
        <div className="mt-2 flex items-center gap-2 flex-wrap">
          <StatusBadge status={d.status} />
          {acceptedBy
            ? <span className="text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-full">Accepted by {acceptedBy}</span>
            : <span className="text-xs text-gray-400">{new Date(n.date).toLocaleString()}</span>}
        </div>
        {canAccept && (
          <Button variant="primary" className="w-full mt-3" disabled={acceptingId === d.id}
            onClick={() => accept(d.id)}>
            {acceptingId === d.id ? <><i className="fas fa-spinner fa-spin mr-2"></i>Accepting…</> : 'ACCEPT'}
          </Button>
        )}
      </Card>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div><h1 className="text-2xl font-extrabold text-gray-900">Volunteer Dashboard 🚴</h1><p className="text-sm text-gray-500 mt-1">{currentUser?.name}</p></div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Active delivery + GPS */}
          {active && (
            <section className="bg-gradient-to-br from-teal/5 to-primary/5 rounded-3xl p-6 border border-teal/20">
              <h2 className="text-lg font-bold text-gray-900 mb-2">Active Delivery</h2>
              <p className="text-sm text-teal font-semibold mb-4">
                {active.status === 'VOLUNTEER_ASSIGNED' ? 'Accepted by you' : `Assigned to you · ${active.status.replaceAll('_', ' ')}`}
              </p>
              <TrackingUI donation={active} />
              {actionError && <p className="text-sm text-red-600 mt-3">{actionError}</p>}
              <div className="mt-5 flex gap-3 flex-wrap">
                {stepButtons[active.status] && <Button variant={stepButtons[active.status].variant || 'primary'} onClick={() => act(active.id, stepButtons[active.status].next)}>{stepButtons[active.status].label}</Button>}
                <Button variant={tracking ? 'outline' : 'teal'} onClick={() => { setGpsMessage(''); setGpsError(''); setTracking(v => !v); }}>
                  {tracking ? 'Stop GPS Tracking' : 'Enable GPS Tracking'}
                </Button>
              </div>
              {tracking && (
                <div className="mt-3 text-xs text-gray-600 bg-white/70 rounded-xl border border-teal/20 px-4 py-2">
                  <p><b>GPS status:</b> <span className="text-teal font-semibold">ON — sharing live location for this delivery only</span></p>
                  <p><b>Destination:</b> {active.deliveryLocation || 'Not set'}</p>
                  {gpsMessage && <p role="status" className="text-teal-dark mt-1">{gpsMessage}</p>}
                </div>
              )}
              {gpsError && <p role="alert" className="mt-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2"><i className="fas fa-circle-exclamation mr-1.5"></i>{gpsError}</p>}
            </section>
          )}

          {/* Notifications with accept */}
          <section>
            <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><i className="fas fa-bell text-accent"></i>Notifications</h2>
            {notifCards.length
              ? notifCards.map(({ n, d }) => <RequestCard key={n.id} n={n} d={d} />)
              : <Card className="p-4 text-sm text-gray-400">No delivery notifications yet.</Card>}
            {actionError && !active && <p className="text-sm text-red-600 mt-2">{actionError}</p>}
          </section>

          {/* Other volunteers' accepts */}
          {claimedByOthers.length > 0 && (
            <section>
              <h2 className="font-bold text-gray-800 mb-3">Requests accepted by another volunteer</h2>
              {claimedByOthers.map(d => (
                <Card key={d.id} className="p-4 mb-2">
                  <p className="font-semibold">{d.title} · Accepted by {d.volunteerName}</p>
                  <p className="text-xs text-gray-500 mt-1">#{String(d.id).slice(-8)} · Status: {d.status.replaceAll('_', ' ')}</p>
                </Card>
              ))}
            </section>
          )}

          {/* All open requests shared with me (even if notification was missed) */}
          <section>
            <h2 className="font-bold text-gray-800 mb-4">Available Requests</h2>
            {donations.filter(d => !d.volunteerId && d.status === 'NGO_ACCEPTED' && (d.sharedWithVolunteers || []).some(id => refId(id) === currentUser?.id)).length ? (
              <div className="space-y-4">
                {donations.filter(d => !d.volunteerId && d.status === 'NGO_ACCEPTED' && (d.sharedWithVolunteers || []).some(id => refId(id) === currentUser?.id)).map(d => (
                  <Card key={d.id} className="p-5">
                    {d.imageUrl && <img src={d.imageUrl} alt={d.title} className="w-full h-32 object-cover rounded-xl mb-3" onError={(e) => { e.target.style.display = 'none'; }} />}
                    <div className="flex justify-between"><h3 className="font-bold">{d.title}</h3><StatusBadge status={d.status} /></div>
                    <p className="text-xs text-gray-500 mt-2">#{String(d.id).slice(-8)} · {d.category} · {d.qty}</p>
                    <p className="text-sm mt-2">Pickup: {d.location}</p>
                    <p className="text-sm">Destination: {d.deliveryLocation || 'Not set'} {d.ngoName && <>· {d.ngoName}</>}</p>
                    <Button className="w-full mt-4" disabled={!!active || acceptingId === d.id} onClick={() => accept(d.id)}>
                      {active ? 'Finish active route first' : acceptingId === d.id ? 'Accepting…' : 'Accept Request'}
                    </Button>
                  </Card>
                ))}
              </div>
            ) : <Card className="p-6 text-center text-sm text-gray-400">No requests shared with volunteers right now.</Card>}
          </section>

          {/* Completed */}
          <section>
            <h2 className="font-bold text-gray-800 mb-4">Completed Deliveries</h2>
            {completed.length ? <div className="space-y-3">{completed.map(d => (
              <Card key={d.id} className="p-4 flex justify-between items-center">
                <span>{d.title} <span className="text-xs text-gray-400">#{String(d.id).slice(-8)}</span></span>
                <StatusBadge status={d.status} />
              </Card>
            ))}</div> : <Card className="p-6 text-center text-sm text-gray-400">No completed deliveries yet.</Card>}
          </section>
        </div>

        {/* Right rail: GPS summary */}
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><i className="fas fa-satellite-dish text-teal"></i>GPS / Location</h2>
            <p className="text-sm text-gray-600">{tracking
              ? <span className="text-teal font-semibold">Sharing live GPS for your assigned delivery.</span>
              : 'GPS is off. Enable it from your active delivery so the donor, NGO and admin can follow this delivery.'}</p>
            {gpsMessage && <p className="text-xs text-gray-500 mt-2">{gpsMessage}</p>}
            {gpsError && <p className="text-xs text-red-600 mt-2">{gpsError}</p>}
          </Card>
          <Card className="p-6">
            <h2 className="font-bold text-gray-800 mb-3">My Deliveries</h2>
            {myDeliveries.length ? myDeliveries.map(d => (
              <div key={d.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                <span className="text-sm text-gray-700">{d.title}</span><StatusBadge status={d.status} />
              </div>
            )) : <p className="text-sm text-gray-400 italic">Nothing assigned yet.</p>}
          </Card>
        </div>
      </div>
    </div>
  );
};
