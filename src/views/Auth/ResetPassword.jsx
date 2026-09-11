import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import Auth3DLayout from './Auth3DLayout';
import './Auth.css';
import { API_URL } from '../../config';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { setAuthSession } = useAuth();
  const { t } = useLanguage();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!password || !confirmPassword) {
      setError('Please fill in both password fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify.');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/auth/reset-password/${token}`, { password });
      setSuccess(true);
      if (res.data.token && res.data.user) {
        setAuthSession(res.data.token, res.data.user);
        setTimeout(() => {
          navigate('/dashboard');
        }, 1800);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Password reset failed. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = () => {
    if (!password) return { label: '', percent: '0%', color: 'transparent' };
    if (password.length >= 10 && /[A-Z]/.test(password) && /[0-9]/.test(password)) {
      return { label: 'Strong Password 💪', percent: '100%', color: '#10b981' };
    }
    if (password.length >= 6) {
      return { label: 'Good Password 👍', percent: '65%', color: '#f59e0b' };
    }
    return { label: 'Weak (Min 6 chars)', percent: '30%', color: '#ef4444' };
  };

  const strength = getPasswordStrength();

  return (
    <Auth3DLayout>
      <div className="auth-3d-header">
        <h1 className="auth-3d-title">Set New Password</h1>
        <p className="auth-3d-subtitle">
          {success
            ? 'Password updated successfully! Redirecting...'
            : 'Choose a strong and secure password for your account'}
        </p>
      </div>

      {error && (
        <div className="auth-3d-alert-error">
          <span>⚠️ {error}</span>
        </div>
      )}

      {success ? (
        <div className="text-center mt-4">
          <div style={{ fontSize: '3rem', margin: '1rem 0' }}>🎉</div>
          <h3 style={{ fontSize: '1.25rem', color: '#16a34a', fontWeight: 700, margin: '0 0 0.5rem 0' }}>
            Password Reset Successfully!
          </h3>
          <p style={{ color: '#4b5563', fontSize: '0.92rem', lineHeight: '1.6' }}>
            Your password has been changed. Taking you to your study dashboard...
          </p>
          <div style={{ marginTop: '1.5rem' }}>
            <Link to="/dashboard" className="btn-3d btn-3d-primary" style={{ display: 'block', textDecoration: 'none' }}>
              Go to Dashboard Now →
            </Link>
          </div>
        </div>
      ) : (
        <form className="auth-3d-form" onSubmit={handleSubmit} noValidate>
          {/* New Password */}
          <div className="form-3d-group">
            <label className="form-3d-label">New Password</label>
            <div className="input-3d-wrapper">
              <span className="input-3d-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                className="input-3d-field"
                placeholder="Enter new password (min 6 chars)"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                required
              />
              <button
                type="button"
                className="input-3d-eye-btn"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Hide Password' : 'Show Password'}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
            </div>
            {password && (
              <div className="password-strength-wrapper mt-2">
                <div className="strength-bar-bg">
                  <div className="strength-bar-fill" style={{ width: strength.percent, background: strength.color }} />
                </div>
                <span className="strength-label" style={{ color: strength.color }}>{strength.label}</span>
              </div>
            )}
          </div>

          {/* Confirm New Password */}
          <div className="form-3d-group">
            <label className="form-3d-label">Confirm New Password</label>
            <div className="input-3d-wrapper">
              <span className="input-3d-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </span>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                className="input-3d-field"
                placeholder="Confirm your new password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                required
              />
              <button
                type="button"
                className="input-3d-eye-btn"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                title={showConfirmPassword ? 'Hide Password' : 'Show Password'}
              >
                {showConfirmPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn-3d btn-3d-primary mt-2"
            disabled={loading}
          >
            {loading ? 'Updating Password...' : 'Save & Reset Password'}
          </button>

          <div className="auth-3d-footer mt-4">
            <p>Remember your password? <Link to="/login" className="link-3d-signup">Back to Login</Link></p>
          </div>
        </form>
      )}
    </Auth3DLayout>
  );
}
