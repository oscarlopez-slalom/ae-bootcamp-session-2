const request = require('supertest');
const { app, db } = require('../../src/app');

afterAll(() => {
  if (db) {
    db.close();
  }
});

describe('Tasks API - integration', () => {
  it('supports the full task lifecycle: create, filter, complete, edit, delete', async () => {
    // Create two tasks, one due in the past (overdue) and one due in the future
    const overdue = await request(app)
      .post('/api/tasks')
      .send({ title: 'Overdue task', due_date: '2000-01-01' });
    expect(overdue.status).toBe(201);

    const upcoming = await request(app)
      .post('/api/tasks')
      .send({ title: 'Upcoming task', due_date: '2999-01-01' });
    expect(upcoming.status).toBe(201);

    // Filter by active status - both new tasks should appear
    const activeResponse = await request(app).get('/api/tasks?status=active');
    expect(activeResponse.status).toBe(200);
    const activeIds = activeResponse.body.map((t) => t.id);
    expect(activeIds).toEqual(expect.arrayContaining([overdue.body.id, upcoming.body.id]));

    // Tasks should be sorted by due date ascending
    const overdueIndex = activeResponse.body.findIndex((t) => t.id === overdue.body.id);
    const upcomingIndex = activeResponse.body.findIndex((t) => t.id === upcoming.body.id);
    expect(overdueIndex).toBeLessThan(upcomingIndex);

    // Mark the overdue task complete
    const completeResponse = await request(app)
      .put(`/api/tasks/${overdue.body.id}`)
      .send({ completed: true });
    expect(completeResponse.status).toBe(200);
    expect(completeResponse.body.completed).toBe(true);

    // It should now show up in the completed filter, not the active filter
    const completedList = await request(app).get('/api/tasks?status=completed');
    expect(completedList.body.map((t) => t.id)).toContain(overdue.body.id);

    const activeListAfter = await request(app).get('/api/tasks?status=active');
    expect(activeListAfter.body.map((t) => t.id)).not.toContain(overdue.body.id);

    // Edit the upcoming task's title and due date
    const editResponse = await request(app)
      .put(`/api/tasks/${upcoming.body.id}`)
      .send({ title: 'Upcoming task - rescheduled', due_date: '2999-06-01' });
    expect(editResponse.status).toBe(200);
    expect(editResponse.body.title).toBe('Upcoming task - rescheduled');
    expect(editResponse.body.due_date).toBe('2999-06-01');

    // Delete both tasks
    const deleteOverdue = await request(app).delete(`/api/tasks/${overdue.body.id}`);
    expect(deleteOverdue.status).toBe(200);

    const deleteUpcoming = await request(app).delete(`/api/tasks/${upcoming.body.id}`);
    expect(deleteUpcoming.status).toBe(200);

    const finalList = await request(app).get('/api/tasks');
    const finalIds = finalList.body.map((t) => t.id);
    expect(finalIds).not.toContain(overdue.body.id);
    expect(finalIds).not.toContain(upcoming.body.id);
  });

  it('returns all tasks when no status filter is provided', async () => {
    const response = await request(app).get('/api/tasks');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });
});
