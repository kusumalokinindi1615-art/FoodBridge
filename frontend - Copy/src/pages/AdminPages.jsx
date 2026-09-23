import React from 'react';
import { Card, Button } from '../components/UI';
import { DashboardStatCard } from '../components/Features';
import { mockUsers, mockDonations, mockStats } from '../mockData';

export const AdminDashboard = () => (
  <div className="p-6">
    <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <DashboardStatCard title="Total Users" value="842" icon="fa-users" color="blue" />
      <DashboardStatCard title="Total Donations" value={mockStats.totalDonations} icon="fa-box" color="green" />
      <DashboardStatCard title="Total NGOs" value={mockStats.ngosPartnered} icon="fa-building" color="purple" />
      <DashboardStatCard title="Pending Verifications" value="12" icon="fa-clock" color="orange" />
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <Card>
        <h2 className="text-xl font-bold mb-4">Recent Users</h2>
        <ul className="divide-y">
          {mockUsers.map(user => (
            <li key={user.id} className="py-3 flex justify-between items-center">
              <div>
                <p className="font-medium">{user.name}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
              <span className="px-2 py-1 bg-gray-100 rounded text-xs">{user.role}</span>
            </li>
          ))}
        </ul>
      </Card>
      <Card>
        <h2 className="text-xl font-bold mb-4">System Alerts</h2>
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <p className="text-yellow-700"><strong>Notice:</strong> High volume of unassigned deliveries in Downtown area.</p>
        </div>
      </Card>
    </div>
  </div>
);

export const ManageUsers = () => (
  <div className="p-6">
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-bold">Manage Users</h1>
      <Button>Add User</Button>
    </div>
    <Card>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {mockUsers.map(u => (
            <tr key={u.id}>
              <td className="px-6 py-4 whitespace-nowrap">{u.name}</td>
              <td className="px-6 py-4 whitespace-nowrap"><span className="px-2 py-1 bg-gray-100 rounded text-xs">{u.role}</span></td>
              <td className="px-6 py-4 whitespace-nowrap">{u.email}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <button className="text-blue-600 hover:text-blue-900 mr-3">Edit</button>
                <button className="text-red-600 hover:text-red-900">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  </div>
);

export const ManageDonations = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-6">Manage All Donations</h1>
    <Card>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {mockDonations.map(d => (
            <tr key={d.id}>
              <td className="px-6 py-4 whitespace-nowrap">{d.title}</td>
              <td className="px-6 py-4 whitespace-nowrap">{d.location}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 py-1 rounded text-xs ${d.status === 'DELIVERED' ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}>{d.status}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  </div>
);
