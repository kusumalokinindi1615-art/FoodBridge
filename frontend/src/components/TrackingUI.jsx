import React, { useEffect, useState } from 'react';
import { Card, StatusBadge } from './PublicUI';
import { donationsAPI } from '../api/api';

/* ─── DonationTimeline (Vertical) ───────────────────── */
export const TrackingUI = ({ donation }) => {
  const [gps, setGps] = useState(null);
  useEffect(() => {
    let stopped = false;
    const load = async () => {
      try {
        const { tracking } = await donationsAPI.tracking(donation.id);
        if (!stopped) setGps(tracking?.volunteerLocation || null);
      } catch { if (!stopped) setGps(null); }
    };
    load();
    const timer = setInterval(load, 15000);
    return () => { stopped = true; clearInterval(timer); };
  }, [donation.id]);
  const steps = [
    { key: 'POSTED',             label: 'Food Posted',         icon: 'fa-box-open' },
    { key: 'NGO_ACCEPTED',       label: 'NGO Accepted',        icon: 'fa-handshake' },
    { key: 'VOLUNTEER_ASSIGNED', label: 'Volunteer Assigned',  icon: 'fa-car' },
    { key: 'PICKUP_STARTED',     label: 'Pickup Started',      icon: 'fa-route' },
    { key: 'FOOD_COLLECTED',     label: 'Food Collected',      icon: 'fa-basket-shopping' },
    { key: 'DELIVERY_STARTED',   label: 'Out for Delivery',    icon: 'fa-truck' },
    { key: 'DELIVERED',          label: 'Delivered ✓',         icon: 'fa-circle-check' },
    { key: 'COMPLETED',          label: 'Completed ✓',         icon: 'fa-circle-check' },
  ];

  const order = steps.map(s => s.key);
  const currentIdx = order.indexOf(donation.status);

  return (
    <Card className="p-6 border-l-4 border-l-teal">
      <div className="flex justify-between items-start mb-5">
        <div>
          <h3 className="font-bold text-gray-900 text-lg">{donation.title}</h3>
          <p className="text-sm text-gray-500 mt-0.5">{donation.qty} • {donation.servings} Servings</p>
        </div>
        <StatusBadge status={donation.status} />
      </div>

      {/* Route info */}
      <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-2xl p-4 mb-6 text-sm">
        <div>
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">Pickup</p>
          <p className="font-medium text-gray-800 flex items-start gap-1.5">
            <i className="fas fa-location-dot text-red-400 mt-0.5 flex-shrink-0"></i>{donation.location}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">Deliver To</p>
          <p className="font-medium text-gray-800 flex items-start gap-1.5">
            <i className="fas fa-flag-checkered text-teal mt-0.5 flex-shrink-0"></i>
            {donation.deliveryLocation || <span className="text-gray-400 italic">Awaiting NGO…</span>}
          </p>
          {donation.ngoName && <p className="text-xs text-gray-400 mt-0.5 pl-5">NGO: {donation.ngoName}</p>}
        </div>
        {donation.volunteerName && (
          <div className="col-span-2 border-t border-gray-200 pt-3 mt-1">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">Volunteer</p>
            <p className="font-medium text-gray-800 flex items-center gap-2">
              <i className="fas fa-person-biking text-primary"></i> {donation.volunteerName}
            </p>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="relative pl-8">
        <div className="absolute left-3.5 top-0 bottom-0 w-0.5 bg-gray-200"></div>
        <div className="space-y-5">
          {steps.map((step, i) => {
            const done = i <= currentIdx;
            const active = i === currentIdx;
            return (
              <div key={step.key} className={`relative flex items-center gap-4 transition-opacity ${done ? 'opacity-100' : 'opacity-35'}`}>
                <div className={`absolute -left-8 w-7 h-7 rounded-full flex items-center justify-center z-10 shadow-sm
                  ${active ? 'bg-gradient-to-br from-primary to-teal ring-4 ring-teal/20' : done ? 'bg-teal' : 'bg-gray-200'}`}>
                  <i className={`fas ${step.icon} text-xs ${done ? 'text-white' : 'text-gray-400'}`}></i>
                </div>
                <p className={`text-sm font-medium ${active ? 'text-primary font-bold' : done ? 'text-gray-800' : 'text-gray-400'}`}>
                  {step.label}
                </p>
                {active && (
                  <span className="ml-auto text-xs bg-teal/10 text-teal font-semibold px-2 py-0.5 rounded-full">Current</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {donation.status === 'DELIVERY_STARTED' && (
        <div className="mt-6 flex items-center gap-3 bg-teal/10 rounded-2xl p-4 text-teal-dark text-sm border border-teal/20">
          <i className="fas fa-satellite-dish text-xl text-teal animate-pulse"></i>
          <div>
            <p className="font-bold">Volunteer is on the way!</p>
            <p className="text-xs opacity-75">Simulated tracking — en route to destination.</p>
          </div>
        </div>
      )}
      {gps?.lat != null && (
        <div className="mt-5 rounded-xl bg-teal/5 border border-teal/20 p-3 text-sm">
          <p className="font-semibold text-teal">{donation.volunteerName || 'Assigned volunteer'} · live delivery location</p>
          <p className="text-gray-600">{Number(gps.lat).toFixed(5)}, {Number(gps.lng).toFixed(5)}{gps.updatedAt ? ` · ${new Date(gps.updatedAt).toLocaleTimeString()}` : ''}</p>
          <a className="text-teal underline" target="_blank" rel="noreferrer" href={`https://www.openstreetmap.org/?mlat=${gps.lat}&mlon=${gps.lng}#map=15/${gps.lat}/${gps.lng}`}>View on map</a>
        </div>
      )}
    </Card>
  );
};
