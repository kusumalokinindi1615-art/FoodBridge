import React from 'react';
import { Card, Button, FormInput, Select } from '../components/UI';
import { DashboardStatCard, FoodCard } from '../components/Features';
import { mockDonations } from '../mockData';

export const DonorDashboard = () => (
  <div className="p-6">
    <h1 className="text-3xl font-bold mb-6">Donor Dashboard</h1>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <DashboardStatCard title="Total Donations" value="45" icon="fa-box-open" color="blue" />
      <DashboardStatCard title="Active Listings" value="3" icon="fa-list" color="green" />
      <DashboardStatCard title="Meals Provided" value="1,200" icon="fa-utensils" color="orange" />
    </div>
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-xl font-bold">Recent Donations</h2>
      <Button>Create Donation</Button>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {mockDonations.slice(0, 3).map(d => <FoodCard key={d.id} donation={d} />)}
    </div>
  </div>
);

export const DonateFood = () => (
  <div className="p-6 max-w-2xl mx-auto">
    <Card>
      <h2 className="text-2xl font-bold mb-6">Create New Donation</h2>
      <form>
        <FormInput label="Food Title" placeholder="e.g. 50 Boxed Lunches" required />
        <Select label="Category" options={[{label: 'Prepared Meals', value:'meals'}, {label: 'Produce', value:'produce'}, {label: 'Baked Goods', value:'baked'}]} />
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea className="w-full px-3 py-2 border rounded-md" rows="4"></textarea>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormInput label="Quantity / Servings" type="number" required />
          <FormInput label="Safe Until (Expiry)" type="datetime-local" required />
        </div>
        <FormInput label="Pickup Location" required />
        <Button className="w-full mt-4">Submit Donation</Button>
      </form>
    </Card>
  </div>
);

export const MyDonations = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-6">My Donations History</h1>
    <Card>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {mockDonations.map(d => (
            <tr key={d.id}>
              <td className="px-6 py-4 whitespace-nowrap">{d.title}</td>
              <td className="px-6 py-4 whitespace-nowrap">{d.date}</td>
              <td className="px-6 py-4 whitespace-nowrap">{d.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  </div>
);
