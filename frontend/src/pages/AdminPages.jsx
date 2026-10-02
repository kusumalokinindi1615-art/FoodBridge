import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, StatusBadge } from '../components/PublicUI';
import { adminAPI, donationsAPI } from '../api/api';

const ACTIVE = ['NGO_ACCEPTED', 'VOLUNTEER_ASSIGNED', 'PICKUP_STARTED', 'FOOD_COLLECTED', 'DELIVERY_STARTED'];
const DONE = ['DELIVERED', 'COMPLETED'];
const STATUSES = ['ALL', 'AVAILABLE', 'NGO_ACCEPTED', 'VOLUNTEER_ASSIGNED', 'PICKUP_STARTED', 'FOOD_COLLECTED', 'DELIVERY_STARTED', 'DELIVERED', 'COMPLETED', 'EXPIRED', 'CLOSED'];
const userName = (value) => typeof value === 'object' ? value?.name : '';
const userId = (value) => typeof value === 'object' ? value?.id || value?._id : value;
const shortId = (id) => String(id || '').slice(-8).toUpperCase();
const date = (value) => value ? new Date(value).toLocaleString() : '—';
const empty = (text) => <p className="py-8 text-center text-sm text-gray-400">{text}</p>;

const Section = ({ id, title, subtitle, children, action }) => <Card className="p-5 sm:p-6" id={id}>
  <div className="mb-5 flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-bold text-gray-900">{title}</h2>{subtitle && <p className="mt-1 text-xs text-gray-500">{subtitle}</p>}</div>{action}</div>
  {children}
</Card>;

