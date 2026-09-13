import { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import './Flashcards.css';

export default function Flashcards() {
  const toast = useToast();
  const { user } = useAuth();

  const [decks, setDecks] = useState([]);
  const [activeDeckId, setActiveDeckId] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);

  // AI Generator Modal state
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [aiSubject, setAiSubject] = useState('General');
  const [aiCount, setAiCount] = useState(5);
  const [aiNotes, setAiNotes] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Manual Deck Modal state
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualTitle, setManualTitle] = useState('');
  const [manualSubject, setManualSubject] = useState('General');
  const [manualCards, setManualCards] = useState([
    { question: '', answer: '' },
    { question: '', answer: '' }
  ]);
  const [isSavingManual, setIsSavingManual] = useState(false);

  // 1. Fetch decks on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    axios
      .get('/api/flashcards', { headers, timeout: 5000 })
      .then((res) => {
        const fetchedDecks = res.data?.sets || [];
        setDecks(fetchedDecks);
        if (fetchedDecks.length > 0) {
          setActiveDeckId(fetchedDecks[0].id);
        }
      })
      .catch((err) => {
        console.warn('Flashcards fetch error:', err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const activeDeck = decks.find((d) => d.id === activeDeckId) || decks[0] || null;
  const cards = activeDeck?.cards || [];
  const currentCard = cards[currentIndex] || cards[0] || null;

  const handleNext = () => {
    if (cards.length === 0) return;
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % cards.length);
  };

  const handlePrev = () => {
    if (cards.length === 0) return;
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
  };

  // 2. Rate confidence for current card
  const handleRateCard = async (masteryRating) => {
    if (!activeDeck || !currentCard) return;

    // Optimistic UI update
    const updatedCards = [...cards];
    updatedCards[currentIndex] = { ...currentCard, mastery: masteryRating };

    const totalPoints = updatedCards.reduce((acc, c) => {
      if (c.mastery === 'Easy') return acc + 100;
      if (c.mastery === 'Medium') return acc + 50;
      return acc;
    }, 0);
    const newProgress = Math.round(totalPoints / updatedCards.length);

    setDecks((prevDecks) =>
      prevDecks.map((d) =>
        d.id === activeDeck.id ? { ...d, cards: updatedCards, progress: newProgress } : d
      )
    );

    // Call PATCH API
    const token = localStorage.getItem('token');
    if (token) {
      try {
        await axios.patch(
          '/api/flashcards',
          {
            setId: activeDeck.id,
            cardIndex: currentIndex,
            mastery: masteryRating
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (e) {
        // silent fallback
      }
    }

    // Feedback message
    if (masteryRating === 'Easy') {
      toast.success('🎯 Card Mastered! Progress updated.');
    }

    handleNext();
  };

  // 3. AI Flashcard Deck Generation
  const handleGenerateAiDeck = async (e) => {
    e.preventDefault();
    if (!aiTopic.trim()) {
      toast.error('Please enter a topic for the AI to study.');
      return;
    }

    setIsGenerating(true);
    const token = localStorage.getItem('token');

    try {
      const res = await axios.post(
        '/api/flashcards/generate',
        {
          topic: aiTopic,
          subject: aiSubject,
          count: aiCount,
          notes: aiNotes
        },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          timeout: 15000
        }
      );

      if (res.data?.deck) {
        const newDeck = res.data.deck;
        setDecks((prev) => [newDeck, ...prev]);
        setActiveDeckId(newDeck.id);
        setCurrentIndex(0);
        setIsFlipped(false);
        setShowAiModal(false);
        setAiTopic('');
        setAiNotes('');
        toast.success(`✨ Generated ${newDeck.cards?.length || 0} active recall cards for "${newDeck.title}"!`);
      }
    } catch (err) {
      console.error('AI Generation Error:', err);
      toast.error(err.response?.data?.error || 'Failed to generate cards with AI.');
    } finally {
      setIsGenerating(false);
    }
  };

  // 4. Manual Deck Creation
  const handleSaveManualDeck = async (e) => {
    e.preventDefault();
    if (!manualTitle.trim()) {
      toast.error('Please enter a deck title.');
      return;
    }

    const validCards = manualCards.filter((c) => c.question.trim() && c.answer.trim());
    if (validCards.length === 0) {
      toast.error('Please fill in at least 1 question and answer.');
      return;
    }

    setIsSavingManual(true);
    const token = localStorage.getItem('token');

    try {
      const res = await axios.post(
        '/api/flashcards',
        {
          title: manualTitle,
          subject: manualSubject,
          cards: validCards
        },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        }
      );

      if (res.data?.set) {
        const newDeck = res.data.set;
        setDecks((prev) => [newDeck, ...prev]);
        setActiveDeckId(newDeck.id);
        setCurrentIndex(0);
        setIsFlipped(false);
        setShowManualModal(false);
        setManualTitle('');
        setManualCards([
          { question: '', answer: '' },
          { question: '', answer: '' }
        ]);
        toast.success(`🎉 Created custom deck: "${newDeck.title}"!`);
      }
    } catch (err) {
      toast.error('Could not save deck.');
    } finally {
      setIsSavingManual(false);
    }
  };

  // 5. Delete a deck
  const handleDeleteDeck = async (deckId, deckTitle, e) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete deck "${deckTitle}"?`)) return;

    const token = localStorage.getItem('token');
    try {
      await axios.delete(`/api/flashcards?id=${deckId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setDecks((prev) => {
        const filtered = prev.filter((d) => d.id !== deckId);
        if (activeDeckId === deckId && filtered.length > 0) {
          setActiveDeckId(filtered[0].id);
          setCurrentIndex(0);
        }
        return filtered;
      });
      toast.info(`Deleted deck: ${deckTitle}`);
    } catch (err) {
      toast.error('Could not delete deck.');
    }
  };

  return (
    <div className="flashcards-view animate-fade-in">
      {/* Header */}
      <div className="flashcards-header">
        <div>
          <h2>🃏 Smart 3D Flashcards & Active Recall</h2>
          <p>Supercharge retention with AI-crafted question decks and spaced repetition.</p>
        </div>

        <div className="flashcards-header-actions">
          <button
            type="button"
            className="btn btn-secondary btn-md"
            onClick={() => setShowManualModal(true)}
          >
            + Create Deck
          </button>
          <button
            type="button"
            className="btn btn-md btn-ai-glow"
            onClick={() => setShowAiModal(true)}
          >
            ✨ Generate AI Flashcards
          </button>
        </div>
      </div>

      {/* Deck Selector Tabs */}
      <div className="deck-selector-row mt-3">
        {decks.map((deck) => (
          <button
            key={deck.id}
            type="button"
            className={`deck-tab-btn ${activeDeckId === deck.id ? 'active' : ''}`}
            onClick={() => {
              setActiveDeckId(deck.id);
              setCurrentIndex(0);
              setIsFlipped(false);
            }}
          >
            <span>{deck.isAIGenerated ? '🤖' : '📚'}</span>
            <span>{deck.title} ({deck.cards?.length || 0})</span>
            <span className="deck-badge-percent">{deck.progress || 0}%</span>
            <button
              type="button"
              className="deck-delete-mini"
              title="Delete deck"
              onClick={(e) => handleDeleteDeck(deck.id, deck.title, e)}
            >
              ✕
            </button>
          </button>
        ))}
      </div>

      {/* Main Flashcard Workspace */}
      {loading ? (
        <div className="flashcards-empty-state">
          <p>Loading your study decks...</p>
        </div>
      ) : cards.length > 0 ? (
        <div className="flashcard-workspace mt-4">
          <div className="card-progress-counter mb-2">
            <span>
              Card <strong>{currentIndex + 1}</strong> of <strong>{cards.length}</strong> •{' '}
              <strong style={{ color: '#c7d2fe' }}>{activeDeck.subject}</strong>
            </span>

            <div className="deck-mastery-track">
              <span>Mastery: {activeDeck.progress || 0}%</span>
              <div className="mastery-progress-bar">
                <div
                  className="mastery-progress-fill"
                  style={{ width: `${activeDeck.progress || 0}%` }}
                />
              </div>
            </div>
          </div>

          {/* 3D Flip Card */}
          <div
            className={`flashcard-3d-scene ${isFlipped ? 'flipped' : ''}`}
            onClick={() => setIsFlipped(!isFlipped)}
          >
            <div className="flashcard-3d-inner">
              {/* Front Side: Question */}
              <div className="flashcard-face flashcard-front">
                <span className="badge badge-cyan mb-3">
                  {activeDeck.title.toUpperCase()} • QUESTION
                </span>
                <h3 className="card-question-text">{currentCard.question}</h3>
                <span className="flip-hint mt-4">🔄 Click anywhere to Flip & Reveal Answer</span>
              </div>

              {/* Back Side: Answer */}
              <div className="flashcard-face flashcard-back">
                <span className="badge badge-success mb-3">
                  ANSWER & EXPLANATION
                </span>
                <p className="card-answer-text">{currentCard.answer}</p>
                <span className="flip-hint mt-4">🔄 Click to Flip Back</span>
              </div>
            </div>
          </div>

          {/* Mastery Confidence Feedback Buttons */}
          <div className="mastery-feedback-bar mt-4">
            <span className="bar-label">Rate Your Active Recall Confidence:</span>
            <div className="feedback-btns">
              <button
                type="button"
                className="btn-feedback hard"
                onClick={() => handleRateCard('Hard')}
              >
                <span>🔴 Hard</span>
                <span style={{ fontSize: '0.72rem', opacity: 0.8 }}>(Review Soon)</span>
              </button>
              <button
                type="button"
                className="btn-feedback medium"
                onClick={() => handleRateCard('Medium')}
              >
                <span>🟡 Medium</span>
                <span style={{ fontSize: '0.72rem', opacity: 0.8 }}>(Felt Good)</span>
              </button>
              <button
                type="button"
                className="btn-feedback easy"
                onClick={() => handleRateCard('Easy')}
              >
                <span>🟢 Easy</span>
                <span style={{ fontSize: '0.72rem', opacity: 0.8 }}>(Mastered)</span>
              </button>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="nav-controls mt-3">
            <button type="button" className="btn btn-secondary btn-sm" onClick={handlePrev}>
              ← Previous Card
            </button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={handleNext}>
              Next Card →
            </button>
          </div>
        </div>
      ) : (
        <div className="flashcards-empty-state">
          <h3>{decks.length === 0 ? 'No flashcard decks created yet' : 'No cards in this deck yet'}</h3>
          <p>Create your custom deck or let AI generate smart flashcards with spaced repetition!</p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '1rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-secondary btn-md"
              onClick={() => setShowManualModal(true)}
            >
              + Create Manual Deck
            </button>
            <button
              type="button"
              className="btn btn-primary btn-md"
              onClick={() => setShowAiModal(true)}
            >
              ✨ Generate AI Flashcards
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: AI FLASHCARD GENERATOR                                   */}
      {/* ============================================================== */}
      {showAiModal && (
        <div className="flashcard-modal-backdrop" onClick={() => setShowAiModal(false)}>
          <div className="flashcard-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-flex">
              <h3>✨ AI Flashcard Deck Generator</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowAiModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGenerateAiDeck}>
              <div className="modal-form-group">
                <label>Study Topic / Concept *</label>
                <input
                  type="text"
                  className="modal-input"
                  placeholder="e.g. Enzyme Kinetics, Newton's Laws, Linked Lists..."
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="modal-form-group">
                <label>Subject Category</label>
                <input
                  type="text"
                  className="modal-input"
                  placeholder="e.g. Biology, Physics, Computer Science..."
                  value={aiSubject}
                  onChange={(e) => setAiSubject(e.target.value)}
                />
              </div>

              <div className="modal-form-group">
                <label>Number of Cards</label>
                <select
                  className="modal-select"
                  value={aiCount}
                  onChange={(e) => setAiCount(Number(e.target.value))}
                >
                  <option value={4}>4 High-Yield Cards (Quick Review)</option>
                  <option value={6}>6 Cards (Standard Deck)</option>
                  <option value={8}>8 Cards (Deep Exam Prep)</option>
                  <option value={10}>10 Cards (Comprehensive Mastery)</option>
                </select>
              </div>

              <div className="modal-form-group">
                <label>Optional Context / Paste Lecture Notes</label>
                <textarea
                  className="modal-textarea"
                  placeholder="Paste lecture excerpts or specific focus formulas here..."
                  value={aiNotes}
                  onChange={(e) => setAiNotes(e.target.value)}
                />
              </div>

              <div className="modal-actions-row">
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setShowAiModal(false)}
                  disabled={isGenerating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-md btn-ai-glow"
                  disabled={isGenerating}
                >
                  {isGenerating ? '🤖 Crafting AI Cards...' : '✨ Generate & Save Deck'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: MANUAL DECK CREATION                                     */}
      {/* ============================================================== */}
      {showManualModal && (
        <div className="flashcard-modal-backdrop" onClick={() => setShowManualModal(false)}>
          <div className="flashcard-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-flex">
              <h3>📝 Create Custom Flashcard Deck</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowManualModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveManualDeck}>
              <div className="modal-form-group">
                <label>Deck Title *</label>
                <input
                  type="text"
                  className="modal-input"
                  placeholder="e.g. Calculus Derivatives"
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  required
                />
              </div>

              <div className="modal-form-group">
                <label>Subject</label>
                <input
                  type="text"
                  className="modal-input"
                  placeholder="e.g. Mathematics"
                  value={manualSubject}
                  onChange={(e) => setManualSubject(e.target.value)}
                />
              </div>

              {manualCards.map((card, idx) => (
                <div
                  key={idx}
                  style={{
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    padding: '0.85rem',
                    marginBottom: '0.75rem',
                    background: 'rgba(255, 255, 255, 0.02)'
                  }}
                >
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#818cf8' }}>
                    Card #{idx + 1}
                  </span>
                  <div className="modal-form-group mt-1">
                    <input
                      type="text"
                      className="modal-input"
                      placeholder="Question..."
                      value={card.question}
                      onChange={(e) => {
                        const next = [...manualCards];
                        next[idx].question = e.target.value;
                        setManualCards(next);
                      }}
                    />
                  </div>
                  <div className="modal-form-group">
                    <input
                      type="text"
                      className="modal-input"
                      placeholder="Answer / Key explanation..."
                      value={card.answer}
                      onChange={(e) => {
                        const next = [...manualCards];
                        next[idx].answer = e.target.value;
                        setManualCards(next);
                      }}
                    />
                  </div>
                </div>
              ))}

              <button
                type="button"
                className="btn btn-ghost btn-sm mb-3"
                style={{ width: '100%' }}
                onClick={() => setManualCards([...manualCards, { question: '', answer: '' }])}
              >
                + Add Another Card
              </button>

              <div className="modal-actions-row">
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setShowManualModal(false)}
                  disabled={isSavingManual}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-md"
                  disabled={isSavingManual}
                >
                  {isSavingManual ? 'Saving...' : '💾 Save Deck'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
