import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import './Community.css';

export default function Community() {
  const { user } = useAuth();
  const { success, error: showError } = useToast();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPostModal, setShowPostModal] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postCategory, setPostCategory] = useState('Exam Prep');
  const [submitting, setSubmitting] = useState(false);

  const fetchPosts = () => {
    axios
      .get('/api/community')
      .then((res) => {
        const fetched = res.data?.posts || [];
        setPosts(fetched);
      })
      .catch((err) => console.warn('Community fetch notice:', err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleUpvote = (id) => {
    setPosts(posts.map((p) => (p.id === id ? { ...p, upvotes: (p.upvotes || 0) + 1 } : p)));
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!postTitle.trim()) return;

    setSubmitting(true);
    const token = localStorage.getItem('token');
    try {
      const res = await axios.post(
        '/api/community',
        {
          title: postTitle.trim(),
          content: postContent.trim(),
          category: postCategory
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data?.post) {
        setPosts([res.data.post, ...posts]);
      }
      success('Post published to peer community!');
      setPostTitle('');
      setPostContent('');
      setShowPostModal(false);
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to publish post.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="community-view animate-fade-in">
      <div className="community-header">
        <div>
          <h2>🌍 Peer Study Community</h2>
          <p>Share study notes, ask exam questions, and collaborate with other students.</p>
        </div>
        <button className="btn btn-primary btn-md" onClick={() => setShowPostModal(true)}>
          + Create Post
        </button>
      </div>

      {loading ? (
        <div className="text-center p-5">
          <div className="ai-spinner" style={{ margin: '0 auto' }} />
        </div>
      ) : (
        <div className="posts-feed mt-4">
          {posts.length > 0 ? (
            posts.map((post) => (
              <div key={post.id} className="glass-card post-card">
                <div className="post-header">
                  <div className="post-author-info">
                    <div className="author-avatar">{post.avatar || (post.author ? post.author[0].toUpperCase() : 'U')}</div>
                    <div>
                      <span className="author-name">{post.author}</span>
                      <span className="post-time">{post.time || 'Recently'}</span>
                    </div>
                  </div>
                  <span className="badge badge-cyan">{post.category || 'Study Q&A'}</span>
                </div>

                <h3 className="post-title mt-3">{post.title}</h3>
                {post.content && <p className="post-body mt-2">{post.content}</p>}

                <div className="post-footer mt-3">
                  <button className="btn-upvote" onClick={() => handleUpvote(post.id)}>
                    🔺 Upvote ({post.upvotes || 0})
                  </button>
                  <span className="comments-count">💬 {post.comments || 0} Comments</span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center p-5 text-muted glass-card">
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>💬</div>
              <h4>No community discussions yet</h4>
              <p>Be the first student to start a discussion or ask an exam question!</p>
              <button className="btn btn-primary btn-md mt-3" onClick={() => setShowPostModal(true)}>
                + Create First Post
              </button>
            </div>
          )}
        </div>
      )}

      {showPostModal && (
        <div className="modal-overlay" onClick={() => setShowPostModal(false)}>
          <div className="glass-card modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Post to Community</h3>
            <form onSubmit={handleCreatePost} className="mt-3">
              <div className="form-group">
                <label>Post Title *</label>
                <input
                  type="text"
                  placeholder="Ask a question or share study tips..."
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div className="form-group">
                <label>Category</label>
                <select value={postCategory} onChange={(e) => setPostCategory(e.target.value)}>
                  <option value="Exam Prep">Exam Prep 🎓</option>
                  <option value="Study Group">Study Group 👥</option>
                  <option value="Q&A">Question & Answer ❓</option>
                  <option value="Study Tips">Study Tips & Advice 💡</option>
                </select>
              </div>

              <div className="form-group">
                <label>Details (Optional)</label>
                <textarea
                  rows="4"
                  placeholder="Provide context, problem details, or resources..."
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                />
              </div>

              <div className="modal-actions mt-4">
                <button type="button" className="btn btn-ghost" onClick={() => setShowPostModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting || !postTitle.trim()}>
                  {submitting ? 'Publishing...' : 'Publish Post'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
