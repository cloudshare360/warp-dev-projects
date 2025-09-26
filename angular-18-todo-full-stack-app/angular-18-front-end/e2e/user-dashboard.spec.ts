import { test, expect } from '@playwright/test';

test.describe('User Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login as user
    await page.goto('/auth/login');
    await page.fill('input[formControlName="email"]', 'john.doe@example.com');
    await page.fill('input[formControlName="password"]', 'password123');
    await page.click('.role-option:has-text("User Login")');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL('/dashboard');
  });

  test('should display dashboard with all components', async ({ page }) => {
    // Check header
    await expect(page.locator('.logo')).toHaveText('📋 Todo App');
    await expect(page.locator('.user-greeting')).toContainText('Welcome, John');
    await expect(page.locator('.notification-btn')).toBeVisible();

    // Check sidebar
    await expect(page.locator('nav.sidebar-nav')).toBeVisible();
    await expect(page.locator('a[routerLink="/dashboard"]')).toHaveText('📋 My Todos');
    await expect(page.locator('a[routerLink="/dashboard/important"]')).toHaveText('⭐ Important');

    // Check stats cards
    await expect(page.locator('.stat-card')).toHaveCount(4);
    await expect(page.locator('.stat-card').first()).toContainText('Total Tasks');

    // Check main content area
    await expect(page.locator('h2')).toHaveText('My Todo List');
    await expect(page.locator('button:has-text("+ Add Todo")')).toBeVisible();
  });

  test('should display statistics correctly', async ({ page }) => {
    const statsCards = page.locator('.stat-card');
    
    // Check that all stat cards are visible
    await expect(statsCards).toHaveCount(4);
    
    // Check stat labels
    await expect(statsCards.nth(0)).toContainText('Total Tasks');
    await expect(statsCards.nth(1)).toContainText('Pending');
    await expect(statsCards.nth(2)).toContainText('Completed');
    await expect(statsCards.nth(3)).toContainText('Overdue');

    // Check that numbers are displayed
    await expect(statsCards.nth(0).locator('.stat-number')).toBeVisible();
    await expect(statsCards.nth(1).locator('.stat-number')).toBeVisible();
  });

  test('should toggle sidebar on mobile', async ({ page }) => {
    // Resize to mobile
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Sidebar should be hidden initially on mobile
    await expect(page.locator('.sidebar')).not.toHaveClass(/open/);
    
    // Click toggle button
    await page.click('.sidebar-toggle');
    
    // Sidebar should be visible
    await expect(page.locator('.sidebar')).toHaveClass(/open/);
  });

  test('should navigate between sidebar sections', async ({ page }) => {
    // Click on Important section
    await page.click('a[routerLink="/dashboard/important"]');
    await expect(page).toHaveURL('/dashboard/important');
    
    // Click on Completed section
    await page.click('a[routerLink="/dashboard/completed"]');
    await expect(page).toHaveURL('/dashboard/completed');
    
    // Click back to main todos
    await page.click('a[routerLink="/dashboard"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should show user avatar with initials', async ({ page }) => {
    await expect(page.locator('.user-avatar')).toBeVisible();
    await expect(page.locator('.user-avatar')).toHaveText('JD');
  });

  test('should display notifications badge', async ({ page }) => {
    await expect(page.locator('.notification-btn .badge')).toBeVisible();
    await expect(page.locator('.notification-btn .badge')).toHaveText('3');
  });
});

