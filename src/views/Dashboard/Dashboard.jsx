import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import './Dashboard.css';

function formatTimeAgo(dateString) {
  if (!dateString) return 'Just now';
  const now = new Date();
  const date = new Date(dateString);
  const diffSec = Math.floor((now - date) / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays} days ago`;
}

export default function Dashboard() {
  const { user } = useAuth();
  const userName = user?.name || 'Learner';

  const [stats, setStats] = useState({
    focusHours: 0,
    streakDays: 0,
    flashcardsMastered: 0,
    totalFlashcards: 0,
    upcomingExamsCount: 0
  });

  const [subjects, setSubjects] = useState([]);
  const [upcomingExams, setUpcomingExams] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [sampleCard, setSampleCard] = useState(null);
  const [loading, setLoading] = useState(true);

  // Live Sync with Supabase API Endpoints
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };

    // 1. Fetch live focus metrics & sessions
    const focusReq = axios
      .get('/api/focus', { headers, timeout: 6000 })
      .then((res) => {
        const data = res.data;
        if (data) {
          const liveHours = Number(((data.weekMinutes || 0) / 60).toFixed(1));
          const liveStreak = data.streakDays !== undefined ? data.streakDays : 0;

          setStats((prev) => ({
            ...prev,
            focusHours: liveHours,
            streakDays: liveStreak
          }));

          if (Array.isArray(data.sessions) && data.sessions.length > 0) {
            const liveActivities = data.sessions.slice(0, 4).map((s) => ({
              title: `Completed ${s.durationMin}m Focus Session (${s.subject || 'General'})`,
              time: formatTimeAgo(s.completedAt),
              icon: '⏱️'
            }));
            setRecentActivity(liveActivities);
          }
        }
      })
      .catch((err) => {
        console.warn('Dashboard focus stats fetch notice:', err.message);
      });

    // 2. Fetch live flashcards to compute real card counts & mastery
    const flashcardReq = axios
      .get('/api/flashcards', { headers, timeout: 6000 })
      .then((res) => {
        const decks = res.data?.sets || [];
        let totalCards = 0;
        let masteredCards = 0;

        decks.forEach((deck) => {
          const cards = deck.cards || [];
          totalCards += cards.length;
          masteredCards += cards.filter((c) => c.mastery === 'Easy').length;
        });

        setStats((prev) => ({
          ...prev,
          totalFlashcards: totalCards,
          flashcardsMastered: masteredCards
        }));

        if (decks.length > 0 && decks[0].cards && decks[0].cards.length > 0) {
          setSampleCard({
            deckTitle: decks[0].title,
            question: decks[0].cards[0].question
          });
        }
      })
      .catch((err) => {
        console.warn('Dashboard flashcards fetch notice:', err.message);
      });

    // 3. Fetch live academics for enrolled courses & upcoming exams
    const academicsReq = axios
      .get('/api/academics', { headers, timeout: 6000 })
      .then((res) => {
        const semesters = res.data?.semesters || [];
        const allCourses = [];
        const colors = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

        semesters.forEach((s) => {
          if (Array.isArray(s.courses)) allCourses.push(...s.courses);
        });

        if (allCourses.length > 0) {
          setSubjects(
            allCourses.map((c, i) => ({
              name: c.name,
              code: c.code,
              creditHours: c.creditHours || 3,
              progress: c.actualGrade ? 100 : 65,
              color: colors[i % colors.length]
            }))
          );

          setStats((prev) => ({
            ...prev,
            upcomingExamsCount: allCourses.length
          }));

          // Mock nearest exams based on real active courses
          setUpcomingExams(
            allCourses.slice(0, 3).map((c, idx) => ({
              title: `${c.name} Assessment`,
              date: `Semester Term Exam`,
              daysLeft: (idx + 1) * 7,
              urgency: idx === 0 ? 'high' : 'medium',
              subject: c.code || c.name
            }))
          );
        }
      })
      .catch((err) => {
        console.warn('Dashboard academics fetch notice:', err.message);
      });

    Promise.allSettled([focusReq, flashcardReq, academicsReq]).finally(() => {
      setLoading(false);
    });
  }, []);

  return (
    <div className="dashboard-view animate-fade-in">
      {/* Welcome Hero Banner */}
      <div className="glass-card welcome-banner">
        <div className="welcome-content">
          <div className="welcome-badge">
            <span>🔥 {stats.streakDays} DAY FOCUS STREAK</span>
          </div>
          <h1>
            Welcome back, <span className="gradient-text">{userName}</span> 👋
          </h1>
          <p>
            {stats.focusHours > 0
              ? `You have logged ${stats.focusHours} focus hours this week. Keep up the great consistency!`
              : 'Start your study journey today. Track focus sessions, generate AI flashcards, and prep for exams!'}
          </p>

          <div className="welcome-actions mt-3">
            <Link to="/timer" className="btn btn-primary btn-sm">
              <span>⏱️ Start Focus Room</span>
            </Link>
            <Link to="/ai-explainer" className="btn btn-secondary btn-sm">
              <span>✨ Ask AI Assistant</span>
            </Link>
            <Link to="/planner" className="btn btn-ghost btn-sm">
              <span>📅 View Planner</span>
            </Link>
          </div>
        </div>

        <div className="welcome-quote-card glass-card">
          <span className="quote-icon">💡</span>
          <p className="quote-text">
            "Success isn't always about greatness. It's about consistency. Consistent hard work leads to success."
          </p>
          <span className="quote-author">— Daily AI Motivation</span>
        </div>
      </div>

      {/* 4 Stat Metric Cards (100% Live Database Data) */}
      <div className="grid-4 mt-4">
        <div className="glass-card glass-card-hover stat-widget">
          <div className="stat-header">
            <span className="stat-title">Focus Time (This Week)</span>
            <div className="stat-icon-wrap primary">⏱️</div>
          </div>
          <div className="stat-value">{stats.focusHours} hrs</div>
          <div className="stat-footer">
            <span className="stat-trend positive">Live Supabase Sync</span>
          </div>
        </div>

        <div className="glass-card glass-card-hover stat-widget">
          <div className="stat-header">
            <span className="stat-title">Study Streak</span>
            <div className="stat-icon-wrap amber">🔥</div>
          </div>
          <div className="stat-value">{stats.streakDays} Days</div>
          <div className="stat-footer">
            <span className="stat-trend positive">Consecutive Days</span>
          </div>
        </div>

        <div className="glass-card glass-card-hover stat-widget">
          <div className="stat-header">
            <span className="stat-title">Flashcards Mastered</span>
            <div className="stat-icon-wrap cyan">🃏</div>
          </div>
          <div className="stat-value">
            {stats.flashcardsMastered} / {stats.totalFlashcards}
          </div>
          <div className="stat-footer">
            <div className="mini-progress-bg">
              <div
                className="mini-progress-fill"
                style={{
                  width: `${stats.totalFlashcards > 0 ? (stats.flashcardsMastered / stats.totalFlashcards) * 100 : 0}%`
                }}
              />
            </div>
          </div>
        </div>

        <div className="glass-card glass-card-hover stat-widget">
          <div className="stat-header">
            <span className="stat-title">Active Courses & Exams</span>
            <div className="stat-icon-wrap rose">🎓</div>
          </div>
          <div className="stat-value">{stats.upcomingExamsCount} Enrolled</div>
          <div className="stat-footer">
            <span className="stat-trend positive">Academic Profile</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Subject Progress & Exams */}
      <div className="grid-2 mt-4">
        {/* Subject Completion Progress */}
        <div className="glass-card dashboard-card">
          <div className="card-header-flex">
            <h3>🎓 Course & Subject Progress</h3>
            <Link to="/academics" className="view-all-link">
              Manage Courses →
            </Link>
          </div>

          <div className="subject-list mt-3">
            {subjects.length > 0 ? (
              subjects.map((sub, idx) => (
                <div key={idx} className="subject-item">
                  <div className="subject-info-row">
                    <span className="subject-name">
                      {sub.code ? `[${sub.code}] ` : ''}
                      {sub.name}
                    </span>
                    <span className="subject-percentage">{sub.creditHours} Credits</span>
                  </div>
                  <div className="subject-bar-bg">
                    <div
                      className="subject-bar-fill"
                      style={{ width: `${sub.progress}%`, background: sub.color }}
                    />
                  </div>
                  <div className="subject-meta mt-1">
                    <span>Enrolled Course</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center p-4 text-muted">
                <p>No courses enrolled yet.</p>
                <Link to="/academics" className="btn btn-secondary btn-sm mt-2">
                  + Add Your First Course
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Deadlines & Exams */}
        <div className="glass-card dashboard-card">
          <div className="card-header-flex">
            <h3>📅 Upcoming Tasks & Deadlines</h3>
            <Link to="/planner" className="view-all-link">
              Study Planner →
            </Link>
          </div>

          <div className="exam-list mt-3">
            {upcomingExams.length > 0 ? (
              upcomingExams.map((exam, idx) => (
                <div key={idx} className="exam-card-item">
                  <div className="exam-left">
                    <div className={`exam-countdown-badge ${exam.urgency}`}>
                      <span className="days-num">{exam.daysLeft}</span>
                      <span className="days-text">Days</span>
                    </div>
                    <div>
                      <h4 className="exam-title">{exam.title}</h4>
                      <span className="exam-date">{exam.subject}</span>
                    </div>
                  </div>
                  <Link to="/planner" className="btn btn-secondary btn-sm">
                    Prep Plan
                  </Link>
                </div>
              ))
            ) : (
              <div className="text-center p-4 text-muted">
                <p>No exams or tasks scheduled.</p>
                <Link to="/planner" className="btn btn-ghost btn-sm mt-2">
                  + Add a Study Task
                </Link>
              </div>
            )}

            <div className="add-exam-prompt mt-3">
              <Link to="/planner" className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
                + Add Study Plan in Planner
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Row: Quick Flashcards Review & Recent Live Activity */}
      <div className="grid-2 mt-4">
        <div className="glass-card dashboard-card">
          <div className="card-header-flex">
            <h3>🃏 Quick Flashcard Review</h3>
            <Link to="/flashcards" className="view-all-link">
              All Decks →
            </Link>
          </div>

          <div className="quick-flashcard-box mt-3 text-center">
            {sampleCard ? (
              <>
                <span className="badge badge-cyan mb-2">{sampleCard.deckTitle}</span>
                <h4>Q: {sampleCard.question}</h4>
                <p className="text-muted mt-1" style={{ fontSize: '0.88rem' }}>
                  Test your recall with spaced repetition!
                </p>
                <div className="mt-3">
                  <Link to="/flashcards" className="btn btn-primary btn-sm">
                    🔄 Flip & Study Deck
                  </Link>
                </div>
              </>
            ) : (
              <div className="p-3">
                <span className="badge badge-cyan mb-2">Study Decks</span>
                <h4>No flashcards created yet</h4>
                <p className="text-muted mt-1" style={{ fontSize: '0.88rem' }}>
                  Generate custom study flashcards instantly with AI!
                </p>
                <div className="mt-3">
                  <Link to="/flashcards" className="btn btn-primary btn-sm">
                    ✨ Generate Flashcards with AI
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="glass-card dashboard-card">
          <div className="card-header-flex">
            <h3>📜 Recent Study Activity</h3>
          </div>

          <div className="activity-list mt-3">
            {recentActivity.length > 0 ? (
              recentActivity.map((act, idx) => (
                <div key={idx} className="activity-item">
                  <span className="activity-icon">{act.icon}</span>
                  <div className="activity-details">
                    <span className="activity-title">{act.title}</span>
                    <span className="activity-time">{act.time}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center p-4 text-muted">
                <p>No study sessions recorded yet.</p>
                <Link to="/timer" className="btn btn-primary btn-sm mt-2">
                  ⏱️ Start 25m Focus Session
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
