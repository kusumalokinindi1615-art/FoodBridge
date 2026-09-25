import React from 'react';
import { Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { Navbar, Footer } from './components/PublicUI';
import { useGlobalState } from './context/GlobalState';

// Public Pages
import { Home, About } from './pages/MarketingPages';
import { AvailableFood, FoodDetails } from './pages/FoodPages';
import { Login, Register } from './pages/AuthPages';
import { NotFound } from './pages/NotFound';

// Role Dashboards
import { DonorDashboard, DonateFood } from './pages/DonorPages';
import { NGODashboard } from './pages/NGOPages';
import { VolunteerDashboard } from './pages/VolunteerPages';
import { AdminDashboard } from './pages/AdminPages';
import { MyProfile } from './pages/ProfilePage';

/* ─── Dashboard sidebar layout ──────────────────────── */
const DashboardLayout = ({ role, children }) => {
  const { logout, currentUser } = useGlobalState();

  const allLinks = [
    { roles:['DONOR'], to:'/donor/donate', label:'Donate Food', icon:'fa-plus-circle' },
  ];
  const links = allLinks.filter(l => l.roles.includes(role));

  return (
    <div className="flex min-h-[calc(100vh-64px)] bg-background">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-card border-r border-gray-100 flex-shrink-0 hidden md:flex flex-col">
        <div className="px-5 py-6 border-b border-gray-100">
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Logged in as</p>
          <p className="font-bold text-gray-900 truncate">{currentUser?.name}</p>
          <span className="inline-block mt-1 text-xs bg-teal/10 text-teal px-2.5 py-0.5 rounded-full font-semibold">{role}</span>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {links.map(l => (
            <Link key={l.label} to={l.to}
              className="flex items-center gap-3 px-4 py-2.5 rounded-2xl text-gray-600 hover:bg-teal/5 hover:text-primary transition-colors font-medium text-sm">
              <i className={`fas ${l.icon} w-4 text-center text-gray-400`}></i>{l.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Mobile top bar for role */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex z-40 shadow-lg">
        {links.map(l => (
          <Link key={l.label} to={l.to}
            className="flex-1 flex flex-col items-center py-3 text-gray-500 hover:text-primary transition-colors text-xs font-medium">
            <i className={`fas ${l.icon} mb-1 text-base`}></i>{l.label}
          </Link>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-x-hidden pb-20 md:pb-0">
        {/* Top-right user menu: My Profile + Logout */}
        <div className="flex justify-end px-6 pt-4">
          <div className="flex items-center gap-2">
            <Link to={`/${role.toLowerCase()}/profile`}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-primary bg-white border border-teal/30 rounded-full shadow-sm hover:bg-teal/5 transition-colors">
              <i className="fas fa-user text-teal text-xs"></i> My Profile
            </Link>
            <Link to="/" onClick={logout}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-red-500 bg-white border border-red-100 rounded-full shadow-sm hover:bg-red-50 transition-colors">
              <i className="fas fa-right-from-bracket text-xs"></i> Logout
            </Link>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
};

/* ─── Protected Route ────────────────────────────────── */
const ProtectedRoute = ({ allowedRoles, children }) => {
  const { currentUser, booting } = useGlobalState();
  if (booting) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-gray-400">
        <i className="fas fa-spinner fa-spin text-2xl text-teal mb-3"></i>
        <p className="text-sm">Restoring your session…</p>
      </div>
    );
  }
  if (!currentUser || !allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/login" replace />;
  }
  return <DashboardLayout role={currentUser.role}>{children}</DashboardLayout>;
};

/* ─── App ────────────────────────────────────────────── */
function App() {
  const location = useLocation();
  const isDashboard = ['/donor','/ngo','/volunteer','/admin'].some(p => location.pathname.startsWith(p));

  return (
    <div className="flex flex-col min-h-screen bg-background font-sans text-gray-900">
      <Navbar />
      <main className="flex-grow flex flex-col">
        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/food/:id" element={<FoodDetails />} />
          <Route path="/food" element={<AvailableFood />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register/:roleType" element={<Register />} />
          <Route path="/register" element={<Navigate to="/register/donor" replace />} />

          {/* Dashboards */}
          <Route path="/donor/dashboard" element={<ProtectedRoute allowedRoles={['DONOR']}><DonorDashboard /></ProtectedRoute>} />
          <Route path="/donor/donate"    element={<ProtectedRoute allowedRoles={['DONOR']}><DonateFood /></ProtectedRoute>} />
          <Route path="/ngo/dashboard"   element={<ProtectedRoute allowedRoles={['NGO']}><NGODashboard /></ProtectedRoute>} />
          <Route path="/volunteer/dashboard" element={<ProtectedRoute allowedRoles={['VOLUNTEER']}><VolunteerDashboard /></ProtectedRoute>} />
          <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/donor/profile" element={<ProtectedRoute allowedRoles={['DONOR']}><MyProfile /></ProtectedRoute>} />
          <Route path="/ngo/profile" element={<ProtectedRoute allowedRoles={['NGO']}><MyProfile /></ProtectedRoute>} />
          <Route path="/volunteer/profile" element={<ProtectedRoute allowedRoles={['VOLUNTEER']}><MyProfile /></ProtectedRoute>} />
          <Route path="/admin/profile" element={<ProtectedRoute allowedRoles={['ADMIN']}><MyProfile /></ProtectedRoute>} />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {!isDashboard && <Footer />}
    </div>
  );
}

export default App;
