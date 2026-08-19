import React, { act } from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import App from '../App';

let tasks;

// Mock server to intercept API requests
const server = setupServer(
  rest.get('/api/tasks', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(tasks));
  }),

  rest.post('/api/tasks', (req, res, ctx) => {
    const { title, due_date } = req.body;

    if (!title || title.trim() === '') {
      return res(ctx.status(400), ctx.json({ error: 'Task title is required' }));
    }

    const newTask = {
      id: tasks.length + 1,
      title,
      due_date: due_date || null,
      completed: false,
      created_at: new Date().toISOString(),
    };
    tasks = [...tasks, newTask];
    return res(ctx.status(201), ctx.json(newTask));
  }),

  rest.put('/api/tasks/:id', (req, res, ctx) => {
    const { id } = req.params;
    const updates = req.body;
    const task = tasks.find((t) => t.id === Number(id));
    if (!task) {
      return res(ctx.status(404), ctx.json({ error: 'Task not found' }));
    }
    const updatedTask = { ...task, ...updates };
    tasks = tasks.map((t) => (t.id === Number(id) ? updatedTask : t));
    return res(ctx.status(200), ctx.json(updatedTask));
  }),

  rest.delete('/api/tasks/:id', (req, res, ctx) => {
    const { id } = req.params;
    tasks = tasks.filter((t) => t.id !== Number(id));
    return res(ctx.status(200), ctx.json({ message: 'Task deleted successfully', id: Number(id) }));
  })
);

// Setup and teardown for the mock server
beforeAll(() => server.listen());
beforeEach(() => {
  tasks = [
    { id: 1, title: 'Active Task', due_date: null, completed: false, created_at: '2023-01-01T00:00:00.000Z' },
    { id: 2, title: 'Completed Task', due_date: null, completed: true, created_at: '2023-01-02T00:00:00.000Z' },
  ];
});
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('App Component', () => {
  test('renders the header', async () => {
    await act(async () => {
      render(<App />);
    });
    expect(screen.getByText('To Do App')).toBeInTheDocument();
  });

  test('loads and displays tasks grouped by status', async () => {
    await act(async () => {
      render(<App />);
    });

    // Initially shows loading state
    expect(screen.getByText('Loading data...')).toBeInTheDocument();

    // Wait for tasks to load, grouped by active/completed
    await waitFor(() => {
      expect(screen.getByText('Active Task')).toBeInTheDocument();
      expect(screen.getByText('Completed Task')).toBeInTheDocument();
    });
  });

  test('adds a new task', async () => {
    const user = userEvent.setup();

    await act(async () => {
      render(<App />);
    });

    // Wait for tasks to load
    await waitFor(() => {
      expect(screen.queryByText('Loading data...')).not.toBeInTheDocument();
    });

    // Fill in the form and submit
    const input = screen.getByPlaceholderText('Enter task title');
    await act(async () => {
      await user.type(input, 'New Test Task');
    });

    const submitButton = screen.getByText('Add Task');
    await act(async () => {
      await user.click(submitButton);
    });

    // Check that the new task appears
    await waitFor(() => {
      expect(screen.getByText('New Test Task')).toBeInTheDocument();
    });
  });

  test('marks a task complete', async () => {
    const user = userEvent.setup();

    await act(async () => {
      render(<App />);
    });

    await waitFor(() => {
      expect(screen.getByText('Active Task')).toBeInTheDocument();
    });

    const checkbox = screen.getByLabelText('Mark "Active Task" as complete');
    await act(async () => {
      await user.click(checkbox);
    });

    await waitFor(() => {
      expect(screen.getByLabelText('Mark "Active Task" as active')).toBeInTheDocument();
    });
  });

  test('deletes a task', async () => {
    const user = userEvent.setup();

    await act(async () => {
      render(<App />);
    });

    await waitFor(() => {
      expect(screen.getByText('Active Task')).toBeInTheDocument();
    });

    const taskItem = screen.getByText('Active Task').closest('li');
    const deleteButton = within(taskItem).getByText('Delete');
    await act(async () => {
      await user.click(deleteButton);
    });

    await waitFor(() => {
      expect(screen.queryByText('Active Task')).not.toBeInTheDocument();
    });
  });

  test('filters tasks by status', async () => {
    const user = userEvent.setup();

    await act(async () => {
      render(<App />);
    });

    await waitFor(() => {
      expect(screen.getByText('Active Task')).toBeInTheDocument();
      expect(screen.getByText('Completed Task')).toBeInTheDocument();
    });

    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'Active' }));
    });

    await waitFor(() => {
      expect(screen.getByText('Active Task')).toBeInTheDocument();
      expect(screen.queryByText('Completed Task')).not.toBeInTheDocument();
    });
  });

  test('handles API error', async () => {
    // Override the default handler to simulate an error
    server.use(
      rest.get('/api/tasks', (req, res, ctx) => {
        return res(ctx.status(500));
      })
    );

    await act(async () => {
      render(<App />);
    });

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch tasks/)).toBeInTheDocument();
    });
  });

  test('shows empty state when no tasks', async () => {
    // Override the default handler to return empty array
    server.use(
      rest.get('/api/tasks', (req, res, ctx) => {
        return res(ctx.status(200), ctx.json([]));
      })
    );

    await act(async () => {
      render(<App />);
    });

    // Wait for empty state messages
    await waitFor(() => {
      expect(screen.getByText('No active tasks.')).toBeInTheDocument();
      expect(screen.getByText('No completed tasks.')).toBeInTheDocument();
    });
  });
});
