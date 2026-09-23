import React from 'react';
import { Button, Card, StatusBadge } from '../components/PublicUI';
import { useGlobalState } from '../context/GlobalState';
import { TrackingUI } from '../components/TrackingUI';

export const VolunteerDashboard = () => {
  const { currentUser, donations, updateDonationStatus } = useGlobalState();

  const pendingPickups = donations.filter(d => d.status === 'NGO_ACCEPTED');
  const myDeliveries = donations.filter(d => d.volunteerId === currentUser?.id);
  const active = myDeliveries.find(d =>
    ['VOLUNTEER_ASSIGNED','PICKUP_STARTED','FOOD_COLLECTED','DELIVERY_STARTED'].includes(d.status));
  const completed = myDeliveries.filter(d => d.status === 'DELIVERED');

  const claim = (id) => updateDonationStatus(id, 'VOLUNTEER_ASSIGNED', {
    volunteerId: currentUser.id, volunteerName: currentUser.name
  });
  const next = (id, status) => updateDonationStatus(id, status);

  const stepButtons = {
    VOLUNTEER_ASSIGNED: { label:'Start Pickup',       next:'PICKUP_STARTED'   },
    PICKUP_STARTED:     { label:'Mark Food Collected', next:'FOOD_COLLECTED'   },
    FOOD_COLLECTED:     { label:'Start Delivery',      next:'DELIVERY_STARTED' },
    DELIVERY_STARTED:   { label:'Mark as Delivered ✓', next:'DELIVERED',       variant:'teal' },
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Volunteer Dashboard 🚗</h1>
        <p className="text-sm text-gray-500 mt-1">{currentUser?.name}</p>
      </div>

      {/* Active delivery */}
      {active && (
        <section className="bg-gradient-to-br from-teal/5 to-primary/5 rounded-3xl p-6 border border-teal/20">
          <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
            <i className="fas fa-route text-teal"></i> Active Delivery
          </h2>
          <TrackingUI donation={active}/>
          <div className="mt-5 flex gap-3">
            {stepButtons[active.status] && (
              <Button
                variant={stepButtons[active.status].variant || 'primary'}
                className="flex-1"
                onClick={() => next(active.id, stepButtons[active.status].next)}
              >
                {stepButtons[active.status].label}
              </Button>
            )}
          </div>
        </section>
      )}

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Available pickups */}
        <section>
          <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <i className="fas fa-location-dot text-primary"></i> Available Pickups
          </h2>
          {pendingPickups.length > 0 ? (
            <div className="space-y-4">
              {pendingPickups.map(d => (
                <Card key={d.id} className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-gray-900">{d.title}</h3>
                    <StatusBadge status={d.status}/>
                  </div>
                  <div className="text-xs text-gray-500 space-y-1 mb-4">
                    <p className="flex items-center gap-1.5"><i className="fas fa-circle text-red-400 text-[6px]"></i> From: {d.location}</p>
                    <p className="flex items-center gap-1.5"><i className="fas fa-circle text-teal text-[6px]"></i> To: {d.deliveryLocation} ({d.ngoName})</p>
                  </div>
                  <Button variant="primary" className="w-full text-sm" onClick={() => claim(d.id)} disabled={!!active}>
                    {active ? 'Finish active route first' : 'Accept Pickup'}
                  </Button>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center text-gray-400 text-sm">No pending pickups right now.</Card>
          )}
        </section>

        {/* Completed */}
        <section>
          <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <i className="fas fa-circle-check text-teal"></i> Completed Deliveries
          </h2>
          {completed.length > 0 ? (
            <div className="space-y-3">
              {completed.map(d => (
                <Card key={d.id} className="p-4 flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-sm text-gray-800">{d.title}</p>
                    <p className="text-xs text-gray-400">Delivered to {d.ngoName}</p>
                  </div>
                  <StatusBadge status={d.status}/>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center text-gray-400 text-sm">No completed deliveries yet.</Card>
          )}
        </section>
      </div>
    </div>
  );
};
