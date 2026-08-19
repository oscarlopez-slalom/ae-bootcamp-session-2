import React, { useState, useEffect } from 'react';
import './App.css';

const isOverdue = (task) => {
  if (task.completed || !task.due_date) return false;
  const today = new Date().toISOString().slice(0, 10);
  return task.due_date < today;
};

function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [filter, setFilter] = useState('all');
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDueDate, setEditDueDate] = useState('');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/tasks');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const result = await response.json();
      setTasks(result);
      setError(null);
    } catch (err) {
      setError('Failed to fetch tasks: ' + err.message);
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: newTitle, due_date: newDueDate || null }),
      });

      if (!response.ok) {
        throw new Error('Failed to add task');
      }

      const result = await response.json();
      setTasks([...tasks, result]);
      setNewTitle('');
      setNewDueDate('');
      setError(null);
    } catch (err) {
      setError('Error adding task: ' + err.message);
      console.error('Error adding task:', err);
    }
  };

  const updateTask = async (id, updates) => {
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update task');
      }

      const result = await response.json();
      setTasks(tasks.map((task) => (task.id === id ? result : task)));
      setError(null);
    } catch (err) {
      setError('Error updating task: ' + err.message);
      console.error('Error updating task:', err);
    }
  };

  const handleToggleComplete = (task) => {
    updateTask(task.id, { completed: !task.completed });
  };

  const startEditing = (task) => {
    setEditingId(task.id);
    setEditTitle(task.title);
    setEditDueDate(task.due_date || '');
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditTitle('');
    setEditDueDate('');
  };

  const handleSaveEdit = async (id) => {
    if (!editTitle.trim()) return;
    await updateTask(id, { title: editTitle, due_date: editDueDate || null });
    cancelEditing();
  };

  const handleDelete = async (taskId) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete task');
      }

      setTasks(tasks.filter((task) => task.id !== taskId));
      setError(null);
    } catch (err) {
      setError('Error deleting task: ' + err.message);
      console.error('Error deleting task:', err);
    }
  };

  const visibleTasks = tasks.filter((task) => {
    if (filter === 'active') return !task.completed;
    if (filter === 'completed') return task.completed;
    return true;
  });

  const renderTask = (task) => {
    const editing = editingId === task.id;

    return (
      <li key={task.id} className={`task-item ${task.completed ? 'completed' : ''} ${isOverdue(task) ? 'overdue' : ''}`}>
        {editing ? (
          <div className="task-edit-form">
            <label htmlFor={`edit-title-${task.id}`}>Title</label>
            <input
              id={`edit-title-${task.id}`}
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
            />
            <label htmlFor={`edit-due-date-${task.id}`}>Due date</label>
            <input
              id={`edit-due-date-${task.id}`}
              type="date"
              value={editDueDate}
              onChange={(e) => setEditDueDate(e.target.value)}
            />
            <div className="task-actions">
              <button type="button" className="btn-primary" onClick={() => handleSaveEdit(task.id)}>
                Save
              </button>
              <button type="button" className="btn-secondary" onClick={cancelEditing}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <input
              type="checkbox"
              checked={task.completed}
              onChange={() => handleToggleComplete(task)}
              aria-label={`Mark "${task.title}" as ${task.completed ? 'active' : 'complete'}`}
            />
            <div className="task-details">
              <span className="task-title">{task.title}</span>
              {task.due_date && (
                <span className="task-due-date">
                  Due {task.due_date}
                  {isOverdue(task) && <span className="overdue-badge">Overdue</span>}
                </span>
              )}
            </div>
            <div className="task-actions">
              <button type="button" className="btn-secondary" onClick={() => startEditing(task)}>
                Edit
              </button>
              <button
                type="button"
                onClick={() => handleDelete(task.id)}
                className="delete-btn"
              >
                Delete
              </button>
            </div>
          </>
        )}
      </li>
    );
  };

  const activeTasks = visibleTasks.filter((task) => !task.completed);
  const completedTasks = visibleTasks.filter((task) => task.completed);

  return (
    <div className="App">
      <header className="App-header">
        <h1>To Do App</h1>
        <p>Keep track of your tasks</p>
      </header>

      <main>
        <section className="add-task-section">
          <h2>Add New Task</h2>
          <form onSubmit={handleSubmit}>
            <label htmlFor="new-task-title">Title</label>
            <input
              id="new-task-title"
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Enter task title"
            />
            <label htmlFor="new-task-due-date">Due date</label>
            <input
              id="new-task-due-date"
              type="date"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
            />
            <button type="submit" className="btn-primary">Add Task</button>
          </form>
        </section>

        <section className="filter-section">
          <h2>Filter</h2>
          <div className="filter-buttons">
            <button
              type="button"
              className={filter === 'all' ? 'btn-primary' : 'btn-secondary'}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button
              type="button"
              className={filter === 'active' ? 'btn-primary' : 'btn-secondary'}
              onClick={() => setFilter('active')}
            >
              Active
            </button>
            <button
              type="button"
              className={filter === 'completed' ? 'btn-primary' : 'btn-secondary'}
              onClick={() => setFilter('completed')}
            >
              Completed
            </button>
          </div>
        </section>

        <section className="tasks-section">
          {loading && <p>Loading data...</p>}
          {error && <p className="error">{error}</p>}
          {!loading && !error && (
            <>
              {filter !== 'completed' && (
                <div className="task-group">
                  <h2>Active</h2>
                  {activeTasks.length > 0 ? (
                    <ul>{activeTasks.map(renderTask)}</ul>
                  ) : (
                    <p>No active tasks.</p>
                  )}
                </div>
              )}
              {filter !== 'active' && (
                <div className="task-group">
                  <h2>Completed</h2>
                  {completedTasks.length > 0 ? (
                    <ul>{completedTasks.map(renderTask)}</ul>
                  ) : (
                    <p>No completed tasks.</p>
                  )}
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;