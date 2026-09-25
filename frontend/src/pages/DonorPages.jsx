import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button, Card, StatusBadge } from '../components/PublicUI';
import { FormInput, SelectInput, Modal } from '../components/PublicUI2';
import { useGlobalState } from '../context/GlobalState';
import { useGeolocation } from '../hooks/useGeolocation';
import { TrackingUI } from '../components/TrackingUI';

/* ─── Donor Dashboard ────────────────────────────────── */
/* ─── Live GPS poller (order-scoped, authorized tracking endpoint) ── */
const NgoLocationPoller = ({ donationId, onLocation }) => {
  useEffect(() => {
    let stop = false;
    const poll = async () => {
      try {
        const { donationsAPI } = await import('../api/api');
        const { tracking } = await donationsAPI.tracking(donationId);
        if (!stop) onLocation(tracking);
      } catch { /* 403/404 → not your order or gone; ignore */ }
    };
    poll();
    const t = setInterval(poll, 15000); // 15s reuse of existing axios auth
    return () => { stop = true; clearInterval(t); };
  }, [donationId]);
  return null;
};

export const DonorDashboard = () => {
  const { currentUser, donations, notifications, refreshDonations } = useGlobalState();
  const myDonations = donations.filter(d => d.donorId === currentUser?.id);
  const active = myDonations.filter(d =>
    ['AVAILABLE','NGO_ACCEPTED','VOLUNTEER_ASSIGNED','PICKUP_STARTED','FOOD_COLLECTED','DELIVERY_STARTED'].includes(d.status));
  const myNotifs = notifications.filter(n => n.userId === currentUser?.id);
  const [ngoLoc, setNgoLoc] = useState({});

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

      {/* My Orders — order-scoped NGO GPS + food photo */}
      <section>
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <i className="fas fa-clipboard-list text-teal"></i> My Orders
        </h2>
        {myDonations.length === 0 ? (
          <Card className="p-8 text-center text-gray-400 text-sm">No donations yet — post your first one!</Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-5">
            {myDonations.slice(0, 6).map(d => {
              const t = ngoLoc[d.id];
              return (
                <Card key={d.id} className="p-5">
                  <div className="flex gap-4">
                    <img src={d.imageUrl || 'https://images.unsplash.com/photo-1490818387583-1baba5e638ca?w=400&q=80'}
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1490818387583-1baba5e638ca?w=400&q=80'; }}
                      alt={d.title} className="w-20 h-20 rounded-2xl object-cover flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="font-bold text-gray-900 truncate">#{d.id?.slice(-6)} · {d.title}</h3>
                        <StatusBadge status={d.status} />
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{d.qty} • {d.servings} servings</p>
                      {d.ngoName && <p className="text-xs text-gray-600 mt-1"><i className="fas fa-handshake text-teal mr-1"></i>Accepted by <b>{d.ngoName}</b></p>}
                      {d.volunteerName && <p className="text-xs text-purple-700 mt-1"><i className="fas fa-person-biking mr-1"></i>Assigned Volunteer: <b>{d.volunteerName}</b></p>}
                      {d.deliveryLocation && <p className="text-xs text-gray-500 mt-0.5"><i className="fas fa-flag-checkered text-primary mr-1"></i>To: {d.deliveryLocation}</p>}
                      {d.deliveredAt && <p className="text-xs text-teal font-semibold mt-0.5"><i className="fas fa-circle-check mr-1"></i>Delivered {new Date(d.deliveredAt).toLocaleString()}</p>}
                    </div>
                  </div>
                  {/* Live NGO GPS — only the NGO that accepted THIS order */}
                  {['NGO_ACCEPTED','VOLUNTEER_ASSIGNED','PICKUP_STARTED','FOOD_COLLECTED','DELIVERY_STARTED'].includes(d.status) && (
                    <NgoLocationPoller donationId={d.id} onLocation={(tr) => setNgoLoc(prev => ({ ...prev, [d.id]: tr }))} />
                  )}
                  {/* Assigned volunteer's live GPS for THIS order (tracking endpoint enforces access) */}
                  {['VOLUNTEER_ASSIGNED','PICKUP_STARTED','FOOD_COLLECTED','DELIVERY_STARTED'].includes(d.status) && t?.volunteerLocation?.lat != null && (
                    <div className="mt-3 bg-purple-50 border border-purple-100 rounded-2xl p-3 text-xs">
                      <p className="font-bold text-purple-700 flex items-center gap-1.5">
                        <i className="fas fa-satellite-dish animate-pulse"></i>{d.volunteerName || 'Assigned volunteer'} — live delivery location
                      </p>
                      <p className="text-gray-600 mt-1">
                        GPS: {Number(t.volunteerLocation.lat).toFixed(4)}, {Number(t.volunteerLocation.lng).toFixed(4)}
                        {t.volunteerLocation.updatedAt && <> · {new Date(t.volunteerLocation.updatedAt).toLocaleTimeString()}</>}
                      </p>
                      <a href={`https://www.openstreetmap.org/?mlat=${t.volunteerLocation.lat}&mlon=${t.volunteerLocation.lng}#map=15/${t.volunteerLocation.lat}/${t.volunteerLocation.lng}`}
                        target="_blank" rel="noreferrer" className="text-purple-700 font-semibold hover:underline mt-1 inline-block">
                        <i className="fas fa-map-location-dot mr-1"></i>View on map
                      </a>
                    </div>
                  )}
                  {t?.ngoLocation && t.ngoLocation.lat != null && (
                    <div className="mt-3 bg-teal/5 border border-teal/20 rounded-2xl p-3 text-xs">
                      <p className="font-bold text-teal flex items-center gap-1.5">
                        <i className="fas fa-satellite-dish animate-pulse"></i>{t.ngoName || 'Assigned NGO'} — live location
                      </p>
                      <p className="text-gray-600 mt-1">
                        GPS: {Number(t.ngoLocation.lat).toFixed(4)}, {Number(t.ngoLocation.lng).toFixed(4)}
                        {t.ngoLocation.updatedAt && <> · {new Date(t.ngoLocation.updatedAt).toLocaleTimeString()}</>}
                      </p>
                      <a href={`https://www.openstreetmap.org/?mlat=${t.ngoLocation.lat}&mlon=${t.ngoLocation.lng}#map=15/${t.ngoLocation.lat}/${t.ngoLocation.lng}`}
                        target="_blank" rel="noreferrer" className="text-teal font-semibold hover:underline mt-1 inline-block">
                        <i className="fas fa-map-location-dot mr-1"></i>View on map
                      </a>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </section>

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
  const [coords, setCoords] = useState(null);
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { error: geoError, loading: geoLoading, getCurrent } = useGeolocation();
  // Real photo upload state
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const set = (f, v) => setForm({ ...form, [f]: v });

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    setUploadError('');
    if (!file) return;
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      setUploadError('Only JPG, JPEG, PNG or WEBP images are allowed.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image too large (max 5 MB).');
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file)); // local preview only; real URL comes from server
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    setSubmitting(true);
    try {
      // 1. Upload the photo first (real multipart POST → backend disk + URL)
      let imageUrl = '';
      if (photoFile) {
        setUploading(true);
        try {
          const { uploadsAPI } = await import('../api/api');
          const { url } = await uploadsAPI.image(photoFile);
          imageUrl = url; // e.g. http://localhost:5000/uploads/1699-123.jpg
        } catch (err) {
          setServerError(err?.response?.data?.message || 'Photo upload failed. Try again or post without a photo.');
          setSubmitting(false);
          setUploading(false);
          return;
        } finally {
          setUploading(false);
        }
      }

      // 2. Create the donation with the real image URL
      await addDonation({
        title: form.title,
        category: form.category,
        description: form.description,
        qty: form.qty,
        servings: form.servings,
        preparedDate: form.preparedTime || new Date().toISOString(),
        safeHours: form.safeHours,
        storageType: form.storageType || 'Room Temperature',
        location: form.location,
        lat: coords?.latitude,
        lng: coords?.longitude,
        imageUrl,
      });
      setShowSuccess(true);
    } catch (err) {
      setServerError(err?.response?.data?.message || 'Could not post donation. Is the backend running?');
    } finally {
      setSubmitting(false);
    }
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

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Food Photo</label>
            <div className="border-2 border-dashed border-teal/30 bg-teal/5 rounded-2xl p-6 text-center relative hover:bg-teal/10 transition-colors">
              {photoPreview ? (
                <div className="relative">
                  <img src={photoPreview} alt="Food preview" className="max-h-48 mx-auto rounded-xl object-cover" />
                  <button type="button" onClick={() => { setPhotoFile(null); setPhotoPreview(''); }}
                    className="absolute top-2 right-2 w-8 h-8 bg-white/90 rounded-full shadow flex items-center justify-center text-red-500 hover:bg-white">
                    <i className="fas fa-times"></i>
                  </button>
                  <p className="text-xs text-teal font-semibold mt-2"><i className="fas fa-circle-check mr-1"></i>{photoFile?.name} — ready to upload</p>
                </div>
              ) : (
                <label htmlFor="food-photo-input" className="cursor-pointer block">
                  <i className="fas fa-cloud-arrow-up text-3xl text-teal/50 mb-2"></i>
                  <p className="text-sm font-semibold text-gray-600">Upload Food Photo</p>
                  <p className="text-xs text-gray-400 mt-1">JPG, PNG or WEBP — max 5 MB</p>
                </label>
              )}
              <input id="food-photo-input" type="file" accept="image/jpeg,image/jpg,image/png,image/webp"
                className="hidden" onChange={handlePhotoChange} disabled={uploading || submitting} />
            </div>
            {uploading && <p className="mt-2 text-xs text-teal"><i className="fas fa-spinner fa-spin mr-1"></i>Uploading photo…</p>}
            {uploadError && <p className="mt-2 text-xs text-red-600"><i className="fas fa-circle-exclamation mr-1"></i>{uploadError}</p>}
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
              <input type="text" className="flex-1 px-4 py-3 text-sm rounded-2xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent" required value={form.location||''} onChange={e => set('location',e.target.value)} placeholder="Enter address"/>                <button type="button" disabled={geoLoading}
                onClick={async () => {
                  const res = await getCurrent();
                  if (res?.address) {
                    set('location', res.address);
                    setCoords(res.coords);
                  }
                }}
                className="px-4 py-2 text-xs bg-teal/10 text-teal rounded-xl border border-teal/20 font-semibold hover:bg-teal/20 disabled:opacity-50">
                <i className={`fas fa-location-crosshairs mr-1 ${geoLoading ? 'fa-spin' : ''}`}></i>
                {geoLoading ? 'Locating…' : 'Current'}
              </button>
            </div>
            {geoError && <p className="mt-1 text-xs text-red-600">{geoError}</p>}
          </div>

          {serverError && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
              <i className="fas fa-circle-exclamation mr-1.5"></i>{serverError}
            </div>
          )}

          <div className="pt-4 border-t border-gray-100">
            <Button type="submit" className="w-full py-3" disabled={submitting}>
              {submitting ? <><i className="fas fa-spinner fa-spin mr-2"></i>Posting…</> : 'Post Donation'}
            </Button>
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
