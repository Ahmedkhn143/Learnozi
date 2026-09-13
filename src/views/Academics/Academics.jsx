import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import './Academics.css';

export default function Academics() {
  const { user } = useAuth();
  const { success, error: showError } = useToast();

  const [semesters, setSemesters] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [courseName, setCourseName] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [creditHours, setCreditHours] = useState('3');
  const [targetGrade, setTargetGrade] = useState('A');
  const [submitting, setSubmitting] = useState(false);

  // Fetch real academics data from Supabase
  const fetchAcademics = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    axios
      .get('/api/academics', {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 6000
      })
      .then((res) => {
        const sems = res.data?.semesters || [];
        setSemesters(sems);

        const allCourses = [];
        sems.forEach((s) => {
          if (Array.isArray(s.courses)) {
            allCourses.push(...s.courses.map((c) => ({ ...c, semesterName: s.name })));
          }
        });
        setCourses(allCourses);
      })
      .catch((err) => {
        console.warn('Academics fetch notice:', err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAcademics();
  }, []);

  // Handle adding new real course
  const handleAddCourse = async (e) => {
    e.preventDefault();
    if (!courseName.trim()) return;

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        '/api/academics/courses',
        {
          name: courseName.trim(),
          code: courseCode.trim(),
          creditHours: parseInt(creditHours, 10) || 3,
          targetGrade
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      success('Course added successfully to your academic record!');
      setCourseName('');
      setCourseCode('');
      setCreditHours('3');
      setShowModal(false);
      fetchAcademics();
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to add course. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const totalCredits = courses.reduce((acc, c) => acc + (c.creditHours || 3), 0);

  return (
    <div className="academics-view animate-fade-in">
      <div className="academics-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>🎓 Academic Profile & Course Overview</h2>
          <p>Track your semester GPA targets, course progress, and credit requirements.</p>
        </div>
        <button className="btn btn-primary btn-md" onClick={() => setShowModal(true)}>
          + Add Course
        </button>
      </div>

      {/* GPA & Target Metrics */}
      <div className="grid-3 mt-4">
        <div className="glass-card gpa-widget">
          <span className="widget-label">Enrolled Courses</span>
          <div className="gpa-value">
            {courses.length} <span className="max-gpa">Courses</span>
          </div>
          <span className="badge badge-success mt-2">
            {courses.length > 0 ? 'Active Semester' : 'Ready to Enroll'}
          </span>
        </div>

        <div className="glass-card gpa-widget">
          <span className="widget-label">Semester Credit Hours</span>
          <div className="gpa-value">
            {totalCredits} <span className="max-gpa">Credits</span>
          </div>
          <span className="badge badge-cyan mt-2">Target: 14 - 18 Credits</span>
        </div>

        <div className="glass-card gpa-widget">
          <span className="widget-label">Education Level</span>
          <div className="gpa-value" style={{ fontSize: '1.4rem' }}>
            {user?.academicProfile?.educationLevel || 'University'}
          </div>
          <span className="badge badge-primary mt-2">
            {user?.academicProfile?.institution || user?.academicProfile?.university || 'Higher Education'}
          </span>
        </div>
      </div>

      {/* Active Courses Breakdown */}
      <div className="glass-card mt-4">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>Current Enrolled Courses ({courses.length})</h3>
          {courses.length > 0 && (
            <button className="btn btn-secondary btn-sm" onClick={() => setShowModal(true)}>
              + Add Another Course
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-center p-4">
            <div className="ai-spinner" style={{ margin: '0 auto' }} />
          </div>
        ) : courses.length > 0 ? (
          <div className="grid-2 mt-3">
            {courses.map((c) => (
              <div key={c.id || c._id} className="glass-card course-card">
                <div className="course-card-header">
                  <div>
                    {c.code && <span className="badge badge-primary">{c.code}</span>}
                    <h4 className="course-title mt-1">{c.name}</h4>
                    <span className="instructor-name">
                      Semester: {c.semesterName || 'Current Semester'}
                    </span>
                  </div>
                  <div className="grade-badge">
                    {c.actualGrade ? `${c.actualGrade} Grade` : `Target: ${c.targetGrade || 'A'}`}
                  </div>
                </div>

                <div className="course-progress-box mt-3">
                  <div className="progress-info-row">
                    <span>Syllabus Covered</span>
                    <span>{c.actualGrade ? '100%' : 'In Progress'}</span>
                  </div>
                  <div className="progress-bar-bg mt-1">
                    <div
                      className="progress-bar-fill"
                      style={{ width: c.actualGrade ? '100%' : '65%', background: '#6366f1' }}
                    />
                  </div>
                </div>

                <div className="course-footer mt-3">
                  <span className="credits-text">Credits: {c.creditHours || 3}</span>
                  <span className="badge badge-cyan">{c.actualGrade ? 'Completed' : 'Enrolled'}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-5 text-muted">
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📚</div>
            <h4>No courses enrolled in your database yet</h4>
            <p>Add your first course to begin tracking credit hours and syllabus goals.</p>
            <button className="btn btn-primary btn-md mt-3" onClick={() => setShowModal(true)}>
              + Add Course Now
            </button>
          </div>
        )}
      </div>

      {/* Add Course Modal */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(4px)'
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            className="glass-card"
            style={{
              width: '90%',
              maxWidth: '480px',
              padding: '2rem',
              borderRadius: '16px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3>Add New Course</h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCourse}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.88rem', fontWeight: 600 }}>
                  Course Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Data Structures & Algorithms"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  required
                  style={{ width: '100%', padding: '0.65rem 1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(15,23,42,0.6)', color: '#fff' }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.88rem', fontWeight: 600 }}>
                  Course Code (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. CS-201, MATH-102"
                  value={courseCode}
                  onChange={(e) => setCourseCode(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(15,23,42,0.6)', color: '#fff' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.88rem', fontWeight: 600 }}>
                    Credit Hours
                  </label>
                  <select
                    value={creditHours}
                    onChange={(e) => setCreditHours(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem 1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(15,23,42,0.8)', color: '#fff' }}
                  >
                    <option value="1">1 Credit</option>
                    <option value="2">2 Credits</option>
                    <option value="3">3 Credits</option>
                    <option value="4">4 Credits</option>
                    <option value="5">5 Credits</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.88rem', fontWeight: 600 }}>
                    Target Grade
                  </label>
                  <select
                    value={targetGrade}
                    onChange={(e) => setTargetGrade(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem 1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(15,23,42,0.8)', color: '#fff' }}
                  >
                    <option value="A">Grade A (4.0)</option>
                    <option value="B+">Grade B+ (3.5)</option>
                    <option value="B">Grade B (3.0)</option>
                    <option value="C">Grade C (2.0)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={submitting || !courseName.trim()}
                >
                  {submitting ? 'Saving Course...' : 'Save Course to Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
