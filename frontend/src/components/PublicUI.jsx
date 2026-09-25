import React, { useState } from 'react';
import { Link } from 'react-router-dom';

/* ─── Navbar ────────────────────────────────────────── */
export const Navbar = () => {
  const [open, setOpen] = useState(false);
  return (
    <nav className="bg-white/95 backdrop-blur-sm shadow-soft sticky top-0 z-50 border-b border-teal-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-teal flex items-center justify-center shadow-sm">
              <i className="fas fa-leaf text-white text-sm"></i>
            </div>
            <span className="text-xl font-bold text-primary group-hover:text-teal transition-colors">FoodBridge</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-gray-600 hover:text-primary transition-colors font-medium text-sm">Home</Link>
            <div className="flex items-center gap-3 ml-2">
              <Link to="/login" className="text-primary font-semibold hover:text-teal transition-colors text-sm">Login</Link>
              <Link to="/register"
                className="bg-gradient-to-r from-primary to-teal text-white px-5 py-2 rounded-full font-medium text-sm shadow-teal hover:shadow-lg hover:scale-105 transition-all">
                Register
              </Link>
            </div>
          </div>

          {/* Mobile burger */}
          <button onClick={() => setOpen(!open)} className="md:hidden text-primary focus:outline-none">
            <i className={`fas ${open ? 'fa-times' : 'fa-bars'} text-xl`}></i>
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden bg-white border-t border-teal-50 shadow-lg">
          <div className="px-4 pt-3 pb-6 space-y-1">
            <Link to="/" onClick={() => setOpen(false)}
              className="block px-4 py-3 text-gray-700 hover:text-primary hover:bg-aqua-light rounded-xl font-medium text-sm">Home</Link>
            <div className="pt-3 mt-2 border-t border-gray-100 flex flex-col gap-3 px-1">
              <Link to="/login" onClick={() => setOpen(false)} className="text-center text-primary font-semibold py-2 text-sm">Login</Link>
              <Link to="/register" onClick={() => setOpen(false)}
                className="text-center bg-gradient-to-r from-primary to-teal text-white font-medium py-2.5 rounded-full text-sm">Register</Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

/* ─── Footer ────────────────────────────────────────── */
export const Footer = () => (
  <footer className="bg-gray-900 text-white pt-12 pb-8 mt-auto relative overflow-hidden">
    {/* Decorative wave */}
    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-teal to-accent opacity-60"></div>

    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
        <div className="md:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-teal flex items-center justify-center">
              <i className="fas fa-leaf text-white text-xs"></i>
            </div>
            <span className="text-xl font-bold">FoodBridge</span>
          </div>
          <p className="text-gray-400 text-sm leading-relaxed mb-5">
            Share Food. Save Food. Serve Communities. Connecting surplus food with communities in need.
          </p>
          <div className="flex gap-4">
            {['fa-twitter','fa-facebook','fa-instagram'].map(icon => (
              <a key={icon} href="#" className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-teal hover:text-white transition-all">
                <i className={`fab ${icon} text-sm`}></i>
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">Get Involved</h4>
          <ul className="space-y-2 text-sm text-gray-400">
            <li><Link to="/register/donor" className="hover:text-teal transition-colors">Donate Food</Link></li>
            <li><Link to="/register/ngo" className="hover:text-teal transition-colors">Register as NGO</Link></li>
            <li><Link to="/register/volunteer" className="hover:text-teal transition-colors">Become a Volunteer</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">Contact</h4>
          <ul className="space-y-3 text-sm text-gray-400">
            <li className="flex items-center gap-2"><i className="fas fa-envelope text-teal w-4"></i> hello@foodbridge.org</li>
            <li className="flex items-center gap-2"><i className="fas fa-phone text-teal w-4"></i> 1800-FOOD-HELP</li>
            <li className="flex items-center gap-2"><i className="fas fa-map-marker-alt text-teal w-4"></i> Innovation City</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-800 pt-6 text-center text-xs text-gray-500">
        &copy; 2026 FoodBridge. All rights reserved.
      </div>
    </div>
  </footer>
);

/* ─── Button ────────────────────────────────────────── */
export const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const base = "inline-flex items-center justify-center px-6 py-2.5 text-sm font-semibold rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed";
  const v = {
    primary:   "text-white bg-gradient-to-r from-primary to-teal shadow-teal hover:shadow-lg hover:scale-105 focus:ring-primary",
    secondary: "text-white bg-gradient-to-r from-accent to-orange-500 shadow-md hover:shadow-lg hover:scale-105 focus:ring-accent",
    outline:   "text-primary bg-white border-2 border-primary hover:bg-primary hover:text-white focus:ring-primary",
    teal:      "text-white bg-teal hover:bg-teal-dark focus:ring-teal shadow-sm hover:shadow-md",
    ghost:     "text-gray-600 bg-transparent hover:bg-gray-100 hover:text-gray-900",
    danger:    "text-white bg-red-500 hover:bg-red-600 focus:ring-red-500 shadow-sm",
  };
  return <button className={`${base} ${v[variant] || v.primary} ${className}`} {...props}>{children}</button>;
};

/* ─── Card ──────────────────────────────────────────── */
export const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-3xl shadow-card border border-gray-100/60 overflow-hidden ${className}`}>
    {children}
  </div>
);

/* ─── StatusBadge ───────────────────────────────────── */
export const StatusBadge = ({ status }) => {
  const map = {
    AVAILABLE:          'bg-teal-100 text-teal-800 border-teal-200',
    EXPIRED:            'bg-red-100 text-red-700 border-red-200',
    NGO_ACCEPTED:       'bg-blue-100 text-blue-800 border-blue-200',
    VOLUNTEER_ASSIGNED: 'bg-purple-100 text-purple-800 border-purple-200',
    PICKUP_STARTED:     'bg-orange-100 text-orange-800 border-orange-200',
    FOOD_COLLECTED:     'bg-yellow-100 text-yellow-800 border-yellow-200',
    DELIVERY_STARTED:   'bg-indigo-100 text-indigo-800 border-indigo-200',
      DELIVERED:          'bg-green-100 text-green-800 border-green-200',
      COMPLETED:          'bg-green-100 text-green-800 border-green-200',
  };
  const icons = {
    AVAILABLE: 'fa-circle-check', EXPIRED: 'fa-circle-xmark',
      DELIVERED: 'fa-truck-fast', NGO_ACCEPTED: 'fa-handshake',
      COMPLETED: 'fa-circle-check',
    VOLUNTEER_ASSIGNED: 'fa-car', DELIVERY_STARTED: 'fa-route',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${map[status] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
      {icons[status] && <i className={`fas ${icons[status]} text-xs`}></i>}
      {status.replaceAll('_', ' ')}
    </span>
  );
};

/* ─── SectionHeading ────────────────────────────────── */
export const SectionHeading = ({ title, subtitle, centered = true }) => (
  <div className={`mb-10 ${centered ? 'text-center' : ''}`}>
    <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3 leading-tight">{title}</h2>
    {subtitle && <p className={`text-base text-gray-500 ${centered ? 'max-w-xl mx-auto' : 'max-w-xl'}`}>{subtitle}</p>}
  </div>
);

/* ─── PageContainer ─────────────────────────────────── */
export const PageContainer = ({ children, className = '' }) => (
  <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 page-transition ${className}`}>
    {children}
  </div>
);

/* ─── BotanicalBg (subtle leaf corners) ─────────────── */
export const BotanicalBg = () => (
  <div className="pointer-events-none select-none absolute inset-0 overflow-hidden">
    {/* top-left leaf cluster */}
    <svg className="absolute -top-4 -left-4 w-44 opacity-[.12]" viewBox="0 0 200 200" fill="none">
      <ellipse cx="60" cy="80" rx="45" ry="22" transform="rotate(-35 60 80)" fill="#3aada8"/>
      <ellipse cx="30" cy="130" rx="38" ry="18" transform="rotate(-55 30 130)" fill="#0d6e8a"/>
      <ellipse cx="100" cy="60" rx="30" ry="15" transform="rotate(-20 100 60)" fill="#3aada8"/>
    </svg>
    {/* bottom-right */}
    <svg className="absolute -bottom-4 -right-4 w-44 opacity-[.12]" viewBox="0 0 200 200" fill="none">
      <ellipse cx="140" cy="120" rx="45" ry="22" transform="rotate(35 140 120)" fill="#3aada8"/>
      <ellipse cx="170" cy="70" rx="38" ry="18" transform="rotate(55 170 70)" fill="#0d6e8a"/>
    </svg>
  </div>
);
