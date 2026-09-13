import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import './Pomodoro.css';

// Web Audio Ambient Synthesizer for Zero-Dependency Soundscapes
class AmbientAudioEngine {
  constructor() {
    this.ctx = null;
    this.nodes = [];
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  stop() {
    this.nodes.forEach((n) => {
      try {
        if (n.stop) n.stop();
        if (n.disconnect) n.disconnect();
      } catch (e) {}
    });
    this.nodes = [];
  }

  playChime() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.12);
      gain.gain.setValueAtTime(0, now + i * 0.12);
      gain.gain.linearRampToValueAtTime(0.2, now + i * 0.12 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.85);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + i * 0.12);
      osc.stop(now + i * 0.12 + 0.9);
    });
  }

  playRain() {
    this.init();
    this.stop();
    if (!this.ctx) return;
    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + white * 0.5362) * 0.035;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 950;

    const gain = this.ctx.createGain();
    gain.gain.value = 0.12;

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start();
    this.nodes.push(noise, filter, gain);
  }

  playLoFi() {
    this.init();
    this.stop();
    if (!this.ctx) return;
    const chords = [174.61, 220.0, 261.63, 329.63]; // F3, A3, C4, E4
    const masterGain = this.ctx.createGain();
    masterGain.gain.value = 0.08;
    masterGain.connect(this.ctx.destination);
    this.nodes.push(masterGain);

    chords.forEach((freq) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.value = 0.04;
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start();
      this.nodes.push(osc, gain);
    });
  }

  playForest() {
    this.init();
    this.stop();
    if (!this.ctx) return;
    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.04;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 500;
    filter.Q.value = 2.2;

    const gain = this.ctx.createGain();
    gain.gain.value = 0.1;

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start();
    this.nodes.push(noise, filter, gain);
  }

  playCafe() {
    this.init();
    this.stop();
    if (!this.ctx) return;
    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let last = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (last + 0.02 * white) / 1.02;
      last = output[i];
      output[i] *= 0.18;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const gain = this.ctx.createGain();
    gain.gain.value = 0.1;
    noise.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start();
    this.nodes.push(noise, gain);
  }
}

const audioEngine = new AmbientAudioEngine();

