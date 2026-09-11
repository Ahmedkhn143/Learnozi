import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from '../../context/LanguageContext';
import Auth3DLayout from './Auth3DLayout';
import CaptchaInput, { generateCaptchaCode } from '../../components/Captcha/CaptchaInput';
import './Auth.css';

export default function ForgotPassword() {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetUrl, setResetUrl] = useState('');
  const [previewCode, setPreviewCode] = useState('');

  // Captcha State
  const [captchaCode, setCaptchaCode] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaError, setCaptchaError] = useState('');

  useEffect(() => {
    refreshCaptcha();
  }, []);

  const refreshCaptcha = () => {
    setCaptchaCode(generateCaptchaCode());
    setCaptchaInput('');
    setCaptchaError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCaptchaError('');

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (captchaInput.trim().toUpperCase() !== captchaCode) {
      setCaptchaError('Captcha code does not match. Please try again.');
      refreshCaptcha();
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post('/api/auth/forgot-password', { email });
      if (res.data.resetUrl) {
        setResetUrl(res.data.resetUrl);
      }
      if (res.data.previewCode) {
        setPreviewCode(res.data.previewCode);
      }
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
      refreshCaptcha();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Auth3DLayout>
      <div className="auth-3d-header">
        <h1 className="auth-3d-title">{t('auth.reset_password_title')}</h1>
        <p className="auth-3d-subtitle">
          {success 
            ? 'Password reset instructions dispatched.' 
            : t('auth.reset_password_sub')}
        </p>
      </div>

      {error && (
        <div className="auth-3d-alert-error">
          <span>⚠️ {error}</span>
        </div>
      )}

      {success ? (
        <div className="text-center mt-4">
          <div style={{ fontSize: '3rem', margin: '0.75rem 0' }}>✉️</div>
          <p style={{ color: 'var(--color-text-secondary, #94a3b8)', fontSize: '0.92rem', lineHeight: '1.6' }}>
            A password reset passcode has been sent to <strong>{email}</strong>.
          </p>

          {previewCode && (
            <div style={{
              margin: '1rem 0',
              padding: '12px 14px',
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px dashed #f59e0b',
              borderRadius: '10px',
              textAlign: 'center'
            }}>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#fbbf24', fontWeight: 600, display: 'block' }}>
                Reset Passcode
              </span>
              <span style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '6px', color: '#f59e0b', fontFamily: 'monospace' }}>
                {previewCode}
              </span>
            </div>
          )}

          {resetUrl && (
            <div style={{
              margin: '1.25rem 0',
              padding: '1rem',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '12px',
              textAlign: 'center'
            }}>
              <Link
                to={resetUrl}
                className="btn-3d btn-3d-primary"
                style={{
                  display: 'block',
                  textDecoration: 'none',
                  fontSize: '0.9rem',
                  padding: '0.75rem 1.25rem',
                  textAlign: 'center',
                }}
              >
                Enter New Password Now →
              </Link>
            </div>
          )}

          <Link to="/login" className="btn-3d btn-3d-demo mt-3" style={{ display: 'block', textDecoration: 'none' }}>
            {t('auth.back_to_login')}
          </Link>
        </div>
      ) : (
        <form className="auth-3d-form" onSubmit={handleSubmit} noValidate>
          <div className="form-3d-group">
            <label className="form-3d-label">{t('auth.email')}</label>
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
                placeholder={t('auth.email_ph')}
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                required
              />
            </div>
          </div>

          {/* Captcha Verification Widget */}
          <CaptchaInput
            value={captchaInput}
            onChange={setCaptchaInput}
            captchaCode={captchaCode}
            onRefresh={refreshCaptcha}
            error={captchaError}
            label="Security Verification"
          />

          <button
            type="submit"
            className="btn-3d btn-3d-primary mt-3"
            disabled={loading}
          >
            {loading ? t('auth.sending_link') : t('auth.send_reset_link')}
          </button>

          <div className="auth-3d-footer mt-4">
            <p>{t('auth.remembered_pwd')} <Link to="/login" className="link-3d-signup">{t('auth.log_in_link')}</Link></p>
          </div>
        </form>
      )}
    </Auth3DLayout>
  );
}
