import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import Auth3DLayout from './Auth3DLayout';
import GoogleAuthModal from '../../components/GoogleAuthModal/GoogleAuthModal';
import CaptchaInput, { generateCaptchaCode } from '../../components/Captcha/CaptchaInput';
import './Auth.css';

export default function Signup() {
  const { register, verifyCode, resendCode, demoLogin } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Registration step: 'form' | 'verify'
  const [step, setStep] = useState(searchParams.get('step') === 'verify' ? 'verify' : 'form');

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [educationLevel, setEducationLevel] = useState('University');
  const [institution, setInstitution] = useState('');
  const [fieldOfStudy, setFieldOfStudy] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);

  // Captcha State
  const [captchaCode, setCaptchaCode] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaError, setCaptchaError] = useState('');

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

  // Initialize Captcha
  useEffect(() => {
    refreshCaptcha();
  }, []);

  // Timer countdown for resending code
  useEffect(() => {
    let timer;
    if (resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendTimer]);

  const refreshCaptcha = () => {
    setCaptchaCode(generateCaptchaCode());
    setCaptchaInput('');
    setCaptchaError('');
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setCaptchaError('');

    if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError('Please fill in all required student details.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    // Verify Captcha
    if (captchaInput.trim().toUpperCase() !== captchaCode) {
      setCaptchaError('Captcha code does not match. Please try again.');
      refreshCaptcha();
      return;
    }

    if (!agreeTerms) {
      setError('Please accept the Terms of Service to continue.');
      return;
    }

    setLoading(true);
    try {
      const res = await register({
        name,
        email,
        password,
        educationLevel,
        institution,
        fieldOfStudy,
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
      refreshCaptcha();
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
      }, 1200);
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
      if (res.previewCode) {
        setPreviewCode(res.previewCode);
      }
      setResendTimer(60);
      setResendMsg('✅ A fresh verification code has been sent to your email.');
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Failed to resend verification code.');
    }
  };

  const handleDemoAccess = () => {
    setLoading(true);
    setTimeout(() => {
      demoLogin();
      setLoading(false);
      navigate('/dashboard');
    }, 300);
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
      {step === 'form' ? (
        <>
          <div className="auth-3d-header">
            <h1 className="auth-3d-title">Student Registration</h1>
            <p className="auth-3d-subtitle">Join Learnozi to supercharge your study with AI</p>
          </div>

          {error && (
            <div className="auth-3d-alert-error">
              <span>⚠️ {error}</span>
            </div>
          )}

          {/* Demo Quick Access Box */}
          <div className="demo-3d-box">
            <div className="demo-3d-badge">
              <span>{t('auth.demo_badge')}</span>
            </div>
            <p>{t('auth.demo_sub')}</p>
            <button
              type="button"
              className="btn-3d btn-3d-demo"
              onClick={handleDemoAccess}
              disabled={loading}
            >
              {t('auth.demo_btn')}
            </button>
          </div>

          <form className="auth-3d-form" onSubmit={handleSignup} noValidate>
            {/* Full name */}
            <div className="form-3d-group">
              <label className="form-3d-label">Full Name *</label>
              <div className="input-3d-wrapper">
                <span className="input-3d-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </span>
                <input
                  type="text"
                  className="input-3d-field"
                  placeholder="e.g. Ahmad Khan"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setError(''); }}
                  required
                />
              </div>
            </div>

            {/* Email address */}
            <div className="form-3d-group">
              <label className="form-3d-label">Student Email *</label>
              <div className="input-3d-wrapper">
                <span className="input-3d-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                </span>
                <input
                  type="email"
                  className="input-3d-field"
                  placeholder="student@example.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  required
                />
              </div>
            </div>

            {/* Academic Info Row: Education Level & Institution */}
            <div className="form-3d-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div className="form-3d-group" style={{ margin: 0 }}>
                <label className="form-3d-label">Education Level</label>
                <div className="input-3d-wrapper">
                  <select
                    className="input-3d-field input-3d-select"
                    value={educationLevel}
                    onChange={(e) => setEducationLevel(e.target.value)}
                    style={{ paddingLeft: '12px' }}
                  >
                    <option value="University">University</option>
                    <option value="College">College</option>
                    <option value="High School">High School</option>
                    <option value="Postgraduate">Postgraduate</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="form-3d-group" style={{ margin: 0 }}>
                <label className="form-3d-label">Institution / University</label>
                <div className="input-3d-wrapper">
                  <input
                    type="text"
                    className="input-3d-field"
                    placeholder="e.g. NUST / FAST"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    style={{ paddingLeft: '12px' }}
                  />
                </div>
              </div>
            </div>

            {/* Password */}
            <div className="form-3d-group">
              <label className="form-3d-label">{t('auth.password')} *</label>
              <div className="input-3d-wrapper">
                <span className="input-3d-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input-3d-field"
                  placeholder="Min 6 characters"
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
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                </button>
              </div>

              {/* Password strength meter */}
              {password && (
                <div className="password-strength-container">
                  <div className="password-strength-bar">
                    <div
                      className="password-strength-fill"
                      style={{ width: strength.percent, backgroundColor: strength.color }}
                    ></div>
                  </div>
                  <span className="password-strength-text" style={{ color: strength.color }}>
                    {strength.label}
                  </span>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="form-3d-group">
              <label className="form-3d-label">{t('auth.confirm_password')} *</label>
              <div className="input-3d-wrapper">
                <span className="input-3d-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  </svg>
                </span>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="input-3d-field"
                  placeholder="Repeat your password"
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
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Captcha Verification Widget */}
            <CaptchaInput
              value={captchaInput}
              onChange={setCaptchaInput}
              captchaCode={captchaCode}
              onRefresh={refreshCaptcha}
              error={captchaError}
              label="Anti-Bot Security Captcha"
            />

            {/* Terms checkbox */}
            <div className="checkbox-3d-wrapper" style={{ marginTop: '8px' }}>
              <label className="checkbox-3d-label">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="checkbox-3d-input"
                  required
                />
                <span className="checkbox-3d-custom"></span>
                <span className="checkbox-3d-text">
                  I agree to the <a href="#terms" className="link-terms">Terms</a> & <a href="#privacy" className="link-terms">Privacy Policy</a>
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="btn-3d btn-3d-primary"
              disabled={loading}
              style={{ marginTop: '12px' }}
            >
              {loading ? 'Sending Verification Passcode...' : 'Register as Student ✉️'}
            </button>
          </form>

          {/* Divider */}
          <div className="auth-3d-divider">
            <span>{t('auth.or')}</span>
          </div>

          {/* Social OAuth Buttons */}
          <div className="social-3d-buttons">
            <button
              type="button"
              className="btn-3d btn-3d-social btn-3d-google"
              onClick={() => setShowGoogleModal(true)}
            >
              <svg className="social-icon" width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>{t('auth.continue_google')}</span>
            </button>
          </div>

          {/* Footer link */}
          <div className="auth-3d-footer">
            <p>Already have an account? <Link to="/login" className="link-3d-signup">{t('auth.sign_in')}</Link></p>
          </div>
        </>
      ) : (
        /* STEP 2: EMAIL VERIFICATION SCREEN */
        <>
          <div className="auth-3d-header">
            <div className="auth-verify-icon-badge">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
            </div>
            <h1 className="auth-3d-title">Verify Your Email</h1>
            <p className="auth-3d-subtitle">
              We sent a 6-digit verification passcode to:<br />
              <strong style={{ color: '#38bdf8' }}>{email}</strong>
            </p>
          </div>

          {error && (
            <div className="auth-3d-alert-error">
              <span>⚠️ {error}</span>
            </div>
          )}

          {successMsg && (
            <div className="auth-3d-alert-success" style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', padding: '10px 14px', borderRadius: '8px', fontSize: '0.86rem', marginBottom: '14px' }}>
              <span>{successMsg}</span>
            </div>
          )}

          {resendMsg && (
            <div className="auth-3d-alert-info" style={{ background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.3)', color: '#38bdf8', padding: '10px 14px', borderRadius: '8px', fontSize: '0.86rem', marginBottom: '14px' }}>
              <span>{resendMsg}</span>
            </div>
          )}

          {/* Dev / Test Mailbox preview box for convenience */}
          {previewCode && (
            <div className="dev-mail-preview-box" style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px dashed #6366f1', borderRadius: '10px', padding: '12px 14px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#818cf8', fontWeight: 600 }}>
                  📬 Student Mailbox Passcode
                </span>
                <button
                  type="button"
                  onClick={() => setVerificationInput(previewCode)}
                  style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '0.72rem', padding: '2px 8px', cursor: 'pointer', fontWeight: 600 }}
                >
                  Auto-fill
                </button>
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '4px', color: '#38bdf8', fontFamily: 'monospace' }}>
                {previewCode}
              </div>
            </div>
          )}

          <form className="auth-3d-form" onSubmit={handleVerifyCode}>
            <div className="form-3d-group">
              <label className="form-3d-label" style={{ textAlign: 'center', display: 'block' }}>
                Enter 6-Digit Passcode
              </label>
              <div className="input-3d-wrapper">
                <input
                  type="text"
                  className="input-3d-field"
                  placeholder="• • • • • •"
                  maxLength={6}
                  value={verificationInput}
                  onChange={(e) => {
                    setVerificationInput(e.target.value.replace(/\D/g, ''));
                    setError('');
                  }}
                  style={{ textAlign: 'center', fontSize: '1.4rem', letterSpacing: '6px', fontWeight: 700, fontFamily: 'monospace' }}
                  autoFocus
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn-3d btn-3d-primary"
              disabled={loading || verificationInput.length < 6}
            >
              {loading ? 'Verifying Account...' : 'Verify & Enter Learnozi 🚀'}
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', fontSize: '0.84rem' }}>
              <button
                type="button"
                onClick={handleResend}
                disabled={resendTimer > 0 || loading}
                style={{ background: 'none', border: 'none', color: resendTimer > 0 ? '#64748b' : '#38bdf8', cursor: resendTimer > 0 ? 'default' : 'pointer', padding: 0, textDecoration: 'underline' }}
              >
                {resendTimer > 0 ? `Resend code in ${resendTimer}s` : 'Resend Code'}
              </button>

              <button
                type="button"
                onClick={() => setStep('form')}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0 }}
              >
                ← Back / Edit Email
              </button>
            </div>
          </form>
        </>
      )}

      {/* Interactive Google Auth Modal */}
      <GoogleAuthModal
        isOpen={showGoogleModal}
        onClose={() => setShowGoogleModal(false)}
      />
    </Auth3DLayout>
  );
}