test.describe('Todo Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as user
    await page.goto('/auth/login');
    await page.fill('input[formControlName="email"]', 'john.doe@example.com');
    await page.fill('input[formControlName="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should display existing todos', async ({ page }) => {
    // Check if todos are displayed
    await expect(page.locator('.todo-item')).toHaveCount.greaterThan(0);
    
    // Check todo item structure
    const firstTodo = page.locator('.todo-item').first();
    await expect(firstTodo.locator('.todo-checkbox')).toBeVisible();
    await expect(firstTodo.locator('.todo-title')).toBeVisible();
    await expect(firstTodo.locator('.todo-meta')).toBeVisible();
    await expect(firstTodo.locator('.todo-actions')).toBeVisible();
  });

  test('should create new todo using quick add', async ({ page }) => {
    const todoTitle = 'New test todo from quick add';
    
    // Fill quick add form
    await page.fill('.quick-input', todoTitle);
    await page.selectOption('select[formControlName="priority"]', 'high');
    await page.selectOption('select[formControlName="category"]', 'work');
    
    // Submit quick add
    await page.click('.quick-add-form button[type="submit"]');
    
    // Check if todo was added
    await expect(page.locator(`.todo-title:has-text("${todoTitle}")`)).toBeVisible();
    
    // Verify it has the correct priority and category
    const newTodo = page.locator('.todo-item').filter({ hasText: todoTitle });
    await expect(newTodo).toHaveClass(/priority-high/);
    await expect(newTodo.locator('.category-tag')).toHaveText('work');
  });

  test('should create new todo using modal', async ({ page }) => {
    // Click Add Todo button
    await page.click('button:has-text("+ Add Todo")');
    
    // Modal should open
    await expect(page.locator('.modal')).toBeVisible();
    await expect(page.locator('.modal h3')).toHaveText('Create New Todo');
    
    // Fill modal form
    const todoTitle = 'New todo from modal';
    const todoDescription = 'This is a detailed description';
    
    await page.fill('input[formControlName="title"]', todoTitle);
    await page.fill('textarea[formControlName="description"]', todoDescription);
    await page.selectOption('select[formControlName="category"]', 'personal');
    await page.fill('input[formControlName="dueDate"]', '2024-12-31T10:00');
    await page.click('.priority-btn:has-text("High")');
    
    // Submit form
    await page.click('button:has-text("Create Todo")');
    
    // Modal should close
    await expect(page.locator('.modal')).not.toBeVisible();
    
    // Todo should be created
    await expect(page.locator(`.todo-title:has-text("${todoTitle}")`)).toBeVisible();
  });

  test('should filter todos by status', async ({ page }) => {
    // Test all filter buttons
    const filters = ['All', 'Pending', 'Completed', 'High Priority', 'Due Today', 'Overdue'];
    
    for (const filter of filters) {
      await page.click(`.filter-btn:has-text("${filter}")`);
      await expect(page.locator(`.filter-btn:has-text("${filter}")`)).toHaveClass(/active/);
    }
  });

  test('should mark todo as complete', async ({ page }) => {
    const todoItem = page.locator('.todo-item').first();
    const checkbox = todoItem.locator('.todo-checkbox');
    
    // Check the checkbox
    await checkbox.check();
    
    // Todo should have completed class
    await expect(todoItem).toHaveClass(/completed/);
    
    // Title should have strike-through
    await expect(todoItem.locator('.todo-title')).toHaveClass(/strike/);
  });

  test('should edit todo', async ({ page }) => {
    const todoItem = page.locator('.todo-item').first();
    const editButton = todoItem.locator('button[title="Edit"]');
    
    // Click edit button
    await editButton.click();
    
    // Should show edit functionality (placeholder for now)
    // This would open an edit modal in the actual implementation
  });

  test('should delete todo', async ({ page }) => {
    const initialCount = await page.locator('.todo-item').count();
    const todoItem = page.locator('.todo-item').first();
    const todoTitle = await todoItem.locator('.todo-title').textContent();
    
    // Click delete button
    await todoItem.locator('button[title="Delete"]').click();
    
    // Confirm deletion in dialog
    page.on('dialog', dialog => dialog.accept());
    
    // Todo should be removed
    await expect(page.locator('.todo-item')).toHaveCount(initialCount - 1);
    await expect(page.locator(`.todo-title:has-text("${todoTitle}")`)).not.toBeVisible();
  });

  test('should toggle important status', async ({ page }) => {
    const todoItem = page.locator('.todo-item').first();
    const starButton = todoItem.locator('button[title="Important"]');
    
    // Click star button
    await starButton.click();
    
    // Todo should be marked as important (visual feedback would be implemented)
    // This would typically change the star appearance or todo styling
  });

  test('should show todo priority colors', async ({ page }) => {
    const todos = page.locator('.todo-item');
    const todoCount = await todos.count();
    
    if (todoCount > 0) {
      // Check for priority classes
      const priorities = ['priority-high', 'priority-medium', 'priority-low'];
      
      for (let i = 0; i < Math.min(todoCount, 3); i++) {
        const todo = todos.nth(i);
        let hasPriorityClass = false;
        
        for (const priority of priorities) {
          if (await todo.getAttribute('class').then(classes => classes?.includes(priority))) {
            hasPriorityClass = true;
            break;
          }
        }
        
        expect(hasPriorityClass).toBe(true);
      }
    }
  });

  test('should validate quick add form', async ({ page }) => {
    // Submit empty quick add
    await page.click('.quick-add-form button[type="submit"]');
    
    // Button should be disabled for empty input
    await expect(page.locator('.quick-add-form button[type="submit"]')).toBeDisabled();
    
    // Add title and button should be enabled
    await page.fill('.quick-input', 'Test todo');
    await expect(page.locator('.quick-add-form button[type="submit"]')).not.toBeDisabled();
  });

  test('should show pagination when needed', async ({ page }) => {
    // If there are todos, pagination should be visible
    const todoCount = await page.locator('.todo-item').count();
    
    if (todoCount > 0) {
      await expect(page.locator('.pagination')).toBeVisible();
      await expect(page.locator('.page-info')).toContainText('Page 1 of');
    }
  });

  test('should close modal when clicking outside', async ({ page }) => {
    // Open modal
    await page.click('button:has-text("+ Add Todo")');
    await expect(page.locator('.modal')).toBeVisible();
    
    // Click on overlay (outside modal)
    await page.click('.modal-overlay');
    
    // Modal should close
    await expect(page.locator('.modal')).not.toBeVisible();
  });

  test('should close modal when clicking close button', async ({ page }) => {
    // Open modal
    await page.click('button:has-text("+ Add Todo")');
    await expect(page.locator('.modal')).toBeVisible();
    
    // Click close button
    await page.click('.close-btn');
    
    // Modal should close
    await expect(page.locator('.modal')).not.toBeVisible();
  });

  test('should reset quick add form after submission', async ({ page }) => {
    // Fill and submit quick add
    await page.fill('.quick-input', 'Test todo');
    await page.selectOption('select[formControlName="priority"]', 'high');
    await page.click('.quick-add-form button[type="submit"]');
    
    // Form should be reset
    await expect(page.locator('.quick-input')).toHaveValue('');
    await expect(page.locator('select[formControlName="priority"]')).toHaveValue('medium');
  });
});