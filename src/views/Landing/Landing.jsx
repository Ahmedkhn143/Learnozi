import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import './Landing.css';

const INITIAL_TESTIMONIALS = [
  {
    id: 'rev-1',
    name: 'Ali Raza',
    institute: 'FAST NUCES — CS',
    rating: 5,
    quote: '"Learnozi helped me turn my messy study schedule into a clear daily plan. The flashcards saved me hours."',
    avatar: 'AR',
    color: '#4f46e5',
    verified: true,
    feature: 'Flashcards & Planner'
  },
  {
    id: 'rev-2',
    name: 'Ayesha Khan',
    institute: 'NUST — Electrical Eng',
    rating: 5,
    quote: '"The AI tutor explains concepts in such a simple way. I finally understand what I used to struggle with."',
    avatar: 'AK',
    color: '#0ea5e9',
    verified: true,
    feature: 'AI Concept Explainer'
  },
  {
    id: 'rev-3',
    name: 'Hamza Ahmed',
    institute: 'LUMS — Business',
    rating: 5,
    quote: '"Perfect for MDCAT prep! The study planner and progress tracker keep me motivated every day."',
    avatar: 'HA',
    color: '#8b5cf6',
    verified: true,
    feature: 'Study Planner'
  },
  {
    id: 'rev-4',
    name: 'Zainab Fatima',
    institute: 'Punjab Board — FSc Pre-Med',
    rating: 5,
    quote: '"Urdu mein mushkil physics concepts itni asani se samajh aate hain! Coaching academy jane ki zaroorat hi nahi rahi."',
    avatar: 'ZF',
    color: '#10b981',
    verified: true,
    feature: 'Urdu Native Explainer'
  },
  {
    id: 'rev-5',
    name: 'Bilal Tariq',
    institute: 'FBISE — Class 10 (SSC-II)',
    rating: 5,
    quote: '"The 25-min Pomodoro timer and streak badges kept me focused for 4 hours daily during board exams!"',
    avatar: 'BT',
    color: '#f59e0b',
    verified: true,
    feature: 'Pomodoro Room'
  }
];

