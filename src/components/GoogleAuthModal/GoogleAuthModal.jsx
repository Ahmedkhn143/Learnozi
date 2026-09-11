import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './GoogleAuthModal.css';

export default function GoogleAuthModal({ isOpen, onClose }) {
  const { googleLogin } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const defaultAccounts = [
    {
      name: 'Ahmad Khan',
      email: 'ahmad.khan.edu@gmail.com',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    },
    {
      name: 'Learner Scholar',
      email: 'student.learnozi@gmail.com',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
    },
  ];

  const handleSelectAccount = async (account) => {
    setLoading(true);
    setError('');
    try {
      await googleLogin({
        name: account.name,
        email: account.email,
        avatar: account.avatar,
        googleId: `google_${Date.now()}`,
      });
      setLoading(false);
      onClose();
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Google authentication failed. Please try again.');
      setLoading(false);
    }
  };

  const handleCustomSubmit = async (e) => {
    e.preventDefault();
    if (!customEmail.trim() || !customEmail.includes('@')) {
      setError('Please enter a valid Google email address.');
      return;
    }
    const name = customName.trim() || customEmail.split('@')[0];
    await handleSelectAccount({
      name,
      email: customEmail.trim(),
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(customEmail)}`,
    });
  };

  return (
    <div className="google-modal-backdrop" onClick={onClose}>
      <div className="google-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button className="google-modal-close" onClick={onClose} title="Close">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        {/* Google Header */}
        <div className="google-modal-header">
          <svg className="google-g-logo" width="32" height="32" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          <h2 className="google-modal-title">Sign in with Google</h2>
          <p className="google-modal-subtitle">Choose an account to continue to <strong>Learnozi</strong></p>
        </div>

        {error && (
          <div className="google-modal-error">
            <span>⚠️ {error}</span>
          </div>
        )}

        {loading ? (
          <div className="google-modal-loading">
            <div className="google-spinner"></div>
            <p>Connecting to Google Account...</p>
          </div>
        ) : !showCustomInput ? (
          <div className="google-accounts-list">
            {defaultAccounts.map((acc, i) => (
              <button
                key={i}
                type="button"
                className="google-account-item"
                onClick={() => handleSelectAccount(acc)}
              >
                <img src={acc.avatar} alt={acc.name} className="google-account-avatar" />
                <div className="google-account-info">
                  <div className="google-account-name">{acc.name}</div>
                  <div className="google-account-email">{acc.email}</div>
                </div>
                <span className="google-account-arrow">›</span>
              </button>
            ))}

            {/* Option to use another account */}
            <button
              type="button"
              className="google-account-item google-use-another"
              onClick={() => setShowCustomInput(true)}
            >
              <div className="google-account-avatar-placeholder">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
              <div className="google-account-info">
                <div className="google-account-name">Use another account</div>
                <div className="google-account-email">Enter any Google email address</div>
              </div>
              <span className="google-account-arrow">›</span>
            </button>
          </div>
        ) : (
          <form className="google-custom-form" onSubmit={handleCustomSubmit}>
            <div className="google-form-field">
              <label>Full Name</label>
              <input
                type="text"
                placeholder="e.g. Ali Raza"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="google-form-field">
              <label>Google Email</label>
              <input
                type="email"
                placeholder="name@gmail.com"
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                required
              />
            </div>
            <div className="google-custom-actions">
              <button
                type="button"
                className="google-btn-secondary"
                onClick={() => setShowCustomInput(false)}
              >
                Back
              </button>
              <button type="submit" className="google-btn-primary">
                Continue with this Account
              </button>
            </div>
          </form>
        )}

        {/* Footer info */}
        <div className="google-modal-footer">
          <p>
            To continue, Google will share your name, email address, language preference, and profile picture with Learnozi.
          </p>
        </div>
      </div>
    </div>
  );
}
