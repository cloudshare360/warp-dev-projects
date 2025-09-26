import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/auth/login');
    await page.fill('input[formControlName="email"]', 'admin@example.com');
    await page.fill('input[formControlName="password"]', 'admin123');
    await page.click('.role-option:has-text("Admin Login")');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL('/admin/dashboard');
  });

  test('should display admin dashboard with all components', async ({ page }) => {
    // Check header
    await expect(page.locator('.logo')).toHaveText('📋 Todo App - Admin Panel');
    await expect(page.locator('.admin-greeting')).toContainText('Welcome, Admin');
    await expect(page.locator('.notification-btn')).toBeVisible();

    // Check admin stats cards
    await expect(page.locator('.admin-stat-card')).toHaveCount(4);
    
    // Check main navigation
    await expect(page.locator('a[routerLink="/admin/users"]')).toHaveText('👥 Users');
    await expect(page.locator('a[routerLink="/admin/system"]')).toHaveText('⚙️ System');
    await expect(page.locator('a[routerLink="/admin/analytics"]')).toHaveText('📊 Analytics');

    // Check switch to user view button
    await expect(page.locator('button:has-text("👤 Switch to User View")')).toBeVisible();
  });

  test('should display admin statistics correctly', async ({ page }) => {
    const statsCards = page.locator('.admin-stat-card');
    
    // Check that all admin stat cards are visible
    await expect(statsCards).toHaveCount(4);
    
    // Check admin stat labels
    await expect(statsCards.nth(0)).toContainText('Total Users');
    await expect(statsCards.nth(1)).toContainText('Active Users');
    await expect(statsCards.nth(2)).toContainText('Total Todos');
    await expect(statsCards.nth(3)).toContainText('System Health');

    // Check that numbers/indicators are displayed
    await expect(statsCards.nth(0).locator('.stat-number')).toBeVisible();
    await expect(statsCards.nth(1).locator('.stat-number')).toBeVisible();
    await expect(statsCards.nth(2).locator('.stat-number')).toBeVisible();
    await expect(statsCards.nth(3).locator('.health-indicator')).toBeVisible();
  });

  test('should display recent activity', async ({ page }) => {
    // Check recent activity section
    await expect(page.locator('.recent-activity h3')).toHaveText('Recent Activity');
    await expect(page.locator('.activity-item')).toHaveCount.greaterThan(0);
    
    // Check activity item structure
    const firstActivity = page.locator('.activity-item').first();
    await expect(firstActivity.locator('.activity-icon')).toBeVisible();
    await expect(firstActivity.locator('.activity-text')).toBeVisible();
    await expect(firstActivity.locator('.activity-time')).toBeVisible();
  });

  test('should show system health status', async ({ page }) => {
    // Check system health section
    await expect(page.locator('.system-health h3')).toHaveText('System Health');
    
    const healthCard = page.locator('.admin-stat-card').nth(3);
    const healthIndicator = healthCard.locator('.health-indicator');
    
    // Health indicator should show status
    await expect(healthIndicator).toBeVisible();
    
    // Should have either healthy, warning, or critical status
    const healthClasses = ['healthy', 'warning', 'critical'];
    let hasHealthClass = false;
    
    for (const healthClass of healthClasses) {
      const classList = await healthIndicator.getAttribute('class');
      if (classList?.includes(healthClass)) {
        hasHealthClass = true;
        break;
      }
    }
    
    expect(hasHealthClass).toBe(true);
  });

  test('should switch to user view', async ({ page }) => {
    // Click switch to user view button
    await page.click('button:has-text("👤 Switch to User View")');
    
    // Should redirect to user dashboard
    await expect(page).toHaveURL('/dashboard');
    
    // Should show user interface
    await expect(page.locator('h2')).toHaveText('My Todo List');
    await expect(page.locator('button:has-text("+ Add Todo")')).toBeVisible();
  });

  test('should navigate to users management', async ({ page }) => {
    // Click on Users link
    await page.click('a[routerLink="/admin/users"]');
    
    // Should navigate to users page
    await expect(page).toHaveURL('/admin/users');
  });

  test('should navigate to system management', async ({ page }) => {
    // Click on System link  
    await page.click('a[routerLink="/admin/system"]');
    
    // Should navigate to system page
    await expect(page).toHaveURL('/admin/system');
  });

  test('should navigate to analytics', async ({ page }) => {
    // Click on Analytics link
    await page.click('a[routerLink="/admin/analytics"]');
    
    // Should navigate to analytics page
    await expect(page).toHaveURL('/admin/analytics');
  });

  test('should display admin notifications', async ({ page }) => {
    // Check notifications badge
    await expect(page.locator('.notification-btn .badge')).toBeVisible();
    
    // Badge should have number of notifications
    const badgeText = await page.locator('.notification-btn .badge').textContent();
    expect(parseInt(badgeText || '0')).toBeGreaterThanOrEqual(0);
  });

  test('should show admin avatar', async ({ page }) => {
    // Check admin avatar
    await expect(page.locator('.admin-avatar')).toBeVisible();
    await expect(page.locator('.admin-avatar')).toHaveText('A');
  });

  test('should logout from admin panel', async ({ page }) => {
    // Click logout button
    await page.click('button:has-text("🚪 Logout")');
    
    // Should redirect to login page
    await expect(page).toHaveURL('/auth/login');
    
    // Should show login form
    await expect(page.locator('h2')).toHaveText('Login to Your Account');
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Resize to mobile
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Stats should stack vertically
    const statsContainer = page.locator('.admin-stats');
    await expect(statsContainer).toBeVisible();
    
    // Navigation should be collapsible
    await expect(page.locator('.admin-nav')).toBeVisible();
  });
});

