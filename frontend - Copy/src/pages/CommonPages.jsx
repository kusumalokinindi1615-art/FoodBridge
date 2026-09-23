import React from 'react';
import { Card, Button, FormInput } from '../components/UI';
import { mockNotifications } from '../mockData';

export const Notifications = () => (
  <div className="p-6 max-w-4xl mx-auto">
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-bold">Notifications</h1>
      <Button variant="outline">Mark All as Read</Button>
    </div>
    <Card>
      <ul className="divide-y">
        {mockNotifications.map(n => (
          <li key={n.id} className={`py-4 flex justify-between items-center ${!n.read ? 'bg-blue-50 -mx-6 px-6' : ''}`}>
            <div>
              <p className={`text-gray-800 ${!n.read ? 'font-bold' : ''}`}>{n.text}</p>
              <p className="text-sm text-gray-500">{n.date}</p>
            </div>
            {!n.read && <span className="w-3 h-3 bg-blue-500 rounded-full"></span>}
          </li>
        ))}
      </ul>
    </Card>
  </div>
);

export const ProfileSettings = () => (
  <div className="p-6 max-w-2xl mx-auto">
    <h1 className="text-2xl font-bold mb-6">Profile & Settings</h1>
    <Card>
      <h2 className="text-lg font-bold mb-4 border-b pb-2">Personal Information</h2>
      <form>
        <div className="grid grid-cols-2 gap-4">
          <FormInput label="First Name" defaultValue="John" />
          <FormInput label="Last Name" defaultValue="Doe" />
        </div>
        <FormInput label="Email Address" defaultValue="john@example.com" type="email" />
        <FormInput label="Phone Number" defaultValue="+1 234 567 890" />
        
        <h2 className="text-lg font-bold mb-4 mt-8 border-b pb-2">Notification Preferences</h2>
        <div className="space-y-2 mb-6">
          <label className="flex items-center"><input type="checkbox" className="mr-2" defaultChecked /> Email Alerts</label>
          <label className="flex items-center"><input type="checkbox" className="mr-2" defaultChecked /> SMS Alerts</label>
        </div>
        
        <Button className="w-full">Save Changes</Button>
      </form>
    </Card>
  </div>
);

export const DonationDetails = () => (
  <div className="p-6 max-w-4xl mx-auto">
    <Button variant="outline" className="mb-4" onClick={() => window.history.back()}><i className="fas fa-arrow-left"></i> Back</Button>
    <Card>
      <div className="h-64 bg-gray-200 -mt-6 -mx-6 mb-6 rounded-t-xl flex items-center justify-center">
        <i className="fas fa-image text-5xl text-gray-400"></i>
      </div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">50 Boxed Lunches</h1>
          <p className="text-gray-600"><i className="fas fa-map-marker-alt"></i> Downtown Hotel</p>
        </div>
        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-bold">AVAILABLE</span>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 text-center bg-gray-50 p-4 rounded-lg">
        <div><p className="text-gray-500 text-sm">Category</p><p className="font-bold">Prepared Meals</p></div>
        <div><p className="text-gray-500 text-sm">Quantity</p><p className="font-bold">50 Servings</p></div>
        <div><p className="text-gray-500 text-sm">Prepared</p><p className="font-bold">Oct 1, 10:00 AM</p></div>
        <div><p className="text-gray-500 text-sm">Safe Until</p><p className="font-bold text-red-500">Oct 1, 5:00 PM</p></div>
      </div>
      
      <h3 className="text-xl font-bold mb-2">Description</h3>
      <p className="text-gray-700 mb-8">Freshly prepared boxed lunches left over from a corporate event. Includes sandwiches, chips, and a piece of fruit. Kept refrigerated.</p>
      
      <div className="flex space-x-4">
        <Button className="flex-1 text-lg py-3">Accept Donation</Button>
        <Button variant="outline" className="flex-1 text-lg py-3">Report Issue</Button>
      </div>
    </Card>
  </div>
);
