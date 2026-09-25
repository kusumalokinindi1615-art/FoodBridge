import React, { useState } from 'react';
import { Button, Card, StatusBadge } from '../components/PublicUI';
import { FormInput, Modal } from '../components/PublicUI2';
import { useGlobalState } from '../context/GlobalState';
import { TrackingUI } from '../components/TrackingUI';

export const NGODashboard = () => {
  const { currentUser, donations, notifications, updateDonationStatus, markNotificationsRead } = useGlobalState();
  const [selected, setSelected] = useState(null);
  const [dest, setDest] = useState(currentUser?.location || '');
  const [showModal, setShowModal] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [actionError, setActionError] = useState('');

  const available = donations.filter(d => d.status === 'AVAILABLE');
  const myAccepted = donations.filter(d => d.ngoId === currentUser?.id);
  const myNotifs = notifications.filter(n => n.userId === currentUser?.id || n.userId === 'NGO_ALL');

  const handleAcceptClick = (d) => { setSelected(d); setDest(currentUser?.location || ''); setShowModal(true); setActionError(''); };
  const confirmAccept = async () => {
    setAccepting(true); setActionError('');
    try {
      await updateDonationStatus(selected.id, 'NGO_ACCEPTED', { deliveryLocation: dest });
      setShowModal(false); setSelected(null);
    } catch (err) {
      setActionError(err?.response?.data?.message || 'Could not accept this donation.');
    } finally {
      setAccepting(false);
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
                    <img src={d.imageUrl} className="w-full h-32 object-cover rounded-2xl mb-3" alt={d.title}/>
                    <h3 className="font-bold text-gray-900">{d.title}</h3>
                    <p className="text-xs text-gray-500 mb-1">{d.category} • {d.qty}</p>
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
                {myAccepted.map(d => <TrackingUI key={d.id} donation={d}/>)}
              </div>
            </section>
          )}
        </div>

        {/* Notifications sidebar */}
        <Card className="p-6 h-fit sticky top-24">
          <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <i className="fas fa-bell text-accent"></i> Notifications
          </h2>
          {myNotifs.slice(0,8).map(n => (
            <div key={n.id} className={`py-3 border-b border-gray-100 last:border-0 ${n.read ? '' : 'font-semibold'}`}>
              <p className="text-sm text-gray-700">{n.text}</p>
              <p className="text-xs text-gray-400 mt-0.5">{new Date(n.date).toLocaleString()}</p>
            </div>
          ))}
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
