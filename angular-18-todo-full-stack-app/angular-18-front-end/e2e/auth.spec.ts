import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
  });

  test('should display login page with all elements', async ({ page }) => {
    // Check page title and logo
    await expect(page.locator('h1.logo')).toHaveText('📋 Todo App');
    await expect(page.locator('.tagline')).toHaveText('Manage your tasks efficiently');

    // Check form elements
    await expect(page.locator('input[formControlName="email"]')).toBeVisible();
    await expect(page.locator('input[formControlName="password"]')).toBeVisible();
    await expect(page.locator('.role-option')).toHaveCount(2);
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    // Check navigation links
    await expect(page.locator('a[routerLink="/auth/forgot-password"]')).toBeVisible();
    await expect(page.locator('a[routerLink="/auth/register"]')).toBeVisible();

    // Check demo credentials
    await expect(page.locator('.demo-credentials')).toBeVisible();
  });

  test('should login as user with valid credentials', async ({ page }) => {
    // Fill login form
    await page.fill('input[formControlName="email"]', 'john.doe@example.com');
    await page.fill('input[formControlName="password"]', 'password123');
    await page.click('.role-option:has-text("User Login")');

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to user dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('h2')).toHaveText('My Todo List');
  });

  test('should login as admin with valid credentials', async ({ page }) => {
    // Fill login form
    await page.fill('input[formControlName="email"]', 'admin@todoapp.com');
    await page.fill('input[formControlName="password"]', 'password123');
    await page.click('.role-option:has-text("Admin Login")');

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to admin dashboard
    await expect(page).toHaveURL('/admin');
    await expect(page.locator('h1')).toHaveText('Admin Dashboard');
    await expect(page.locator('.admin-badge')).toHaveText('ADMIN');
  });

  test('should show error for invalid credentials', async ({ page }) => {
    // Fill login form with invalid credentials
    await page.fill('input[formControlName="email"]', 'invalid@example.com');
    await page.fill('input[formControlName="password"]', 'wrongpassword');

    // Submit form
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator('.error-message')).toHaveText('Invalid email or password');
  });

  test('should validate required fields', async ({ page }) => {
    // Try to submit empty form
    await page.click('button[type="submit"]');

    // Button should be disabled
    await expect(page.locator('button[type="submit"]')).toBeDisabled();
  });

  test('should use demo credentials when clicked', async ({ page }) => {
    // Click on user demo credentials
    await page.click('.demo-account:has-text("User:")');

    // Check if form is filled
    await expect(page.locator('input[formControlName="email"]')).toHaveValue('john.doe@example.com');
    await expect(page.locator('input[formControlName="password"]')).toHaveValue('password123');
  });

  test('should navigate to register page', async ({ page }) => {
    await page.click('a[routerLink="/auth/register"]');
    await expect(page).toHaveURL('/auth/register');
    await expect(page.locator('h1.logo')).toHaveText('📋 Todo App');
    await expect(page.locator('.tagline')).toHaveText('Create your account');
  });

  test('should register new user account', async ({ page }) => {
    // Navigate to register page
    await page.click('a[routerLink="/auth/register"]');

    // Fill registration form
    await page.fill('input[formControlName="fullName"]', 'Test User');
    await page.fill('input[formControlName="email"]', 'test@example.com');
    await page.fill('input[formControlName="password"]', 'password123');
    await page.fill('input[formControlName="confirmPassword"]', 'password123');
    await page.click('.role-option:has-text("User Account")');

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to login page
    await expect(page).toHaveURL('/auth/login');
  });

  test('should toggle between user and admin role selection', async ({ page }) => {
    // Initially user should be selected
    await expect(page.locator('.role-option:has-text("User Login")')).toHaveClass(/selected/);
    
    // Click admin option
    await page.click('.role-option:has-text("Admin Login")');
    await expect(page.locator('.role-option:has-text("Admin Login")')).toHaveClass(/selected/);
    await expect(page.locator('.role-option:has-text("User Login")')).not.toHaveClass(/selected/);

    // Click back to user
    await page.click('.role-option:has-text("User Login")');
    await expect(page.locator('.role-option:has-text("User Login")')).toHaveClass(/selected/);
  });

  test('should show loading state during login', async ({ page }) => {
    // Fill form
    await page.fill('input[formControlName="email"]', 'john.doe@example.com');
    await page.fill('input[formControlName="password"]', 'password123');

    // Click submit and check loading state
    await page.click('button[type="submit"]');
    await expect(page.locator('button[type="submit"]')).toHaveText('Signing in...');
  });
});

test.describe('Authentication Guards', () => {
  test('should redirect unauthenticated user to login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/auth/login');
  });

  test('should redirect non-admin user from admin routes', async ({ page }) => {
    // Login as regular user first
    await page.goto('/auth/login');
    await page.fill('input[formControlName="email"]', 'john.doe@example.com');
    await page.fill('input[formControlName="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Try to access admin route
    await page.goto('/admin');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should allow admin access to admin routes', async ({ page }) => {
    // Login as admin
    await page.goto('/auth/login');
    await page.fill('input[formControlName="email"]', 'admin@todoapp.com');
    await page.fill('input[formControlName="password"]', 'password123');
    await page.click('.role-option:has-text("Admin Login")');
    await page.click('button[type="submit"]');

    // Should be able to access admin route
    await expect(page).toHaveURL('/admin');
    await expect(page.locator('.admin-badge')).toBeVisible();
  });

  test('should logout and redirect to login', async ({ page }) => {
    // Login first
    await page.goto('/auth/login');
    await page.fill('input[formControlName="email"]', 'john.doe@example.com');
    await page.fill('input[formControlName="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Logout
    await page.click('button:has-text("Logout")');
    await expect(page).toHaveURL('/auth/login');

    // Should not be able to access protected routes
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/auth/login');
  });
});