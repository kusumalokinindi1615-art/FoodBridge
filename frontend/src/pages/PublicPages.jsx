import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Card, FormInput, Select } from '../components/UI';
import { FoodCard } from '../components/Features';
import { mockDonations, mockStats } from '../mockData';

export const Home = () => (
  <div>
    <div className="bg-green-50 py-20 text-center">
      <h1 className="text-5xl font-bold text-gray-800 mb-6">Bridge the Gap between <span className="text-primary">Surplus</span> and <span className="text-secondary">Scarcity</span></h1>
      <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">Join FoodBridge to redistribute perfectly good food from donors to NGOs and communities in need.</p>
      <div className="space-x-4">
        <Link to="/register"><Button variant="primary" className="text-lg px-8 py-3">Join as Donor</Button></Link>
        <Link to="/available-food"><Button variant="outline" className="text-lg px-8 py-3">Find Food</Button></Link>
      </div>
    </div>
    <div className="max-w-7xl mx-auto px-4 py-16 grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
      <div><h2 className="text-4xl font-bold text-primary mb-2">{mockStats.totalDonations}+</h2><p className="text-gray-600">Donations Made</p></div>
      <div><h2 className="text-4xl font-bold text-primary mb-2">{mockStats.mealsServed}+</h2><p className="text-gray-600">Meals Served</p></div>
      <div><h2 className="text-4xl font-bold text-primary mb-2">{mockStats.activeVolunteers}+</h2><p className="text-gray-600">Active Volunteers</p></div>
      <div><h2 className="text-4xl font-bold text-primary mb-2">{mockStats.ngosPartnered}+</h2><p className="text-gray-600">Partner NGOs</p></div>
    </div>
  </div>
);

export const About = () => (
  <div className="max-w-4xl mx-auto px-4 py-12 text-center">
    <h1 className="text-4xl font-bold mb-6 text-gray-800">About FoodBridge</h1>
    <p className="text-lg text-gray-600 mb-8">FoodBridge is a community-focused food redistribution platform designed to reduce food waste and combat hunger by connecting surplus food from donors to those who need it most.</p>
    <img src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" alt="Community" className="rounded-xl shadow-lg mx-auto" />
  </div>
);

export const HowItWorks = () => (
  <div className="max-w-7xl mx-auto px-4 py-12">
    <h1 className="text-4xl font-bold text-center mb-12 text-gray-800">How It Works</h1>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <Card className="text-center">
        <i className="fas fa-box-open text-5xl text-primary mb-4"></i>
        <h3 className="text-xl font-bold mb-2">1. Donate</h3>
        <p className="text-gray-600">Donors list their surplus food with details and quantities.</p>
      </Card>
      <Card className="text-center">
        <i className="fas fa-hand-holding-heart text-5xl text-secondary mb-4"></i>
        <h3 className="text-xl font-bold mb-2">2. Accept</h3>
        <p className="text-gray-600">NGOs browse available food and accept what they need.</p>
      </Card>
      <Card className="text-center">
        <i className="fas fa-truck text-5xl text-primary mb-4"></i>
        <h3 className="text-xl font-bold mb-2">3. Deliver</h3>
        <p className="text-gray-600">Volunteers pick up the food and deliver it safely.</p>
      </Card>
    </div>
  </div>
);

export const AvailableFood = () => (
  <div className="max-w-7xl mx-auto px-4 py-12">
    <h1 className="text-3xl font-bold mb-8">Available Food</h1>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {mockDonations.filter(d => d.status === 'AVAILABLE').map(donation => (
        <FoodCard key={donation.id} donation={donation} actionLabel="View Details" onAction={() => {}} />
      ))}
    </div>
  </div>
);

export const Login = ({ onLogin }) => {
  const navigate = useNavigate();
  const [role, setRole] = useState('DONOR');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(role);
    navigate(`/${role.toLowerCase()}/dashboard`);
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6">Welcome Back</h2>
        <form onSubmit={handleSubmit}>
          <FormInput label="Email" type="email" required />
          <FormInput label="Password" type="password" required />
          <Select label="Simulate Role" options={[
            {value: 'DONOR', label: 'Donor'},
            {value: 'NGO', label: 'NGO'},
            {value: 'VOLUNTEER', label: 'Volunteer'},
            {value: 'ADMIN', label: 'Admin'},
          ]} value={role} onChange={(e) => setRole(e.target.value)} />
          <Button type="submit" className="w-full mt-4">Login</Button>
        </form>
        <p className="text-center mt-4 text-gray-600">Don't have an account? <Link to="/register" className="text-primary hover:underline">Register</Link></p>
      </Card>
    </div>
  );
};

export const Register = () => (
  <div className="min-h-[70vh] flex items-center justify-center bg-gray-50 py-12">
    <Card className="w-full max-w-lg">
      <h2 className="text-2xl font-bold text-center mb-6">Create an Account</h2>
      <form>
        <div className="grid grid-cols-2 gap-4">
          <FormInput label="First Name" required />
          <FormInput label="Last Name" required />
        </div>
        <FormInput label="Email" type="email" required />
        <FormInput label="Phone" required />
        <Select label="Role" options={[
          {value: 'DONOR', label: 'Donor'},
          {value: 'NGO', label: 'NGO (Receiver)'},
          {value: 'VOLUNTEER', label: 'Volunteer'},
        ]} />
        <FormInput label="Password" type="password" required />
        <FormInput label="Confirm Password" type="password" required />
        <Button className="w-full mt-4">Register</Button>
      </form>
    </Card>
  </div>
);
