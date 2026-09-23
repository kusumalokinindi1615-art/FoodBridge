import React from 'react';

export const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const baseStyle = 'px-4 py-2 rounded font-medium transition-colors duration-200';
  const variants = {
    primary: 'bg-primary text-white hover:bg-green-600',
    secondary: 'bg-secondary text-white hover:bg-orange-600',
    outline: 'border-2 border-primary text-primary hover:bg-green-50',
    danger: 'bg-red-500 text-white hover:bg-red-600',
  };
  return (
    <button className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-xl shadow-md p-6 ${className}`}>
    {children}
  </div>
);

export const StatusBadge = ({ status }) => {
  const colors = {
    AVAILABLE: 'bg-blue-100 text-blue-800',
    NGO_ACCEPTED: 'bg-yellow-100 text-yellow-800',
    VOLUNTEER_ASSIGNED: 'bg-purple-100 text-purple-800',
    IN_TRANSIT: 'bg-orange-100 text-orange-800',
    DELIVERED: 'bg-green-100 text-green-800',
    COMPLETED: 'bg-gray-100 text-gray-800',
    CANCELLED: 'bg-red-100 text-red-800',
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colors[status] || 'bg-gray-100'}`}>
      {status.replace('_', ' ')}
    </span>
  );
};

export const FormInput = ({ label, type = 'text', ...props }) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input type={type} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary" {...props} />
  </div>
);

export const Select = ({ label, options, ...props }) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary" {...props}>
      {options.map((opt, idx) => (
        <option key={idx} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  </div>
);

export const LoadingSpinner = () => (
  <div className="flex justify-center items-center py-10">
    <i className="fas fa-spinner fa-spin text-4xl text-primary"></i>
  </div>
);

export const EmptyState = ({ message = 'No items found.', icon = 'fa-box-open' }) => (
  <div className="text-center py-12 text-gray-500">
    <i className={`fas ${icon} text-5xl mb-4 text-gray-300`}></i>
    <p className="text-lg">{message}</p>
  </div>
);

export const ErrorState = ({ message = 'Something went wrong.' }) => (
  <div className="bg-red-50 text-red-600 p-4 rounded-md my-4 flex items-center">
    <i className="fas fa-exclamation-circle mr-2"></i> {message}
  </div>
);
