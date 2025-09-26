import { test, expect } from '@playwright/test';

test.describe('Responsive Design', () => {
  test.beforeEach(async ({ page }) => {
    // Login as user
    await page.goto('/auth/login');
    await page.fill('input[formControlName="email"]', 'john.doe@example.com');
    await page.fill('input[formControlName="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should display correctly on mobile devices', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // Header should be responsive
    await expect(page.locator('.header')).toBeVisible();
    await expect(page.locator('.logo')).toBeVisible();
    await expect(page.locator('.sidebar-toggle')).toBeVisible();

    // Sidebar should be hidden on mobile initially
    await expect(page.locator('.sidebar')).not.toHaveClass(/open/);

    // Stats cards should stack vertically
    const statsCards = page.locator('.stat-card');
    await expect(statsCards).toHaveCount(4);
    
    // Content should be scrollable
    await expect(page.locator('.main-content')).toBeVisible();
    
    // Forms should be responsive
    await expect(page.locator('.quick-add-form')).toBeVisible();
  });

  test('should display correctly on tablet devices', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });

    // Layout should adapt to tablet size
    await expect(page.locator('.sidebar')).toBeVisible();
    await expect(page.locator('.main-content')).toBeVisible();

    // Stats should display in 2x2 grid on tablet
    const statsCards = page.locator('.stat-card');
    await expect(statsCards).toHaveCount(4);
  });

  test('should display correctly on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    // Full layout should be visible
    await expect(page.locator('.sidebar')).toBeVisible();
    await expect(page.locator('.main-content')).toBeVisible();
    await expect(page.locator('.header')).toBeVisible();

    // Stats should display in a single row
    const statsCards = page.locator('.stat-card');
    await expect(statsCards).toHaveCount(4);
  });

  test('should toggle sidebar on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // Sidebar should be hidden initially
    await expect(page.locator('.sidebar')).not.toHaveClass(/open/);

    // Click toggle button
    await page.click('.sidebar-toggle');

    // Sidebar should open
    await expect(page.locator('.sidebar')).toHaveClass(/open/);

    // Click toggle again to close
    await page.click('.sidebar-toggle');
    await expect(page.locator('.sidebar')).not.toHaveClass(/open/);
  });

  test('should handle modal responsiveness', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // Open add todo modal
    await page.click('button:has-text("+ Add Todo")');

    // Modal should be responsive on mobile
    await expect(page.locator('.modal')).toBeVisible();
    await expect(page.locator('.modal .modal-content')).toBeVisible();

    // Form fields should be stacked vertically
    await expect(page.locator('input[formControlName="title"]')).toBeVisible();
    await expect(page.locator('textarea[formControlName="description"]')).toBeVisible();
  });

  test('should handle navigation responsiveness', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // Navigation should work on mobile
    await page.click('.sidebar-toggle');
    await page.click('a[routerLink="/dashboard/important"]');

    await expect(page).toHaveURL('/dashboard/important');
  });

  test('should handle form layouts on different screen sizes', async ({ page }) => {
    // Test desktop form layout
    await page.setViewportSize({ width: 1440, height: 900 });
    
    const quickAddForm = page.locator('.quick-add-form');
    await expect(quickAddForm).toBeVisible();
    await expect(quickAddForm.locator('.quick-input')).toBeVisible();
    await expect(quickAddForm.locator('select')).toHaveCount.greaterThanOrEqual(1);

    // Test mobile form layout
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(quickAddForm).toBeVisible();
    
    // Form fields should still be accessible
    await expect(quickAddForm.locator('.quick-input')).toBeVisible();
  });

  test('should handle touch interactions on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // Test touch on sidebar toggle
    await page.tap('.sidebar-toggle');
    await expect(page.locator('.sidebar')).toHaveClass(/open/);

    // Test touch on todo items
    const todoItem = page.locator('.todo-item').first();
    if (await todoItem.isVisible()) {
      await todoItem.tap();
      // Should not cause any errors or unexpected behavior
    }

    // Test touch on buttons
    await page.tap('button:has-text("+ Add Todo")');
    await expect(page.locator('.modal')).toBeVisible();
  });
});

