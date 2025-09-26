# E2E Test Suite Documentation

## Overview
Comprehensive End-to-End test suite for the Angular 18 Todo Full Stack application using Playwright. The test suite covers all major user flows, admin functionality, responsive design, and accessibility features.

## Test Structure

### 1. Authentication Tests (`auth.spec.ts`)
- User login/logout flows
- Admin login flows  
- Registration functionality
- Form validation
- Demo credentials testing
- Role selection
- Routing guards verification

### 2. User Dashboard Tests (`user-dashboard.spec.ts`)
- Dashboard component rendering
- Statistics display
- Sidebar navigation
- Todo management (CRUD operations)
- Filtering and sorting
- Quick add functionality
- Modal interactions
- Mobile responsiveness

### 3. Admin Dashboard Tests (`admin-dashboard.spec.ts`)
- Admin dashboard rendering
- System health monitoring
- Recent activity display
- User management interface
- CRUD operations on users
- Search and filtering
- Export functionality
- Role-based access control

### 4. Responsive Design Tests (`responsive-and-accessibility.spec.ts`)
- Mobile viewport (375px)
- Tablet viewport (768px)
- Desktop viewport (1440px)
- Sidebar toggle functionality
- Touch interactions
- Form layout adaptation

### 5. Accessibility Tests
- Keyboard navigation
- Screen reader support
- ARIA labels and roles
- Form labels and associations
- Focus management
- Color contrast validation
- Skip links
- Heading structure

### 6. Integration Tests (`all-tests.spec.ts`)
- Smoke tests for critical flows
- Cross-viewport testing
- Performance benchmarks
- Security validation
- Data integrity checks
- Error handling scenarios

## Running Tests

### Prerequisites
- Node.js and npm installed
- Angular CLI installed globally
- Playwright browsers installed

### Installation
```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install
```

### Running Tests

#### Start the application and JSON server
```bash
# Start both JSON server and Angular app
npm run start:dev
```

#### Run E2E tests (with services running)
```bash
# Run all E2E tests
npm run e2e

# Run tests with UI mode
npm run e2e:ui

# Run tests in debug mode
npm run e2e:debug

# Show test reports
npm run e2e:report
```

#### Run E2E tests (automated setup)
```bash
# This will start JSON server, wait for it, then run tests
npm run test:e2e
```

### Specific Test Files
```bash
# Run authentication tests only
npx playwright test e2e/auth.spec.ts

# Run user dashboard tests only
npx playwright test e2e/user-dashboard.spec.ts

# Run admin tests only
npx playwright test e2e/admin-dashboard.spec.ts

# Run responsive tests only
npx playwright test e2e/responsive-and-accessibility.spec.ts

# Run integration tests only
npx playwright test e2e/all-tests.spec.ts
```

### Browser-specific Tests
```bash
# Run tests on Chrome only
npx playwright test --project=chromium

# Run tests on Firefox only
npx playwright test --project=firefox

# Run tests on Safari only
npx playwright test --project=webkit
```

## Test Data

The tests use the mock data from `db.json` which includes:

### Test Users
- **User Account**: john.doe@example.com / password123
- **Admin Account**: admin@example.com / admin123

### Sample Data
- Pre-populated todos with different priorities
- Categories (work, personal, shopping)
- Activity logs
- System metrics

## Test Configuration

### Playwright Config (`playwright.config.ts`)
- Browsers: Chrome, Firefox, Safari
- Base URL: http://localhost:4200
- Test timeout: 30 seconds
- Retries: 2 failed attempts
- Parallel execution: 4 workers
- Screenshots on failure
- Video recording on failure

### Environment Setup
- JSON Server: http://localhost:3000
- Angular App: http://localhost:4200
- Test reports: `playwright-report/`
- Screenshots: `test-results/`

## Test Patterns and Best Practices

### Page Object Model
Tests use locator strategies focusing on:
- Semantic selectors (role, label, text)
- Angular form control names
- CSS classes for components
- ARIA attributes for accessibility

### Data-Driven Testing
- Multiple viewport sizes
- Different user roles
- Various form inputs
- Error scenarios

### Assertions
- Visibility checks
- URL navigation
- Text content verification
- Form state validation
- Responsive behavior
- Accessibility compliance

## Coverage Areas

### ✅ Functional Testing
- Authentication flows
- CRUD operations
- Navigation
- Form submissions
- Modal interactions
- Filtering and search

### ✅ UI/UX Testing
- Responsive design
- Cross-browser compatibility
- Mobile interactions
- Loading states
- Error messages

### ✅ Security Testing
- Authentication guards
- Role-based access
- Unauthorized access prevention
- Input validation

### ✅ Performance Testing
- Load time benchmarks
- Navigation speed
- Form submission times
- Large dataset handling

### ✅ Accessibility Testing
- Screen reader compatibility
- Keyboard navigation
- Focus management
- ARIA compliance
- Color contrast

## Continuous Integration

### GitHub Actions Integration
```yaml
- name: Install dependencies
  run: npm ci

- name: Install Playwright
  run: npx playwright install

- name: Run E2E tests
  run: npm run test:e2e

- name: Upload test results
  uses: actions/upload-artifact@v3
  if: failure()
  with:
    name: playwright-report
    path: playwright-report/
```

## Troubleshooting

### Common Issues
1. **Tests failing due to timing**: Increase timeout or add explicit waits
2. **JSON server not starting**: Check port 3000 availability
3. **Browser not found**: Run `npx playwright install`
4. **Flaky tests**: Add retry mechanisms or stability improvements

### Debug Mode
```bash
# Run specific test in debug mode
npx playwright test e2e/auth.spec.ts --debug

# Run with headed browser
npx playwright test --headed

# Run with slow motion
npx playwright test --slowmo=1000
```

### Test Reports
- HTML report: `playwright-report/index.html`
- JSON report: `test-results/report.json`
- Screenshots: `test-results/*/test-failed-*.png`
- Videos: `test-results/*/video.webm`

## Future Enhancements

### Planned Additions
1. Visual regression testing
2. API testing integration
3. Database state validation
4. Mobile app testing (if applicable)
5. Load testing scenarios
6. Automated accessibility audits
7. Screenshot comparisons
8. Multi-language testing

### Maintenance
- Regular browser updates
- Test data refresh
- Selector maintenance
- Performance baseline updates
- New feature test coverage

## Contributing

When adding new tests:
1. Follow existing naming conventions
2. Add appropriate documentation
3. Ensure cross-browser compatibility
4. Include accessibility checks
5. Add responsive design validation
6. Update this README if needed