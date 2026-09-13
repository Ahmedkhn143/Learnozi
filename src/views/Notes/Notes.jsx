import { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../../context/ToastContext';
import './Notes.css';

export default function Notes() {
  const { success, error: showError } = useToast();

  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeNote, setActiveNote] = useState(null);

  // New Note Modal
  const [newTitle, setNewTitle] = useState('');
  const [newTag, setNewTag] = useState('General');
  const [newContent, setNewContent] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // AI Summarize State
  const [summarizing, setSummarizing] = useState(false);
  const [aiSummary, setAiSummary] = useState(null);

  // Sync notes with backend
  const syncNotes = async (updatedNotes) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      await axios.post(
        '/api/notes',
        { notes: updatedNotes },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.warn('Failed to sync notes:', err.message);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    axios
      .get('/api/notes', {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 6000
      })
      .then((res) => {
        const fetched = res.data?.notes || [];
        setNotes(fetched);
        if (fetched.length > 0) {
          setActiveNote(fetched[0]);
        }
      })
      .catch((err) => console.warn('Fetch notes notice:', err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleCreateNote = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newN = {
      id: Date.now(),
      title: newTitle.trim(),
      tag: newTag || 'General',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      content: newContent.trim() || 'No content added yet...'
    };

    const updated = [newN, ...notes];
    setNotes(updated);
    setActiveNote(newN);
    syncNotes(updated);
    success('Note created successfully!');
    setNewTitle('');
    setNewTag('General');
    setNewContent('');
    setShowAddModal(false);
  };

  const handleDeleteNote = (id) => {
    const updated = notes.filter((n) => n.id !== id);
    setNotes(updated);
    setActiveNote(updated.length > 0 ? updated[0] : null);
    syncNotes(updated);
    success('Note deleted');
  };

  const handleAiSummarize = async () => {
    if (!activeNote || !activeNote.content) return;
    setSummarizing(true);
    setAiSummary(null);

    const token = localStorage.getItem('token');
    try {
      const res = await axios.post(
        '/api/ai/summarize',
        { text: activeNote.content },
        { headers: { Authorization: `Bearer ${token}` }, timeout: 12000 }
      );
      setAiSummary(res.data);
      success('AI Summary generated!');
    } catch (err) {
      showError(err.response?.data?.error || 'AI Summarization failed. Please check your connection.');
    } finally {
      setSummarizing(false);
    }
  };

  const filteredNotes = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="notes-view animate-fade-in">
      <div className="notes-header">
        <div>
          <h2>📝 AI Smart Study Notes</h2>
          <p>Create, organize, and auto-summarize your lecture notes with Gemini AI.</p>
        </div>
        <button className="btn btn-primary btn-md" onClick={() => setShowAddModal(true)}>
          + Create Note
        </button>
      </div>

      {loading ? (
        <div className="text-center p-5">
          <div className="ai-spinner" style={{ margin: '0 auto' }} />
        </div>
      ) : (
        <div className="grid-3 mt-4">
          {/* Notes List Sidebar */}
          <div className="glass-card notes-sidebar-panel">
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mb-3"
            />

            <div className="notes-list">
              {filteredNotes.length > 0 ? (
                filteredNotes.map((note) => (
                  <div
                    key={note.id}
                    className={`glass-card note-list-item ${activeNote?.id === note.id ? 'active' : ''}`}
                    onClick={() => {
                      setActiveNote(note);
                      setAiSummary(null);
                    }}
                  >
                    <span className="badge badge-primary mb-1">{note.tag}</span>
                    <h4 className="note-item-title">{note.title}</h4>
                    <span className="note-date">{note.date}</span>
                  </div>
                ))
              ) : (
                <div className="text-center p-4 text-muted" style={{ fontSize: '0.88rem' }}>
                  {notes.length === 0 ? 'No notes created yet.' : 'No notes match your search.'}
                </div>
              )}
            </div>
          </div>

          {/* Note Reader / Editor Workspace */}
          <div className="glass-card note-editor-panel" style={{ gridColumn: 'span 2' }}>
            {activeNote ? (
              <div>
                <div className="editor-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span className="badge badge-cyan">{activeNote.tag}</span>
                    <h3 className="mt-2">{activeNote.title}</h3>
                    <span className="note-date">Date: {activeNote.date}</span>
                  </div>
                  <div className="editor-actions" style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      className="btn btn-accent btn-sm"
                      onClick={handleAiSummarize}
                      disabled={summarizing}
                    >
                      {summarizing ? '✨ Summarizing...' : '✨ AI Summarize'}
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDeleteNote(activeNote.id)}
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {/* AI Summary Box */}
                {aiSummary && (
                  <div
                    className="glass-card mt-3 p-3"
                    style={{
                      background: 'rgba(99, 102, 241, 0.1)',
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                      borderRadius: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, color: '#818cf8', fontSize: '0.9rem' }}>
                        ✨ AI Executive Summary
                      </span>
                      <button
                        onClick={() => setAiSummary(null)}
                        style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                      >
                        ✕
                      </button>
                    </div>
                    {aiSummary.oneLineSummary && (
                      <p className="mt-2" style={{ fontStyle: 'italic', color: '#e2e8f0' }}>
                        "{aiSummary.oneLineSummary}"
                      </p>
                    )}
                    {Array.isArray(aiSummary.bullets) && aiSummary.bullets.length > 0 && (
                      <ul className="mt-2" style={{ paddingLeft: '1.2rem', color: '#cbd5e1', fontSize: '0.88rem' }}>
                        {aiSummary.bullets.map((b, i) => (
                          <li key={i}>{b}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                <div className="editor-content mt-4" style={{ lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>
                  <p>{activeNote.content}</p>
                </div>
              </div>
            ) : (
              <div className="text-center p-5 text-muted">
                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📝</div>
                <h4>No note selected</h4>
                <p>Select a note from the left or create your first smart note.</p>
                <button className="btn btn-primary btn-md mt-3" onClick={() => setShowAddModal(true)}>
                  + Create Your First Note
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Note Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="glass-card modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Create New Study Note</h3>
            <form onSubmit={handleCreateNote} className="mt-3">
              <div className="form-group">
                <label>Note Title</label>
                <input
                  type="text"
                  placeholder="e.g. Chapter 4 Integration Summary"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div className="form-group">
                <label>Subject / Category</label>
                <input
                  type="text"
                  placeholder="e.g. Chemistry, Math, CS"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Note Content</label>
                <textarea
                  rows="6"
                  placeholder="Type or paste your study notes, formulas, or lecture points here..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.15)',
                    background: 'rgba(15,23,42,0.6)',
                    color: '#fff',
                    resize: 'vertical'
                  }}
                  required
                />
              </div>

              <div className="modal-actions mt-4">
                <button type="button" className="btn btn-ghost" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
