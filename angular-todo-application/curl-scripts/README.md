# Angular Todo API Testing Framework 🧪

## Overview
This comprehensive testing framework provides automated testing for the Angular Todo Application REST API. It includes unit, integration, functional, performance, and security testing capabilities.

## Features
- 🔄 **Automated Test Execution**: Run all tests with a single command
- 📊 **Beautiful HTML Reports**: Interactive reports with charts and statistics
- 📈 **Performance Monitoring**: Track API response times
- 🔒 **Security Testing**: SQL injection, XSS, and auth bypass prevention tests
- 📝 **Detailed Logging**: Complete execution logs for debugging
- 🎯 **Smart Token Management**: Automatic authentication for protected endpoints

## Quick Start

### Run All Tests
From the project root directory:

```bash
npm run test:api
```

This will:
1. Check if MongoDB is running (starts it if needed)
2. Check if the backend API is running (starts it if needed)
3. Execute all test suites
4. Generate HTML and JSON reports
5. Open the HTML report in your browser

### Run Tests Directly
If services are already running:

```bash
cd curl-scripts
./run-all-tests.sh
```

## Directory Structure

```
curl-scripts/
├── README.md               # This file
├── run-all-tests.sh       # Main test runner script
├── auth/                  # Authentication test scripts
│   ├── normal-flow/      # Successful authentication tests
│   ├── alternative-flow/ # Alternative authentication paths
│   ├── error-flow/       # Error handling tests
│   └── exception-flow/   # Exception and edge cases
├── users/                 # User management tests
│   ├── normal-flow/
│   ├── alternative-flow/
│   ├── error-flow/
│   └── exception-flow/
├── lists/                 # List management tests
│   ├── normal-flow/
│   ├── alternative-flow/
│   ├── error-flow/
│   └── exception-flow/
├── todos/                 # Todo management tests
│   ├── normal-flow/
│   ├── alternative-flow/
│   ├── error-flow/
│   └── exception-flow/
├── test-data/            # Test data files
│   ├── users.json
│   ├── lists.json
│   ├── todos.json
│   ├── invalid-data.json
│   └── edge-cases.json
├── reports/              # Generated test reports
│   ├── test_report_*.html
│   ├── test_report_*.json
│   └── test_log_*.log
└── utilities/            # Helper scripts
    └── common.sh
```

## Test Suites

### 1. Authentication Tests
- User registration with valid data
- Duplicate user prevention
- Invalid email format handling
- Login with correct credentials
- Login with incorrect credentials
- Token generation and validation

### 2. User Management Tests
- Get user profile
- Update user information
- Change password
- Delete account
- Avatar upload

### 3. List Management Tests
- Create new lists
- Retrieve all lists
- Update list properties
- Delete lists
- Share lists with users

### 4. Todo Management Tests
- Create todos
- Update todo details
- Toggle completion status
- Set priorities and deadlines
- Add tags and attachments
- Delete todos

### 5. Security Tests
- SQL Injection prevention
- Cross-Site Scripting (XSS) prevention
- Authentication bypass attempts
- Rate limiting verification
- Input sanitization

### 6. Performance Tests
- Response time benchmarks
- Concurrent request handling
- Database query optimization
- Caching effectiveness

## Test Reports

### HTML Report
- **Location**: `reports/test_report_YYYYMMDD_HHMMSS.html`
- **Features**:
  - Visual summary with charts
  - Pass/fail statistics
  - Response time metrics
  - Detailed test results table
  - Responsive design

### JSON Report
- **Location**: `reports/test_report_YYYYMMDD_HHMMSS.json`
- **Use Cases**:
  - CI/CD integration
  - Automated analysis
  - Historical tracking
  - Custom reporting

### Log Files
- **Location**: `reports/test_log_YYYYMMDD_HHMMSS.log`
- **Contents**:
  - Complete execution trace
  - Error details
  - Response bodies
  - Timing information

## Environment Variables

Set these before running tests:

```bash
export API_URL=http://localhost:3000  # API base URL
export TEST_USER=testuser              # Test username
export TEST_PASSWORD=TestPass123!      # Test password
```

## Custom Test Configuration

Edit `run-all-tests.sh` to customize:

```bash
# Configuration section
BASE_URL="${API_URL:-http://localhost:3000}"
REPORT_DIR="./reports"
TEST_DATA_DIR="./test-data"
```

## Adding New Tests

To add a new test to the suite:

1. Define a test function in `run-all-tests.sh`:

```bash
run_my_new_test() {
    log_test_header "MY NEW TEST"
    
    run_test \
        "test_name" \
        "Test description" \
        "HTTP_METHOD" \
        "/api/endpoint" \
        '{"json": "payload"}' \
        "$token" \
        "expected_status"
}
```

2. Call it in the main function:

```bash
main() {
    # ... existing tests
    run_my_new_test
    # ... rest of code
}
```

## Troubleshooting

### Tests are failing
1. Check if all services are running:
   ```bash
   docker ps  # Check MongoDB
   curl http://localhost:3000/health  # Check API
   ```

2. Review the log file for details:
   ```bash
   cat reports/test_log_*.log
   ```

3. Verify test data is correct:
   ```bash
   cat test-data/*.json
   ```

### API is not accessible
1. Start the backend manually:
   ```bash
   cd ../Back-End/express-rest-todo-api
   npm run dev
   ```

2. Check for port conflicts:
   ```bash
   lsof -i :3000
   ```

### MongoDB connection issues
1. Start MongoDB:
   ```bash
   npm run db:start
   ```

2. Check MongoDB logs:
   ```bash
   npm run db:logs
   ```

## Performance Benchmarks

Expected response times:
- Authentication: < 100ms
- CRUD operations: < 50ms
- Search queries: < 200ms
- File uploads: < 500ms

## Security Considerations

The test suite includes:
- ✅ SQL injection tests
- ✅ XSS prevention tests
- ✅ Authentication bypass tests
- ✅ Rate limiting verification
- ✅ Input validation tests
- ✅ Token security tests

## CI/CD Integration

### GitHub Actions Example

```yaml
name: API Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run test:api
      - uses: actions/upload-artifact@v2
        if: always()
        with:
          name: test-reports
          path: curl-scripts/reports/
```

### Jenkins Pipeline Example

```groovy
pipeline {
    agent any
    stages {
        stage('Test') {
            steps {
                sh 'npm run test:api'
            }
        }
        stage('Archive Reports') {
            steps {
                archiveArtifacts artifacts: 'curl-scripts/reports/**'
            }
        }
    }
}
```

## Contributing

To contribute to the testing framework:
1. Add tests for new API endpoints
2. Improve existing test coverage
3. Enhance reporting capabilities
4. Add performance benchmarks
5. Document test scenarios

## License

MIT

## Support

For issues or questions:
- Check the logs in `reports/`
- Review this documentation
- Contact the development team

---

**Last Updated**: January 2025
**Version**: 1.0.0
**Maintainer**: Angular Todo App Team