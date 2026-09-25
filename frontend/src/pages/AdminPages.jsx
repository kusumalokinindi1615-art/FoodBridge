import React, { useEffect, useState } from 'react';
import { Card, StatusBadge } from '../components/PublicUI';
import { adminAPI, donationsAPI } from '../api/api';
import { useGlobalState } from '../context/GlobalState';

/* ─── Admin GPS poller (order-scoped, uses authorized tracking endpoint) ── */
const VolunteerLocationPoller = ({ donationId, onLocation }) => {
  useEffect(() => {
    let stop = false;
    const poll = async () => {
      try {
        const { tracking } = await donationsAPI.tracking(donationId);
        if (!stop) onLocation(tracking);
      } catch { /* gone or unauthorized → ignore */ }
    };
    poll();
    const t = setInterval(poll, 15000);
    return () => { stop = true; clearInterval(t); };
  }, [donationId]);
  return null;
};

export const AdminDashboard = () => {
  const { refreshDonations, donations, notifications } = useGlobalState();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const [s, u] = await Promise.all([adminAPI.stats(), adminAPI.users()]);
      setStats(s.stats);
      setUsers(u.users || []);
      refreshDonations();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load admin data');
    }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleVerify = async (u) => {
    try {
      await adminAPI.verifyUser(u.id, !u.isVerified);
      load();
    } catch { /* ignore */ }
  };

  const removeUser = async (u) => {
    if (!window.confirm(`Delete ${u.name}? This cannot be undone.`)) return;
    try {
      await adminAPI.deleteUser(u.id);
      load();
    } catch (err) {
      alert(err?.response?.data?.message || 'Delete failed');
    }
  };

  const activeD = donations.filter(d =>
    ['VOLUNTEER_ASSIGNED', 'PICKUP_STARTED', 'FOOD_COLLECTED', 'DELIVERY_STARTED'].includes(d.status)).length;
  const doneD = donations.filter(d => ['DELIVERED', 'COMPLETED'].includes(d.status)).length;

  const statsCards = [
    { label: 'Donors', val: stats?.donors ?? '…', icon: 'fa-box-open', bg: 'from-blue-500 to-blue-600' },
    { label: 'NGOs', val: stats?.ngos ?? '…', icon: 'fa-hand-holding-heart', bg: 'from-teal to-teal-dark' },
    { label: 'Volunteers', val: stats?.volunteers ?? '…', icon: 'fa-car', bg: 'from-purple-500 to-purple-600' },
    { label: 'Total Food', val: stats?.total ?? '…', icon: 'fa-utensils', bg: 'from-primary to-primary-dark' },
    { label: 'Active Delvs', val: activeD, icon: 'fa-truck', bg: 'from-orange-400 to-orange-600' },
    { label: 'Completed', val: doneD, icon: 'fa-circle-check', bg: 'from-green-500 to-green-600' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-extrabold text-gray-900">Admin Dashboard 🛡️</h1>
        <button onClick={load} className="text-sm text-teal font-semibold hover:underline">
          <i className="fas fa-rotate mr-1"></i>Refresh
        </button>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          <i className="fas fa-circle-exclamation mr-1.5"></i>{error}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {statsCards.map(s => (
          <Card key={s.label} className="p-4 text-center">
            <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${s.bg} flex items-center justify-center mx-auto mb-3 shadow-sm`}>
              <i className={`fas ${s.icon} text-white text-sm`}></i>
            </div>
            <div className="text-2xl font-extrabold text-gray-900">{s.val}</div>
            <div className="text-xs text-gray-500 font-medium mt-0.5">{s.label}</div>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Users table */}
        <Card className="p-6">
          <h2 className="font-bold text-gray-800 mb-5 flex items-center gap-2">
            <i className="fas fa-users text-teal"></i> All Users
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-400 font-semibold uppercase border-b border-gray-100">
                  <th className="text-left pb-3">Name</th>
                  <th className="text-left pb-3">Role</th>
                  <th className="text-left pb-3">Status</th>
                  <th className="text-right pb-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map(u => (
                  <tr key={u.id}>
                    <td className="py-3">
                      <p className="font-medium text-gray-800">{u.name}</p>
                      <p className="text-gray-400 text-xs">{u.email}</p>
                    </td>
                    <td className="py-3">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal/10 text-teal">{u.role}</span>
                    </td>
                    <td className="py-3">
                      {u.isVerified
                        ? <span className="text-xs font-semibold text-green-600"><i className="fas fa-circle-check mr-1"></i>Verified</span>
                        : <span className="text-xs font-semibold text-yellow-600"><i className="fas fa-hourglass-half mr-1"></i>Pending</span>}
                    </td>
                    <td className="py-3 text-right whitespace-nowrap">
                      <button onClick={() => toggleVerify(u)} title={u.isVerified ? 'Un-verify' : 'Verify'}
                        className="text-teal hover:text-primary mr-3 transition-colors">
                        <i className={`fas ${u.isVerified ? 'fa-user-slash' : 'fa-user-check'}`}></i>
                      </button>
                      {u.role !== 'ADMIN' && (
                        <button onClick={() => removeUser(u)} title="Delete user"
                          className="text-red-400 hover:text-red-600 transition-colors">
                          <i className="fas fa-trash"></i>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Recent donations */}
        <Card className="p-6">
          <h2 className="font-bold text-gray-800 mb-5 flex items-center gap-2">
            <i className="fas fa-box text-primary"></i> Recent Donations
          </h2>
          <div className="space-y-3">
            {donations.slice().reverse().slice(0, 6).map(d => (
              <AdminDonationRow key={d.id} d={d} />
            ))}
            {donations.length === 0 && <p className="text-sm text-gray-400 italic text-center py-6">No donations yet.</p>}
          </div>
        </Card>
      </div>

      {/* System notifications feed */}
      <Card className="p-6">
        <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <i className="fas fa-tower-broadcast text-teal"></i> System Notifications
        </h2>
        {notifications.length ? notifications.slice(0, 6).map(n => (
          <div key={n.id} className="py-2.5 border-b border-gray-100 last:border-0">
            <p className="text-sm text-gray-700">{n.text}</p>
            <p className="text-xs text-gray-400 mt-0.5">{new Date(n.date).toLocaleString()}</p>
          </div>
        )) : <p className="text-sm text-gray-400 italic">No notifications.</p>}
      </Card>
    </div>
  );
};

/* One donation row with order-scoped volunteer GPS (authorized tracking API) */
const AdminDonationRow = ({ d }) => {
  const [tracking, setTracking] = useState(null);
  const showGps = ['VOLUNTEER_ASSIGNED', 'PICKUP_STARTED', 'FOOD_COLLECTED', 'DELIVERY_STARTED'].includes(d.status);
  return (
    <div className="p-3 bg-gray-50 rounded-2xl">
      {showGps && <VolunteerLocationPoller donationId={d.id} onLocation={setTracking} />}
      <div className="flex justify-between items-center">
        <div>
          <p className="font-semibold text-sm text-gray-900">{d.title} <span className="text-gray-400">#{String(d.id).slice(-8)}</span></p>
          <p className="text-xs text-gray-400">{new Date(d.createdAt || new Date()).toLocaleString()}</p>
          {d.volunteerName && <p className="text-xs text-gray-600">Assigned volunteer: {d.volunteerName}</p>}
          {tracking?.volunteerLocation?.lat != null && (
            <p className="text-xs text-teal font-semibold">
              GPS: {Number(tracking.volunteerLocation.lat).toFixed(4)}, {Number(tracking.volunteerLocation.lng).toFixed(4)}
              {tracking.volunteerLocation.updatedAt && <> · {new Date(tracking.volunteerLocation.updatedAt).toLocaleTimeString()}</>}
            </p>
          )}
        </div>
        <StatusBadge status={d.status} />
      </div>
    </div>
  );
};
