import { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../../context/ToastContext';
import './StudyPlanner.css';

export default function StudyPlanner() {
  const { success, error: showError } = useToast();

  const [tasks, setTasks] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskSubject, setNewTaskSubject] = useState('General');
  const [newTaskPriority, setNewTaskPriority] = useState('medium');
  const [showAddModal, setShowAddModal] = useState(false);

  // Sync tasks to backend
  const syncTasks = async (updatedTasks) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      await axios.post(
        '/api/tasks',
        { tasks: updatedTasks },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.warn('Failed to sync tasks:', err.message);
    }
  };

  // Fetch real tasks and user courses
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };

    // 1. Fetch real tasks
    axios
      .get('/api/tasks', { headers })
      .then((res) => {
        if (Array.isArray(res.data?.tasks)) {
          setTasks(res.data.tasks);
        }
      })
      .catch((err) => console.warn('Fetch tasks notice:', err.message))
      .finally(() => setLoading(false));

    // 2. Fetch user's real courses for the dropdown
    axios
      .get('/api/academics', { headers })
      .then((res) => {
        const sems = res.data?.semesters || [];
        const allC = [];
        sems.forEach((s) => {
          if (Array.isArray(s.courses)) allC.push(...s.courses);
        });
        if (allC.length > 0) {
          setCourses(allC);
          setNewTaskSubject(allC[0].name);
        }
      })
      .catch(() => {});
  }, []);

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask = {
      id: Date.now(),
      title: newTaskTitle.trim(),
      subject: newTaskSubject || 'General',
      status: 'todo',
      priority: newTaskPriority,
      dueDate: 'Active'
    };

    const updated = [newTask, ...tasks];
    setTasks(updated);
    syncTasks(updated);
    success('Study task added!');
    setNewTaskTitle('');
    setShowAddModal(false);
  };

  const moveTask = (id, newStatus) => {
    const updated = tasks.map((t) => (t.id === id ? { ...t, status: newStatus } : t));
    setTasks(updated);
    syncTasks(updated);
  };

  const deleteTask = (id) => {
    const updated = tasks.filter((t) => t.id !== id);
    setTasks(updated);
    syncTasks(updated);
    success('Task removed');
  };

  return (
    <div className="planner-view animate-fade-in">
      {/* Page Header */}
      <div className="planner-header-row">
        <div>
          <h2>📅 Study Planner & Timetable</h2>
          <p>Organize your study goals, prioritize exam preparation, and stay focused.</p>
        </div>
        <button className="btn btn-primary btn-md" onClick={() => setShowAddModal(true)}>
          + Add New Task
        </button>
      </div>

      {loading ? (
        <div className="text-center p-5">
          <div className="ai-spinner" style={{ margin: '0 auto' }} />
        </div>
      ) : (
        /* Task Board Columns */
        <div className="grid-3 mt-4">
          {/* Column 1: To Do */}
          <div className="glass-card planner-column">
            <div className="column-header">
              <span className="column-title">📌 To Do ({tasks.filter((t) => t.status === 'todo').length})</span>
              <span className="badge badge-warning">Pending</span>
            </div>

            <div className="task-list mt-3">
              {tasks.filter((t) => t.status === 'todo').map((task) => (
                <div key={task.id} className="glass-card task-item-card">
                  <div className="task-meta-row">
                    <span className="badge badge-primary">{task.subject}</span>
                    <span className={`priority-tag ${task.priority}`}>{task.priority}</span>
                  </div>
                  <h4 className="task-title mt-2">{task.title}</h4>
                  <div className="task-footer mt-3">
                    <span className="due-date">⏱️ {task.dueDate}</span>
                    <div className="task-actions">
                      <button className="btn-action" onClick={() => moveTask(task.id, 'in-progress')} title="Start Task">
                        ➡️
                      </button>
                      <button className="btn-action danger" onClick={() => deleteTask(task.id)} title="Delete">
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {tasks.filter((t) => t.status === 'todo').length === 0 && (
                <div className="text-center p-4 text-muted" style={{ fontSize: '0.85rem' }}>
                  No pending tasks. Click "+ Add New Task" to schedule!
                </div>
              )}
            </div>
          </div>

          {/* Column 2: In Progress */}
          <div className="glass-card planner-column">
            <div className="column-header">
              <span className="column-title">
                ⚡ In Progress ({tasks.filter((t) => t.status === 'in-progress').length})
              </span>
              <span className="badge badge-cyan">Active</span>
            </div>

            <div className="task-list mt-3">
              {tasks.filter((t) => t.status === 'in-progress').map((task) => (
                <div key={task.id} className="glass-card task-item-card active-border">
                  <div className="task-meta-row">
                    <span className="badge badge-cyan">{task.subject}</span>
                    <span className={`priority-tag ${task.priority}`}>{task.priority}</span>
                  </div>
                  <h4 className="task-title mt-2">{task.title}</h4>
                  <div className="task-footer mt-3">
                    <span className="due-date">⏱️ {task.dueDate}</span>
                    <div className="task-actions">
                      <button className="btn-action" onClick={() => moveTask(task.id, 'completed')} title="Mark Done">
                        ✅
                      </button>
                      <button className="btn-action danger" onClick={() => deleteTask(task.id)} title="Delete">
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {tasks.filter((t) => t.status === 'in-progress').length === 0 && (
                <div className="text-center p-4 text-muted" style={{ fontSize: '0.85rem' }}>
                  No active study tasks currently in progress.
                </div>
              )}
            </div>
          </div>

          {/* Column 3: Completed */}
          <div className="glass-card planner-column">
            <div className="column-header">
              <span className="column-title">
                ✅ Completed ({tasks.filter((t) => t.status === 'completed').length})
              </span>
              <span className="badge badge-success">Done</span>
            </div>

            <div className="task-list mt-3">
              {tasks.filter((t) => t.status === 'completed').map((task) => (
                <div key={task.id} className="glass-card task-item-card completed-opacity">
                  <div className="task-meta-row">
                    <span className="badge badge-success">{task.subject}</span>
                  </div>
                  <h4 className="task-title mt-2 strike-through">{task.title}</h4>
                  <div className="task-footer mt-3">
                    <span className="due-date">🎉 Done</span>
                    <button className="btn-action danger" onClick={() => deleteTask(task.id)} title="Delete">
                      🗑️
                    </button>
                  </div>
                </div>
              ))}

              {tasks.filter((t) => t.status === 'completed').length === 0 && (
                <div className="text-center p-4 text-muted" style={{ fontSize: '0.85rem' }}>
                  Completed study goals will appear here.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="glass-card modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Add New Study Task</h3>
            <form onSubmit={handleAddTask} className="mt-3">
              <div className="form-group">
                <label>Task Title</label>
                <input
                  type="text"
                  placeholder="e.g. Solve 10 integration problems"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div className="form-group">
                <label>Subject / Course</label>
                {courses.length > 0 ? (
                  <select value={newTaskSubject} onChange={(e) => setNewTaskSubject(e.target.value)}>
                    {courses.map((c) => (
                      <option key={c.id || c._id} value={c.name}>
                        {c.name} {c.code ? `(${c.code})` : ''}
                      </option>
                    ))}
                    <option value="General">General Study</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="e.g. Mathematics, Computer Science"
                    value={newTaskSubject}
                    onChange={(e) => setNewTaskSubject(e.target.value)}
                  />
                )}
              </div>

              <div className="form-group">
                <label>Priority Level</label>
                <select value={newTaskPriority} onChange={(e) => setNewTaskPriority(e.target.value)}>
                  <option value="high">High 🔴</option>
                  <option value="medium">Medium 🟡</option>
                  <option value="low">Low 🟢</option>
                </select>
              </div>

              <div className="modal-actions mt-4">
                <button type="button" className="btn btn-ghost" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