export const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [donations, setDonations] = useState([]);
  const [activity, setActivity] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [trackingId, setTrackingId] = useState('');
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');

  const load = useCallback(async () => {
    try {
      setError('');
      const [s, u, d, a] = await Promise.all([adminAPI.stats(), adminAPI.users(), adminAPI.donations(), adminAPI.activity()]);
      setStats(s.stats || {}); setUsers(u.users || []); setDonations(d.donations || []); setActivity(a.notifications || []);
    } catch (err) { setError(err?.response?.data?.message || 'Could not load admin operations data.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); const timer = setInterval(load, 30000); return () => clearInterval(timer); }, [load]);
  useEffect(() => {
    if (!trackingId) { setTracking(null); return undefined; }
    let stopped = false;
    const poll = async () => { try { const result = await donationsAPI.tracking(trackingId); if (!stopped) setTracking(result.tracking); } catch { if (!stopped) setTracking(null); } };
    poll(); const timer = setInterval(poll, 15000);
    return () => { stopped = true; clearInterval(timer); };
  }, [trackingId]);

  const filteredDonations = useMemo(() => donations.filter((d) => {
    const matchesStatus = status === 'ALL' || d.status === status;
    const needle = search.trim().toLowerCase();
    const matchesSearch = !needle || [d.title, d._id, userName(d.donorId), userName(d.ngoId), userName(d.volunteerId), d.volunteerName].some(v => String(v || '').toLowerCase().includes(needle));
    return matchesStatus && matchesSearch;
  }), [donations, search, status]);
  const activeDeliveries = donations.filter(d => ACTIVE.includes(d.status));
  const completed = donations.filter(d => DONE.includes(d.status));
  const expiring = donations.filter(d => d.status === 'AVAILABLE' && d.safeUntil && new Date(d.safeUntil) > new Date() && new Date(d.safeUntil) <= new Date(Date.now() + 6 * 60 * 60 * 1000));
  const donors = users.filter(u => u.role === 'DONOR');
  const ngos = users.filter(u => u.role === 'NGO');
  const volunteers = users.filter(u => u.role === 'VOLUNTEER');

  const verify = async (ngo, isVerified) => {
    setActionError('');
    try { await adminAPI.verifyUser(ngo.id || ngo._id, isVerified); await load(); }
    catch (err) { setActionError(err?.response?.data?.message || 'NGO verification update failed.'); }
  };

  const metric = (label, value, icon, color) => <Card key={label} className="p-4"><div className="flex items-center justify-between gap-2"><div><p className="text-xs text-gray-500">{label}</p><p className="mt-1 text-2xl font-extrabold text-gray-900">{loading && stats == null ? '…' : (value ?? 0)}</p></div><span className={`flex h-10 w-10 items-center justify-center rounded-2xl ${color}`}><i className={`fas ${icon} text-white`} /></span></div></Card>;

  return <main className="mx-auto max-w-7xl space-y-6 p-4 pb-24 sm:p-6">
    <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-teal">FoodBridge Operations</p><h1 className="mt-1 text-2xl font-extrabold text-gray-900 sm:text-3xl">Admin control center</h1><p className="mt-1 text-sm text-gray-500">Database activity refreshes every 30 seconds.</p></div><button onClick={load} className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-teal"><i className="fas fa-rotate mr-2"/>Refresh</button></header>
    {error && <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
    {actionError && <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{actionError}</div>}
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
      {metric('Active food donations', (stats?.available || 0) + (stats?.active || 0), 'fa-bowl-food', 'bg-teal-600')}
      {metric('Total donors', stats?.donors, 'fa-users', 'bg-blue-600')}{metric('Verified NGOs', stats?.verifiedNgos, 'fa-building', 'bg-emerald-600')}{metric('Total NGOs', stats?.ngos, 'fa-handshake', 'bg-cyan-700')}
      {metric('Volunteers', stats?.volunteers, 'fa-person-biking', 'bg-violet-600')}{metric('Active deliveries', activeDeliveries.length, 'fa-truck-fast', 'bg-orange-500')}{metric('Completed donations', stats?.delivered, 'fa-circle-check', 'bg-green-600')}{metric('Expired donations', stats?.expired, 'fa-circle-xmark', 'bg-red-600')}
    </div>
    <Section id="flow" title="Live FoodBridge flow" subtitle="Counts use the existing donation status values.">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">{STATUSES.filter(s => s !== 'ALL').map(s => <div key={s} className="rounded-xl bg-gray-50 p-3"><p className="text-[10px] font-bold uppercase text-gray-500">{s.replaceAll('_',' ')}</p><p className="mt-1 text-xl font-extrabold">{donations.filter(d => d.status === s).length}</p></div>)}</div>
      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-semibold text-gray-500"><span>Donor</span><i className="fas fa-arrow-right text-teal"/><span>NGO</span><i className="fas fa-arrow-right text-teal"/><span>Volunteer</span><i className="fas fa-arrow-right text-teal"/><span>Pickup</span><i className="fas fa-arrow-right text-teal"/><span>Delivery</span><i className="fas fa-arrow-right text-teal"/><span>NGO received</span><i className="fas fa-arrow-right text-teal"/><span>Completed</span></div>
    </Section>
    <Section id="donations" title="Food donation monitoring" subtitle={`${filteredDonations.length} matching records`} action={<div className="flex flex-wrap gap-2"><input aria-label="Search donations" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search ID, food, donor, NGO…" className="w-52 rounded-lg border border-gray-200 px-3 py-2 text-xs"/><select aria-label="Donation status" value={status} onChange={e => setStatus(e.target.value)} className="rounded-lg border border-gray-200 px-3 py-2 text-xs">{STATUSES.map(s=><option key={s}>{s}</option>)}</select></div>}>
      <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-xs"><thead className="text-[10px] uppercase text-gray-400"><tr>{['Donation','Donor','NGO destination','Volunteer','Quantity / servings','Prepared / safe until','Status'].map(x=><th key={x} className="border-b py-3 pr-4">{x}</th>)}</tr></thead><tbody className="divide-y divide-gray-100">{filteredDonations.map(d=><tr key={d.id || d._id} className="align-top"><td className="py-3 pr-4"><div className="flex items-center gap-2">{d.imageUrl && <img src={d.imageUrl} alt="" className="h-10 w-10 rounded-lg object-cover"/>}<div><button onClick={()=>setSelectedDonation(d)} className="text-left font-bold text-gray-800 hover:text-teal">{d.title}</button><p className="text-gray-400">#{shortId(d.id || d._id)}</p></div></div></td><td className="py-3 pr-4">{userName(d.donorId) || '—'}<br/><span className="text-gray-400">{typeof d.donorId === 'object' ? d.donorId?.email : ''}</span></td><td className="py-3 pr-4">{userName(d.ngoId) || d.ngoName || '—'}<br/><span className="text-gray-400">{d.deliveryLocation || '—'}</span></td><td className="py-3 pr-4">{userName(d.volunteerId) || d.volunteerName || '—'}</td><td className="py-3 pr-4">{d.qty} / {d.servings ?? 0} servings</td><td className="py-3 pr-4">{date(d.preparedDate)}<br/><span className="text-gray-500">Safe: {date(d.safeUntil)}</span></td><td className="py-3 pr-4"><StatusBadge status={d.status}/><button onClick={()=>setTrackingId(d.id || d._id)} className="ml-2 text-teal underline">GPS</button></td></tr>)}</tbody></table>{!loading && !filteredDonations.length && empty('No donations match these filters.')}</div>
    </Section>
    <div className="grid gap-6 lg:grid-cols-2"><Section id="donors" title="Donor management" subtitle={`${donors.length} registered donors`}><div className="max-h-80 space-y-2 overflow-auto">{donors.map(u=>{const own=donations.filter(d=>userId(d.donorId)===String(u.id||u._id));return <div key={u.id||u._id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-gray-50 p-3"><div><p className="text-sm font-semibold">{u.name}</p><p className="text-xs text-gray-500">{u.email} · {u.phone||'No phone'} · {u.location||'No location'}</p><p className="text-[11px] text-gray-400">Joined {date(u.createdAt)} · {own.length} donations ({own.filter(d=>DONE.includes(d.status)).length} completed)</p></div><button onClick={()=>setSelectedDonor(u)} className="text-xs font-bold text-teal">Donation history</button></div>})}{!donors.length&&empty('No donors registered.')}</div></Section>
      <Section id="ngos" title="NGO verification" subtitle={`${stats?.pendingNgos ?? ngos.filter(n=>!n.isVerified).length} pending · ${stats?.verifiedNgos ?? ngos.filter(n=>n.isVerified).length} verified`}><div className="max-h-80 space-y-2 overflow-auto">{ngos.map(u=><div key={u.id||u._id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-gray-50 p-3"><div><p className="text-sm font-semibold">{u.name} <span className={`ml-1 text-[10px] ${u.isVerified?'text-green-700':'text-amber-700'}`}>{u.isVerified?'VERIFIED':'PENDING'}</span></p><p className="text-xs text-gray-500">{u.contactPerson||'Contact not listed'} · {u.email} · {u.phone||'No phone'}</p><p className="text-[11px] text-gray-400">{u.location||'No location'} · {donations.filter(d=>userId(d.ngoId)===String(u.id||u._id)).length} assigned donations</p></div><button onClick={()=>verify(u,!u.isVerified)} className="rounded-lg bg-teal px-3 py-2 text-xs font-bold text-white">{u.isVerified?'Revoke approval':'Approve'}</button></div>)}{!ngos.length&&empty('No NGOs registered.')}</div><p className="mt-3 text-[11px] text-gray-400">The current account model stores verification as isVerified; rejected NGOs remain pending.</p></Section></div>
    <div className="grid gap-6 lg:grid-cols-2"><Section id="volunteers" title="Volunteer operations" subtitle={`${volunteers.length} registered volunteers`}><div className="max-h-72 space-y-2 overflow-auto">{volunteers.map(u=>{const assigned=donations.filter(d=>userId(d.volunteerId)===String(u.id||u._id));return <div key={u.id||u._id} className="rounded-xl bg-gray-50 p-3"><p className="text-sm font-semibold">{u.name}</p><p className="text-xs text-gray-500">{u.email} · {u.phone||'No phone'} · {u.location||'No location'}</p><p className="mt-1 text-[11px] text-gray-400">{assigned.filter(d=>ACTIVE.includes(d.status)).length} active assignment(s) · {assigned.filter(d=>DONE.includes(d.status)).length} completed deliveries</p></div>})}{!volunteers.length&&empty('No volunteers registered.')}</div></Section>
      <Section id="deliveries" title="Active deliveries" subtitle="Current in progress donation assignments">{activeDeliveries.length?<div className="space-y-3">{activeDeliveries.map(d=><div key={d.id||d._id} className="rounded-xl border border-gray-100 p-3"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm font-bold">#{shortId(d.id||d._id)} · {d.title}</p><p className="mt-1 text-xs text-gray-500">{userName(d.donorId)||'Donor'} → {userName(d.volunteerId)||d.volunteerName||'Volunteer pending'} → {userName(d.ngoId)||d.ngoName||'NGO'}</p><p className="text-xs text-gray-400">Pickup: {d.location} · Destination: {d.deliveryLocation||'—'}</p></div><button onClick={()=>setTrackingId(d.id||d._id)} className="rounded-lg bg-teal px-3 py-2 text-xs font-bold text-white">View location</button></div><div className="mt-2"><StatusBadge status={d.status}/></div></div>)}</div>:empty('No active deliveries right now.')}{trackingId && <div className="mt-4 rounded-xl bg-teal/5 p-4"><div className="flex justify-between"><p className="text-sm font-bold">Selected delivery location</p><button onClick={()=>setTrackingId('')} className="text-gray-500">Close</button></div>{tracking ? <div className="mt-2 space-y-1 text-xs text-gray-600"><p>Pickup: {tracking.pickupLocation||'—'}</p><p>Destination: {tracking.deliveryLocation||'—'}</p><p>Volunteer: {tracking.volunteerLocation?.lat != null ? `${tracking.volunteerLocation.lat}, ${tracking.volunteerLocation.lng} · updated ${date(tracking.volunteerLocation.updatedAt)}` : 'No volunteer GPS update yet'}</p><p>NGO location: {tracking.ngoLocation?.lat != null ? `${tracking.ngoLocation.lat}, ${tracking.ngoLocation.lng} · updated ${date(tracking.ngoLocation.updatedAt)}` : 'No NGO GPS update'}</p></div>:<p className="mt-2 text-xs text-gray-500">Location is unavailable or has not been reported.</p>}</div>}</Section></div>
    <div className="grid gap-6 lg:grid-cols-2"><Section id="expiry" title="Expiry monitoring" subtitle="Available donations approaching safeUntil within six hours.">{expiring.length?<div className="space-y-2">{expiring.map(d=><div key={d.id||d._id} className="flex justify-between rounded-xl bg-amber-50 p-3 text-sm"><span>{d.title} · #{shortId(d.id||d._id)}</span><span className="font-semibold text-amber-800">Safe until {date(d.safeUntil)}</span></div>)}</div>:empty('No donations are approaching expiry.') }<p className="mt-2 text-[11px] text-gray-400">Expired status is set by the existing backend expiry job.</p></Section>
      <Section id="impact" title="FoodBridge impact" subtitle="Calculated from completed donation records."><div className="grid grid-cols-2 gap-3">{[['Total donations',stats?.total],['Completed donations',stats?.delivered],['Meals / servings shared',stats?.mealsShared],['NGOs served',new Set(completed.map(d=>userId(d.ngoId)).filter(Boolean)).size],['Completed volunteer deliveries',completed.filter(d=>d.volunteerId||d.volunteerName).length]].map(([k,v])=><div key={k} className="rounded-xl bg-gray-50 p-3"><p className="text-xs text-gray-500">{k}</p><p className="mt-1 text-xl font-extrabold">{v??0}</p></div>)}</div></Section></div>
    <Section id="activity" title="System activity" subtitle="Persisted notifications addressed to admin accounts.">{activity.length?<div className="divide-y divide-gray-100">{activity.map(n=><div key={n.id||n._id} className="py-3"><p className="text-sm text-gray-700">{n.text}{n.donationId?.title?` · ${n.donationId.title}`:''}</p><p className="mt-1 text-xs text-gray-400">{date(n.createdAt)}</p></div>)}</div>:empty('No admin notifications recorded.')}</Section>
    {selectedDonor && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true"><div className="max-h-[80vh] w-full max-w-2xl overflow-auto rounded-2xl bg-white p-5 shadow-xl"><div className="flex items-start justify-between"><div><h2 className="text-lg font-bold">{selectedDonor.name} · donation history</h2><p className="text-xs text-gray-500">{selectedDonor.email}</p></div><button onClick={()=>setSelectedDonor(null)} aria-label="Close history">✕</button></div><div className="mt-4 space-y-2">{donations.filter(d=>userId(d.donorId)===String(selectedDonor.id||selectedDonor._id)).map(d=><div key={d.id||d._id} className="flex flex-wrap justify-between gap-2 rounded-lg bg-gray-50 p-3 text-sm"><span>{d.title} · {d.qty}</span><StatusBadge status={d.status}/></div>)}</div></div></div>}
    {selectedDonation && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true"><div className="max-h-[85vh] w-full max-w-2xl overflow-auto rounded-2xl bg-white p-5 shadow-xl"><div className="flex items-start justify-between"><div><h2 className="text-lg font-bold">{selectedDonation.title}</h2><p className="text-xs text-gray-500">Donation #{shortId(selectedDonation.id||selectedDonation._id)}</p></div><button onClick={()=>setSelectedDonation(null)} aria-label="Close donation details">✕</button></div>{selectedDonation.imageUrl&&<img src={selectedDonation.imageUrl} alt={selectedDonation.title} className="mt-4 max-h-52 w-full rounded-xl object-cover"/>}<div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">{[['Status',selectedDonation.status],['Category',selectedDonation.category],['Quantity',selectedDonation.qty],['Servings',selectedDonation.servings],['Prepared',date(selectedDonation.preparedDate)],['Safe until',date(selectedDonation.safeUntil)],['Pickup location',selectedDonation.location],['NGO destination',selectedDonation.deliveryLocation||'—'],['Donor',userName(selectedDonation.donorId)||'—'],['NGO',userName(selectedDonation.ngoId)||selectedDonation.ngoName||'—'],['Assigned volunteer',userName(selectedDonation.volunteerId)||selectedDonation.volunteerName||'—'],['Storage',selectedDonation.storageType||'—']].map(([label,value])=><div key={label} className="rounded-lg bg-gray-50 p-3"><p className="text-[10px] uppercase text-gray-400">{label}</p><p className="mt-1 font-medium">{value}</p></div>)}</div>{selectedDonation.description&&<p className="mt-3 rounded-lg bg-gray-50 p-3 text-sm text-gray-600">{selectedDonation.description}</p>}</div></div>}
  </main>;
};
