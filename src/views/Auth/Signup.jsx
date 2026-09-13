import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import GoogleAuthModal from '../../components/GoogleAuthModal/GoogleAuthModal';
import './AuthExpert.css';

export default function Signup() {
  const { register, verifyCode, resendCode } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Registration step: 'form' | 'verify'
  const [step, setStep] = useState(searchParams.get('step') === 'verify' ? 'verify' : 'form');

  // Form Fields matching official design
  const [name, setName] = useState('');
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [educationLevel, setEducationLevel] = useState('University');
  const [institution, setInstitution] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [interest, setInterest] = useState('Computer Science & IT');
  const [agreeTerms, setAgreeTerms] = useState(true);

  // Verification Step State
  const [verificationInput, setVerificationInput] = useState('');
  const [previewCode, setPreviewCode] = useState(searchParams.get('code') || '');
  const [resendTimer, setResendTimer] = useState(0);
  const [resendMsg, setResendMsg] = useState('');

  // Status & Modal States
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);

  // Timer countdown for resending verification code
  useEffect(() => {
    let timer;
    if (resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendTimer]);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError('Please fill in all required fields to create your account.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (!agreeTerms) {
      setError('Please agree to the Terms & Privacy Policy to proceed.');
      return;
    }

    setLoading(true);
    try {
      const res = await register({
        name: name.trim(),
        email: email.trim(),
        password,
        educationLevel,
        institution: institution.trim(),
        fieldOfStudy: interest,
        phoneNumber: phoneNumber.trim(),
      });

      setLoading(false);

      if (res?.requiresVerification) {
        setStep('verify');
        if (res.previewCode) {
          setPreviewCode(res.previewCode);
        }
        setResendTimer(60);
        setSuccessMsg(res.message || 'Verification passcode sent to your email.');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!verificationInput.trim()) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setLoading(true);
    try {
      await verifyCode(email, verificationInput.trim());
      setLoading(false);
      setSuccessMsg('🎉 Account verified! Redirecting to your dashboard...');
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    } catch (err) {
      setError(err.message || 'Invalid verification code. Please try again.');
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setError('');
    setResendMsg('');
    setLoading(true);

    try {
      const res = await resendCode(email);
      setLoading(false);
      setResendTimer(60);
      setResendMsg(res?.message || 'New verification passcode sent to your email.');
      if (res?.previewCode) {
        setPreviewCode(res.previewCode);
      }
    } catch (err) {
      setError(err.message || 'Failed to resend code.');
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
        {/* RIGHT COLUMN: ELEVATED WHITE SIGNUP FORM CARD                     */}
        {/* ================================================================= */}
        <div className="expert-form-card">
          {/* Top Bar: Switch to Login & Language Toggle */}
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

            <Link to="/login" className="expert-nav-link">
              Already have an account? <strong>Login →</strong>
            </Link>
          </div>

          {step === 'form' ? (
            <>
              {/* Card Badge */}
              <div className="expert-card-badge">
                <span>👤</span>
                <span>Create Your Account</span>
              </div>

              {/* Title & Subtitle */}
              <h2 className="expert-card-title">
                Join <span className="card-title-gradient">Learnozi</span>
              </h2>
              <p className="expert-card-subtitle">
                Start your learning journey today. It only takes a minute!
              </p>

              {/* Alert Messages */}
              {error && (
                <div className="expert-alert-box alert-error">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSignup} className="expert-auth-form">
                {/* Full Name */}
                <div className="expert-field-group">
                  <label className="expert-label">Full Name *</label>
                  <div className="expert-input-wrapper">
                    <span className="expert-input-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your full name"
                      className="expert-input-field"
                    />
                  </div>
                </div>

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

                {/* Password & Confirm Password (2 Columns) */}
                <div className="expert-fields-grid-2">
                  <div className="expert-field-group">
                    <label className="expert-label">Password *</label>
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
                        placeholder="Create a strong password"
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
                  </div>

                  <div className="expert-field-group">
                    <label className="expert-label">Confirm Password *</label>
                    <div className="expert-input-wrapper">
                      <span className="expert-input-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                      </span>
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter your password"
                        className="expert-input-field"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="expert-eye-btn"
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? '👁️' : '🔒'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Education Level (Dropdown) */}
                <div className="expert-field-group">
                  <label className="expert-label">Education Level *</label>
                  <div className="expert-input-wrapper">
                    <span className="expert-input-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                        <path d="M6 12v5c3 3 9 3 12 0v-5" />
                      </svg>
                    </span>
                    <select
                      value={educationLevel}
                      onChange={(e) => setEducationLevel(e.target.value)}
                      className="expert-input-field expert-select-field"
                    >
                      <option value="School">School (Matric / O-Levels / 9th-10th)</option>
                      <option value="College">College / High School (FSc / A-Levels / 11th-12th)</option>
                      <option value="University">University (Undergraduate / Bachelors)</option>
                      <option value="Postgraduate">Postgraduate (Masters / PhD)</option>
                      <option value="Self-Learner">Self-Learner / Professional</option>
                    </select>
                    <span className="expert-select-chevron">▼</span>
                  </div>
                </div>

                {/* Institution / University */}
                <div className="expert-field-group">
                  <label className="expert-label">Institution / University *</label>
                  <div className="expert-input-wrapper">
                    <span className="expert-input-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 21h18" />
                        <path d="M5 21V7l7-4 7 4v14" />
                        <path d="M9 10h.01" />
                        <path d="M9 14h.01" />
                        <path d="M15 10h.01" />
                        <path d="M15 14h.01" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      value={institution}
                      onChange={(e) => setInstitution(e.target.value)}
                      placeholder="e.g. NUST / FAST / Oxford"
                      className="expert-input-field"
                    />
                  </div>
                </div>

                {/* Phone Number & Select Your Interests (2 Columns) */}
                <div className="expert-fields-grid-2">
                  <div className="expert-field-group">
                    <label className="expert-label">Phone Number (Optional)</label>
                    <div className="expert-input-wrapper">
                      <span className="expert-input-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                        </svg>
                      </span>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="+92 300 1234567"
                        className="expert-input-field"
                      />
                    </div>
                  </div>

                  <div className="expert-field-group">
                    <label className="expert-label">Select Your Interests</label>
                    <div className="expert-input-wrapper">
                      <span className="expert-input-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <circle cx="12" cy="12" r="6" />
                          <circle cx="12" cy="12" r="2" />
                        </svg>
                      </span>
                      <select
                        value={interest}
                        onChange={(e) => setInterest(e.target.value)}
                        className="expert-input-field expert-select-field"
                      >
                        <option value="Computer Science & IT">Computer Science & IT</option>
                        <option value="Medical & Pre-Med">Medical & Pre-Med</option>
                        <option value="Engineering & Math">Engineering & Math</option>
                        <option value="Business & Finance">Business & Finance</option>
                        <option value="General Studies">General Studies & Arts</option>
                      </select>
                      <span className="expert-select-chevron">▼</span>
                    </div>
                  </div>
                </div>

                {/* Terms Agreement Checkbox */}
                <div className="expert-checkbox-row">
                  <label className="expert-checkbox-label">
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="expert-checkbox-input"
                    />
                    <span>
                      I agree to the <a href="#terms" onClick={(e) => { e.preventDefault(); alert('Learnozi Terms & Privacy Policy: We prioritize your privacy and data security.'); }} className="expert-terms-link">Terms & Privacy Policy</a>
                    </span>
                  </label>
                </div>

                {/* Primary Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-expert-primary"
                >
                  <span className="btn-sparkle-icon">✨</span>
                  <span>{loading ? 'Creating Account...' : 'Create Account'}</span>
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
            </>
          ) : (
            /* ============================================================= */
            /* STEP 2: PASSCODE VERIFICATION VIEW                            */
            /* ============================================================= */
            <div className="verify-passcode-box">
              <div className="verify-icon-wrap">
                <span>✉️</span>
              </div>
              <h2 className="expert-card-title">Verify Your Email</h2>
              <p className="expert-card-subtitle">
                We sent a 6-digit verification code to <strong>{email}</strong>.
              </p>

              {previewCode && (
                <div className="verify-helper-badge">
                  <span>Demo Dev Passcode: <strong>{previewCode}</strong></span>
                </div>
              )}

              {error && (
                <div className="expert-alert-box alert-error">
                  <span>{error}</span>
                </div>
              )}

              {successMsg && (
                <div className="expert-alert-box alert-success">
                  <span>{successMsg}</span>
                </div>
              )}

              <form onSubmit={handleVerifyCode} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
                <input
                  type="text"
                  maxLength={6}
                  value={verificationInput}
                  onChange={(e) => setVerificationInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••••"
                  className="verify-input-field"
                  autoFocus
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-expert-primary"
                  style={{ maxWidth: '280px' }}
                >
                  <span>{loading ? 'Verifying...' : 'Verify & Continue'}</span>
                  <span className="btn-arrow-icon">→</span>
                </button>
              </form>

              <div style={{ marginTop: '1rem', fontSize: '0.82rem', color: '#64748b' }}>
                Didn't receive the code?{' '}
                {resendTimer > 0 ? (
                  <span style={{ fontWeight: 700, color: '#4f46e5' }}>Resend in {resendTimer}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    style={{ background: 'none', border: 'none', color: '#4f46e5', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                  >
                    Resend Code
                  </button>
                )}
              </div>
            </div>
          )}
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
