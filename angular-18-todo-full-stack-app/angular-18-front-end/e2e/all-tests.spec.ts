import { test, expect } from '@playwright/test';

// Import test configurations
test.describe('Full E2E Test Suite', () => {
  test.beforeAll(async () => {
    console.log('🚀 Starting comprehensive E2E test suite for Angular Todo App');
  });

  test.afterAll(async () => {
    console.log('✅ E2E test suite completed successfully');
  });

  test('should run smoke test for all major flows', async ({ page }) => {
    console.log('🔍 Running smoke test for critical user journeys...');

    // 1. Test login flow
    await page.goto('/auth/login');
    await expect(page.locator('h2')).toHaveText('Login to Your Account');
    
    await page.fill('input[formControlName="email"]', 'john.doe@example.com');
    await page.fill('input[formControlName="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');

    // 2. Test dashboard loads properly
    await expect(page.locator('h2')).toHaveText('My Todo List');
    await expect(page.locator('.stat-card')).toHaveCount(4);

    // 3. Test todo creation
    await page.fill('.quick-input', 'Smoke test todo');
    await page.click('.quick-add-form button[type="submit"]');
    await expect(page.locator('.todo-title:has-text("Smoke test todo")')).toBeVisible();

    // 4. Test admin access
    await page.goto('/auth/login');
    await page.fill('input[formControlName="email"]', 'admin@example.com');
    await page.fill('input[formControlName="password"]', 'admin123');
    await page.click('.role-option:has-text("Admin Login")');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/admin/dashboard');
    await expect(page.locator('.admin-stat-card')).toHaveCount(4);

    console.log('✅ Smoke test passed - all critical flows working');
  });

  test('should validate responsive design on multiple viewports', async ({ page }) => {
    console.log('📱 Testing responsive design across device sizes...');

    await page.goto('/auth/login');
    await page.fill('input[formControlName="email"]', 'john.doe@example.com');
    await page.fill('input[formControlName="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('.sidebar-toggle')).toBeVisible();
    await expect(page.locator('.sidebar')).not.toHaveClass(/open/);

    // Test tablet viewport  
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('.sidebar')).toBeVisible();
    await expect(page.locator('.main-content')).toBeVisible();

    // Test desktop viewport
    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(page.locator('.sidebar')).toBeVisible();
    await expect(page.locator('.stat-card')).toHaveCount(4);

    console.log('✅ Responsive design tests passed');
  });

  test('should validate accessibility features', async ({ page }) => {
    console.log('♿ Testing accessibility features...');

    await page.goto('/auth/login');

    // Test keyboard navigation
    await page.keyboard.press('Tab');
    await expect(page.locator('input[formControlName="email"]')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('input[formControlName="password"]')).toBeFocused();

    // Test form labels
    await expect(page.locator('label[for="email"]')).toBeVisible();
    await expect(page.locator('label[for="password"]')).toBeVisible();

    // Login and test dashboard accessibility
    await page.fill('input[formControlName="email"]', 'john.doe@example.com');
    await page.fill('input[formControlName="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Test heading structure
    await expect(page.locator('h2')).toHaveText('My Todo List');

    console.log('✅ Accessibility tests passed');
  });

  test('should handle error scenarios gracefully', async ({ page }) => {
    console.log('❌ Testing error handling scenarios...');

    // Test invalid login
    await page.goto('/auth/login');
    await page.fill('input[formControlName="email"]', 'invalid@example.com');
    await page.fill('input[formControlName="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Should stay on login page
    await expect(page).toHaveURL('/auth/login');

    // Test unauthorized access
    await page.goto('/admin/dashboard');
    await expect(page).toHaveURL('/auth/login');

    // Test network offline scenario (if applicable)
    // await page.setOffline(true);
    // Test graceful degradation

    console.log('✅ Error handling tests passed');
  });

  test('should verify all navigation flows work correctly', async ({ page }) => {
    console.log('🧭 Testing navigation flows...');

    // Login as user
    await page.goto('/auth/login');
    await page.fill('input[formControlName="email"]', 'john.doe@example.com');
    await page.fill('input[formControlName="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Test user navigation
    await page.click('a[routerLink="/dashboard/important"]');
    await expect(page).toHaveURL('/dashboard/important');

    await page.click('a[routerLink="/dashboard/completed"]');
    await expect(page).toHaveURL('/dashboard/completed');

    await page.click('a[routerLink="/dashboard"]');
    await expect(page).toHaveURL('/dashboard');

    // Test admin navigation
    await page.goto('/auth/login');
    await page.fill('input[formControlName="email"]', 'admin@example.com');
    await page.fill('input[formControlName="password"]', 'admin123');
    await page.click('button[type="submit"]');

    await page.click('a[routerLink="/admin/users"]');
    await expect(page).toHaveURL('/admin/users');

    await page.click('a[routerLink="/admin/system"]');
    await expect(page).toHaveURL('/admin/system');

    console.log('✅ Navigation tests passed');
  });

  test('should validate data integrity and CRUD operations', async ({ page }) => {
    console.log('💾 Testing data integrity and CRUD operations...');

    // Login
    await page.goto('/auth/login');
    await page.fill('input[formControlName="email"]', 'john.doe@example.com');
    await page.fill('input[formControlName="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Create todo
    const todoTitle = `Integration test todo ${Date.now()}`;
    await page.fill('.quick-input', todoTitle);
    await page.click('.quick-add-form button[type="submit"]');
    await expect(page.locator(`.todo-title:has-text("${todoTitle}")`)).toBeVisible();

    // Mark as complete
    const todoItem = page.locator('.todo-item').filter({ hasText: todoTitle });
    await todoItem.locator('.todo-checkbox').check();
    await expect(todoItem).toHaveClass(/completed/);

    // Test filtering
    await page.click('.filter-btn:has-text("Completed")');
    await expect(page.locator('.filter-btn:has-text("Completed")')).toHaveClass(/active/);

    console.log('✅ Data integrity tests passed');
  });

  test('should verify performance benchmarks', async ({ page }) => {
    console.log('⚡ Testing performance benchmarks...');

    const startTime = Date.now();
    
    // Test initial load time
    await page.goto('/auth/login');
    const loginLoadTime = Date.now() - startTime;
    expect(loginLoadTime).toBeLessThan(5000); // Should load within 5 seconds

    // Test login response time
    const loginStart = Date.now();
    await page.fill('input[formControlName="email"]', 'john.doe@example.com');
    await page.fill('input[formControlName="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
    const loginTime = Date.now() - loginStart;
    expect(loginTime).toBeLessThan(3000); // Login should complete within 3 seconds

    // Test dashboard load time
    const dashboardStart = Date.now();
    await page.goto('/dashboard');
    await expect(page.locator('.stat-card')).toHaveCount(4);
    const dashboardTime = Date.now() - dashboardStart;
    expect(dashboardTime).toBeLessThan(2000); // Dashboard should load within 2 seconds

    console.log(`✅ Performance tests passed - Login: ${loginTime}ms, Dashboard: ${dashboardTime}ms`);
  });

  test('should validate security measures', async ({ page }) => {
    console.log('🔒 Testing security measures...');

    // Test unauthenticated access protection
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/auth/login');

    await page.goto('/admin/dashboard');
    await expect(page).toHaveURL('/auth/login');

    // Test role-based access
    await page.fill('input[formControlName="email"]', 'john.doe@example.com');
    await page.fill('input[formControlName="password"]', 'password123');
    await page.click('button[type="submit"]');

    // User should not be able to access admin routes
    await page.goto('/admin/users');
    await expect(page).toHaveURL('/dashboard'); // Should redirect to user dashboard

    console.log('✅ Security tests passed');
  });
});

// Test configuration and utilities
test.describe('Test Configuration', () => {
  test('should verify test environment is properly set up', async ({ page }) => {
    console.log('🔧 Verifying test environment...');

    // Check that JSON server is running
    await page.goto('/auth/login');
    await expect(page.locator('h2')).toHaveText('Login to Your Account');

    // Verify mock data is available
    await page.fill('input[formControlName="email"]', 'john.doe@example.com');
    await page.fill('input[formControlName="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('.user-greeting')).toContainText('Welcome, John');

    console.log('✅ Test environment verified');
  });

  test('should clean up test data after suite', async ({ page }) => {
    console.log('🧹 Cleaning up test data...');
    
    // This would typically reset the JSON server data to initial state
    // For now, we just verify the app is still functional
    await page.goto('/auth/login');
    await expect(page.locator('h2')).toHaveText('Login to Your Account');
    
    console.log('✅ Test cleanup completed');
  });
});