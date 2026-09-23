import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

export const Navbar = ({ role }) => {
  const navigate = useNavigate();
  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-primary flex items-center">
          <i className="fas fa-leaf mr-2 text-secondary"></i> FoodBridge
        </Link>
        <div className="hidden md:flex space-x-6 items-center">
          <Link to="/" className="text-gray-600 hover:text-primary">Home</Link>
          <Link to="/about" className="text-gray-600 hover:text-primary">About</Link>
          <Link to="/how-it-works" className="text-gray-600 hover:text-primary">How It Works</Link>
          <Link to="/available-food" className="text-gray-600 hover:text-primary">Available Food</Link>
          {!role ? (
            <>
              <Link to="/login" className="text-primary font-medium hover:underline">Login</Link>
              <Link to="/register" className="bg-primary text-white px-4 py-2 rounded-md hover:bg-green-600">Register</Link>
            </>
          ) : (
            <Link to={`/${role.toLowerCase()}/dashboard`} className="text-gray-600 hover:text-primary font-bold">
              Dashboard <i className="fas fa-user-circle ml-1"></i>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export const Footer = () => (
  <footer className="bg-gray-800 text-white py-8 mt-auto">
    <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
      <div>
        <h3 className="text-xl font-bold mb-4"><i className="fas fa-leaf text-primary mr-2"></i>FoodBridge</h3>
        <p className="text-gray-400">Connecting surplus food with communities in need, reducing waste, and fighting hunger.</p>
      </div>
      <div>
        <h4 className="font-bold mb-4">Quick Links</h4>
        <ul className="space-y-2 text-gray-400">
          <li><Link to="/about" className="hover:text-white">About Us</Link></li>
          <li><Link to="/how-it-works" className="hover:text-white">How It Works</Link></li>
          <li><Link to="/available-food" className="hover:text-white">Available Food</Link></li>
        </ul>
      </div>
      <div>
        <h4 className="font-bold mb-4">Get Involved</h4>
        <ul className="space-y-2 text-gray-400">
          <li><Link to="/register" className="hover:text-white">Become a Donor</Link></li>
          <li><Link to="/register" className="hover:text-white">Register NGO</Link></li>
          <li><Link to="/register" className="hover:text-white">Volunteer to Drive</Link></li>
        </ul>
      </div>
      <div>
        <h4 className="font-bold mb-4">Contact</h4>
        <p className="text-gray-400"><i className="fas fa-envelope mr-2"></i> hello@foodbridge.org</p>
        <p className="text-gray-400 mt-2"><i className="fas fa-phone mr-2"></i> +1 234 567 8900</p>
      </div>
    </div>
    <div className="text-center text-gray-500 mt-8 border-t border-gray-700 pt-4">
      &copy; 2026 FoodBridge. All rights reserved.
    </div>
  </footer>
);

export const Sidebar = ({ links }) => (
  <div className="w-64 bg-white shadow-sm h-screen sticky top-0 hidden md:block">
    <div className="p-4 border-b">
      <h2 className="text-xl font-bold text-gray-700">Menu</h2>
    </div>
    <ul className="p-2 space-y-1">
      {links.map((link, idx) => (
        <li key={idx}>
          <Link to={link.to} className="block px-4 py-2 text-gray-600 hover:bg-green-50 hover:text-primary rounded-md">
            <i className={`fas ${link.icon} w-6`}></i> {link.label}
          </Link>
        </li>
      ))}
    </ul>
  </div>
);

export const ProtectedRoute = ({ role, allowedRoles, children }) => {
  if (!allowedRoles.includes(role)) {
    return <div className="p-8 text-center text-red-500">Access Denied. Please login with proper credentials.</div>;
  }
  return children;
};
