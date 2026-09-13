import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import GoogleAuthModal from '../../components/GoogleAuthModal/GoogleAuthModal';
import CaptchaInput, { generateCaptchaCode } from '../../components/Captcha/CaptchaInput';
import './AuthExpert.css';

export default function Login() {
  const { login, demoLogin } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();
  const navigate = useNavigate();

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [capsLockActive, setCapsLockActive] = useState(false);

  // Captcha State
  const [captchaCode, setCaptchaCode] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaError, setCaptchaError] = useState('');

  // Status & Modal States
  const [unverifiedState, setUnverifiedState] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);

  useEffect(() => {
    refreshCaptcha();
  }, []);

  const refreshCaptcha = () => {
    setCaptchaCode(generateCaptchaCode());
    setCaptchaInput('');
    setCaptchaError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setCaptchaError('');
    setUnverifiedState(null);

    if (!email.trim() || !password.trim()) {
      setError('Please provide both your email address and password.');
      return;
    }

    // Verify Captcha
    if (captchaInput.trim().toUpperCase() !== captchaCode) {
      setCaptchaError('Security code does not match. Please try again.');
      refreshCaptcha();
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
      setLoading(false);
      navigate('/dashboard');
    } catch (err) {
      setLoading(false);
      refreshCaptcha();

      if (err.requiresVerification) {
        setUnverifiedState({
          email: err.email || email,
          previewCode: err.previewCode || null,
        });
        setError('Your email is not verified yet. Click below to verify.');
      } else {
        setError(err.message || 'Invalid email or password. Please try again.');
      }
    }
  };

  const handleDemoAccess = async () => {
    setLoading(true);
    setError('');
    try {
      await demoLogin();
      setLoading(false);
      navigate('/dashboard');
    } catch (err) {
      setError('Demo login failed. Please try manual login.');
      setLoading(false);
    }
  };

  return (
    <div className="expert-auth-page">
      {/* Soft Ambient Glows */}
      <div className="expert-ambient-sphere sphere-purple" />
      <div className="expert-ambient-sphere sphere-cyan" />
      <div className="expert-ambient-sphere sphere-blue" />

      <div className="expert-auth-container">
        {/* ================================================================= */}
        {/* LEFT COLUMN: VISUAL BRAND SHOWCASE                                */}
        {/* ================================================================= */}
        <div className="expert-showcase">
          {/* Top Branding Row */}
          <div className="expert-brand-row">
            <Link to="/" className="expert-logo-link">
              <div className="expert-logo-badge">
                <svg className="expert-logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                  <path d="M6 12v5c3 3 9 3 12 0v-5" />
                </svg>
              </div>
              <div className="expert-brand-text">
                <span className="expert-brand-name">Learnozi</span>
                <span className="expert-brand-tagline">Learn • Plan • Achieve</span>
              </div>
            </Link>

            {/* Handwritten Doodle Note */}
            <div className="expert-doodle-quote">
              <span>Better Learning</span>
              <span>Brighter Future</span>
              <div className="expert-doodle-swoosh" />
            </div>
          </div>

          {/* Hero Pill Badge */}
          <div className="expert-hero-badge">
            <span>✦</span>
            <span>YOUR AI-POWERED STUDY COMPANION</span>
          </div>

          {/* Main Headline */}
          <h1 className="expert-headline">
            Smart Learning
            <span className="headline-highlight">for a Brighter You</span>
          </h1>

          <p className="expert-subtext">
            Plan your study, get personalized AI help, revise with smart tools and achieve your academic goals — all in one place.
          </p>

          {/* 4 Feature Badges Grid */}
          <div className="expert-features-grid">
            <div className="feature-pill-card">
              <div className="feature-icon-box icon-purple">
                <span>✨</span>
              </div>
              <p className="feature-title">AI Explainer</p>
              <p className="feature-desc">Understand Faster</p>
            </div>

            <div className="feature-pill-card">
              <div className="feature-icon-box icon-blue">
                <span>📅</span>
              </div>
              <p className="feature-title">Smart Planner</p>
              <p className="feature-desc">Stay on Track</p>
            </div>

            <div className="feature-pill-card">
              <div className="feature-icon-box icon-green">
                <span>📑</span>
              </div>
              <p className="feature-title">Flashcards</p>
              <p className="feature-desc">Revise Smarter</p>
            </div>

            <div className="feature-pill-card">
              <div className="feature-icon-box icon-orange">
                <span>⏱️</span>
              </div>
              <p className="feature-title">Pomodoro</p>
              <p className="feature-desc">Focus Better</p>
            </div>
          </div>

          {/* 3D Workspace Scene Box with Floating Radial Progress */}
          <div className="expert-desk-wrapper">
            <img 
              src="/images/auth-desk-pure.jpg" 
              alt="Learnozi Smart Workspace" 
              className="expert-desk-img"
            />

            {/* Floating Circular Progress Card */}
            <div className="expert-floating-progress">
              <div className="progress-header-row">
                <span>Progress</span>
                <span>↗</span>
              </div>
              <div className="progress-circle-wrap">
                <svg width="38" height="38" viewBox="0 0 54 54">
                  <circle cx="27" cy="27" r="22" fill="none" stroke="#e2e8f0" strokeWidth="4.5" />
                  <circle 
                    cx="27" 
                    cy="27" 
                    r="22" 
                    fill="none" 
                    stroke="#0284c7" 
                    strokeWidth="4.5" 
                    strokeDasharray="138.2" 
                    strokeDashoffset="30.4" 
                    strokeLinecap="round" 
                  />
                </svg>
                <span className="progress-circle-text">78%</span>
              </div>
              <span className="progress-footer-note">↗ Keep going!</span>
            </div>
          </div>

          {/* Bottom Security Note */}
          <div className="expert-showcase-footer">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span>Secure • Fast • Always with you</span>
          </div>
        </div>

        {/* ================================================================= */}
        {/* RIGHT COLUMN: ELEVATED WHITE LOGIN FORM CARD                      */}
        {/* ================================================================= */}
        <div className="expert-form-card">
          {/* Top Bar: Switch to Signup & Language Toggle */}
          <div className="expert-form-toplink">
            <button 
              type="button" 
              onClick={toggleLanguage} 
              className="expert-lang-btn"
              title="Switch Urdu / English"
            >
              <span>🌐</span>
              <span>{language === 'en' ? 'اردو' : 'English'}</span>
            </button>

            <Link to="/signup" className="expert-nav-link">
              Don't have an account? <strong>Sign Up →</strong>
            </Link>
          </div>

          {/* Card Badge */}
          <div className="expert-card-badge">
            <span>👋</span>
            <span>Welcome Back</span>
          </div>

          {/* Title & Subtitle */}
          <h2 className="expert-card-title">
            Sign in to <span className="card-title-gradient">Learnozi</span>
          </h2>
          <p className="expert-card-subtitle">
            Continue your learning journey today. Welcome back!
          </p>

          {/* Quick Demo Access Pill */}
          <div className="expert-demo-pill">
            <div className="demo-pill-left">
              <span className="demo-pill-icon">⚡</span>
              <div className="demo-pill-text">
                <strong>Demo Student Account</strong>
                <span>One-click instant access to explore Learnozi</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDemoAccess}
              disabled={loading}
              className="btn-demo-action"
            >
              Instant Login →
            </button>
          </div>

          {/* Alert Messages */}
          {error && (
            <div className="expert-alert-box alert-error">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <div>
                <div>{error}</div>
                {unverifiedState && (
                  <button
                    type="button"
                    onClick={() => navigate(`/signup?step=verify&email=${encodeURIComponent(unverifiedState.email)}${unverifiedState.previewCode ? `&code=${unverifiedState.previewCode}` : ''}`)}
                    style={{ marginTop: '0.4rem', background: '#0284c7', color: '#fff', border: 'none', borderRadius: '6px', padding: '0.3rem 0.75rem', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Go to Verification Page →
                  </button>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="expert-auth-form">
            {/* Email Address */}
            <div className="expert-field-group">
              <label className="expert-label">Email Address *</label>
              <div className="expert-input-wrapper">
                <span className="expert-input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect width="20" height="16" x="2" y="4" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="expert-input-field"
                />
              </div>
            </div>

            {/* Password */}
            <div className="expert-field-group">
              <div className="expert-label">
                <span>Password *</span>
                <Link to="/forgot-password" className="expert-forgot-link">
                  Forgot Password?
                </Link>
              </div>
              <div className="expert-input-wrapper">
                <span className="expert-input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyUp={(e) => setCapsLockActive(e.getModifierState('CapsLock'))}
                  placeholder="Enter your password"
                  className="expert-input-field"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="expert-eye-btn"
                  tabIndex={-1}
                >
                  {showPassword ? '👁️' : '🔒'}
                </button>
              </div>
              {capsLockActive && (
                <span style={{ fontSize: '0.72rem', color: '#d97706', fontWeight: 600, marginTop: '0.2rem' }}>
                  ⚠️ Caps Lock is turned on
                </span>
              )}
            </div>

            {/* Captcha Verification */}
            <div className="expert-field-group" style={{ margin: '0.2rem 0' }}>
              <CaptchaInput
                captchaCode={captchaCode}
                captchaInput={captchaInput}
                onChangeCaptchaInput={(val) => {
                  setCaptchaInput(val);
                  if (captchaError) setCaptchaError('');
                }}
                onRefreshCaptcha={refreshCaptcha}
                error={captchaError}
              />
            </div>

            {/* Remember Me Checkbox */}
            <div className="expert-checkbox-row">
              <label className="expert-checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="expert-checkbox-input"
                />
                <span>Remember this device for 30 days</span>
              </label>
            </div>

            {/* Primary Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-expert-primary"
            >
              <span className="btn-sparkle-icon">✨</span>
              <span>{loading ? 'Signing in...' : 'Sign In'}</span>
              <span className="btn-arrow-icon">→</span>
            </button>

            {/* Divider */}
            <div className="expert-or-divider">
              <span>or</span>
            </div>

            {/* Google Sign-in Button */}
            <button
              type="button"
              onClick={() => setShowGoogleModal(true)}
              className="btn-expert-google"
            >
              <svg className="google-icon-svg" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Footnote Security Badge */}
            <div className="expert-security-note">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span>Your data is safe with us 🔒</span>
            </div>
          </form>
        </div>
      </div>

      {/* Google OAuth Modal */}
      {showGoogleModal && (
        <GoogleAuthModal
          onClose={() => setShowGoogleModal(false)}
          onSuccess={() => navigate('/dashboard')}
        />
      )}
    </div>
  );
}
