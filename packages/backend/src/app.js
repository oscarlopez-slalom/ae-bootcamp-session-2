const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const Database = require('better-sqlite3');

// Initialize express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Initialize in-memory SQLite database
const db = new Database(':memory:');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    due_date TEXT,
    completed INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);

// Insert some initial data
const insertStmt = db.prepare('INSERT INTO tasks (title, due_date) VALUES (?, ?)');
insertStmt.run('Buy groceries', null);
insertStmt.run('Finish project report', null);
insertStmt.run('Schedule dentist appointment', null);

console.log('In-memory database initialized with sample data');

const getByIdStmt = db.prepare('SELECT * FROM tasks WHERE id = ?');

// Serialize a task row for the API (convert completed 0/1 to boolean)
const serializeTask = (row) => ({ ...row, completed: !!row.completed });

// Health check endpoint
app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Backend server is running' });
});

// API Routes
app.get('/api/tasks', (req, res) => {
  try {
    const { status } = req.query;
    let query = 'SELECT * FROM tasks';
    if (status === 'active') {
      query += ' WHERE completed = 0';
    } else if (status === 'completed') {
      query += ' WHERE completed = 1';
    }
    // Sort by due date (earliest first, tasks without a due date last), then by creation time
    query += ' ORDER BY CASE WHEN due_date IS NULL THEN 1 ELSE 0 END, due_date ASC, created_at ASC';

    const tasks = db.prepare(query).all();
    res.json(tasks.map(serializeTask));
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

app.post('/api/tasks', (req, res) => {
  try {
    const { title, due_date } = req.body;

    if (!title || typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({ error: 'Task title is required' });
    }

    const result = insertStmt.run(title, due_date || null);
    const newTask = getByIdStmt.get(result.lastInsertRowid);
    res.status(201).json(serializeTask(newTask));
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

app.put('/api/tasks/:id', (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'Valid task ID is required' });
    }

    const existingTask = getByIdStmt.get(id);
    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const { title, due_date, completed } = req.body;

    if (title !== undefined && (typeof title !== 'string' || title.trim() === '')) {
      return res.status(400).json({ error: 'Task title is required' });
    }

    const updatedTitle = title !== undefined ? title : existingTask.title;
    const updatedDueDate = due_date !== undefined ? due_date : existingTask.due_date;
    const updatedCompleted = completed !== undefined ? (completed ? 1 : 0) : existingTask.completed;

    db.prepare('UPDATE tasks SET title = ?, due_date = ?, completed = ? WHERE id = ?')
      .run(updatedTitle, updatedDueDate, updatedCompleted, id);

    const updatedTask = getByIdStmt.get(id);
    res.json(serializeTask(updatedTask));
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

app.delete('/api/tasks/:id', (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'Valid task ID is required' });
    }

    const existingTask = getByIdStmt.get(id);
    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const deleteStmt = db.prepare('DELETE FROM tasks WHERE id = ?');
    const result = deleteStmt.run(id);

    if (result.changes > 0) {
      res.json({ message: 'Task deleted successfully', id: parseInt(id) });
    } else {
      res.status(404).json({ error: 'Task not found' });
    }
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

module.exports = { app, db, insertStmt };