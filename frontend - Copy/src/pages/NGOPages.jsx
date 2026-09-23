import React from 'react';
import { Card, Button } from '../components/UI';
import { DashboardStatCard, FoodCard, TrackingCard } from '../components/Features';
import { mockDonations } from '../mockData';

export const NGODashboard = () => (
  <div className="p-6">
    <h1 className="text-3xl font-bold mb-6">NGO Dashboard</h1>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <DashboardStatCard title="Food Received" value="8,500 lbs" icon="fa-box" color="primary" />
      <DashboardStatCard title="Active Deliveries" value="2" icon="fa-truck" color="orange" />
      <DashboardStatCard title="People Fed" value="12,400" icon="fa-users" color="blue" />
    </div>
    <h2 className="text-xl font-bold mb-4">Available Nearby</h2>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {mockDonations.filter(d => d.status === 'AVAILABLE').map(d => (
        <FoodCard key={d.id} donation={d} actionLabel="Accept Donation" onAction={() => {}} />
      ))}
    </div>
  </div>
);

export const NGOAvailableDonations = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-6">Browse Available Food</h1>
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {mockDonations.filter(d => d.status === 'AVAILABLE' || d.status === 'NGO_ACCEPTED').map(d => (
        <FoodCard key={d.id} donation={d} actionLabel={d.status === 'AVAILABLE' ? 'Accept' : ''} />
      ))}
    </div>
  </div>
);

export const NGODeliveryTracking = () => {
  const activeDelivery = mockDonations.find(d => d.status === 'IN_TRANSIT');
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Active Deliveries</h1>
      {activeDelivery ? (
        <TrackingCard donation={activeDelivery} />
      ) : (
        <Card><p className="text-gray-500">No active deliveries at the moment.</p></Card>
      )}
    </div>
  );
};
