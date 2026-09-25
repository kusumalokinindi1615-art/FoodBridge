import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, StatusBadge } from '../components/PublicUI';
import { FormInput } from '../components/PublicUI2';
import { useGlobalState } from '../context/GlobalState';
import { authAPI } from '../api/api';

/* ─── Shared My Profile page (Donor & NGO) ─────────────
   Fetches the logged-in user's REAL data from /api/auth/me.
   Edit saves via PATCH /api/auth/profile. No hardcoded info. */
export const MyProfile = () => {
  const navigate = useNavigate();
  const { currentUser, logout, setCurrentUser } = useGlobalState();
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [loadError, setLoadError] = useState('');

  const load = async () => {
    try {
      const { user } = await authAPI.me(); // fresh data from DB, not cache
      setProfile(user);
      setForm({
        name: user.name || '',
        phone: user.phone || '',
        location: user.location || '',
        contactPerson: user.contactPerson || '',
      });
    } catch (err) {
      setLoadError(err?.response?.data?.message || 'Failed to load profile. Is the server running?');
    }
  };

  useEffect(() => { load(); }, []);

  const set = (f, v) => {
    setForm({ ...form, [f]: v });
    if (errors[f]) setErrors({ ...errors, [f]: null });
  };

  const validate = () => {
    const e = {};
    if (!form.name?.trim()) e.name = 'Name is required';
    if (form.phone && !/^[+\d][\d\s-]{5,}$/.test(form.phone)) e.phone = 'Invalid phone number';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const save = async () => {
    if (!validate()) return;
    setSaving(true); setMsg('');
    try {
      const { user } = await authAPI.updateProfile(form);
      setProfile(user);
      setCurrentUser(user); // reflect immediately in header/sidebar
      setEditing(false);
      setMsg('Profile updated successfully ✓');
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      setMsg(err?.response?.data?.message || 'Could not save changes.');
    } finally {
      setSaving(false);
    }
  };

  if (loadError) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <Card className="p-8 text-center">
          <i className="fas fa-triangle-exclamation text-3xl text-red-400 mb-3"></i>
          <p className="text-red-600 text-sm font-medium">{loadError}</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>Go Back</Button>
        </Card>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-6 max-w-2xl mx-auto text-center text-gray-400 py-20">
        <i className="fas fa-spinner fa-spin text-2xl text-teal mb-3"></i>
        <p className="text-sm">Loading profile…</p>
      </div>
    );
  }

  const isNGO = profile.role === 'NGO';
  const roleLabels = { DONOR: 'Donor', NGO: 'NGO', VOLUNTEER: 'Volunteer', ADMIN: 'Admin' };
  const rows = [
    { label: 'Name', value: profile.name },
    ...(isNGO && profile.contactPerson ? [{ label: 'Contact Person', value: profile.contactPerson }] : []),
    { label: 'Email', value: profile.email, locked: true },
    { label: 'Phone', value: profile.phone },
    { label: 'Role', value: profile.role, badge: true },
    ...(profile.location ? [{ label: isNGO ? 'NGO Address' : 'Location', value: profile.location }] : []),
    ...(profile.isVerified !== undefined ? [{ label: 'Verified', value: profile.isVerified ? 'Yes ✓' : 'Pending review' }] : []),
    { label: 'Member Since', value: new Date(profile.createdAt).toLocaleDateString() },
  ];

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <button onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary mb-5 transition-colors">
        <i className="fas fa-arrow-left"></i> Back
      </button>

      <Card className="p-8">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-teal flex items-center justify-center shadow-teal">
              <i className={`fas ${isNGO ? 'fa-hand-holding-heart' : 'fa-box-open'} text-white text-xl`}></i>
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900">My Profile</h1>
              <p className="text-sm text-gray-500">{roleLabels[profile.role] || profile.role} account</p>
            </div>
          </div>
          {!editing && (
            <Button variant="outline" onClick={() => setEditing(true)}>
              <i className="fas fa-pen mr-2"></i>Edit Profile
            </Button>
          )}
        </div>

        {msg && (
          <div className={`mb-5 text-sm rounded-xl px-4 py-2.5 border ${msg.includes('✓')
            ? 'text-teal bg-teal/5 border-teal/20' : 'text-red-600 bg-red-50 border-red-100'}`}>
            {msg}
          </div>
        )}

        {editing ? (
          <div className="space-y-1">
            <FormInput label="Name" value={form.name} onChange={e => set('name', e.target.value)} error={errors.name} />
            {isNGO && (
              <FormInput label="Contact Person" value={form.contactPerson} onChange={e => set('contactPerson', e.target.value)} />
            )}
            <FormInput label="Phone" value={form.phone} onChange={e => set('phone', e.target.value)} error={errors.phone} />
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                {isNGO ? 'NGO Address' : 'Location'}
              </label>
              <input type="text" value={form.location} onChange={e => set('location', e.target.value)}
                className="w-full px-4 py-3 text-sm rounded-2xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent" />
            </div>
            <div className="bg-gray-50 rounded-2xl p-4 text-xs text-gray-500 mb-4">
              <i className="fas fa-lock mr-1.5"></i>Email cannot be changed. Password changes need a dedicated flow.
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" className="flex-1 border border-gray-200" onClick={() => { setEditing(false); setErrors({}); setMsg(''); }}>
                Cancel
              </Button>
              <Button variant="primary" className="flex-1" onClick={save} disabled={saving}>
                {saving ? <><i className="fas fa-spinner fa-spin mr-2"></i>Saving…</> : 'Save Changes'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {rows.map((r) => (
              <div key={r.label} className="flex justify-between items-center py-3.5">
                <span className="text-sm text-gray-500 font-medium">{r.label}</span>
                {r.badge ? (
                  <span className="text-xs bg-teal/10 text-teal px-2.5 py-0.5 rounded-full font-bold">{r.value}</span>
                ) : (
                  <span className="text-sm font-semibold text-gray-900">{r.value || <span className="text-gray-300 italic">Not set</span>}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
