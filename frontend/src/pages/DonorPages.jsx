import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button, Card, StatusBadge } from '../components/PublicUI';
import { FormInput, SelectInput, Modal } from '../components/PublicUI2';
import { useGlobalState } from '../context/GlobalState';
import { TrackingUI } from '../components/TrackingUI';

/* ─── Donor Dashboard ────────────────────────────────── */
export const DonorDashboard = () => {
  const { currentUser, donations, notifications } = useGlobalState();
  const myDonations = donations.filter(d => d.donorId === currentUser?.id);
  const active = myDonations.filter(d =>
    ['AVAILABLE','NGO_ACCEPTED','VOLUNTEER_ASSIGNED','PICKUP_STARTED','FOOD_COLLECTED','DELIVERY_STARTED'].includes(d.status));
  const myNotifs = notifications.filter(n => n.userId === currentUser?.id);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Welcome, {currentUser?.name} 👋</h1>
          <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
            <i className="fas fa-location-dot text-teal"></i>{currentUser?.location}
          </p>
        </div>
        <Link to="/donor/donate">
          <Button variant="primary" className="shadow-teal">
            <i className="fas fa-plus-circle mr-2"></i>Donate Food
          </Button>
        </Link>
      </div>

      {/* Active tracking */}
      {active.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <i className="fas fa-satellite-dish text-teal"></i> Active Donations
          </h2>
          <div className="space-y-5">
            {active.map(d => <TrackingUI key={d.id} donation={d} />)}
          </div>
        </section>
      )}

      {/* Notifications + History */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <i className="fas fa-bell text-accent"></i> Notifications
          </h2>
          {myNotifs.length > 0 ? myNotifs.slice(0,5).map(n => (
            <div key={n.id} className="py-3 border-b border-gray-100 last:border-0">
              <p className="text-sm text-gray-700">{n.text}</p>
              <p className="text-xs text-gray-400 mt-0.5">{new Date(n.date).toLocaleString()}</p>
            </div>
          )) : <p className="text-sm text-gray-400 italic">No new notifications.</p>}
        </Card>

        <Card className="p-6">
          <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <i className="fas fa-clock-rotate-left text-teal"></i> Donation History
          </h2>
          {myDonations.length > 0 ? myDonations.map(d => (
            <div key={d.id} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0">
              <div>
                <p className="font-semibold text-sm text-gray-900">{d.title}</p>
                <p className="text-xs text-gray-400">{new Date(d.createdAt || new Date()).toLocaleDateString()}</p>
              </div>
              <StatusBadge status={d.status} />
            </div>
          )) : <p className="text-sm text-gray-400 italic">No donations yet.</p>}
        </Card>
      </div>
    </div>
  );
};

/* ─── Donate Food Form ───────────────────────────────── */
export const DonateFood = () => {
  const navigate = useNavigate();
  const { currentUser, addDonation } = useGlobalState();
  const [form, setForm] = useState({ location: currentUser?.location || '' });
  const [showSuccess, setShowSuccess] = useState(false);

  const set = (f, v) => setForm({ ...form, [f]: v });

  const handleSubmit = (e) => {
    e.preventDefault();
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + parseInt(form.safeHours || 4));
    addDonation({
      title: form.title,
      category: form.category,
      description: form.description,
      qty: form.qty,
      servings: form.servings,
      preparedDate: form.preparedTime || new Date().toISOString(),
      safeUntil: expiry.toISOString(),
      location: form.location,
      imageUrl: 'https://images.unsplash.com/photo-1490818387583-1baba5e638ca?w=800&q=80',
    });
    setShowSuccess(true);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Link to="/donor/dashboard" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary mb-5 transition-colors">
        <i className="fas fa-arrow-left"></i> Back to Dashboard
      </Link>
      <Card className="p-8">
        <h1 className="text-2xl font-extrabold text-gray-900 mb-6 flex items-center gap-2">
          <i className="fas fa-box-open text-teal"></i> Post Food Donation
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <FormInput label="Food Name" required value={form.title||''} onChange={e => set('title',e.target.value)}/>
            <SelectInput label="Category" required options={['Cooked Food','Rice','Biryani','Vegetables','Fruits','Bakery','Packaged Food','Other']} value={form.category||''} onChange={e => set('category',e.target.value)}/>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
            <textarea className="w-full px-4 py-3 text-sm rounded-2xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent" rows={3} required value={form.description||''} onChange={e => set('description',e.target.value)}/>
          </div>

          <div className="border-2 border-dashed border-teal/30 bg-teal/5 rounded-2xl p-6 text-center">
            <i className="fas fa-cloud-arrow-up text-3xl text-teal/50 mb-2"></i>
            <p className="text-sm font-semibold text-gray-600">Upload Food Photos</p>
            <p className="text-xs text-gray-400 mt-1">Mock UI — photo will be auto-assigned for demo</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <FormInput label="Quantity (e.g. 5 kg, 10 packets)" required value={form.qty||''} onChange={e => set('qty',e.target.value)}/>
            <FormInput label="Number of Servings" type="number" required value={form.servings||''} onChange={e => set('servings',e.target.value)}/>
            <FormInput label="Prepared Date/Time" type="datetime-local" required value={form.preparedTime||''} onChange={e => set('preparedTime',e.target.value)}/>
            <FormInput label="Safe For (Hours)" type="number" min="1" required value={form.safeHours||''} onChange={e => set('safeHours',e.target.value)}/>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Pickup Location</label>
            <div className="flex gap-2">
              <input type="text" className="flex-1 px-4 py-3 text-sm rounded-2xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent" required value={form.location||''} onChange={e => set('location',e.target.value)} placeholder="Enter address"/>
              <button type="button" onClick={() => set('location', currentUser?.location)}
                className="px-4 py-2 text-xs bg-teal/10 text-teal rounded-xl border border-teal/20 font-semibold hover:bg-teal/20">
                <i className="fas fa-location-crosshairs mr-1"></i>Current
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <Button type="submit" className="w-full py-3">Post Donation</Button>
          </div>
        </form>
      </Card>

      <Modal isOpen={showSuccess} onClose={() => {}} title="Donation Posted!">
        <div className="text-center py-2">
          <div className="w-14 h-14 bg-teal/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-circle-check text-2xl text-teal"></i>
          </div>
          <p className="text-gray-600 text-sm mb-2">Food donation posted successfully!</p>
          <p className="text-xs text-gray-400 mb-6">Status: <span className="font-bold text-teal">Waiting for NGO</span></p>
          <Button onClick={() => navigate('/donor/dashboard')} className="w-full">Back to Dashboard</Button>
        </div>
      </Modal>
    </div>
  );
};
