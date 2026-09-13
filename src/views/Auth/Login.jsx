import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import GoogleAuthModal from '../../components/GoogleAuthModal/GoogleAuthModal';
import './LoginMinimal.css';

export default function Login() {
  const { login } = useAuth();
  const { language, toggleLanguage } = useLanguage();
  const navigate = useNavigate();

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [capsLockActive, setCapsLockActive] = useState(false);

  // Status & Modal States
  const [unverifiedState, setUnverifiedState] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);

  const handleKeyUp = (e) => {
    if (e.getModifierState) {
      setCapsLockActive(e.getModifierState('CapsLock'));
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setUnverifiedState(null);

    if (!email.trim() || !password.trim()) {
      setError('Please provide both your email address and password.');
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
      setLoading(false);
      navigate('/dashboard');
    } catch (err) {
      setLoading(false);
      if (err.requiresVerification) {
        setUnverifiedState({
          email: err.email || email,
          previewCode: err.previewCode || null,
        });
        setError('Your email is not verified yet. Please click below to verify.');
      } else {
        setError(err.message || 'Invalid email or password. Please try again.');
      }
    }
  };


  return (
    <div className="minimal-auth-page">
      {/* Dynamic Ambient Cosmic Glow Orbs */}
      <div className="minimal-ambient-glow glow-top-left" />
      <div className="minimal-ambient-glow glow-bottom-right" />
      <div className="minimal-ambient-glow glow-center" />
      <div className="minimal-ambient-glow glow-accent-4" />

      {/* Animated Aurora Wave Ribbon */}
      <div className="minimal-aurora-ribbon" />

      {/* Floating Stardust Particles */}
      <div className="cosmic-particles-wrap" aria-hidden="true">
        <span className="cosmic-dot dot-1" />
        <span className="cosmic-dot dot-2" />
        <span className="cosmic-dot dot-3" />
        <span className="cosmic-dot dot-4" />
        <span className="cosmic-dot dot-5" />
        <span className="cosmic-dot dot-6" />
        <span className="cosmic-dot dot-7" />
        <span className="cosmic-dot dot-8" />
        <span className="cosmic-dot dot-9" />
        <span className="cosmic-dot dot-10" />
      </div>

      {/* Subtle Mesh Grid */}
      <div className="minimal-grid-overlay" />

      {/* Top Controls: Language Switch */}
      <div className="minimal-top-controls">
        <button
          type="button"
          onClick={toggleLanguage}
          className="minimal-lang-pill"
          title="Switch Language"
        >
          <span>🌐</span>
          <span>{language === 'en' ? 'اردو' : 'English'}</span>
        </button>
      </div>

      {/* Main Centered Frosted Glass Card */}
      <div className="minimal-auth-card">
        {/* Header Branding */}
        <div className="minimal-card-header">
          <Link to="/" style={{ textDecoration: 'none', display: 'inline-block' }}>
            <div className="minimal-brand-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c3 3 9 3 12 0v-5" />
              </svg>
            </div>
          </Link>
          <h1 className="minimal-title">Welcome back</h1>
          <p className="minimal-subtitle">Sign in to access your study planner, AI explainer, and notes</p>
        </div>

        {/* Google Quick Sign-In */}
        <button
          type="button"
          onClick={() => setShowGoogleModal(true)}
          className="btn-minimal-google"
        >
          <svg className="google-icon-svg" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          <span>Continue with Google</span>
        </button>

        {/* Divider */}
        <div className="minimal-divider">
          <span>or sign in with email</span>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="minimal-alert error mb-3">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Unverified Account Banner */}
        {unverifiedState && (
          <div className="minimal-unverified-box">
            <span>Account pending email verification ({unverifiedState.email}).</span>
            <button
              type="button"
              className="minimal-unverified-btn"
              onClick={() => navigate(`/signup?step=verify&email=${encodeURIComponent(unverifiedState.email)}&code=${unverifiedState.previewCode || ''}`)}
            >
              Verify Email Now →
            </button>
          </div>
        )}

        {/* Main Email/Password Form */}
        <form onSubmit={handleLogin} className="minimal-form">
          {/* Email Field */}
          <div className="minimal-field-group">
            <label className="minimal-label">Email Address</label>
            <div className="minimal-input-box">
              <span className="minimal-input-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </span>
              <input
                type="email"
                className="minimal-input"
                placeholder="student@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="minimal-field-group">
            <label className="minimal-label">Password</label>
            <div className="minimal-input-box">
              <span className="minimal-input-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                className="minimal-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyUp={handleKeyUp}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="minimal-eye-btn"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            {capsLockActive && (
              <span className="minimal-caps-warning">
                ⚠️ Caps Lock is active
              </span>
            )}
          </div>

          {/* Options Row: Remember Me & Forgot Password */}
          <div className="minimal-options-row">
            <label className="minimal-checkbox-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>Remember me</span>
            </label>
            <Link to="/forgot-password" className="minimal-forgot-link">
              Forgot password?
            </Link>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn-minimal-primary"
            disabled={loading}
          >
            <span>{loading ? 'Signing In...' : 'Sign In to Learnozi'}</span>
            <span style={{ fontSize: '1.1rem' }}>→</span>
          </button>
        </form>

        {/* Card Footer: Switch to Signup */}
        <div className="minimal-card-footer">
          <span>Don't have an account?</span>
          <Link to="/signup" className="minimal-signup-link">
            Create an account →
          </Link>
        </div>
      </div>

      {/* Interactive Google Auth Modal */}
      <GoogleAuthModal
        isOpen={showGoogleModal}
        onClose={() => setShowGoogleModal(false)}
      />
    </div>
  );
}
