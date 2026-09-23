import React from 'react';

/* ─── FormInput ─────────────────────────────────────── */
export const FormInput = ({ label, error, ...props }) => (
  <div className="mb-4">
    {label && <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>}
    <input
      className={`w-full px-4 py-3 text-sm rounded-2xl border transition-all bg-gray-50 focus:bg-white focus:outline-none focus:ring-2
        ${error ? 'border-red-400 focus:ring-red-400' : 'border-gray-200 focus:ring-teal focus:border-transparent'}`}
      {...props}
    />
    {error && <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1"><i className="fas fa-circle-exclamation"></i>{error}</p>}
  </div>
);

/* ─── SelectInput ───────────────────────────────────── */
export const SelectInput = ({ label, options = [], error, ...props }) => (
  <div className="mb-4">
    {label && <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>}
    <select
      className={`w-full px-4 py-3 text-sm rounded-2xl border transition-all bg-gray-50 focus:bg-white focus:outline-none focus:ring-2
        ${error ? 'border-red-400 focus:ring-red-400' : 'border-gray-200 focus:ring-teal focus:border-transparent'}`}
      {...props}
    >
      <option value="" disabled>Select an option</option>
      {options.map((opt, i) => (
        <option key={i} value={opt.value ?? opt}>{opt.label ?? opt}</option>
      ))}
    </select>
    {error && <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1"><i className="fas fa-circle-exclamation"></i>{error}</p>}
  </div>
);

/* ─── LoadingState ──────────────────────────────────── */
export const LoadingState = () => (
  <div className="flex flex-col items-center justify-center py-20">
    <div className="w-12 h-12 rounded-full border-4 border-teal border-t-transparent animate-spin mb-4"></div>
    <p className="text-gray-500 font-medium text-sm">Loading…</p>
  </div>
);

/* ─── EmptyState ────────────────────────────────────── */
export const EmptyState = ({ title = 'Nothing here yet', message = 'Check back later.', icon = 'fa-box-open' }) => (
  <div className="text-center py-16 px-4">
    <div className="w-20 h-20 bg-aqua rounded-full flex items-center justify-center mx-auto mb-5 shadow-sm">
      <i className={`fas ${icon} text-2xl text-primary`}></i>
    </div>
    <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
    <p className="text-sm text-gray-500">{message}</p>
  </div>
);

/* ─── ErrorState ────────────────────────────────────── */
export const ErrorState = ({ message = 'Something went wrong.' }) => (
  <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center my-6">
    <i className="fas fa-triangle-exclamation text-3xl text-red-400 mb-3"></i>
    <p className="text-red-700 text-sm font-medium">{message}</p>
  </div>
);

/* ─── SearchBar ─────────────────────────────────────── */
export const SearchBar = ({ placeholder, value, onChange }) => (
  <div className="relative">
    <i className="fas fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
    <input
      type="text"
      className="w-full pl-10 pr-4 py-3 text-sm rounded-2xl border border-gray-200 bg-white shadow-card focus:outline-none focus:ring-2 focus:ring-teal transition-all"
      placeholder={placeholder}
      value={value}
      onChange={e => onChange(e.target.value)}
    />
  </div>
);

/* ─── Modal ─────────────────────────────────────────── */
export const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-7 z-10">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors">
            <i className="fas fa-times text-xs"></i>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};
