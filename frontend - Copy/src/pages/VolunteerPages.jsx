import React from 'react';
import { Card, Button } from '../components/UI';
import { DashboardStatCard, FoodCard, TrackingCard } from '../components/Features';
import { mockDonations } from '../mockData';

export const VolunteerDashboard = () => (
  <div className="p-6">
    <h1 className="text-3xl font-bold mb-6">Volunteer Dashboard</h1>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <DashboardStatCard title="Completed Deliveries" value="124" icon="fa-check-circle" color="green" />
      <DashboardStatCard title="Miles Driven" value="840" icon="fa-road" color="gray" />
      <DashboardStatCard title="Active Pickup" value="1" icon="fa-truck" color="orange" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div>
        <h2 className="text-xl font-bold mb-4">Available Pickups</h2>
        <div className="space-y-4">
          {mockDonations.filter(d => d.status === 'NGO_ACCEPTED').map(d => (
            <Card key={d.id} className="flex justify-between items-center">
              <div>
                <h4 className="font-bold">{d.title}</h4>
                <p className="text-sm text-gray-600"><i className="fas fa-map-marker-alt"></i> {d.location}</p>
              </div>
              <Button>Claim Route</Button>
            </Card>
          ))}
        </div>
      </div>
      <div>
        <h2 className="text-xl font-bold mb-4">Current Active Delivery</h2>
        {mockDonations.filter(d => d.status === 'IN_TRANSIT').map(d => (
          <TrackingCard key={d.id} donation={d} />
        ))}
      </div>
    </div>
  </div>
);

export const AvailablePickups = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-6">Available Pickups Nearby</h1>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {mockDonations.filter(d => d.status === 'NGO_ACCEPTED').map(d => (
        <FoodCard key={d.id} donation={d} actionLabel="Claim Pickup" />
      ))}
    </div>
  </div>
);
