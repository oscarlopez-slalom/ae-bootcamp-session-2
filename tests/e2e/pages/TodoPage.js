// Page Object Model for the TODO app's main page
class TodoPage {
  constructor(page) {
    this.page = page;
    this.addForm = page.locator('.add-task-section form');
    this.titleInput = this.addForm.getByLabel('Title', { exact: true });
    this.dueDateInput = this.addForm.getByLabel('Due date', { exact: true });
    this.addButton = page.getByRole('button', { name: 'Add Task' });
    this.allFilterButton = page.getByRole('button', { name: 'All' });
    this.activeFilterButton = page.getByRole('button', { name: 'Active' });
    this.completedFilterButton = page.getByRole('button', { name: 'Completed' });
  }

  async goto() {
    await this.page.goto('/');
    await this.page.getByRole('heading', { name: 'To Do App' }).waitFor();
  }

  async addTask(title, dueDate) {
    await this.titleInput.fill(title);
    if (dueDate) {
      await this.dueDateInput.fill(dueDate);
    }
    await this.addButton.click();
    await this.getTaskItem(title).waitFor();
  }

  getTaskItem(title) {
    return this.page.locator('li.task-item', { hasText: title });
  }

  async toggleComplete(title) {
    await this.getTaskItem(title).getByRole('checkbox').click();
  }

  async deleteTask(title) {
    await this.getTaskItem(title).getByRole('button', { name: 'Delete' }).click();
    await this.getTaskItem(title).waitFor({ state: 'detached' });
  }

  async startEdit(title) {
    await this.getTaskItem(title).getByRole('button', { name: 'Edit' }).click();
  }

  // Only one task can be in edit mode at a time, so the edit form is looked up by class.
  async saveEdit({ newTitle, newDueDate } = {}) {
    const form = this.page.locator('.task-edit-form');
    if (newTitle) {
      await form.locator('input[type="text"]').fill(newTitle);
    }
    if (newDueDate) {
      await form.locator('input[type="date"]').fill(newDueDate);
    }
    await form.getByRole('button', { name: 'Save' }).click();
  }

  async filterBy(status) {
    const button = { all: this.allFilterButton, active: this.activeFilterButton, completed: this.completedFilterButton }[status];
    await button.click();
  }

  async isOverdue(title) {
    return (await this.getTaskItem(title).locator('.overdue-badge').count()) > 0;
  }

  async isCompleted(title) {
    const classAttr = await this.getTaskItem(title).getAttribute('class');
    return classAttr.includes('completed');
  }
}

module.exports = { TodoPage };
