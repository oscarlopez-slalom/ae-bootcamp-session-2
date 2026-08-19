const { test, expect } = require('@playwright/test');
const { TodoPage } = require('./pages/TodoPage');

// Each test creates its own uniquely-titled task(s) and cleans up after itself,
// so tests remain isolated and independent of one another and of execution order.
const uniqueTitle = (label) => `${label} ${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

test.describe('TODO app workflow', () => {
  test('user can add a new task', async ({ page }) => {
    const todoPage = new TodoPage(page);
    const title = uniqueTitle('Add task');
    await todoPage.goto();

    await todoPage.addTask(title);

    await expect(todoPage.getTaskItem(title)).toBeVisible();

    // Verify the task was actually persisted in the backend, not just rendered in the UI.
    const tasksAfterAdd = await (await page.request.get('/api/tasks')).json();
    expect(tasksAfterAdd.some((t) => t.title === title)).toBe(true);

    await todoPage.deleteTask(title);
  });

  test('user can mark a task complete and back to active', async ({ page }) => {
    const todoPage = new TodoPage(page);
    const title = uniqueTitle('Complete task');
    await todoPage.goto();
    await todoPage.addTask(title);

    await todoPage.toggleComplete(title);
    await expect(todoPage.getTaskItem(title)).toHaveClass(/completed/);

    await todoPage.toggleComplete(title);
    await expect(todoPage.getTaskItem(title)).not.toHaveClass(/completed/);

    await todoPage.deleteTask(title);
  });

  test('user can edit a task title and due date', async ({ page }) => {
    const todoPage = new TodoPage(page);
    const title = uniqueTitle('Edit task');
    const updatedTitle = `${title} - updated`;
    await todoPage.goto();
    await todoPage.addTask(title);

    await todoPage.startEdit(title);
    await todoPage.saveEdit({ newTitle: updatedTitle, newDueDate: '2030-01-01' });

    await expect(todoPage.getTaskItem(updatedTitle)).toBeVisible();
    await expect(todoPage.getTaskItem(updatedTitle)).toContainText('2030-01-01');

    await todoPage.deleteTask(updatedTitle);
  });

  test('user can delete a task', async ({ page }) => {
    const todoPage = new TodoPage(page);
    const title = uniqueTitle('Delete task');
    await todoPage.goto();
    await todoPage.addTask(title);

    await todoPage.deleteTask(title);

    await expect(todoPage.getTaskItem(title)).toHaveCount(0);

    // Verify the task was actually removed from the backend, not just hidden in the UI.
    const tasksAfterDelete = await (await page.request.get('/api/tasks')).json();
    expect(tasksAfterDelete.some((t) => t.title === title)).toBe(false);
  });

  test('user can filter tasks by status', async ({ page }) => {
    const todoPage = new TodoPage(page);
    const activeTitle = uniqueTitle('Filter active');
    const completedTitle = uniqueTitle('Filter completed');
    await todoPage.goto();
    await todoPage.addTask(activeTitle);
    await todoPage.addTask(completedTitle);
    await todoPage.toggleComplete(completedTitle);

    await todoPage.filterBy('active');
    await expect(todoPage.getTaskItem(activeTitle)).toBeVisible();
    await expect(todoPage.getTaskItem(completedTitle)).toHaveCount(0);

    await todoPage.filterBy('completed');
    await expect(todoPage.getTaskItem(completedTitle)).toBeVisible();
    await expect(todoPage.getTaskItem(activeTitle)).toHaveCount(0);

    await todoPage.filterBy('all');
    await todoPage.deleteTask(activeTitle);
    await todoPage.deleteTask(completedTitle);
  });

  test('overdue tasks are clearly identified', async ({ page }) => {
    const todoPage = new TodoPage(page);
    const title = uniqueTitle('Overdue task');
    await todoPage.goto();

    await todoPage.addTask(title, '2000-01-01');

    expect(await todoPage.isOverdue(title)).toBe(true);

    await todoPage.deleteTask(title);
  });
});
