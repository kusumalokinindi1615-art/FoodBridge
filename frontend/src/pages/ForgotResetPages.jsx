/* ─── FORGOT / RESET PASSWORD ──────────────────────────
   Forgot: enter email → backend emails a reset link (dev mode: link shown
   inline). Reset: /reset-password/:token → new password with eye toggle. */
import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/PublicUI';
import { FormInput } from '../components/PublicUI2';
import { authAPI } from '../api/api';
import { AuthPanel } from './AuthPages';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState(null); // { message, devResetUrl? }
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setError('');
    if (!email.trim()) { setError('Email is required'); return; }
    setSubmitting(true);
    try {
      setResult(await authAPI.forgotPassword(email.trim()));
    } catch (err) {
      setError(err?.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthPanel quote="Every meal shared is a life touched. Join FoodBridge today.">
      <div className="max-w-sm mx-auto">
        <h2 className="text-2xl font-extrabold text-gray-900 mb-1">Forgot password</h2>
        <p className="text-sm text-gray-400 mb-8">
          Enter your account email and we'll send you a reset link.
        </p>

        {result ? (
          <>
            <div className="text-sm rounded-xl px-4 py-2.5 border text-teal bg-teal/5 border-teal/20 mb-4">
              <i className="fas fa-circle-check mr-1.5"></i>{result.message}
            </div>

            {/* Dev-mode convenience: shown only when SMTP is not configured */}
            {result.devResetUrl && (
              <div className="text-xs rounded-xl px-4 py-3 border border-amber-200 bg-amber-50 mb-4">
                <p className="font-semibold text-amber-800 mb-1">
                  <i className="fas fa-flask mr-1"></i>Dev mode — SMTP not configured:
                </p>
                <a href={result.devResetUrl} className="text-teal font-semibold break-all hover:underline">
                  {result.devResetUrl}
                </a>
              </div>
            )}

            <Link to="/login" className="text-sm text-teal font-semibold hover:underline">
              <i className="fas fa-arrow-left mr-1.5"></i>Back to login
            </Link>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <FormInput
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              error={error}
            />
            <Button type="submit" className="w-full py-3 text-sm" disabled={submitting}>
              {submitting
                ? <><i className="fas fa-spinner fa-spin mr-2"></i>Sending…</>
                : <><i className="fas fa-paper-plane mr-2"></i>Send reset link</>}
            </Button>
            <p className="text-center mt-6 text-sm text-gray-500">
              Remembered it? <Link to="/login" className="text-teal font-semibold hover:underline">Back to login</Link>
            </p>
          </form>
        )}
      </div>
    </AuthPanel>
  );
};

export const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const e = {};
    if (!password) e.password = 'Password is required';
    else if (password.length < 8) e.password = 'Min 8 characters';
    if (password !== confirmPassword) e.confirmPassword = 'Passwords must match';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setServerError('');
    if (!validate()) return;
    setSubmitting(true);
    try {
      await authAPI.resetPassword(token, password);
      navigate('/login', {
        state: { flash: 'Password reset successful. Log in with your new password.' },
      });
    } catch (err) {
      setServerError(err?.response?.data?.message || 'Password reset failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthPanel quote="Every meal shared is a life touched. Join FoodBridge today.">
      <div className="max-w-sm mx-auto">
        <h2 className="text-2xl font-extrabold text-gray-900 mb-1">Set a new password</h2>
        <p className="text-sm text-gray-400 mb-8">Choose a strong password of at least 8 characters.</p>

        <form onSubmit={handleSubmit}>
          {/* Both fields get the shared eye toggle built into FormInput */}
          <FormInput
            label="New Password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            error={errors.password}
          />
          <FormInput
            label="Confirm New Password"
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            error={errors.confirmPassword}
          />

          {serverError && (
            <div className="mt-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
              <i className="fas fa-circle-exclamation mr-1.5"></i>{serverError}
            </div>
          )}

          <Button type="submit" className="w-full py-3 text-sm mt-2" disabled={submitting}>
            {submitting
              ? <><i className="fas fa-spinner fa-spin mr-2"></i>Resetting…</>
              : 'Reset Password'}
          </Button>
          <p className="text-center mt-6 text-sm text-gray-500">
            <Link to="/login" className="text-teal font-semibold hover:underline">
              <i className="fas fa-arrow-left mr-1.5"></i>Back to login
            </Link>
          </p>
        </form>
      </div>
    </AuthPanel>
  );
};