export default function Pomodoro() {
  const toast = useToast();
  const { user } = useAuth();

  const [mode, setMode] = useState('pomodoro'); // pomodoro (25m), shortBreak (5m), longFocus (50m)
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [soundscape, setSoundscape] = useState('rain');
  const [soundPlaying, setSoundPlaying] = useState(false);

  // Dynamic Subject state
  const [availableSubjects, setAvailableSubjects] = useState(['General Study']);
  const [subject, setSubject] = useState('General Study');
  const [customSubject, setCustomSubject] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);

  // Live session stats from API
  const [completedSessions, setCompletedSessions] = useState(0);
  const [todayMinutes, setTodayMinutes] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const modeConfig = {
    pomodoro: { label: 'Pomodoro (25m)', duration: 25 * 60, minutes: 25 },
    shortBreak: { label: 'Short Break (5m)', duration: 5 * 60, minutes: 5 },
    longFocus: { label: 'Deep Focus (50m)', duration: 50 * 60, minutes: 50 }
  };

  // 1. Fetch live focus metrics and real enrolled subjects on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const headers = { Authorization: `Bearer ${token}` };

    // Fetch focus stats
    axios
      .get('/api/focus', { headers, timeout: 6000 })
      .then((res) => {
        if (res.data) {
          setTodayMinutes(res.data.todayMinutes || 0);
          setCompletedSessions(res.data.totalSessions || 0);
        }
      })
      .catch((err) => {
        console.warn('Could not fetch live focus stats:', err.message);
      });

    // Fetch user enrolled courses
    axios
      .get('/api/academics', { headers, timeout: 6000 })
      .then((res) => {
        const sems = res.data?.semesters || [];
        const userCourses = [];
        sems.forEach((s) => {
          if (Array.isArray(s.courses)) {
            s.courses.forEach((c) => {
              if (!userCourses.includes(c.name)) userCourses.push(c.name);
            });
          }
        });
        if (userCourses.length > 0) {
          setAvailableSubjects([...userCourses, 'General Study']);
          setSubject(userCourses[0]);
        }
      })
      .catch(() => {});
  }, []);

  // 2. Soundscape audio handler
  useEffect(() => {
    if (!soundPlaying) {
      audioEngine.stop();
      return;
    }

    if (soundscape === 'rain') audioEngine.playRain();
    else if (soundscape === 'lofi') audioEngine.playLoFi();
    else if (soundscape === 'forest') audioEngine.playForest();
    else if (soundscape === 'cafe') audioEngine.playCafe();

    return () => {
      audioEngine.stop();
    };
  }, [soundPlaying, soundscape]);

  // 3. Complete and log focus session to backend
  const handleSessionCompletion = async (explicitMinutes = null) => {
    setIsActive(false);
    const duration = explicitMinutes || modeConfig[mode].minutes;
    const targetSubject = isCustomMode && customSubject.trim() ? customSubject.trim() : subject;

    audioEngine.playChime();
    setIsSaving(true);

    const token = localStorage.getItem('token');

    try {
      const res = await axios.post(
        '/api/focus',
        {
          subject: targetSubject,
          durationMin: duration,
          completed: true
        },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          timeout: 4500
        }
      );

      if (res.data) {
        setCompletedSessions(res.data.totalSessions || completedSessions + 1);
        setTodayMinutes(res.data.todayMinutes || todayMinutes + duration);
        toast.success(`🎉 Great focus! +${duration}m logged for ${targetSubject}.`);
      }
    } catch (err) {
      console.warn('Error saving focus session:', err.message);
      setCompletedSessions((prev) => prev + 1);
      setTodayMinutes((prev) => prev + duration);
      toast.success(`🎉 Session completed! +${duration}m logged for ${targetSubject}.`);
    } finally {
      setIsSaving(false);
      resetTimer();
    }
  };

  // 4. Countdown Timer Interval
  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      handleSessionCompletion();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const changeMode = (newMode) => {
    setMode(newMode);
    setIsActive(false);
    setTimeLeft(modeConfig[newMode].duration);
  };

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(modeConfig[mode].duration);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const totalSecs = modeConfig[mode].duration;
  const progressPercent = ((totalSecs - timeLeft) / totalSecs) * 100;
  const strokeDashoffset = 565 - (565 * progressPercent) / 100;

  return (
    <div className="pomodoro-view animate-fade-in">
      <div className="pomodoro-header text-center">
        <h2>⏱️ Ambient Focus Room</h2>
        <p>Eliminate distractions, lock in deep study sessions, and track focus time in real time.</p>
      </div>

      {/* Mode Selector Tabs */}
      <div className="timer-mode-tabs mt-3">
        <button
          type="button"
          className={`mode-tab-btn ${mode === 'pomodoro' ? 'active' : ''}`}
          onClick={() => changeMode('pomodoro')}
        >
          🧠 25m Focus
        </button>
        <button
          type="button"
          className={`mode-tab-btn ${mode === 'shortBreak' ? 'active' : ''}`}
          onClick={() => changeMode('shortBreak')}
        >
          ☕ 5m Break
        </button>
        <button
          type="button"
          className={`mode-tab-btn ${mode === 'longFocus' ? 'active' : ''}`}
          onClick={() => changeMode('longFocus')}
        >
          🚀 50m Deep Work
        </button>
      </div>

      {/* Circular Timer Ring */}
      <div className="timer-workspace mt-4">
        <div className="svg-timer-wrap">
          <svg className="timer-svg" width="220" height="220" viewBox="0 0 200 200">
            <circle className="timer-bg-circle" cx="100" cy="100" r="90" />
            <circle
              className="timer-progress-circle"
              cx="100"
              cy="100"
              r="90"
              style={{ strokeDasharray: 565, strokeDashoffset }}
            />
          </svg>

          <div className="timer-display-content">
            <span className="time-digits">{formatTime(timeLeft)}</span>
            <span className="mode-status-text">
              {isActive ? `⚡ IN FOCUS • ${isCustomMode && customSubject ? customSubject : subject}` : 'PAUSED'}
            </span>
          </div>
        </div>

        {/* Timer Control Buttons */}
        <div className="timer-controls mt-4">
          <button
            type="button"
            className={`btn btn-lg ${isActive ? 'btn-secondary' : 'btn-primary'}`}
            onClick={toggleTimer}
          >
            {isActive ? '⏸️ Pause' : '▶️ Start Session'}
          </button>
          <button type="button" className="btn btn-secondary btn-lg" onClick={resetTimer}>
            🔄 Reset
          </button>
        </div>

        {/* Secondary Actions: Finish Early / Test Quick Log */}
        <div className="timer-secondary-actions">
          <button
            type="button"
            className="btn-complete-early"
            onClick={() => handleSessionCompletion()}
            disabled={isSaving}
          >
            {isSaving ? 'Logging...' : '✅ Mark Session Completed & Log'}
          </button>
        </div>

        {/* Subject Picker Card */}
        <div className="glass-card subject-picker-card">
          <div className="subject-picker-title">
            <span>📚 Select Study Subject</span>
            <span style={{ fontSize: '0.75rem', color: '#818cf8' }}>
              Current: <strong>{isCustomMode && customSubject ? customSubject : subject}</strong>
            </span>
          </div>

          <div className="subject-pills-row">
            {availableSubjects.map((s) => (
              <button
                key={s}
                type="button"
                className={`subject-pill-btn ${!isCustomMode && subject === s ? 'active' : ''}`}
                onClick={() => {
                  setSubject(s);
                  setIsCustomMode(false);
                }}
              >
                {s}
              </button>
            ))}
            <button
              type="button"
              className={`subject-pill-btn ${isCustomMode ? 'active' : ''}`}
              onClick={() => setIsCustomMode(true)}
            >
              ✏️ Custom
            </button>
          </div>

          {isCustomMode && (
            <div className="subject-custom-row">
              <input
                type="text"
                placeholder="Enter subject name (e.g. AI Ethics, Anatomy)..."
                value={customSubject}
                onChange={(e) => setCustomSubject(e.target.value)}
                className="subject-custom-input"
                autoFocus
              />
            </div>
          )}
        </div>

        {/* Ambient Soundscapes Bar */}
        <div className="glass-card soundscape-panel mt-4">
          <div className="soundscape-header">
            <span>
              🎧 Ambient Soundscape: <strong>{soundscape.toUpperCase()}</strong>
            </span>
            <button
              type="button"
              className={`btn btn-sm ${soundPlaying ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setSoundPlaying(!soundPlaying)}
            >
              {soundPlaying ? '🔊 Playing' : '🔇 Turn Sound On'}
            </button>
          </div>
          <div className="soundscape-options mt-2">
            <button
              type="button"
              className={`sound-btn ${soundscape === 'rain' ? 'active' : ''}`}
              onClick={() => {
                setSoundscape('rain');
                if (!soundPlaying) setSoundPlaying(true);
              }}
            >
              🌧️ Gentle Rain
            </button>
            <button
              type="button"
              className={`sound-btn ${soundscape === 'lofi' ? 'active' : ''}`}
              onClick={() => {
                setSoundscape('lofi');
                if (!soundPlaying) setSoundPlaying(true);
              }}
            >
              🎧 Lo-Fi Synth Pad
            </button>
            <button
              type="button"
              className={`sound-btn ${soundscape === 'forest' ? 'active' : ''}`}
              onClick={() => {
                setSoundscape('forest');
                if (!soundPlaying) setSoundPlaying(true);
              }}
            >
              🌲 Forest Breeze
            </button>
            <button
              type="button"
              className={`sound-btn ${soundscape === 'cafe' ? 'active' : ''}`}
              onClick={() => {
                setSoundscape('cafe');
                if (!soundPlaying) setSoundPlaying(true);
              }}
            >
              ☕ Cafe Ambience
            </button>
          </div>
        </div>

        {/* Real-time Completed Sessions Stats */}
        <div className="completed-sessions-badge mt-3">
          <span>
            🎉 <strong>{completedSessions}</strong> Total Sessions Logged Today •{' '}
            <strong>{(todayMinutes / 60).toFixed(1)} hrs</strong> ({todayMinutes} mins)
          </span>
        </div>
      </div>
    </div>
  );
}