export default function Landing() {
  const { t, language, toggleLanguage } = useLanguage();

  // Light / Dark Theme State with persistence
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('lz_theme') || 'light';
    }
    return 'light';
  });

  const toggleTheme = () => {
    setTheme(prev => {
      const next = prev === 'light' ? 'dark' : 'light';
      if (typeof window !== 'undefined') {
        localStorage.setItem('lz_theme', next);
        if (next === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
      return next;
    });
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [theme]);

  // Reviews state with localStorage persistence
  const [reviews, setReviews] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('lz_student_reviews');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch (err) {
        console.error('Failed to load reviews from localStorage', err);
      }
    }
    return INITIAL_TESTIMONIALS;
  });

  // Review Modal and form states
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewName, setReviewName] = useState('');
  const [reviewInstitute, setReviewInstitute] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewFeature, setReviewFeature] = useState('All Features');
  const [reviewText, setReviewText] = useState('');
  const [reviewImg, setReviewImg] = useState('');
  const [reviewImgPreview, setReviewImgPreview] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');

  // Marquee auto-scroll and control state
  const [isMarqueePaused, setIsMarqueePaused] = useState(false);

  // Hero interactive doubt simulation state
  const [heroAskPrompt, setHeroAskPrompt] = useState("Explain Newton's Laws in simple Urdu");
  const [heroAnswerPreview, setHeroAnswerPreview] = useState(
    "🚀 Newton ka 2nd Law (F = m × a): Force kisi cheez ke mass aur uski acceleration ka nateeja hoti hai! Asan misaal: Halki cycle ko chalana asan hai, lekin bhaari car ko aagay dhakelne ke liye bohat zyada taqat (force) lagani padti hai! 🚲🚗"
  );
  const [heroAskLoading, setHeroAskLoading] = useState(false);

  const handleHeroAsk = (e) => {
    if (e) e.preventDefault();
    if (!heroAskPrompt.trim()) return;
    setHeroAskLoading(true);
    setTimeout(() => {
      const p = heroAskPrompt.toLowerCase();
      if (p.includes("biology") || p.includes("cell") || p.includes("mdcat")) {
        setHeroAnswerPreview("🔬 Cell Cycle & Mitosis: Aik cell do identical daughter cells mein divide hota hai. Is ke chaar phases hain: Prophase, Metaphase, Anaphase, aur Telophase! MDCAT ke mutabiq yeh growth aur tissue repair ke liye zaroori hai. 🧬");
      } else if (p.includes("chemistry") || p.includes("organic")) {
        setHeroAnswerPreview("🧪 Organic Chemistry: Carbon atoms covalent bonds banatay hain. Alkane (Single bond C-C), Alkene (Double C=C), aur Alkyne (Triple C≡C). Board exams mein IUPAC nomenclature rules sab se important hain! ⚗️");
      } else if (p.includes("math") || p.includes("calculus") || p.includes("derivative")) {
        setHeroAnswerPreview("📐 Derivatives: Derivative batata hai ke koi cheez waqt ke sath kitni tezi se badal rahi hai (rate of change)! Jaise speed = distance ka derivative. Formula: d/dx(x^n) = n*x^(n-1). 📈");
      } else {
        setHeroAnswerPreview(`💡 "${heroAskPrompt}": Learnozi AI explains concepts directly according to your board textbook syllabus, highlighting past paper patterns and key formulas step-by-step! ✨`);
      }
      setHeroAskLoading(false);
    }, 300);
  };

  // Scroll listener for sticky navbar shadow
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2.5 * 1024 * 1024) {
        setReviewError(language === 'ur' ? 'تصویر کا سائز 2.5MB سے کم ہونا چاہیے' : 'Image size must be under 2.5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setReviewImg(reader.result);
        setReviewImgPreview(reader.result);
        setReviewError('');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setReviewImg('');
    setReviewImgPreview('');
  };

  const handleReviewSubmit = (e) => {
    e.preventDefault();
    if (!reviewName.trim()) {
      setReviewError(language === 'ur' ? 'براہ کرم اپنا نام درج کریں' : 'Please enter your name');
      return;
    }
    if (!reviewText.trim() || reviewText.trim().length < 8) {
      setReviewError(language === 'ur' ? 'براہ کرم کم از کم 8 حروف کا ریویو لکھیں' : 'Please enter at least 8 characters in your review');
      return;
    }

    const initials = reviewName
      .trim()
      .split(' ')
      .filter(Boolean)
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'ST';

    const colorPalette = ['#4f46e5', '#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4'];
    const randomColor = colorPalette[Math.floor(Math.random() * colorPalette.length)];

    const newRev = {
      id: 'user-rev-' + Date.now(),
      name: reviewName.trim(),
      institute: reviewInstitute.trim() || (language === 'ur' ? 'طالب علم' : 'Student'),
      rating: reviewRating,
      quote: `"${reviewText.trim()}"`,
      avatar: initials,
      avatarImg: reviewImg || '',
      color: randomColor,
      verified: true,
      feature: reviewFeature,
      isNew: true
    };

    const updated = [newRev, ...reviews];
    setReviews(updated);
    try {
      localStorage.setItem('lz_student_reviews', JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to save review', err);
    }

    setReviewName('');
    setReviewInstitute('');
    setReviewRating(5);
    setReviewText('');
    setReviewImg('');
    setReviewImgPreview('');
    setReviewError('');
    setIsReviewModalOpen(false);
    setReviewSuccess(t('landing.review_success_msg') || '🎉 Shukriya! Your review has been added live to Learnozi!');

    setTimeout(() => {
      setReviewSuccess('');
    }, 6000);
  };

  // Interactive states for Feature cards
  const [explainerInput, setExplainerInput] = useState("Explain photosynthesis like I'm 10");
  const [explainerResponse, setExplainerResponse] = useState(
    "Photosynthesis is how plants make food! They catch sunlight with green leaves, drink water from roots, and breathe in CO2 to create sweet sugar and fresh oxygen! 🌿☀️"
  );
  const [explainerLoading, setExplainerLoading] = useState(false);

  const [flashcardFlipped, setFlashcardFlipped] = useState(false);

  // Planner checklist state
  const [plannerTasks, setPlannerTasks] = useState([
    { id: 1, text: "Physics — Chapter 3", done: true },
    { id: 2, text: "Math — Practice Set", done: false },
    { id: 3, text: "Chemistry — Revision", done: false },
  ]);

  const togglePlannerTask = (id) => {
    setPlannerTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  // Pomodoro timer state
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(1498); // 24:58

  const toggleTimer = () => {
    setTimerRunning(prev => !prev);
  };

  const formatTimerDigits = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Pakistani curriculum active pill
  const [activeCurriculum, setActiveCurriculum] = useState('FSc');

  // Hero mockup subject
  const [heroSubject, setHeroSubject] = useState("Physics — Newton's Laws");

  // Hero mockup checklist
  const [heroChecklist, setHeroChecklist] = useState([
    { id: 1, text: "Read Chapter 3", done: true },
    { id: 2, text: "10 AI Flashcards", done: true },
    { id: 3, text: "25 min Focus Session", done: false },
  ]);

  const toggleHeroChecklist = (id) => {
    setHeroChecklist(prev => prev.map(item => item.id === id ? { ...item, done: !item.done } : item));
  };

  // 2-column FAQ state
  const [expandedFaq, setExpandedFaq] = useState(null);

  const toggleFaq = (index) => {
    setExpandedFaq(prev => prev === index ? null : index);
  };

  const faqListCol1 = [
    {
      id: 1,
      q: language === 'en' ? "Is Learnozi free?" : "کیا Learnozi مفت ہے؟",
      a: language === 'en' 
        ? "Yes! Learnozi offers a forever free basic plan that includes daily AI concept explanations, study planner, flashcards, and focus timer without needing a credit card."
        : "جی ہاں! Learnozi کا بیسک پلان 100% مفت ہے جس میں روزانہ AI استاد، اسٹڈی پلانر اور فلیش کارڈز شامل ہیں بغیر کسی کریڈٹ کارڈ کے۔"
    },
    {
      id: 2,
      q: language === 'en' ? "Does it support Urdu?" : "کیا یہ اردو سپورٹ کرتا ہے؟",
      a: language === 'en'
        ? "Yes! You can ask questions in English, Urdu, or Roman Urdu (e.g. 'mujhe Newton ka law Urdu mein samjhao') and the AI explains with natural everyday local examples."
        : "بالکل! آپ انگلش، اردو یا رومن اردو میں سوالات پوچھ سکتے ہیں اور AI آسان عام فہم اردو میں وضاحت کرتا ہے۔"
    },
    {
      id: 3,
      q: language === 'en' ? "Which classes/exams does it support?" : "کونسی کلاسز اور امتحانات شامل ہیں؟",
      a: language === 'en'
        ? "Learnozi supports Matric (9th & 10th), FSc (Pre-Medical, Pre-Engineering, ICS), competitive entry tests like MDCAT & ECAT, CSS, and university undergraduate degrees."
        : "میٹرک، ایف ایس سی (پری میڈیکل، پری انجینئرنگ، ICS)، MDCAT، ECAT، سی ایس ایس، اور یونیورسٹی مضامین شامل ہیں۔"
    },
    {
      id: 7,
      q: language === 'en' ? "How is Learnozi different from ChatGPT?" : "Learnozi اور ChatGPT میں کیا فرق ہے؟",
      a: language === 'en'
        ? "ChatGPT is a generic chatbot with no knowledge of Pakistani board textbooks, exam dates, or past paper patterns. Learnozi is a purpose-built study operating system with syllabus roadmaps, auto-generated flashcards, Pomodoro focus tracking, and bilingual tutor support."
        : "ChatGPT ایک عام چیٹ بوٹ ہے جو آپ کے بورڈ نصاب اور امتحانی پیٹرن سے ناواقف ہے۔ Learnozi مخصوص اسٹڈی پلیٹ فارم ہے جس میں مکمل سلیبس، امتحانی شیڈول اور فلیش کارڈز شامل ہیں۔"
    }
  ];

  const faqListCol2 = [
    {
      id: 4,
      q: language === 'en' ? "Can I use it for university subjects?" : "کیا یونیورسٹی کے مضامین بھی پڑھ سکتے ہیں؟",
      a: language === 'en'
        ? "Definitely! Whether you're in Computer Science, Engineering, Business, or Medical studies, Learnozi handles semester course planning and technical concept breakdowns."
        : "جی ہاں! چاہے آپ کمپیوٹر سائنس، انجینئرنگ یا بزنس میں ہوں، Learnozi یونیورسٹی کے سمسٹر کورسز اور مشکل کانسیپٹس کو بآسانی حل کرتا ہے۔"
    },
    {
      id: 5,
      q: language === 'en' ? "Do I need a credit card?" : "کیا کریڈٹ کارڈ کی ضرورت ہے؟",
      a: language === 'en'
        ? "No credit card or payment details are ever required to sign up and study on Learnozi."
        : "ہرگز نہیں! Learnozi پر رجسٹر ہونے اور پڑھائی شروع کرنے کیلئے کسی کریڈٹ کارڈ کی ضرورت نہیں۔"
    },
    {
      id: 6,
      q: language === 'en' ? "How does the AI study planner work?" : "AI اسٹڈی پلانر کیسے کام کرتا ہے؟",
      a: language === 'en'
        ? "You simply select your subjects and target exam date. Our AI calculates exactly how many chapters and practice questions you need to complete each day to finish on time with confidence."
        : "بس اپنے مضامین اور امتحان کی تاریخ منتخب کریں۔ AI روزانہ کا ٹارگٹ اور شیڈول خود ترتیب دیتا ہے تاکہ امتحان سے پہلے مکمل سلیبس دہرایا جا سکے۔"
    },
    {
      id: 8,
      q: language === 'en' ? "Can I upload my class notes or PDF slides?" : "کیا کلاس نوٹس یا سلائیڈز اپلوڈ کر سکتے ہیں؟",
      a: language === 'en'
        ? "Yes, you can upload PDF handouts, lecture slides, and past papers to chat with your documents and generate instant summaries and flashcards."
        : "جی ہاں، آپ اپنے نوٹس، لیکچر سلائیڈز اور پاسٹ پیپرز اپلوڈ کر کے ان سے سوالات پوچھ سکتے ہیں اور خلاصہ حاصل کر سکتے ہیں۔"
    }
  ];

  const handleExplainerSubmit = (e) => {
    e.preventDefault();
    setExplainerLoading(true);
    setTimeout(() => {
      if (explainerInput.toLowerCase().includes("newton")) {
        setExplainerResponse("Newton's 2nd Law states that Force = Mass × Acceleration (F = ma). Simply put: heavier things take more force to push or speed up! 🚀");
      } else {
        setExplainerResponse("Photosynthesis is how plants turn sunshine, water, and air into food and clean oxygen for us to breathe! 🌿☀️");
      }
      setExplainerLoading(false);
    }, 400);
  };

  return (
    <div className={`lz-page ${theme === 'dark' ? 'lz-dark-mode' : ''} ${language === 'ur' ? 'lz-ur-mode' : ''}`}>

      {/* =========================================================================
          1. TOP NAVIGATION BAR (Sticky, Glass, Lang + Dark/Light Mode)
         ========================================================================= */}
      <nav className={`lz-nav ${scrolled ? 'lz-nav-scrolled' : ''}`} id="top">
        <div className="lz-nav-inner">
          <Link to="/" className="lz-logo">
            <img src="/logo.png" alt="Learnozi" className="lz-logo-icon" />
            <span className="lz-logo-text">Learnozi</span>
          </Link>

          <div className="lz-nav-center">
            <a href="#features">{language === 'en' ? 'Features' : 'فیچرز'}</a>
            <a href="#how-it-works">{language === 'en' ? 'How It Works' : 'طریقہ کار'}</a>
            <a href="#why-learnozi">{language === 'en' ? 'Why Learnozi' : 'Learnozi کیوں؟'}</a>
            <a href="#testimonials">{language === 'en' ? 'Testimonials' : 'تاثرات'}</a>
            <a href="#faq">{language === 'en' ? 'FAQ' : 'سوالات'}</a>
          </div>

          <div className="lz-nav-right">
            {/* Theme Toggle Button */}
            <button 
              type="button" 
              className="lz-theme-btn" 
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle Theme">
              <span className="lz-theme-icon">{theme === 'dark' ? '☀️' : '🌙'}</span>
              <span className="lz-theme-text">{theme === 'dark' ? (t('landing.theme_light') || 'Light') : (t('landing.theme_dark') || 'Dark')}</span>
            </button>

            {/* Language Switcher Button */}
            <button 
              type="button" 
              className="lz-lang-btn" 
              onClick={toggleLanguage}
              title="Toggle Language">
              <span className="lz-globe-svg">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                </svg>
              </span>
              <span>{language === 'en' ? 'EN | اردو' : 'اردو | EN'}</span>
            </button>
            <Link to="/login" className="lz-nav-login">{t('nav.login') || 'Log In'}</Link>
            <Link to="/signup" className="lz-btn-start">
              {t('nav.signup') || 'Start Free'} →
            </Link>
          </div>
        </div>
      </nav>

      {/* =========================================================================
          2. HERO SECTION (High Impact, Glowing Gradient, Live AI Doubt Solver)
         ========================================================================= */}
      <section className="lz-hero-section">
        <div className="lz-hero-ambient-glow"></div>
        <div className="lz-hero-container">
          {/* Left Column: Exactly matching reference image */}
          <div className="lz-hero-left">
            <div className="lz-companion-badge lz-ribbon-badge">
              <span className="lz-flag-tag">🇵🇰</span>
              <span>Pakistan's #1 AI Study Companion.</span>
            </div>

            <h1 className="lz-hero-h1">
              <span>Study Smarter.</span><br />
              <span className="lz-h1-accent">Ace Every Exam.</span>
            </h1>

            <p className="lz-hero-subtitle">
              Your AI tutor, study planner, flashcards, and focus coach — tailored for the Pakistani syllabus.
            </p>

            {/* Feature Pills from Reference Screenshot */}
            <div className="lz-hero-feature-pills">
              <span className="lz-fpill lz-fpill-grey">
                <span className="lz-fpill-icon">💬</span> AI Tutor
              </span>
              <span className="lz-fpill lz-fpill-teal">
                <span className="lz-fpill-icon">📅</span> Study Planner
              </span>
              <span className="lz-fpill lz-fpill-peach">
                <span className="lz-fpill-icon">🗂️</span> Flashcards
              </span>
              <span className="lz-fpill lz-fpill-grey">
                <span className="lz-fpill-icon">⏱️</span> Focus Timer
              </span>
            </div>

            {/* CTA Buttons */}
            <div className="lz-hero-actions">
              <Link to="/signup" className="lz-btn-primary-purple">
                Start Studying Free →
              </Link>
              <a href="#how-it-works" className="lz-btn-how-works">
                Watch a Demo | How it Works →
              </a>
            </div>

            {/* Trust Checklist Row matching reference */}
            <div className="lz-trust-row lz-trust-stacked">
              <div className="lz-trust-line">
                <span className="lz-trust-item"><span className="lz-green-check">✓</span> No credit card needed</span>
                <span className="lz-trust-item"><span className="lz-green-check">✓</span> Free to start</span>
                <span className="lz-trust-item"><span className="lz-green-check">✓</span> 100% Urdu & English</span>
              </div>
              <div className="lz-trust-line">
                <span className="lz-trust-item"><span className="lz-green-check">✓</span> Pakistan Syllabus Supported <span className="lz-green-check">✓</span></span>
              </div>
            </div>

            {/* Social Proof Counter */}
            <div className="lz-social-proof">
              <div className="lz-social-avatars">
                <span className="lz-avatar-c" style={{background:'#4f46e5'}}>AR</span>
                <span className="lz-avatar-c" style={{background:'#0ea5e9'}}>AK</span>
                <span className="lz-avatar-c" style={{background:'#8b5cf6'}}>HA</span>
                <span className="lz-avatar-c" style={{background:'#10b981'}}>FN</span>
              </div>
              <div className="lz-social-caption">
                <strong>Trusted by 10,000+</strong>
                <span>Students Studying Smarter. 📈</span>
              </div>
            </div>
          </div>

          {/* Right Column: Tablet Mockup with Orbiting Floating Cards matching reference image */}
          <div className="lz-hero-right lz-hero-orbit-stage">
            {/* Ambient Cosmic Orbital Rings & Glow */}
            <div className="lz-orbit-ring lz-orbit-ring-1"></div>
            <div className="lz-orbit-ring lz-orbit-ring-2"></div>
            <div className="lz-orbit-dot lz-orbit-dot-1"></div>
            <div className="lz-orbit-dot lz-orbit-dot-2"></div>
            <div className="lz-orbit-dot lz-orbit-dot-3"></div>

            {/* Central Tablet Container */}
            <div className="lz-tablet-device">
              {/* Tablet Outer Hardware Bezel & Camera */}
              <div className="lz-tablet-camera-notch"></div>
              
              <div className="lz-tablet-screen">
                {/* Tablet Top App Bar */}
                <div className="lz-tablet-appbar">
                  <div className="lz-tablet-bot-meta">
                    <span className="lz-tablet-bot-avatar-mini">🤖</span>
                    <div>
                      <strong className="lz-tablet-bot-name">Learnozi AI</strong>
                      <span className="lz-tablet-bot-status">● Online</span>
                    </div>
                  </div>
                </div>

                {/* 3D Robot Avatar in Glowing Circular Badge */}
                <div className="lz-tablet-robot-avatar-wrap">
                  <div className="lz-robot-glow-ring"></div>
                  <img 
                    src="/assets/hero-robot-tutor.jpg" 
                    alt="Learnozi 3D AI Robot Tutor" 
                    className="lz-tablet-robot-img" 
                  />
                </div>

                {/* AI Tutor Chat Card with Newton's Cradle Visual */}
                <div className="lz-tablet-chat-card">
                  <div className="lz-tablet-chat-header">
                    <span className="lz-chat-sparkle">✨</span>
                    <strong>AI Tutor:</strong>
                  </div>
                  <p className="lz-tablet-chat-msg">
                    Got questions on Newton's Laws? Let's check this Newton's Cradle visual!
                  </p>
                  <span className="lz-tablet-chat-subnote">[Moving visual on screen] ...</span>

                  <div className="lz-tablet-visual-box">
                    <img 
                      src="/assets/hero-cradle.jpg" 
                      alt="Newton's Cradle Demonstration" 
                      className="lz-tablet-cradle-img"
                    />
                    <div className="lz-cradle-motion-tag">F = m × a</div>
                  </div>
                </div>

                {/* Bottom Chat Prompt Input */}
                <div className="lz-tablet-input-bar">
                  <span className="lz-tablet-input-placeholder">Ask a follow up...</span>
                  <button type="button" className="lz-tablet-send-btn" aria-label="Send query">
                    ➤
                  </button>
                </div>
              </div>
            </div>

            {/* 5 Floating Orbiting Cards Matching Reference Image */}

            {/* 1. Top-Left: 10 New Flashcards Created */}
            <div className="lz-float-card-orbit lz-fcard-flashcards">
              <div className="lz-fcard-fc-thumb-wrap">
                <img src="/assets/hero-flashcards.jpg" alt="Flashcards Deck" className="lz-fcard-fc-img" />
              </div>
              <div className="lz-fcard-fc-text">
                <strong>10 New Flashcards</strong>
                <span>Created.</span>
              </div>
            </div>

            {/* 2. Bottom-Left: Weekly Progress (Orange Area Chart) */}
            <div className="lz-float-card-orbit lz-fcard-progress-orange">
              <div className="lz-fcard-chart-title">Weekly Progress</div>
              <div className="lz-fcard-chart-wrap">
                <svg viewBox="0 0 140 60" className="lz-fcard-svg-chart">
                  <defs>
                    <linearGradient id="orangeChartGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f97316" stopOpacity="0.45" />
                      <stop offset="100%" stopColor="#f97316" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <text x="5" y="15" className="lz-chart-axis-txt">30</text>
                  <text x="5" y="32" className="lz-chart-axis-txt">20</text>
                  <text x="5" y="49" className="lz-chart-axis-txt">10</text>
                  <line x1="20" y1="12" x2="135" y2="12" stroke="#f1f5f9" strokeDasharray="2 2" />
                  <line x1="20" y1="30" x2="135" y2="30" stroke="#f1f5f9" strokeDasharray="2 2" />
                  <line x1="20" y1="48" x2="135" y2="48" stroke="#f1f5f9" strokeDasharray="2 2" />
                  
                  <path 
                    d="M 22 45 Q 40 38, 55 42 T 85 28 T 115 35 T 135 18 L 135 52 L 22 52 Z" 
                    fill="url(#orangeChartGrad)" 
                  />
                  <path 
                    d="M 22 45 Q 40 38, 55 42 T 85 28 T 115 35 T 135 18" 
                    fill="none" 
                    stroke="#ea580c" 
                    strokeWidth="2.5" 
                    strokeLinecap="round" 
                  />
                </svg>
                <div className="lz-chart-x-labels">
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                </div>
              </div>
            </div>

            {/* 3. Top-Right: Weekly Progress (Blue Smooth Wave) */}
            <div className="lz-float-card-orbit lz-fcard-progress-blue">
              <div className="lz-fcard-chart-title">Weekly Progress</div>
              <div className="lz-fcard-chart-wrap">
                <svg viewBox="0 0 140 60" className="lz-fcard-svg-chart">
                  <defs>
                    <linearGradient id="blueChartGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <text x="5" y="14" className="lz-chart-axis-txt">300</text>
                  <text x="5" y="29" className="lz-chart-axis-txt">200</text>
                  <text x="5" y="44" className="lz-chart-axis-txt">100</text>
                  <text x="5" y="56" className="lz-chart-axis-txt">0</text>
                  <line x1="24" y1="12" x2="135" y2="12" stroke="#f1f5f9" strokeDasharray="2 2" />
                  <line x1="24" y1="27" x2="135" y2="27" stroke="#f1f5f9" strokeDasharray="2 2" />
                  <line x1="24" y1="42" x2="135" y2="42" stroke="#f1f5f9" strokeDasharray="2 2" />

                  <path 
                    d="M 25 50 C 45 48, 60 22, 80 35 C 100 48, 115 15, 135 22 L 135 56 L 25 56 Z" 
                    fill="url(#blueChartGrad)" 
                  />
                  <path 
                    d="M 25 50 C 45 48, 60 22, 80 35 C 100 48, 115 15, 135 22" 
                    fill="none" 
                    stroke="#2563eb" 
                    strokeWidth="2.5" 
                    strokeLinecap="round" 
                  />
                </svg>
                <div className="lz-chart-x-labels">
                  <span>Jan</span>
                  <span>Wed</span>
                  <span>Tue</span>
                </div>
              </div>
            </div>

            {/* 4. Middle-Right: Physics Newton's 2nd Law pill */}
            <div className="lz-float-card-orbit lz-fcard-physics">
              <strong>Physics — Newton's 2nd Law: F=ma</strong>
              <small>with illustration.</small>
            </div>

            {/* 5. Bottom-Right: Biology Animal Cell Card */}
            <div className="lz-float-card-orbit lz-fcard-biology">
              <div className="lz-fcard-bio-title">Biology</div>
              <div className="lz-fcard-bio-thumb">
                <img src="/assets/hero-cell.jpg" alt="Biology Cell Diagram" className="lz-fcard-cell-img" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. STATS BAR (Exact 4 cards from screenshot)
         ========================================================================= */}
      <section className="lz-stats-section">
        <div className="lz-stats-grid">
          <div className="lz-stat-item">
            <span className="lz-stat-icon">⚙️</span>
            <div>
              <h3 className="lz-stat-num">6+</h3>
              <p className="lz-stat-label">AI Study Tools</p>
            </div>
          </div>
          <div className="lz-stat-item">
            <span className="lz-stat-icon">🗣️</span>
            <div>
              <h3 className="lz-stat-num">English + Urdu</h3>
              <p className="lz-stat-label">Language Support</p>
            </div>
          </div>
          <div className="lz-stat-item">
            <span className="lz-stat-icon">🎁</span>
            <div>
              <h3 className="lz-stat-num">100% Free</h3>
              <p className="lz-stat-label">Basic Plan</p>
            </div>
          </div>
          <div className="lz-stat-item">
            <span className="lz-stat-icon">🎧</span>
            <div>
              <h3 className="lz-stat-num">24/7</h3>
              <p className="lz-stat-label">AI Tutor Available</p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. "OUR FEATURES - Everything a student needs in one place" (6 Cards)
         ========================================================================= */}
      <section className="lz-features-section" id="features">
        <div className="lz-section-title-wrap">
          <span className="lz-category-badge">OUR FEATURES</span>
          <h2 className="lz-section-heading">Everything a student needs<br />in one place</h2>
          <p className="lz-section-desc">
            From understanding difficult concepts to staying on track — Learnozi has everything you need to succeed.
          </p>

          {/* Hand-drawn doodle note on top right */}
          <div className="lz-features-doodle">
            <svg width="40" height="40" viewBox="0 0 50 50" fill="none">
              <path d="M10 40 C 20 20, 30 10, 42 6 M 42 6 L 30 6 M 42 6 L 42 18" stroke="#818cf8" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
            <span>All core study tools are free to use!</span>
          </div>
        </div>

        <div className="lz-features-grid">
          {/* Card 1: AI Concept Explainer */}
          <div className="lz-fcard">
            <div className="lz-fcard-icon">💡</div>
            <h3 className="lz-fcard-title">AI Concept Explainer</h3>
            <p className="lz-fcard-desc">Stuck on a topic? Ask Learnozi.</p>
            <form onSubmit={handleExplainerSubmit} className="lz-fcard-widget lz-explainer-widget">
              <input 
                type="text" 
                value={explainerInput}
                onChange={(e) => setExplainerInput(e.target.value)}
                className="lz-explainer-input"
              />
              <button type="submit" className="lz-btn-purple-widget">
                {explainerLoading ? '...' : 'Ask Learnozi →'}
              </button>
              {explainerResponse && (
                <div className="lz-explainer-result">
                  <small>🤖 Learnozi:</small>
                  <p>{explainerResponse}</p>
                </div>
              )}
            </form>
          </div>

          {/* Card 2: AI Flashcards */}
          <div className="lz-fcard">
            <div className="lz-fcard-icon">🗂️</div>
            <h3 className="lz-fcard-title">AI Flashcards</h3>
            <p className="lz-fcard-desc">Turn your notes into smart flashcards and quiz yourself anytime.</p>
            <div className="lz-fcard-widget lz-flashcard-widget">
              <div 
                className={`lz-card-flip-box ${flashcardFlipped ? 'flipped' : ''}`}
                onClick={() => setFlashcardFlipped(prev => !prev)}>
                {!flashcardFlipped ? (
                  <div className="lz-flip-face front">
                    <span className="lz-tiny-hint">Question</span>
                    <strong>Newton's 2nd Law</strong>
                  </div>
                ) : (
                  <div className="lz-flip-face back">
                    <span className="lz-tiny-hint">Formula & Definition</span>
                    <strong className="lz-formula-text">F = ma</strong>
                    <small>Force = Mass × Acceleration</small>
                  </div>
                )}
              </div>
              <button 
                type="button" 
                className="lz-btn-text-link"
                onClick={() => setFlashcardFlipped(prev => !prev)}>
                {flashcardFlipped ? 'Show Term ↺' : 'Test Me →'}
              </button>
            </div>
          </div>

          {/* Card 3: Smart Study Planner */}
          <div className="lz-fcard">
            <div className="lz-fcard-icon">📅</div>
            <h3 className="lz-fcard-title">Smart Study Planner</h3>
            <p className="lz-fcard-desc">Get a personalized study plan based on your subjects and exam dates.</p>
            <div className="lz-fcard-widget lz-planner-widget">
              <div className="lz-planner-header">
                <strong>Today</strong>
              </div>
              <div className="lz-planner-task-list">
                {plannerTasks.map(task => (
                  <div 
                    key={task.id} 
                    className={`lz-ptask-item ${task.done ? 'done' : ''}`}
                    onClick={() => togglePlannerTask(task.id)}>
                    <span className="lz-ptask-box">{task.done ? '☑' : '☐'}</span>
                    <span className="lz-ptask-title">{task.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Card 4: Pomodoro Focus Timer */}
          <div className="lz-fcard">
            <div className="lz-fcard-icon">⏱️</div>
            <h3 className="lz-fcard-title">Pomodoro Focus Timer</h3>
            <p className="lz-fcard-desc">Study for 25 mins, break for 5 mins. Build better focus and habits.</p>
            <div className="lz-fcard-widget lz-timer-widget">
              <div className="lz-circle-timer-dial">
                <span className="lz-dial-digits">{formatTimerDigits(timerSeconds)}</span>
              </div>
              <button 
                type="button" 
                className="lz-btn-purple-widget lz-btn-timer-start"
                onClick={toggleTimer}>
                {timerRunning ? 'Pause' : 'Start'}
              </button>
            </div>
          </div>

          {/* Card 5: Progress Dashboard */}
          <div className="lz-fcard">
            <div className="lz-fcard-icon">📊</div>
            <h3 className="lz-fcard-title">Progress Dashboard</h3>
            <p className="lz-fcard-desc">Track your progress, see your strengths and stay motivated.</p>
            <div className="lz-fcard-widget lz-dashboard-widget">
              <div className="lz-dash-head">
                <strong>Weekly Progress</strong>
              </div>
              <div className="lz-dash-bars-wrap">
                <div className="lz-dbar-row">
                  <span className="lz-subj-name">Physics</span>
                  <div className="lz-dbar-track">
                    <div className="lz-dbar-fill" style={{width: '80%', background: '#10b981'}} />
                  </div>
                  <span className="lz-subj-pct">80%</span>
                </div>
                <div className="lz-dbar-row">
                  <span className="lz-subj-name">Math</span>
                  <div className="lz-dbar-track">
                    <div className="lz-dbar-fill" style={{width: '62%', background: '#ef4444'}} />
                  </div>
                  <span className="lz-subj-pct">62%</span>
                </div>
                <div className="lz-dbar-row">
                  <span className="lz-subj-name">Chemistry</span>
                  <div className="lz-dbar-track">
                    <div className="lz-dbar-fill" style={{width: '90%', background: '#4f46e5'}} />
                  </div>
                  <span className="lz-subj-pct">90%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 6: Pakistan Curriculum Focused */}
          <div className="lz-fcard">
            <div className="lz-fcard-icon">🎓</div>
            <h3 className="lz-fcard-title">Pakistan Curriculum Focused</h3>
            <p className="lz-fcard-desc">Ideal for Matric, FSc, MDCAT, CSS — perfectly aligned with Pakistani syllabus.</p>
            <div className="lz-fcard-widget lz-curriculum-widget">
              <div className="lz-curriculum-pills">
                {['Matric', 'FSc', 'MDCAT', 'ECAT', 'CSS', 'University'].map(b => (
                  <button 
                    key={b}
                    type="button"
                    className={`lz-curric-pill ${activeCurriculum === b ? 'active' : ''}`}
                    onClick={() => setActiveCurriculum(b)}>
                    {b}
                  </button>
                ))}
              </div>
              <div className="lz-curric-preview-note">
                <span>✓ {activeCurriculum} textbook chapters & past paper pattern aligned</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          5. HOW IT WORKS (3 Simple Steps)
         ========================================================================= */}
      <section className="lz-how-section" id="how-it-works">
        <div className="lz-section-title-wrap">
          <span className="lz-category-badge">HOW IT WORKS</span>
          <h2 className="lz-section-heading">Get started in 3 simple steps</h2>
          <p className="lz-section-desc">It only takes a minute to set up. Let's get you on your way!</p>

          <div className="lz-how-doodle">
            <svg width="40" height="40" viewBox="0 0 50 50" fill="none">
              <path d="M10 40 C 20 20, 30 10, 42 6 M 42 6 L 30 6 M 42 6 L 42 18" stroke="#818cf8" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
            <span>Your goals. Our AI. Better results.</span>
          </div>
        </div>

        <div className="lz-how-steps-grid">
          {/* Step 01 */}
          <div className="lz-hstep">
            <div className="lz-hstep-icon">👤</div>
            <div className="lz-hstep-number">01</div>
            <h3 className="lz-hstep-title">Tell us what you're studying</h3>
            <p className="lz-hstep-desc">Add your class, subjects, exam and syllabus.</p>
            <div className="lz-hstep-connector">→</div>
          </div>

          {/* Step 02 */}
          <div className="lz-hstep">
            <div className="lz-hstep-icon">📋</div>
            <div className="lz-hstep-number">02</div>
            <h3 className="lz-hstep-title">Get your personalized plan</h3>
            <p className="lz-hstep-desc">AI creates your study roadmap and suggests the best tools.</p>
            <div className="lz-hstep-connector">→</div>
          </div>

          {/* Step 03 */}
          <div className="lz-hstep">
            <div className="lz-hstep-icon">🚀</div>
            <div className="lz-hstep-number">03</div>
            <h3 className="lz-hstep-title">Study with your AI companion</h3>
            <p className="lz-hstep-desc">Learn, practice, track progress and reach your goals.</p>
          </div>
        </div>
      </section>

      {/* =========================================================================
          6. BUILT FOR PAKISTANI STUDENTS (Exact Layout & Image from screenshot)
         ========================================================================= */}
      <section className="lz-pakistani-section">
        <div className="lz-pakistani-container">
          <div className="lz-pakistani-left">
            <span className="lz-category-badge">BUILT FOR PAKISTANI STUDENTS</span>
            <h2 className="lz-pakistani-heading">Built for how Pakistani students actually study.</h2>
            <p className="lz-pakistani-desc">
              From Matric and FSc to MDCAT, ECAT and university exams, Learnozi helps you study around your subjects, syllabus and goals.
            </p>
            <div className="lz-board-pills-row">
              {['Matric', 'FSc', 'MDCAT', 'ECAT', 'CSS', 'University'].map(b => (
                <span key={b} className="lz-board-pill-tag">{b}</span>
              ))}
            </div>
          </div>

          <div className="lz-pakistani-right">
            <div className="lz-student-image-frame">
              <img 
                src="/images/student-study.jpg" 
                alt="Pakistani Student studying with Learnozi" 
                className="lz-student-photo" 
              />
              <div className="lz-student-doodle-flag">
                <span className="lz-flag-emoji">🇵🇰</span>
                <span className="lz-flag-tagline">Same dreams. Smarter tools.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          7. "WHY CHOOSE LEARNOZI" (Featuring ChatGPT and Others Comparison!)
         ========================================================================= */}
      <section className="lz-why-section" id="why-learnozi">
        <div className="lz-why-container">
          <div className="lz-why-top-layout">
            <div className="lz-why-left-content">
              <span className="lz-category-badge">WHY CHOOSE LEARNOZI</span>
              <h2 className="lz-why-heading">Designed for your success.</h2>
              <p className="lz-why-desc">
                More than just answers — Learnozi helps you build better study habits, deeper understanding and real results.
              </p>

              {/* 5 Core Feature Pillars */}
              <div className="lz-pillars-horizontal">
                <div className="lz-pillar-item">
                  <span className="lz-pillar-icon">📚</span>
                  <span className="lz-pillar-text">Syllabus-aware content</span>
                </div>
                <div className="lz-pillar-item">
                  <span className="lz-pillar-icon">🗣️</span>
                  <span className="lz-pillar-text">Local language support</span>
                </div>
                <div className="lz-pillar-item">
                  <span className="lz-pillar-icon">📋</span>
                  <span className="lz-pillar-text">Personalized study plans</span>
                </div>
                <div className="lz-pillar-item">
                  <span className="lz-pillar-icon">📈</span>
                  <span className="lz-pillar-text">Track your progress</span>
                </div>
                <div className="lz-pillar-item">
                  <span className="lz-pillar-icon">⏱️</span>
                  <span className="lz-pillar-text">Stay consistent with streaks</span>
                </div>
              </div>
            </div>

            {/* Right Card: Student Progress Review Card from Screenshot */}
            <div className="lz-why-right-card">
              <div className="lz-student-review-card">
                <div className="lz-review-card-top">
                  <small>Student Progress</small>
                </div>
                <div className="lz-review-author-row">
                  <div className="lz-review-avatar">👩‍🎓</div>
                  <div>
                    <strong>Ayesha Khan</strong>
                    <span>FSc — Pre-Medical</span>
                  </div>
                  <span className="lz-streak-tag-small">🔥 7 day streak</span>
                </div>
                <p className="lz-review-quote">
                  "Learnozi has made my study routine so much easier. The flashcards and study plan are a game changer!"
                </p>
                <div className="lz-review-stars">
                  ⭐⭐⭐⭐⭐
                </div>
              </div>
            </div>
          </div>

          {/* =========================================================================
              DIRECT COMPARISON MATRIX (USER SPECIAL REQUEST: inside why choose learnozi)
             ========================================================================= */}
          <div className="lz-comparison-card-integrated" id="comparison">
            <div className="lz-comp-headline">
              <span className="lz-comp-badge">LEARNOZI VS CHATGPT & OTHERS</span>
              <h3>Why choose Learnozi over generic AI & academies?</h3>
              <p>See how a purpose-built study operating system gives Pakistani students an unfair advantage:</p>
            </div>

            <div className="lz-comp-table-container">
              <table className="lz-comp-table">
                <thead>
                  <tr>
                    <th className="lz-th-feature">Feature & Capability</th>
                    <th className="lz-th-learnozi">
                      <span className="lz-recom-chip">👑 WINNER</span>
                      <strong>Learnozi 🇵🇰</strong>
                      <small>All-in-One Study OS</small>
                    </th>
                    <th className="lz-th-chatgpt">
                      <strong>ChatGPT</strong>
                      <small>Generic Chatbot</small>
                    </th>
                    <th className="lz-th-tuition">
                      <strong>Academies / Tuition</strong>
                      <small>KIPS, STEP, Stars</small>
                    </th>
                    <th className="lz-th-youtube">
                      <strong>YouTube & Web</strong>
                      <small>Self-Search</small>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="lz-td-name">
                      <strong>Pakistani Board Syllabus Aligned</strong>
                      <small>FBISE, Punjab, Sindh, KPK & Balochistan</small>
                    </td>
                    <td className="lz-td-col-learnozi">
                      <span className="lz-pill-win">✅ 100% Board Aligned</span>
                      <p>Built specifically for local textbooks & past papers</p>
                    </td>
                    <td>
                      <span className="lz-pill-part">⚠️ Generic Global</span>
                      <p>Often gives US/UK curriculum answers out of syllabus</p>
                    </td>
                    <td>
                      <span className="lz-pill-part">⚠️ Rigid Pacing</span>
                      <p>Fixed batch speed, cannot review on demand</p>
                    </td>
                    <td>
                      <span className="lz-pill-lose">❌ Scattered</span>
                      <p>Hard to find videos matching your exact board</p>
                    </td>
                  </tr>

                  <tr>
                    <td className="lz-td-name">
                      <strong>Entry Test Prep (MDCAT / ECAT / CSS)</strong>
                      <small>Targeted past papers & high-yield MCQs</small>
                    </td>
                    <td className="lz-td-col-learnozi">
                      <span className="lz-pill-win">✅ Built-in Drills</span>
                      <p>Instant concept breakdown with exam past paper pattern</p>
                    </td>
                    <td>
                      <span className="lz-pill-part">⚠️ No Test Bank</span>
                      <p>Answers isolated prompts but lacks test series</p>
                    </td>
                    <td>
                      <span className="lz-pill-part">⚠️ High Pressure</span>
                      <p>Crowded 80+ student rooms, limited individual help</p>
                    </td>
                    <td>
                      <span className="lz-pill-lose">❌ Passive Watching</span>
                      <p>Watching videos gives false illusion of mastery</p>
                    </td>
                  </tr>

                  <tr>
                    <td className="lz-td-name">
                      <strong>Urdu & Roman Urdu Native Support</strong>
                      <small>"Aasan lafzon mein samjhao" mode</small>
                    </td>
                    <td className="lz-td-col-learnozi">
                      <span className="lz-pill-win">✅ Native Bilingual</span>
                      <p>Natural conversational Urdu & Roman Urdu explanations</p>
                    </td>
                    <td>
                      <span className="lz-pill-part">⚠️ Robotic Urdu</span>
                      <p>Literal dictionary translations that sound stiff</p>
                    </td>
                    <td>
                      <span className="lz-pill-part">⚠️ Teacher Dependent</span>
                      <p>Depends completely on individual tutor style</p>
                    </td>
                    <td>
                      <span className="lz-pill-part">⚠️ 45-Min Lectures</span>
                      <p>Wastes 40 mins of video for a 2-min doubt</p>
                    </td>
                  </tr>

                  <tr>
                    <td className="lz-td-name">
                      <strong>1-Click AI Flashcards & Spaced Repetition</strong>
                      <small>Active recall system for quick memorization</small>
                    </td>
                    <td className="lz-td-col-learnozi">
                      <span className="lz-pill-win">✅ Instant 1-Click</span>
                      <p>Generates active recall flashcards from any topic</p>
                    </td>
                    <td>
                      <span className="lz-pill-lose">❌ Manual Prompting</span>
                      <p>Must write prompts and copy to Anki/Quizlet manually</p>
                    </td>
                    <td>
                      <span className="lz-pill-lose">❌ None</span>
                      <p>Paper notes get misplaced easily</p>
                    </td>
                    <td>
                      <span className="lz-pill-lose">❌ None</span>
                      <p>No active testing system</p>
                    </td>
                  </tr>

                  <tr>
                    <td className="lz-td-name">
                      <strong>Adaptive Daily Study Planner</strong>
                      <small>Schedules daily milestones till exam date</small>
                    </td>
                    <td className="lz-td-col-learnozi">
                      <span className="lz-pill-win">✅ Automated Timetable</span>
                      <p>Schedules daily chapters to finish syllabus before exam</p>
                    </td>
                    <td>
                      <span className="lz-pill-lose">❌ None</span>
                      <p>Static text replies, zero timeline or reminders</p>
                    </td>
                    <td>
                      <span className="lz-pill-part">⚠️ Generic Batch</span>
                      <p>Rigid timetable with no personal flexibility</p>
                    </td>
                    <td>
                      <span className="lz-pill-lose">❌ No Roadmap</span>
                      <p>Students get overwhelmed by 1,000s of videos</p>
                    </td>
                  </tr>

                  <tr>
                    <td className="lz-td-name">
                      <strong>Pomodoro Focus Room & Streaks</strong>
                      <small>Built-in timer to build daily habits</small>
                    </td>
                    <td className="lz-td-col-learnozi">
                      <span className="lz-pill-win">✅ Habit Coaching</span>
                      <p>25/5 intervals with streak badges & study logs</p>
                    </td>
                    <td>
                      <span className="lz-pill-lose">❌ None</span>
                      <p>Must use third-party apps</p>
                    </td>
                    <td>
                      <span className="lz-pill-lose">❌ None</span>
                      <p>No focus tracking</p>
                    </td>
                    <td>
                      <span className="lz-pill-lose">❌ Distraction Trap</span>
                      <p>Full of clickbait, ads, and YouTube Shorts</p>
                    </td>
                  </tr>

                  <tr>
                    <td className="lz-td-name">
                      <strong>Monthly Cost & Accessibility</strong>
                      <small>Affordable for every Pakistani student</small>
                    </td>
                    <td className="lz-td-col-learnozi">
                      <span className="lz-pill-win">💚 100% Free Plan</span>
                      <p>Free to start, no credit card required</p>
                    </td>
                    <td>
                      <span className="lz-pill-lose">❌ $20 / month</span>
                      <p>~PKR 5,600/month with international card</p>
                    </td>
                    <td>
                      <span className="lz-pill-lose">❌ PKR 15k – 40k / mo</span>
                      <p>Heavy tuition fees + daily commute costs</p>
                    </td>
                    <td>
                      <span className="lz-pill-part">⚠️ Free but Costly</span>
                      <p>Wastes 100s of hours with zero accountability</p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          8. STUDENT STORIES (Loved by Students Across Pakistan 🇵🇰) - Single Line Marquee
         ========================================================================= */}
      <section className="lz-testimonials-section" id="testimonials">
        <div className="lz-testimonials-header">
          <div>
            <span className="lz-category-badge">{t('landing.testimonials_badge')}</span>
            <h2 className="lz-section-heading">{t('landing.testimonials_title')}</h2>
            <p className="lz-testimonials-subtitle">
              {language === 'ur' 
                ? 'ہزاروں طلباء نے Learnozi کے ساتھ اپنے درجات اور اسٹڈی عادات کو بہتر بنایا ہے' 
                : 'Real Pakistani students crushing their board and university exams with Learnozi'}
            </p>
          </div>
          <div className="lz-testimonials-actions">
            <button 
              type="button" 
              className="lz-btn-add-review"
              onClick={() => setIsReviewModalOpen(true)}>
              <span>⭐</span>
              <span>{t('landing.testimonials_add_btn')}</span>
            </button>
            <a href="#top" className="lz-real-results-link">{t('landing.testimonials_link')}</a>
          </div>
        </div>

        {reviewSuccess && (
          <div className="lz-review-success-banner">
            <div className="lz-success-content">
              <span>{reviewSuccess}</span>
            </div>
            <button 
              type="button" 
              className="lz-close-banner-btn" 
              onClick={() => setReviewSuccess('')}>
              ✕
            </button>
          </div>
        )}

        {/* Continuous Single-Line Scrolling Marquee */}
        <div className="lz-testimonials-marquee-wrapper" aria-label="Student Reviews Carousel">
          <div className="lz-testimonials-marquee-track">
            {[...reviews, ...reviews].map((rev, idx) => (
              <div key={`${rev.id}-${idx}`} className={`lz-tcard lz-tcard-marquee ${rev.isNew ? 'lz-tcard-new' : ''}`}>
                <div className="lz-tcard-top-meta">
                  <div className="lz-tcard-stars">
                    {Array.from({ length: rev.rating || 5 }).map((_, i) => (
                      <span key={i} className="lz-star-icon">★</span>
                    ))}
                  </div>
                  {rev.feature && <span className="lz-tcard-feat-tag">{rev.feature}</span>}
                </div>

                <p className="lz-tcard-quote">{rev.quote}</p>

                <div className="lz-tcard-author">
                  {rev.avatarImg ? (
                    <img src={rev.avatarImg} alt={rev.name} className="lz-tauthor-img" />
                  ) : (
                    <div className="lz-tauthor-avatar" style={{ background: rev.color || '#4f46e5' }}>
                      {rev.avatar}
                    </div>
                  )}
                  <div className="lz-tauthor-info">
                    <strong>{rev.name}</strong>
                    <span>{rev.institute}</span>
                    <span className="lz-verified-badge">
                      {rev.isNew ? '🌟 Just Added' : '✓ Verified Student'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          9. FREQUENTLY ASKED QUESTIONS (2-Column Grid matching screenshot)
         ========================================================================= */}
      <section className="lz-faq-section" id="faq">
        <div className="lz-faq-container">
          <div className="lz-faq-left">
            <span className="lz-category-badge">FAQ</span>
            <h2 className="lz-section-heading">Frequently Asked Questions</h2>
            <p className="lz-section-desc">Find quick answers to common questions.</p>
          </div>

          <div className="lz-faq-right">
            <div className="lz-faq-2col-grid">
              {/* Column 1 */}
              <div className="lz-faq-column">
                {faqListCol1.map((item) => (
                  <div 
                    key={item.id} 
                    className={`lz-faq-accordion-item ${expandedFaq === item.id ? 'open' : ''}`}
                    onClick={() => toggleFaq(item.id)}>
                    <div className="lz-faq-q-row">
                      <span>{item.q}</span>
                      <span className="lz-faq-chevron">{expandedFaq === item.id ? '▴' : '▾'}</span>
                    </div>
                    {expandedFaq === item.id && (
                      <div className="lz-faq-ans-body">
                        <p>{item.a}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Column 2 */}
              <div className="lz-faq-column">
                {faqListCol2.map((item) => (
                  <div 
                    key={item.id} 
                    className={`lz-faq-accordion-item ${expandedFaq === item.id ? 'open' : ''}`}
                    onClick={() => toggleFaq(item.id)}>
                    <div className="lz-faq-q-row">
                      <span>{item.q}</span>
                      <span className="lz-faq-chevron">{expandedFaq === item.id ? '▴' : '▾'}</span>
                    </div>
                    {expandedFaq === item.id && (
                      <div className="lz-faq-ans-body">
                        <p>{item.a}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          10. PRE-FOOTER BANNER (3D Stack of Books with Cap, White CTA & Doodle)
         ========================================================================= */}
      <section className="lz-prefooter-banner-section">
        <div className="lz-banner-card">
          <div className="lz-banner-left-graphic">
            <img 
              src="/images/books-cap.jpg" 
              alt="Start studying smarter with Learnozi" 
              className="lz-banner-clay-books" 
            />
          </div>

          <div className="lz-banner-center-content">
            <h2 className="lz-banner-heading">Your smarter study journey<br />starts here.</h2>
            <p className="lz-banner-sub">Free to start. No credit card required.</p>
            <Link to="/signup" className="lz-btn-white-cta">
              Create Free Account →
            </Link>
          </div>

          <div className="lz-banner-right-doodle">
            <span className="lz-banner-handwritten">Better habits.<br />Brighter future. ✨</span>
            <svg width="60" height="35" viewBox="0 0 70 40" fill="none">
              <path d="M10 20 C 30 35, 55 25, 65 10" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round"/>
              <path d="M55 12 L 65 10 L 62 20" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </section>

      {/* =========================================================================
          11. FOOTER (Exact Layout from screenshot)
         ========================================================================= */}
      <footer className="lz-footer">
        <div className="lz-footer-container">
          <div className="lz-footer-col-brand">
            <Link to="/" className="lz-logo" style={{marginBottom: '0.8rem'}}>
              <img src="/logo.png" alt="Learnozi" className="lz-logo-icon" />
              <span className="lz-logo-text" style={{color: '#ffffff'}}>Learnozi</span>
            </Link>
            <p className="lz-footer-motto">
              Pakistan's AI study companion<br />for better results.
            </p>
            <div className="lz-social-icon-row">
              <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook">📘</a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram">📸</a>
              <a href="https://youtube.com" target="_blank" rel="noreferrer" aria-label="YouTube">▶️</a>
              <a href="https://tiktok.com" target="_blank" rel="noreferrer" aria-label="TikTok">🎵</a>
              <a href="https://x.com" target="_blank" rel="noreferrer" aria-label="X">𝕏</a>
            </div>
          </div>

          <div className="lz-footer-col">
            <h4>Product</h4>
            <a href="#features">Features</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#why-learnozi">Why Learnozi</a>
            <a href="#comparison">Pricing</a>
            <a href="#faq">FAQs</a>
          </div>

          <div className="lz-footer-col">
            <h4>Resources</h4>
            <Link to="/signup">Study Tips</Link>
            <Link to="/signup">Blog</Link>
            <Link to="/signup">Help Center</Link>
          </div>

          <div className="lz-footer-col">
            <h4>Company</h4>
            <Link to="/login">About</Link>
            <a href="mailto:support@learnozi.com">Contact</a>
            <Link to="/login">Privacy</Link>
            <Link to="/login">Terms</Link>
          </div>

          <div className="lz-footer-col-made">
            <div className="lz-pakistan-seal">
              <span className="lz-pak-flag">🇵🇰</span>
              <span>Made in Pakistan 🇵🇰</span>
            </div>
            <p className="lz-copyright-text">
              © {new Date().getFullYear()} Learnozi. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* =========================================================================
          11. ADD REVIEW MODAL (Accessible, Interactive, Localized)
         ========================================================================= */}
      {/* =========================================================================
          11. WRITE A REVIEW MODAL (With Optional Photo Upload & Modern UI)
         ========================================================================= */}
      {isReviewModalOpen && (
        <div className="lz-modal-backdrop" onClick={() => setIsReviewModalOpen(false)}>
          <div className="lz-modal-dialog lz-review-modal-modern" onClick={(e) => e.stopPropagation()}>
            <div className="lz-modal-header">
              <div className="lz-modal-header-left">
                <div className="lz-modal-avatar-badge">✍️</div>
                <div>
                  <h3 className="lz-modal-title">{t('landing.review_modal_title')}</h3>
                  <p className="lz-modal-sub">
                    {language === 'ur'
                      ? 'اپنا حقیقی تجربہ شیئر کریں اور پاکستانی طلباء کو متاثر کریں'
                      : 'Share your real experience & inspire students across Pakistan'}
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                className="lz-modal-close" 
                onClick={() => setIsReviewModalOpen(false)}
                aria-label="Close modal">
                ✕
              </button>
            </div>

            <form onSubmit={handleReviewSubmit} className="lz-modal-form">
              {reviewError && (
                <div className="lz-modal-error-alert">{reviewError}</div>
              )}

              <div className="lz-form-row-2col">
                <div className="lz-form-col">
                  <label className="lz-form-label">{t('landing.review_name_label')}</label>
                  <input 
                    type="text" 
                    className="lz-form-input" 
                    placeholder={t('landing.review_name_placeholder')}
                    value={reviewName}
                    onChange={(e) => setReviewName(e.target.value)}
                    maxLength={50}
                    required
                  />
                </div>

                <div className="lz-form-col">
                  <label className="lz-form-label">{t('landing.review_inst_label')}</label>
                  <input 
                    type="text" 
                    className="lz-form-input" 
                    placeholder={t('landing.review_inst_placeholder')}
                    value={reviewInstitute}
                    onChange={(e) => setReviewInstitute(e.target.value)}
                    maxLength={60}
                  />
                </div>
              </div>

              {/* Optional Student Photo Upload */}
              <div className="lz-form-row lz-photo-upload-row">
                <div className="lz-photo-label-row">
                  <label className="lz-form-label">{t('landing.review_photo_label') || 'Student Photo'}</label>
                  <span className="lz-photo-optional-tag">{t('landing.review_photo_optional') || 'Optional'}</span>
                </div>
                
                {reviewImgPreview ? (
                  <div className="lz-photo-preview-box">
                    <img src={reviewImgPreview} alt="Student Preview" className="lz-photo-thumb" />
                    <div className="lz-photo-meta">
                      <span className="lz-photo-success-txt">✓ Photo uploaded</span>
                      <button 
                        type="button" 
                        className="lz-btn-photo-remove" 
                        onClick={handleRemoveImage}>
                        {t('landing.review_photo_remove') || 'Remove Photo'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="lz-photo-uploader-label">
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="lz-file-input" 
                      onChange={handleImageUpload}
                    />
                    <div className="lz-uploader-content">
                      <span className="lz-uploader-icon">📷</span>
                      <div>
                        <strong>{t('landing.review_photo_upload_btn') || 'Click to select profile picture'}</strong>
                        <p>{t('landing.review_photo_help') || 'PNG, JPG or WebP (max 2.5MB)'}</p>
                      </div>
                    </div>
                  </label>
                )}
              </div>

              <div className="lz-form-row-2col">
                <div className="lz-form-col">
                  <label className="lz-form-label">{t('landing.review_rating_label')}</label>
                  <div className="lz-star-picker">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className={`lz-star-picker-btn ${star <= reviewRating ? 'active' : ''}`}
                        onClick={() => setReviewRating(star)}>
                        ★
                      </button>
                    ))}
                    <span className="lz-star-score-text">{reviewRating} / 5</span>
                  </div>
                </div>

                <div className="lz-form-col">
                  <label className="lz-form-label">{t('landing.review_feature_label')}</label>
                  <select 
                    className="lz-form-select"
                    value={reviewFeature}
                    onChange={(e) => setReviewFeature(e.target.value)}>
                    <option value="All Features">{t('landing.review_feature_all')}</option>
                    <option value="AI Explainer">{t('landing.review_feature_ai')}</option>
                    <option value="Flashcards">{t('landing.review_feature_flashcards')}</option>
                    <option value="Study Planner">{t('landing.review_feature_planner')}</option>
                    <option value="Pomodoro Room">{t('landing.review_feature_pomodoro')}</option>
                  </select>
                </div>
              </div>

              <div className="lz-form-row">
                <label className="lz-form-label">{t('landing.review_text_label')}</label>
                <textarea 
                  className="lz-form-textarea" 
                  rows="3"
                  placeholder={t('landing.review_text_placeholder')}
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  maxLength={300}
                  required
                />
                <div className="lz-char-counter">{reviewText.length} / 300</div>
              </div>

              <div className="lz-modal-footer">
                <button 
                  type="button" 
                  className="lz-btn-modal-cancel"
                  onClick={() => setIsReviewModalOpen(false)}>
                  {t('landing.review_cancel_btn')}
                </button>
                <button 
                  type="submit" 
                  className="lz-btn-modal-submit">
                  {t('landing.review_submit_btn')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