test.describe('Admin User Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin and navigate to users
    await page.goto('/auth/login');
    await page.fill('input[formControlName="email"]', 'admin@example.com');
    await page.fill('input[formControlName="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.click('a[routerLink="/admin/users"]');
    
    await expect(page).toHaveURL('/admin/users');
  });

  test('should display users list', async ({ page }) => {
    // Check page title
    await expect(page.locator('h2')).toHaveText('User Management');
    
    // Check if users table is displayed
    await expect(page.locator('.users-table')).toBeVisible();
    await expect(page.locator('.user-row')).toHaveCount.greaterThan(0);
    
    // Check table headers
    await expect(page.locator('th:has-text("Name")')).toBeVisible();
    await expect(page.locator('th:has-text("Email")')).toBeVisible();
    await expect(page.locator('th:has-text("Role")')).toBeVisible();
    await expect(page.locator('th:has-text("Status")')).toBeVisible();
    await expect(page.locator('th:has-text("Actions")')).toBeVisible();
  });

  test('should show user details correctly', async ({ page }) => {
    const firstUserRow = page.locator('.user-row').first();
    
    // Check user details structure
    await expect(firstUserRow.locator('.user-name')).toBeVisible();
    await expect(firstUserRow.locator('.user-email')).toBeVisible();
    await expect(firstUserRow.locator('.user-role')).toBeVisible();
    await expect(firstUserRow.locator('.user-status')).toBeVisible();
    await expect(firstUserRow.locator('.user-actions')).toBeVisible();
  });

  test('should filter users by status', async ({ page }) => {
    // Check filter buttons
    await expect(page.locator('.filter-btn:has-text("All Users")')).toBeVisible();
    await expect(page.locator('.filter-btn:has-text("Active")')).toBeVisible();
    await expect(page.locator('.filter-btn:has-text("Inactive")')).toBeVisible();
    
    // Test filtering
    await page.click('.filter-btn:has-text("Active")');
    await expect(page.locator('.filter-btn:has-text("Active")')).toHaveClass(/active/);
    
    await page.click('.filter-btn:has-text("Inactive")');
    await expect(page.locator('.filter-btn:has-text("Inactive")')).toHaveClass(/active/);
    
    await page.click('.filter-btn:has-text("All Users")');
    await expect(page.locator('.filter-btn:has-text("All Users")')).toHaveClass(/active/);
  });

  test('should search users', async ({ page }) => {
    // Check search input
    await expect(page.locator('.search-input')).toBeVisible();
    
    // Search for specific user
    await page.fill('.search-input', 'john');
    
    // Results should filter based on search
    await expect(page.locator('.user-row')).toHaveCount.greaterThanOrEqual(1);
    
    // Clear search
    await page.fill('.search-input', '');
  });

  test('should edit user details', async ({ page }) => {
    const firstUserRow = page.locator('.user-row').first();
    
    // Click edit button
    await firstUserRow.locator('button[title="Edit"]').click();
    
    // Edit modal should open
    await expect(page.locator('.modal')).toBeVisible();
    await expect(page.locator('.modal h3')).toHaveText('Edit User');
    
    // Check edit form fields
    await expect(page.locator('input[formControlName="firstName"]')).toBeVisible();
    await expect(page.locator('input[formControlName="lastName"]')).toBeVisible();
    await expect(page.locator('input[formControlName="email"]')).toBeVisible();
    await expect(page.locator('select[formControlName="role"]')).toBeVisible();
    
    // Make changes
    await page.fill('input[formControlName="firstName"]', 'Updated Name');
    
    // Save changes
    await page.click('button:has-text("Save Changes")');
    
    // Modal should close
    await expect(page.locator('.modal')).not.toBeVisible();
  });

  test('should toggle user status', async ({ page }) => {
    const firstUserRow = page.locator('.user-row').first();
    const statusToggle = firstUserRow.locator('.status-toggle');
    
    // Click status toggle
    await statusToggle.click();
    
    // Should confirm action
    page.on('dialog', dialog => dialog.accept());
    
    // Status should change visually
    // This would be implemented with specific status indicators
  });

  test('should delete user with confirmation', async ({ page }) => {
    const initialCount = await page.locator('.user-row').count();
    const firstUserRow = page.locator('.user-row').first();
    
    // Click delete button
    await firstUserRow.locator('button[title="Delete"]').click();
    
    // Confirm deletion
    page.on('dialog', dialog => dialog.accept());
    
    // User should be removed
    await expect(page.locator('.user-row')).toHaveCount(initialCount - 1);
  });

  test('should show user statistics', async ({ page }) => {
    // Check user stats section
    await expect(page.locator('.user-stats')).toBeVisible();
    
    // Should show total, active, inactive counts
    await expect(page.locator('.stat-card:has-text("Total Users")')).toBeVisible();
    await expect(page.locator('.stat-card:has-text("Active Users")')).toBeVisible();
    await expect(page.locator('.stat-card:has-text("Inactive Users")')).toBeVisible();
  });

  test('should export users data', async ({ page }) => {
    // Check export button
    await expect(page.locator('button:has-text("📥 Export")')).toBeVisible();
    
    // Click export button
    await page.click('button:has-text("📥 Export")');
    
    // Should trigger download (in actual implementation)
    // This would be tested with download event handling
  });

  test('should add new user', async ({ page }) => {
    // Click add user button
    await page.click('button:has-text("+ Add User")');
    
    // Add user modal should open
    await expect(page.locator('.modal')).toBeVisible();
    await expect(page.locator('.modal h3')).toHaveText('Add New User');
    
    // Fill add user form
    await page.fill('input[formControlName="firstName"]', 'New');
    await page.fill('input[formControlName="lastName"]', 'User');
    await page.fill('input[formControlName="email"]', 'newuser@example.com');
    await page.selectOption('select[formControlName="role"]', 'user');
    await page.fill('input[formControlName="password"]', 'password123');
    
    // Submit form
    await page.click('button:has-text("Add User")');
    
    // Modal should close
    await expect(page.locator('.modal')).not.toBeVisible();
    
    // New user should appear in list
    await expect(page.locator('.user-email:has-text("newuser@example.com")')).toBeVisible();
  });

  test('should show pagination for users', async ({ page }) => {
    // Check if pagination is visible
    await expect(page.locator('.pagination')).toBeVisible();
    await expect(page.locator('.page-info')).toContainText('Page 1 of');
  });

  test('should sort users by column', async ({ page }) => {
    // Click on Name column header to sort
    await page.click('th:has-text("Name")');
    
    // Column should show sort indicator
    await expect(page.locator('th:has-text("Name") .sort-icon')).toBeVisible();
    
    // Click again to reverse sort
    await page.click('th:has-text("Name")');
    
    // Sort indicator should change direction
    await expect(page.locator('th:has-text("Name") .sort-icon')).toHaveClass(/desc/);
  });

  test('should validate user form inputs', async ({ page }) => {
    // Click add user button
    await page.click('button:has-text("+ Add User")');
    
    // Try to submit empty form
    await page.click('button:has-text("Add User")');
    
    // Should show validation errors
    await expect(page.locator('.error-message')).toHaveCount.greaterThan(0);
    
    // Fill invalid email
    await page.fill('input[formControlName="email"]', 'invalid-email');
    await page.blur();
    
    // Should show email validation error
    await expect(page.locator('.error-message:has-text("email")')).toBeVisible();
  });

  test('should close modal on escape key', async ({ page }) => {
    // Open add user modal
    await page.click('button:has-text("+ Add User")');
    await expect(page.locator('.modal')).toBeVisible();
    
    // Press escape key
    await page.keyboard.press('Escape');
    
    // Modal should close
    await expect(page.locator('.modal')).not.toBeVisible();
  });
});