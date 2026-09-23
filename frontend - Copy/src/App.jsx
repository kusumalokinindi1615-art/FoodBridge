import React, { useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Navbar, Footer, Sidebar, ProtectedRoute } from './components/Layout';

// Public Pages
import { Home, About, HowItWorks, AvailableFood, Login, Register } from './pages/PublicPages';

// Common Pages
import { Notifications, ProfileSettings, DonationDetails } from './pages/CommonPages';

// Role Pages
import { DonorDashboard, DonateFood, MyDonations } from './pages/DonorPages';
import { NGODashboard, NGOAvailableDonations, NGODeliveryTracking } from './pages/NGOPages';
import { VolunteerDashboard, AvailablePickups } from './pages/VolunteerPages';
import { AdminDashboard, ManageUsers, ManageDonations } from './pages/AdminPages';

const DashboardLayout = ({ role, children }) => {
  const getLinks = () => {
    switch(role) {
      case 'DONOR': return [
        { to: '/donor/dashboard', label: 'Dashboard', icon: 'fa-tachometer-alt' },
        { to: '/donor/donate', label: 'Donate Food', icon: 'fa-plus-circle' },
        { to: '/donor/my-donations', label: 'My Donations', icon: 'fa-box' },
        { to: '/donor/notifications', label: 'Notifications', icon: 'fa-bell' },
        { to: '/donor/settings', label: 'Settings', icon: 'fa-cog' },
      ];
      case 'NGO': return [
        { to: '/ngo/dashboard', label: 'Dashboard', icon: 'fa-tachometer-alt' },
        { to: '/ngo/available', label: 'Available Food', icon: 'fa-search' },
        { to: '/ngo/tracking', label: 'Deliveries', icon: 'fa-truck' },
        { to: '/ngo/notifications', label: 'Notifications', icon: 'fa-bell' },
        { to: '/ngo/settings', label: 'Settings', icon: 'fa-cog' },
      ];
      case 'VOLUNTEER': return [
        { to: '/volunteer/dashboard', label: 'Dashboard', icon: 'fa-tachometer-alt' },
        { to: '/volunteer/pickups', label: 'Available Pickups', icon: 'fa-map-marker-alt' },
        { to: '/volunteer/active', label: 'Active Route', icon: 'fa-route' },
        { to: '/volunteer/notifications', label: 'Notifications', icon: 'fa-bell' },
        { to: '/volunteer/settings', label: 'Settings', icon: 'fa-cog' },
      ];
      case 'ADMIN': return [
        { to: '/admin/dashboard', label: 'Dashboard', icon: 'fa-tachometer-alt' },
        { to: '/admin/users', label: 'Manage Users', icon: 'fa-users' },
        { to: '/admin/donations', label: 'All Donations', icon: 'fa-boxes' },
        { to: '/admin/notifications', label: 'Notifications', icon: 'fa-bell' },
        { to: '/admin/settings', label: 'Settings', icon: 'fa-cog' },
      ];
      default: return [];
    }
  };

  return (
    <div className="flex bg-gray-50 min-h-[calc(100vh-64px)]">
      <Sidebar links={getLinks()} />
      <div className="flex-1 w-full overflow-x-hidden">
        {children}
      </div>
    </div>
  );
};

function App() {
  const [role, setRole] = useState(null); // 'DONOR', 'NGO', 'VOLUNTEER', 'ADMIN'
  const location = useLocation();
  const isDashboard = location.pathname.includes('/dashboard') || 
                      ['/donor/', '/ngo/', '/volunteer/', '/admin/'].some(p => location.pathname.startsWith(p));

  const content = (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/how-it-works" element={<HowItWorks />} />
      <Route path="/available-food" element={<AvailableFood />} />
      <Route path="/donation/:id" element={<DonationDetails />} />
      <Route path="/login" element={<Login onLogin={setRole} />} />
      <Route path="/register" element={<Register />} />

      {/* DONOR Routes */}
      <Route path="/donor/dashboard" element={<ProtectedRoute role={role} allowedRoles={['DONOR']}><DonorDashboard /></ProtectedRoute>} />
      <Route path="/donor/donate" element={<ProtectedRoute role={role} allowedRoles={['DONOR']}><DonateFood /></ProtectedRoute>} />
      <Route path="/donor/my-donations" element={<ProtectedRoute role={role} allowedRoles={['DONOR']}><MyDonations /></ProtectedRoute>} />
      <Route path="/donor/notifications" element={<ProtectedRoute role={role} allowedRoles={['DONOR']}><Notifications /></ProtectedRoute>} />
      <Route path="/donor/settings" element={<ProtectedRoute role={role} allowedRoles={['DONOR']}><ProfileSettings /></ProtectedRoute>} />
      
      {/* NGO Routes */}
      <Route path="/ngo/dashboard" element={<ProtectedRoute role={role} allowedRoles={['NGO']}><NGODashboard /></ProtectedRoute>} />
      <Route path="/ngo/available" element={<ProtectedRoute role={role} allowedRoles={['NGO']}><NGOAvailableDonations /></ProtectedRoute>} />
      <Route path="/ngo/tracking" element={<ProtectedRoute role={role} allowedRoles={['NGO']}><NGODeliveryTracking /></ProtectedRoute>} />
      <Route path="/ngo/notifications" element={<ProtectedRoute role={role} allowedRoles={['NGO']}><Notifications /></ProtectedRoute>} />
      <Route path="/ngo/settings" element={<ProtectedRoute role={role} allowedRoles={['NGO']}><ProfileSettings /></ProtectedRoute>} />

      {/* VOLUNTEER Routes */}
      <Route path="/volunteer/dashboard" element={<ProtectedRoute role={role} allowedRoles={['VOLUNTEER']}><VolunteerDashboard /></ProtectedRoute>} />
      <Route path="/volunteer/pickups" element={<ProtectedRoute role={role} allowedRoles={['VOLUNTEER']}><AvailablePickups /></ProtectedRoute>} />
      <Route path="/volunteer/active" element={<ProtectedRoute role={role} allowedRoles={['VOLUNTEER']}><NGODeliveryTracking /></ProtectedRoute>} />
      <Route path="/volunteer/notifications" element={<ProtectedRoute role={role} allowedRoles={['VOLUNTEER']}><Notifications /></ProtectedRoute>} />
      <Route path="/volunteer/settings" element={<ProtectedRoute role={role} allowedRoles={['VOLUNTEER']}><ProfileSettings /></ProtectedRoute>} />

      {/* ADMIN Routes */}
      <Route path="/admin/dashboard" element={<ProtectedRoute role={role} allowedRoles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute role={role} allowedRoles={['ADMIN']}><ManageUsers /></ProtectedRoute>} />
      <Route path="/admin/donations" element={<ProtectedRoute role={role} allowedRoles={['ADMIN']}><ManageDonations /></ProtectedRoute>} />
      <Route path="/admin/notifications" element={<ProtectedRoute role={role} allowedRoles={['ADMIN']}><Notifications /></ProtectedRoute>} />
      <Route path="/admin/settings" element={<ProtectedRoute role={role} allowedRoles={['ADMIN']}><ProfileSettings /></ProtectedRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar role={role} />
      {isDashboard && role ? (
        <DashboardLayout role={role}>{content}</DashboardLayout>
      ) : (
        <main className="flex-grow">{content}</main>
      )}
      {!isDashboard && <Footer />}
    </div>
  );
}

export default App;
