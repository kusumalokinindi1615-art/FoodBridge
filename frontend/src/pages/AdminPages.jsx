import React from 'react';
import { Card, StatusBadge } from '../components/PublicUI';
import { useGlobalState } from '../context/GlobalState';

export const AdminDashboard = () => {
  const { users, donations } = useGlobalState();

  const count = (role) => users.filter(u => u.role === role).length;
  const activeD = donations.filter(d =>
    ['VOLUNTEER_ASSIGNED','PICKUP_STARTED','FOOD_COLLECTED','DELIVERY_STARTED'].includes(d.status)).length;
  const doneD = donations.filter(d => d.status === 'DELIVERED').length;

  const stats = [
    { label:'Donors',     val:count('DONOR'),     icon:'fa-box-open',           bg:'from-blue-500 to-blue-600' },
    { label:'NGOs',       val:count('NGO'),        icon:'fa-hand-holding-heart', bg:'from-teal to-teal-dark' },
    { label:'Volunteers', val:count('VOLUNTEER'),  icon:'fa-car',                bg:'from-purple-500 to-purple-600' },
    { label:'Total Food', val:donations.length,   icon:'fa-utensils',            bg:'from-primary to-primary-dark' },
    { label:'Active Delvs',val:activeD,            icon:'fa-truck',              bg:'from-orange-400 to-orange-600' },
    { label:'Completed',  val:doneD,               icon:'fa-circle-check',       bg:'from-green-500 to-green-600' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <h1 className="text-2xl font-extrabold text-gray-900">Admin Dashboard 🛡️</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map(s => (
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
                  <th className="text-left pb-3">Email</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map(u => (
                  <tr key={u.id}>
                    <td className="py-3 font-medium text-gray-800">{u.name}</td>
                    <td className="py-3">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal/10 text-teal">{u.role}</span>
                    </td>
                    <td className="py-3 text-gray-500 text-xs">{u.email}</td>
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
            {donations.slice().reverse().slice(0,6).map(d => (
              <div key={d.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-2xl">
                <div>
                  <p className="font-semibold text-sm text-gray-900">{d.title}</p>
                  <p className="text-xs text-gray-400">{new Date(d.createdAt || new Date()).toLocaleString()}</p>
                </div>
                <StatusBadge status={d.status}/>
              </div>
            ))}
            {donations.length === 0 && <p className="text-sm text-gray-400 italic text-center py-6">No donations yet.</p>}
          </div>
        </Card>
      </div>
    </div>
  );
};