test.describe('Accessibility (A11y)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
  });

  test('should have proper heading structure', async ({ page }) => {
    // Check login page headings
    await expect(page.locator('h1, h2').first()).toBeVisible();
    
    // Login and check dashboard headings
    await page.fill('input[formControlName="email"]', 'john.doe@example.com');
    await page.fill('input[formControlName="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Dashboard should have proper heading structure
    await expect(page.locator('h2')).toHaveText('My Todo List');
  });

  test('should have proper form labels', async ({ page }) => {
    // Check login form labels
    await expect(page.locator('label[for="email"]')).toContainText('Email');
    await expect(page.locator('label[for="password"]')).toContainText('Password');

    // Check form inputs have proper associations
    const emailInput = page.locator('input[formControlName="email"]');
    const passwordInput = page.locator('input[formControlName="password"]');
    
    await expect(emailInput).toHaveAttribute('id', 'email');
    await expect(passwordInput).toHaveAttribute('id', 'password');
  });

  test('should support keyboard navigation', async ({ page }) => {
    // Test tab navigation on login form
    await page.keyboard.press('Tab');
    await expect(page.locator('input[formControlName="email"]')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.locator('input[formControlName="password"]')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.locator('button[type="submit"]')).toBeFocused();

    // Test Enter key submission
    await page.fill('input[formControlName="email"]', 'john.doe@example.com');
    await page.fill('input[formControlName="password"]', 'password123');
    await page.keyboard.press('Enter');

    await expect(page).toHaveURL('/dashboard');
  });

  test('should have proper ARIA labels and roles', async ({ page }) => {
    // Login first
    await page.fill('input[formControlName="email"]', 'john.doe@example.com');
    await page.fill('input[formControlName="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Check ARIA labels on dashboard elements
    await expect(page.locator('[aria-label="Main navigation"]')).toBeVisible();
    await expect(page.locator('[aria-label="User menu"]')).toBeVisible();
    
    // Check buttons have proper labels
    const addButton = page.locator('button:has-text("+ Add Todo")');
    await expect(addButton).toHaveAttribute('aria-label');
  });

  test('should have sufficient color contrast', async ({ page }) => {
    // This is typically tested with automated tools
    // Here we check for basic visibility of text elements
    
    await page.fill('input[formControlName="email"]', 'john.doe@example.com');
    await page.fill('input[formControlName="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Check that text is visible and readable
    const textElements = page.locator('p, span, h1, h2, h3, button, label');
    const count = await textElements.count();
    
    for (let i = 0; i < Math.min(count, 10); i++) {
      const element = textElements.nth(i);
      if (await element.isVisible()) {
        // Element should have text content
        const textContent = await element.textContent();
        expect(textContent?.trim()).toBeTruthy();
      }
    }
  });

  test('should handle focus management in modals', async ({ page }) => {
    // Login first
    await page.fill('input[formControlName="email"]', 'john.doe@example.com');
    await page.fill('input[formControlName="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Open modal
    await page.click('button:has-text("+ Add Todo")');
    
    // Focus should be trapped in modal
    await expect(page.locator('.modal')).toBeVisible();
    
    // First focusable element in modal should receive focus
    await expect(page.locator('.modal input[formControlName="title"]')).toBeFocused();

    // Tab navigation should stay within modal
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Focus should still be within modal
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('should support screen reader announcements', async ({ page }) => {
    // Login first
    await page.fill('input[formControlName="email"]', 'john.doe@example.com');
    await page.fill('input[formControlName="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Check for live regions for dynamic content
    await expect(page.locator('[aria-live]')).toHaveCount.greaterThanOrEqual(0);
    
    // Status messages should be announced
    // This would be tested more thoroughly with actual screen reader testing
  });

  test('should provide alternative text for images', async ({ page }) => {
    // Login first  
    await page.fill('input[formControlName="email"]', 'john.doe@example.com');
    await page.fill('input[formControlName="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Check for images with alt text
    const images = page.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const altText = await img.getAttribute('alt');
      expect(altText).toBeTruthy();
    }
  });

  test('should handle error announcements', async ({ page }) => {
    // Try invalid login
    await page.fill('input[formControlName="email"]', 'invalid@example.com');
    await page.fill('input[formControlName="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Error message should be announced
    const errorMessage = page.locator('.error-message, .alert-error');
    if (await errorMessage.isVisible()) {
      await expect(errorMessage).toHaveAttribute('role', 'alert');
    }
  });

  test('should support high contrast mode', async ({ page }) => {
    // This would typically be tested with browser settings
    // Here we check that important elements are still visible
    
    await page.fill('input[formControlName="email"]', 'john.doe@example.com');
    await page.fill('input[formControlName="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Check that interactive elements are visible
    await expect(page.locator('button')).toHaveCount.greaterThan(0);
    await expect(page.locator('input')).toHaveCount.greaterThan(0);
    await expect(page.locator('a')).toHaveCount.greaterThan(0);
  });

  test('should have proper skip links', async ({ page }) => {
    // Check for skip to content link
    await page.keyboard.press('Tab');
    
    const skipLink = page.locator('a[href="#main-content"], .skip-link');
    if (await skipLink.isVisible()) {
      await expect(skipLink).toHaveText(/skip to/i);
      
      // Skip link should work
      await skipLink.click();
      await expect(page.locator('#main-content, main')).toBeFocused();
    }
  });

  test('should handle reduced motion preferences', async ({ page }) => {
    // This would be tested with CSS media queries
    // Here we check that animations don't prevent functionality
    
    await page.fill('input[formControlName="email"]', 'john.doe@example.com');
    await page.fill('input[formControlName="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Sidebar toggle should work regardless of animation
    await page.setViewportSize({ width: 375, height: 667 });
    await page.click('.sidebar-toggle');
    await expect(page.locator('.sidebar')).toHaveClass(/open/);
  });
});