import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button, BotanicalBg } from '../components/PublicUI';
import { FormInput, SelectInput, Modal } from '../components/PublicUI2';
import { useGlobalState } from '../context/GlobalState';

/* ─── Panel wrapper shared by Login & Register ────── */
const AuthPanel = ({ children, image, quote }) => (
  <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
    {/* subtle botanical bg */}
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-teal/5 blur-3xl"></div>
      <div className="absolute -bottom-20 -right-20 w-96 h-96 rounded-full bg-primary/5 blur-3xl"></div>
      <svg className="absolute top-0 left-0 w-56 opacity-[.06]" viewBox="0 0 200 200" fill="none">
        <ellipse cx="60" cy="80" rx="55" ry="25" transform="rotate(-40 60 80)" fill="#3aada8"/>
        <ellipse cx="30" cy="140" rx="45" ry="20" transform="rotate(-60 30 140)" fill="#0d6e8a"/>
      </svg>
    </div>

    <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden flex z-10">
      {/* Left decorative panel */}
      <div className="hidden md:flex md:w-5/12 bg-gradient-to-br from-primary to-teal flex-col justify-between p-10 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%"><pattern id="grid" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse"><circle cx="15" cy="15" r="1.5" fill="white"/></pattern><rect width="100%" height="100%" fill="url(#grid)"/></svg>
        </div>
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-2 text-white text-xl font-bold mb-2">
            <i className="fas fa-leaf text-white/80"></i> FoodBridge
          </Link>
          <p className="text-white/70 text-xs">Share Food. Save Food. Serve Communities.</p>
        </div>
        <div className="relative z-10">
          <div className="text-5xl mb-5">🥗🤝🚚</div>
          <blockquote className="text-white/90 text-sm leading-relaxed italic">
            "{quote}"
          </blockquote>
        </div>
        <div className="relative z-10 flex items-center gap-2 text-white/60 text-xs">
          <i className="fas fa-shield-halved"></i> Secure & Trusted Platform
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 p-8 md:p-10 overflow-y-auto">
        {children}
      </div>
    </div>
  </div>
);

/* ─── LOGIN ──────────────────────────────────────────── */
export const Login = () => {
  const navigate = useNavigate();
  const { login } = useGlobalState();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('DONOR');
  const [showPwd, setShowPwd] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!email) e.email = 'Email is required';
    if (!password) e.password = 'Password is required';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = (ev) => {
    ev.preventDefault();
    if (validate()) {
      login(email, role);
      navigate(`/${role.toLowerCase()}/dashboard`);
    }
  };

  return (
    <AuthPanel quote="Every meal shared is a life touched. Join FoodBridge today.">
      <div className="max-w-sm mx-auto">
        <h2 className="text-2xl font-extrabold text-gray-900 mb-1">Welcome back</h2>
        <p className="text-sm text-gray-400 mb-8">Sign in to your FoodBridge account.</p>

        <form onSubmit={handleSubmit}>
          <SelectInput
            label="Mock Login Role"
            options={[
              { value: 'DONOR', label: 'Donor' },
              { value: 'NGO', label: 'NGO' },
              { value: 'VOLUNTEER', label: 'Volunteer' },
              { value: 'ADMIN', label: 'Admin' },
            ]}
            value={role}
            onChange={e => setRole(e.target.value)}
          />
          <FormInput label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} error={errors.email} />
          <div className="relative">
            <FormInput label="Password" type={showPwd ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} error={errors.password} />
            <button type="button" onClick={() => setShowPwd(!showPwd)}
              className="absolute right-4 top-9 text-gray-400 hover:text-teal text-sm">
              <i className={`fas ${showPwd ? 'fa-eye-slash' : 'fa-eye'}`}></i>
            </button>
          </div>
          <div className="flex justify-between items-center mb-6">
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 accent-teal rounded"/> Remember me
            </label>
            <a href="#" className="text-sm text-teal font-semibold hover:underline">Forgot password?</a>
          </div>
          <Button type="submit" className="w-full py-3 text-sm">Sign In</Button>
        </form>

        <p className="text-center mt-6 text-sm text-gray-500">
          Don't have an account?{' '}
          <Link to="/register" className="text-teal font-semibold hover:underline">Register now</Link>
        </p>
      </div>
    </AuthPanel>
  );
};

