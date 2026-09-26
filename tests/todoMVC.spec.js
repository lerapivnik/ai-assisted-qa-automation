const { test, expect } = require('@playwright/test');

const TODO_APP_URL = 'https://demo.playwright.dev/todomvc/#/';

async function openEmptyTodoApp(page) {
  await page.goto(TODO_APP_URL);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.getByTestId('todo-item')).toHaveCount(0);
}

function newTodoInput(page) {
  return page.getByRole('textbox', { name: 'What needs to be done?' });
}

async function addTodo(page, title) {
  const input = newTodoInput(page);
  await input.fill(title);
  await input.press('Enter');
}

function todoItem(page, title) {
  return page.getByTestId('todo-item').filter({
    has: page.getByTestId('todo-title').filter({ hasText: title }),
  });
}

async function deleteTodo(page, title) {
  const item = todoItem(page, title);
  await item.hover();
  await item.getByRole('button', { name: 'Delete' }).click();
}

test.describe('TodoMVC — Positive flows', () => {
  test.beforeEach(async ({ page }) => {
    await openEmptyTodoApp(page);
  });

  test('TC-001: new todo appears after submitting in What needs to be done?', async ({
    page,
  }) => {
    await addTodo(page, 'Buy milk');

    await expect(todoItem(page, 'Buy milk')).toHaveCount(1);
    await expect(page.locator('.todo-count')).toHaveText('1 item left');
    await expect(page.getByRole('link', { name: 'All' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Active' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Completed' })).toBeVisible();
  });

  test('TC-002: multiple todos update the list and item count', async ({ page }) => {
    await addTodo(page, 'Buy milk');
    await addTodo(page, 'Walk dog');
    await addTodo(page, 'Pay bills');

    await expect(page.getByTestId('todo-item')).toHaveCount(3);
    await expect(page.locator('.todo-count')).toHaveText('3 items left');

    for (const title of ['Buy milk', 'Walk dog', 'Pay bills']) {
      const item = todoItem(page, title);
      await expect(item.getByRole('checkbox', { name: 'Toggle Todo' })).toBeVisible();
      await item.hover();
      await expect(item.getByRole('button', { name: 'Delete' })).toBeVisible();
    }
  });

  test('TC-003: todo is marked completed when Toggle Todo is checked', async ({ page }) => {
    await addTodo(page, 'Buy milk');
    const item = todoItem(page, 'Buy milk');

    await item.getByRole('checkbox', { name: 'Toggle Todo' }).check();

    await expect(item).toHaveClass(/completed/);
    await expect(page.locator('.todo-count')).toHaveText('0 items left');
    await expect(item.getByTestId('todo-title')).toHaveText('Buy milk');
    await expect(page.getByTestId('todo-item')).toHaveCount(1);
  });

  test('TC-004: completed todo becomes active when toggled again', async ({ page }) => {
    await addTodo(page, 'Buy milk');
    const toggle = todoItem(page, 'Buy milk').getByRole('checkbox', { name: 'Toggle Todo' });
    await toggle.check();
    await toggle.uncheck();

    await expect(todoItem(page, 'Buy milk')).not.toHaveClass(/completed/);
    await expect(page.locator('.todo-count')).toHaveText('1 item left');
  });

  test('TC-005: todo is removed when Delete is clicked', async ({ page }) => {
    await addTodo(page, 'Buy milk');
    await deleteTodo(page, 'Buy milk');

    await expect(page.getByTestId('todo-item')).toHaveCount(0);
    await expect(page.locator('.todo-count')).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'All' })).toHaveCount(0);
  });

  test('TC-006: deleting one item leaves the other todos', async ({ page }) => {
    await addTodo(page, 'Buy milk');
    await addTodo(page, 'Walk dog');
    await deleteTodo(page, 'Buy milk');

    await expect(page.getByTestId('todo-item')).toHaveCount(1);
    await expect(todoItem(page, 'Walk dog')).toHaveCount(1);
    await expect(page.locator('.todo-count')).toHaveText('1 item left');
  });
});

test.describe('TodoMVC — Negative flows', () => {
  test.beforeEach(async ({ page }) => {
    await openEmptyTodoApp(page);
  });

  test('TC-007: empty submit does not create a todo', async ({ page }) => {
    const input = newTodoInput(page);
    await input.click();
    await input.press('Enter');
    await input.press('Enter');

    await expect(page.getByTestId('todo-item')).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'All' })).toHaveCount(0);
  });

  test('TC-008: whitespace-only input does not create a todo', async ({ page }) => {
    await addTodo(page, '   ');

    await expect(page.getByTestId('todo-item')).toHaveCount(0);
  });

  test('TC-009: completing a todo does not remove it from the list', async ({ page }) => {
    await addTodo(page, 'Buy milk');
    await todoItem(page, 'Buy milk').getByRole('checkbox', { name: 'Toggle Todo' }).check();

    await expect(page.getByTestId('todo-title').filter({ hasText: 'Buy milk' })).toBeVisible();
    await expect(page.getByTestId('todo-item')).toHaveCount(1);
  });

  test('TC-010: special characters render as plain text without alert', async ({ page }) => {
    const dangerous = 'Task & "quotes" <tag>';
    let dialogShown = false;
    page.on('dialog', () => {
      dialogShown = true;
    });

    await addTodo(page, dangerous);

    await expect(page.getByTestId('todo-title').filter({ hasText: dangerous })).toHaveCount(1);
    expect(dialogShown).toBe(false);
  });
});

test.describe('TodoMVC — Edge cases', () => {
  test.beforeEach(async ({ page }) => {
    await openEmptyTodoApp(page);
  });

  test('TC-011: duplicate titles create separate rows', async ({ page }) => {
    await addTodo(page, 'Buy milk');
    await addTodo(page, 'Buy milk');

    await expect(page.getByTestId('todo-item')).toHaveCount(2);
    await expect(page.getByTestId('todo-title').filter({ hasText: 'Buy milk' })).toHaveCount(2);
    await expect(page.locator('.todo-count')).toHaveText('2 items left');
  });

  test('TC-012: 500-character todo is stored in full', async ({ page }) => {
    await addTodo(page, 'Buy milk');
    await addTodo(page, 'Walk dog');
    await addTodo(page, 'Pay bills');

    const longTitle = 'A'.repeat(500);
    await addTodo(page, longTitle);

    await expect(page.locator('.todo-count')).toHaveText('4 items left');
    const titles = page.getByTestId('todo-title');
    await expect(titles).toHaveCount(4);
    await expect(titles.nth(3)).toHaveText(longTitle);
    await expect(titles.nth(3)).toHaveText(new RegExp(`^A{500}$`));
  });

  test('TC-013: todo-count uses singular and plural labels', async ({ page }) => {
    await addTodo(page, 'Buy milk');
    await expect(page.locator('.todo-count')).toHaveText('1 item left');

    await addTodo(page, 'Walk dog');
    await expect(page.locator('.todo-count')).toHaveText('2 items left');
  });

  test('TC-014: footer is hidden when the last todo is deleted', async ({ page }) => {
    await addTodo(page, 'Buy milk');
    await deleteTodo(page, 'Buy milk');

    await expect(page.getByRole('link', { name: 'All' })).toHaveCount(0);
    await expect(page.locator('.todo-count')).toHaveCount(0);
  });

  test('TC-015: leading and trailing spaces are trimmed on save', async ({ page }) => {
    await addTodo(page, '  Trim me  ');

    await expect(page.getByTestId('todo-title')).toHaveText('Trim me');
  });
});
