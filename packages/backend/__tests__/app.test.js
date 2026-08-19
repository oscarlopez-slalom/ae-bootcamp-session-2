const request = require('supertest');
const { app, db } = require('../src/app');

// Close the database connection after all tests
afterAll(() => {
  if (db) {
    db.close();
  }
});

// Test helpers
const createTask = async (title = 'Temp Task', due_date = null) => {
  const response = await request(app)
    .post('/api/tasks')
    .send({ title, due_date })
    .set('Accept', 'application/json');

  expect(response.status).toBe(201);
  expect(response.body).toHaveProperty('id');
  return response.body;
};

describe('API Endpoints', () => {
  describe('GET /api/tasks', () => {
    it('should return all tasks', async () => {
      const response = await request(app).get('/api/tasks');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      // Check if tasks have the expected structure
      const task = response.body[0];
      expect(task).toHaveProperty('id');
      expect(task).toHaveProperty('title');
      expect(task).toHaveProperty('due_date');
      expect(task).toHaveProperty('completed');
      expect(task).toHaveProperty('created_at');
    });
  });

  describe('POST /api/tasks', () => {
    it('should create a new task', async () => {
      const newTask = { title: 'Test Task', due_date: '2030-01-01' };
      const response = await request(app)
        .post('/api/tasks')
        .send(newTask)
        .set('Accept', 'application/json');

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe(newTask.title);
      expect(response.body.due_date).toBe(newTask.due_date);
      expect(response.body.completed).toBe(false);
    });

    it('should return 400 if title is missing', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .send({})
        .set('Accept', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Task title is required');
    });

    it('should return 400 if title is empty', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .send({ title: '' })
        .set('Accept', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Task title is required');
    });
  });

  describe('PUT /api/tasks/:id', () => {
    it('should update a task title and due date', async () => {
      const task = await createTask('Original title');

      const response = await request(app)
        .put(`/api/tasks/${task.id}`)
        .send({ title: 'Updated title', due_date: '2030-05-05' })
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body.title).toBe('Updated title');
      expect(response.body.due_date).toBe('2030-05-05');
    });

    it('should mark a task as complete and back to active', async () => {
      const task = await createTask('Task to complete');

      const completeResponse = await request(app)
        .put(`/api/tasks/${task.id}`)
        .send({ completed: true });
      expect(completeResponse.status).toBe(200);
      expect(completeResponse.body.completed).toBe(true);

      const activeResponse = await request(app)
        .put(`/api/tasks/${task.id}`)
        .send({ completed: false });
      expect(activeResponse.status).toBe(200);
      expect(activeResponse.body.completed).toBe(false);
    });

    it('should return 404 when task does not exist', async () => {
      const response = await request(app)
        .put('/api/tasks/999999')
        .send({ title: 'Does not matter' });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Task not found');
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    it('should delete an existing task', async () => {
      const task = await createTask('Task To Be Deleted');

      const deleteResponse = await request(app).delete(`/api/tasks/${task.id}`);
      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body).toEqual({ message: 'Task deleted successfully', id: task.id });

      const deleteAgain = await request(app).delete(`/api/tasks/${task.id}`);
      expect(deleteAgain.status).toBe(404);
      expect(deleteAgain.body).toHaveProperty('error', 'Task not found');
    });

    it('should return 404 when task does not exist', async () => {
      const response = await request(app).delete('/api/tasks/999999');
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Task not found');
    });

    it('should return 400 for invalid id', async () => {
      const response = await request(app).delete('/api/tasks/abc');
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Valid task ID is required');
    });
  });
});