/* ─── REGISTER ───────────────────────────────────────── */
export const Register = () => {
  const navigate = useNavigate();
  const { roleType } = useParams();
  const { registerUser } = useGlobalState();
  const role = roleType ? roleType.toUpperCase() : 'DONOR';

  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);

  const set = (field, val) => {
    setForm({ ...form, [field]: val });
    if (errors[field]) setErrors({ ...errors, [field]: null });
  };

  const validate = () => {
    const e = {};
    if (!form.name) e.name = 'Required';
    if (!form.email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
    if (!form.phone) e.phone = 'Phone is required';
    if (role !== 'ADMIN' && !form.location) e.location = 'Location is required';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 8) e.password = 'Min 8 characters';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords must match';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = (ev) => {
    ev.preventDefault();
    if (validate()) {
      registerUser({ name: form.name, email: form.email, phone: form.phone, location: form.location, role });
      setShowSuccess(true);
    }
  };

  const roleLabel = { DONOR:'Donor', NGO:'NGO', VOLUNTEER:'Volunteer', ADMIN:'Admin' }[role];

  return (
    <AuthPanel quote="Your surplus can be someone else's lifeline. Start donating today.">
      <div className="max-w-sm mx-auto">
        <h2 className="text-2xl font-extrabold text-gray-900 mb-1">Sign Up as {roleLabel}</h2>
        <p className="text-sm text-gray-400 mb-6">Join FoodBridge and make an impact in your community.</p>

        {/* Role switcher */}
        <div className="flex bg-gray-100 rounded-2xl p-1 mb-6">
          {['DONOR','NGO','VOLUNTEER','ADMIN'].map(r => (
            <Link key={r} to={`/register/${r.toLowerCase()}`}
              className={`flex-1 py-1.5 text-center text-xs font-bold rounded-xl transition-all
                ${role === r ? 'bg-white shadow-sm text-primary' : 'text-gray-500 hover:text-gray-700'}`}>
              {r === 'DONOR' ? 'Donor' : r === 'NGO' ? 'NGO' : r === 'VOLUNTEER' ? 'Volunteer' : 'Admin'}
            </Link>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-1">
          {role === 'NGO' ? (
            <>
              <FormInput label="NGO Name" value={form.name||''} onChange={e => set('name',e.target.value)} error={errors.name}/>
              <FormInput label="Contact Person" value={form.contactPerson||''} onChange={e => set('contactPerson',e.target.value)}/>
            </>
          ) : (
            <FormInput label={role==='DONOR'?'Organization / Full Name':'Full Name'} value={form.name||''} onChange={e => set('name',e.target.value)} error={errors.name}/>
          )}

          <div className="grid grid-cols-2 gap-3">
            <FormInput label="Email" type="email" value={form.email||''} onChange={e => set('email',e.target.value)} error={errors.email}/>
            <FormInput label="Phone" value={form.phone||''} onChange={e => set('phone',e.target.value)} error={errors.phone}/>
          </div>

          {role !== 'ADMIN' && (
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Location</label>
              <div className="flex gap-2">
                <input type="text" className={`flex-1 px-4 py-3 text-sm rounded-2xl border bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent
                  ${errors.location ? 'border-red-400' : 'border-gray-200'}`}
                  value={form.location||''} onChange={e => set('location',e.target.value)} placeholder="Address" />
                <button type="button" onClick={() => set('location','123 Tech Park, Innovation City')}
                  className="px-3 py-2 text-xs bg-teal/10 text-teal rounded-xl border border-teal/20 font-semibold hover:bg-teal/20 whitespace-nowrap">
                  <i className="fas fa-location-crosshairs mr-1"></i>Current
                </button>
              </div>
              {errors.location && <p className="mt-1 text-xs text-red-600">{errors.location}</p>}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <FormInput label="Password" type="password" value={form.password||''} onChange={e => set('password',e.target.value)} error={errors.password}/>
            <FormInput label="Confirm Password" type="password" value={form.confirmPassword||''} onChange={e => set('confirmPassword',e.target.value)} error={errors.confirmPassword}/>
          </div>

          <Button type="submit" className="w-full py-3 text-sm mt-4">Create Account</Button>
        </form>

        <p className="text-center mt-5 text-sm text-gray-500">
          Already have an account?{' '}
          <Link to="/login" className="text-teal font-semibold hover:underline">Log in</Link>
        </p>
      </div>

      <Modal isOpen={showSuccess} onClose={() => {}} title="🎉 Account Created!">
        <div className="text-center py-2">
          <div className="w-16 h-16 bg-teal/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-circle-check text-3xl text-teal"></i>
          </div>
          <p className="text-gray-600 text-sm mb-6">{roleLabel} account created successfully. Head to your dashboard!</p>
          <Button onClick={() => navigate(`/${role.toLowerCase()}/dashboard`)} className="w-full">Go to Dashboard</Button>
        </div>
      </Modal>
    </AuthPanel>
  );
};
