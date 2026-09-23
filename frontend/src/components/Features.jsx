import React from 'react';
import { Card, StatusBadge, Button } from './UI';
import { Link } from 'react-router-dom';

export const DashboardStatCard = ({ title, value, icon, color = 'primary' }) => (
  <Card className="flex items-center">
    <div className={`p-4 rounded-full bg-${color}-100 text-${color}-600 mr-4`}>
      <i className={`fas ${icon} text-2xl`}></i>
    </div>
    <div>
      <p className="text-gray-500 text-sm">{title}</p>
      <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
    </div>
  </Card>
);

export const FoodCard = ({ donation, actionLabel, onAction }) => (
  <Card className="hover:shadow-lg transition-shadow">
    <div className="h-40 bg-gray-200 rounded-t-lg -mx-6 -mt-6 mb-4 overflow-hidden flex items-center justify-center">
      <i className="fas fa-utensils text-4xl text-gray-400"></i>
    </div>
    <div className="flex justify-between items-start mb-2">
      <h3 className="font-bold text-lg">{donation.title}</h3>
      <StatusBadge status={donation.status} />
    </div>
    <p className="text-gray-600 text-sm mb-2"><i className="fas fa-tag w-4"></i> {donation.category}</p>
    <p className="text-gray-600 text-sm mb-2"><i className="fas fa-box w-4"></i> {donation.qty} units</p>
    <p className="text-gray-600 text-sm mb-4"><i className="fas fa-map-marker-alt w-4"></i> {donation.location}</p>
    {actionLabel && (
      <Button variant="primary" className="w-full" onClick={() => onAction(donation.id)}>
        {actionLabel}
      </Button>
    )}
  </Card>
);

export const SearchBar = ({ placeholder, onChange }) => (
  <div className="relative mb-6">
    <i className="fas fa-search absolute left-3 top-3 text-gray-400"></i>
    <input 
      type="text" 
      placeholder={placeholder || 'Search...'} 
      className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
      onChange={e => onChange(e.target.value)}
    />
  </div>
);

export const NotificationBell = ({ count }) => (
  <div className="relative cursor-pointer">
    <i className="fas fa-bell text-xl text-gray-600"></i>
    {count > 0 && (
      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
        {count}
      </span>
    )}
  </div>
);

export const DonationTimeline = ({ currentStatus }) => {
  const steps = ['AVAILABLE', 'NGO_ACCEPTED', 'VOLUNTEER_ASSIGNED', 'IN_TRANSIT', 'DELIVERED'];
  const currentIndex = steps.indexOf(currentStatus);
  return (
    <div className="flex justify-between items-center my-8 relative">
      <div className="absolute left-0 top-1/2 w-full h-1 bg-gray-200 -z-10"></div>
      <div className="absolute left-0 top-1/2 h-1 bg-primary -z-10 transition-all" style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}></div>
      {steps.map((step, idx) => (
        <div key={idx} className="flex flex-col items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${idx <= currentIndex ? 'bg-primary text-white' : 'bg-gray-300 text-gray-600'}`}>
            {idx + 1}
          </div>
          <span className="text-xs mt-2 font-medium text-gray-600 text-center w-20 hidden md:block">{step.replace('_', ' ')}</span>
        </div>
      ))}
    </div>
  );
};

export const TrackingCard = ({ donation }) => (
  <Card>
    <h3 className="font-bold text-lg mb-4 border-b pb-2">Live Tracking Simulation</h3>
    <DonationTimeline currentStatus={donation.status} />
    <div className="bg-gray-100 h-64 rounded-lg flex items-center justify-center flex-col relative overflow-hidden">
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%239C92AC\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}></div>
      <i className="fas fa-map-marker-alt text-4xl text-red-500 mb-2 z-10 animate-bounce"></i>
      <p className="z-10 font-medium text-gray-700">Driver is en route to: {donation.location}</p>
    </div>
  </Card>
);
