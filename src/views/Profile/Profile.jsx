import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import './Profile.css';

export default function Profile() {
  const { user, setAuthSession } = useAuth();
  const { success, error: showError } = useToast();

  const [name, setName] = useState(user?.name || '');
  const [email] = useState(user?.email || '');
  const [educationLevel, setEducationLevel] = useState(
    user?.academicProfile?.educationLevel || 'University'
  );
  const [institution, setInstitution] = useState(
    user?.academicProfile?.institution || user?.academicProfile?.university || ''
  );

  const [liveStats, setLiveStats] = useState({
    focusHours: 0,
    streak: 0,
    flashcards: 0
  });

  const [saving, setSaving] = useState(false);

  // Sync state if user changes
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEducationLevel(user.academicProfile?.educationLevel || 'University');
      setInstitution(user.academicProfile?.institution || user.academicProfile?.university || '');
    }
  }, [user]);

  // Fetch live stats from database
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const headers = { Authorization: `Bearer ${token}` };

    // Fetch Focus Hours & Streak
    axios
      .get('/api/focus', { headers, timeout: 6000 })
      .then((res) => {
        if (res.data) {
          const hours = Number(((res.data.weekMinutes || 0) / 60).toFixed(1));
          setLiveStats((prev) => ({
            ...prev,
            focusHours: hours,
            streak: res.data.streakDays || 0
          }));
        }
      })
      .catch(() => {});

    // Fetch Flashcard Count
    axios
      .get('/api/flashcards', { headers, timeout: 6000 })
      .then((res) => {
        const decks = res.data?.sets || [];
        let count = 0;
        decks.forEach((d) => (count += (d.cards || []).length));
        setLiveStats((prev) => ({
          ...prev,
          flashcards: count
        }));
      })
      .catch(() => {});
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    const token = localStorage.getItem('token');
    try {
      const updatedProfile = {
        educationLevel,
        institution,
        university: institution
      };

      const res = await axios.put(
        '/api/auth/me',
        {
          name: name.trim(),
          academicProfile: updatedProfile
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data?.user) {
        setAuthSession(token, { ...user, ...res.data.user });
      }

      success('Profile updated successfully!');
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-view animate-fade-in">
      <div className="profile-header">
        <div>
          <h2>👤 Account Settings & Profile</h2>
          <p>Manage your account credentials, academic background, and view verified stats.</p>
        </div>
      </div>

      <div className="grid-3 mt-4">
        {/* User Card */}
        <div className="glass-card user-summary-card">
          <div className="user-avatar-large">
            {name ? name[0].toUpperCase() : 'U'}
          </div>
          <h3 className="mt-3">{name || 'Student'}</h3>
          <p className="text-muted" style={{ fontSize: '0.85rem' }}>
            {email || 'Verified Account'}
          </p>
          <span className="badge badge-primary mt-2">Learnozi Student</span>

          <div className="user-quick-stats mt-4">
            <div className="stat-box">
              <span className="num">{liveStats.focusHours}</span>
              <span className="lbl">Focus Hrs</span>
            </div>
            <div className="stat-box">
              <span className="num">{liveStats.flashcards}</span>
              <span className="lbl">Flashcards</span>
            </div>
            <div className="stat-box">
              <span className="num">{liveStats.streak}</span>
              <span className="lbl">Streak</span>
            </div>
          </div>
        </div>

        {/* Profile Settings Form */}
        <div className="glass-card profile-form-panel" style={{ gridColumn: 'span 2' }}>
          <h3>Edit Profile Information</h3>

          <form onSubmit={handleSave} className="mt-3">
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                value={email}
                disabled
                style={{ opacity: 0.7, cursor: 'not-allowed' }}
                title="Email cannot be changed"
              />
            </div>

            <div className="form-group">
              <label>Education Level</label>
              <select value={educationLevel} onChange={(e) => setEducationLevel(e.target.value)}>
                <option value="Matric">Matric (9th/10th)</option>
                <option value="Intermediate">Intermediate (11th/12th / College)</option>
                <option value="University">University Degree (BS / Masters)</option>
                <option value="TestPrep">Test Preparation (MDCAT/ECAT/GAT)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Institution / University</label>
              <input
                type="text"
                value={institution}
                placeholder="e.g. NUST, FAST, Punjab College, etc."
                onChange={(e) => setInstitution(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary mt-3" disabled={saving}>
              {saving ? 'Saving Changes...' : 'Save Profile Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
