import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import GoogleAuthModal from '../../components/GoogleAuthModal/GoogleAuthModal';
import './SignupMinimal.css';

export default function Signup() {
  const { register, verifyCode, resendCode } = useAuth();
  const { language, toggleLanguage } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Registration step: 'form' | 'verify'
  const [step, setStep] = useState(searchParams.get('step') === 'verify' ? 'verify' : 'form');

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [educationLevel, setEducationLevel] = useState('University');
  const [institution, setInstitution] = useState('');
  const [interest, setInterest] = useState('Computer Science & IT');
  const [agreeTerms, setAgreeTerms] = useState(true);

  // Verification Step State
  const [verificationInput, setVerificationInput] = useState('');
  const [previewCode, setPreviewCode] = useState(searchParams.get('code') || '');
  const [resendTimer, setResendTimer] = useState(0);

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
      setError('Please fill in all required fields.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please double-check.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (!agreeTerms) {
      setError('Please agree to the Terms & Privacy Policy.');
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
      });

      setLoading(false);

      if (res?.requiresVerification) {
        setStep('verify');
        if (res.previewCode) {
          setPreviewCode(res.previewCode);
        }
        setResendTimer(60);
        setSuccessMsg(res.message || 'Verification code sent to your email.');
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
      setSuccessMsg('🎉 Account verified! Redirecting to dashboard...');
      setTimeout(() => {
        navigate('/dashboard');
      }, 800);
    } catch (err) {
      setError(err.message || 'Invalid verification code. Please try again.');
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setError('');
    setLoading(true);

    try {
      const res = await resendCode(email);
      setLoading(false);
      setResendTimer(60);
      setSuccessMsg(res?.message || 'New verification code sent to your email.');
      if (res?.previewCode) {
        setPreviewCode(res.previewCode);
      }
    } catch (err) {
      setError(err.message || 'Failed to resend code.');
      setLoading(false);
    }
  };

  return (
    <div className="minimal-signup-page">
      {/* Ambient Cosmic Background Glows */}
      <div className="minimal-ambient-glow signup-glow-1" />
      <div className="minimal-ambient-glow signup-glow-2" />
      <div className="minimal-ambient-glow signup-glow-3" />

      {/* Grid Mesh */}
      <div className="minimal-grid-overlay" />

      {/* Top Bar Language Switcher */}
      <div className="minimal-signup-top-bar">
        <button
          type="button"
          onClick={toggleLanguage}
          className="minimal-lang-btn"
          title="Switch Language"
        >
          <span>🌐</span>
          <span>{language === 'en' ? 'اردو' : 'English'}</span>
        </button>
      </div>

      {/* Main Centered Frosted Glass Card */}
      <div className="minimal-signup-card">
        {step === 'form' ? (
          <>
            {/* Header */}
            <div className="signup-card-header">
              <Link to="/" style={{ textDecoration: 'none', display: 'inline-block' }}>
                <div className="signup-badge-wrap">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                    <path d="M6 12v5c3 3 9 3 12 0v-5" />
                  </svg>
                </div>
              </Link>
              <h1 className="signup-title">Create your account</h1>
              <p className="signup-subtitle">Join thousands of students studying smarter with AI</p>
            </div>

            {/* Quick Google Sign-In */}
            <button
              type="button"
              onClick={() => setShowGoogleModal(true)}
              className="btn-signup-google"
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
            <div className="signup-divider">
              <span>or sign up with email</span>
            </div>

            {/* Alerts */}
            {error && (
              <div className="signup-alert error mb-2">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Registration Form */}
            <form onSubmit={handleSignup} className="signup-form">
              {/* Row 1: Full Name & Email */}
              <div className="signup-grid-2">
                <div className="signup-field-wrap">
                  <label className="signup-label">Full Name *</label>
                  <div className="signup-input-box">
                    <span className="signup-input-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      className="signup-input"
                      placeholder="Ahmad Khan"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="signup-field-wrap">
                  <label className="signup-label">Email Address *</label>
                  <div className="signup-input-box">
                    <span className="signup-input-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                    </span>
                    <input
                      type="email"
                      className="signup-input"
                      placeholder="student@univ.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Row 2: Password & Confirm Password */}
              <div className="signup-grid-2">
                <div className="signup-field-wrap">
                  <label className="signup-label">Password *</label>
                  <div className="signup-input-box">
                    <span className="signup-input-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="signup-input"
                      placeholder="Min 6 chars"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="signup-eye-btn"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                </div>

                <div className="signup-field-wrap">
                  <label className="signup-label">Confirm Password *</label>
                  <div className="signup-input-box">
                    <span className="signup-input-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </span>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      className="signup-input"
                      placeholder="Re-type password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="signup-eye-btn"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Row 3: Education Level & Institution */}
              <div className="signup-grid-2">
                <div className="signup-field-wrap">
                  <label className="signup-label">Education Level</label>
                  <select
                    className="signup-select"
                    value={educationLevel}
                    onChange={(e) => setEducationLevel(e.target.value)}
                  >
                    <option value="University">University / College</option>
                    <option value="FSc / A-Levels">FSc / Intermediate / A-Levels</option>
                    <option value="Matric / O-Levels">Matric / O-Levels</option>
                    <option value="Self-Taught">Self-Taught / Professional</option>
                  </select>
                </div>

                <div className="signup-field-wrap">
                  <label className="signup-label">Institution / University</label>
                  <div className="signup-input-box">
                    <span className="signup-input-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 21h18M3 7v14M21 7v14M6 7V3h12v4" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      className="signup-input"
                      placeholder="e.g. NUST, FAST, Punjab Univ"
                      value={institution}
                      onChange={(e) => setInstitution(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Row 4: Field of Study / Interest */}
              <div className="signup-field-wrap">
                <label className="signup-label">Primary Field of Study</label>
                <select
                  className="signup-select"
                  value={interest}
                  onChange={(e) => setInterest(e.target.value)}
                >
                  <option value="Computer Science & IT">💻 Computer Science & Software Engineering</option>
                  <option value="Pre-Medical & Health Sciences">🩺 Pre-Medical & Biology</option>
                  <option value="Engineering (Electrical / Mechanical)">⚡ Engineering & Physical Sciences</option>
                  <option value="Business, Economics & Finance">📊 Business, Finance & Economics</option>
                  <option value="General & High School Studies">📚 General Science & Humanities</option>
                </select>
              </div>

              {/* Terms Checkbox */}
              <div className="signup-terms-row">
                <input
                  type="checkbox"
                  id="agreeTerms"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                />
                <label htmlFor="agreeTerms">
                  I agree to Learnozi <Link to="/" style={{ color: '#818cf8' }}>Terms</Link> & <Link to="/" style={{ color: '#818cf8' }}>Privacy Policy</Link>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="btn-signup-primary"
                disabled={loading}
              >
                <span>{loading ? 'Creating Account...' : 'Create Free Account'}</span>
                <span>→</span>
              </button>
            </form>

            {/* Footer */}
            <div className="signup-card-footer">
              <span>Already have an account?</span>
              <Link to="/login" className="signup-login-link">
                Sign In →
              </Link>
            </div>
          </>
        ) : (
          /* ============================================================== */
          /* STEP 2: SLEEK 6-DIGIT EMAIL VERIFICATION VIEW                  */
          /* ============================================================== */
          <div className="verify-compact-box">
            <div className="verify-badge-icon">
              <span>✉️</span>
            </div>
            <h2 className="signup-title">Verify Your Email</h2>
            <p className="signup-subtitle" style={{ maxWidth: '380px', margin: '0.4rem 0 0.8rem' }}>
              We sent a 6-digit passcode to <strong style={{ color: '#ffffff' }}>{email}</strong>
            </p>

            {previewCode && (
              <div
                className="verify-helper-pill"
                onClick={() => setVerificationInput(previewCode)}
                title="Click to auto-fill"
              >
                <span>Dev Passcode: <strong>{previewCode}</strong> (Click to auto-fill)</span>
              </div>
            )}

            {error && (
              <div className="signup-alert error mb-2" style={{ width: '100%', maxWidth: '320px' }}>
                <span>⚠️ {error}</span>
              </div>
            )}

            {successMsg && (
              <div className="signup-alert success mb-2" style={{ width: '100%', maxWidth: '320px' }}>
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleVerifyCode} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <input
                type="text"
                maxLength={6}
                value={verificationInput}
                onChange={(e) => setVerificationInput(e.target.value.replace(/\D/g, ''))}
                placeholder="••••••"
                className="verify-code-input"
                autoFocus
              />

              <button
                type="submit"
                className="btn-signup-primary"
                style={{ maxWidth: '280px' }}
                disabled={loading || verificationInput.length < 6}
              >
                <span>{loading ? 'Verifying...' : 'Verify & Enter Learnozi 🚀'}</span>
              </button>
            </form>

            <div style={{ marginTop: '1.25rem', fontSize: '0.82rem', color: '#94a3b8' }}>
              Didn't receive code?{' '}
              {resendTimer > 0 ? (
                <span style={{ fontWeight: 700, color: '#818cf8' }}>Resend in {resendTimer}s</span>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  style={{ background: 'none', border: 'none', color: '#818cf8', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                >
                  Resend Code
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setStep('form')}
              style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.8rem', marginTop: '0.75rem', cursor: 'pointer' }}
            >
              ← Edit Email
            </button>
          </div>
        )}
      </div>

      {/* Google OAuth Modal */}
      <GoogleAuthModal
        isOpen={showGoogleModal}
        onClose={() => setShowGoogleModal(false)}
      />
    </div>
  );
}
