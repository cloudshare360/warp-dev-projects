# Portfolio API - Postman Collection Testing

This directory contains comprehensive Postman collections for testing the Portfolio API endpoints, along with automation scripts and environment configurations.

## 📁 Collection Files

### Main Collection
- **File**: `Portfolio-API-Main.postman_collection.json`
- **Purpose**: Comprehensive functional testing of all API endpoints
- **Coverage**: Health checks, Profile, Experience, Skills, Projects, Education, Contact, Testimonials

### Performance Collection  
- **File**: `Portfolio-API-Performance.postman_collection.json`
- **Purpose**: Performance and load testing of API endpoints
- **Coverage**: Load tests, stress tests, memory usage, response time monitoring

### Environment Configuration
- **File**: `Portfolio-API-Environment.postman_environment.json`
- **Purpose**: Environment variables for different deployment targets
- **Variables**: Base URLs, timeouts, test data, configuration settings

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v14 or higher)
- [Postman](https://www.postman.com/) (optional, for GUI usage)
- Portfolio API server running (Express REST API)
- JSON Server running with portfolio data

### Installation

1. **Install Dependencies**
   ```bash
   cd postman-collection
   npm install
   ```

2. **Verify Collection Files**
   ```bash
   ls -la *.json
   ```

3. **Test Newman Installation**
   ```bash
   npx newman --version
   ```

## 🧪 Running Tests

### Using NPM Scripts (Recommended)

```bash
# Run main functional tests
npm run test:main

# Run performance tests
npm run test:performance  

# Run all tests
npm run test:all

# Generate HTML report
npm run test:html

# Generate JSON report
npm run test:json

# Generate JUnit XML report (for CI/CD)
npm run test:junit

# Run CI/CD pipeline tests (bail on first failure)
npm run test:ci

# Run performance tests with 10 iterations
npm run test:performance:load

# Show help
npm run help
```

### Using Newman CLI Directly

```bash
# Basic test run
npx newman run Portfolio-API-Main.postman_collection.json -e Portfolio-API-Environment.postman_environment.json

# Run with HTML report
npx newman run Portfolio-API-Main.postman_collection.json -e Portfolio-API-Environment.postman_environment.json -r html --reporter-html-export ./reports/test-report.html

# Run performance tests with multiple iterations
npx newman run Portfolio-API-Performance.postman_collection.json -e Portfolio-API-Environment.postman_environment.json -n 5

# Run with custom environment variables
npx newman run Portfolio-API-Main.postman_collection.json -e Portfolio-API-Environment.postman_environment.json --env-var "baseUrl=http://localhost:3001"
```

### Using the Automation Script

```bash
# Basic usage
./run-tests.js

# Run performance tests with 5 iterations
./run-tests.js -c performance -n 5

# Run all collections with HTML reports
./run-tests.js -c all -r html -o ./test-reports

# Verbose output with bail on failure
./run-tests.js -c main -v -b

# Show all options
./run-tests.js --help
```

## 🎯 Test Collections Details

### Main Collection Tests

#### Health Check Endpoints
- ✅ Basic health check (`GET /health`)
- ✅ Detailed health check (`GET /health/detailed`)  
- ✅ Readiness probe (`GET /health/ready`)
- ✅ Liveness probe (`GET /health/live`)

#### Profile API
- ✅ Get profile information (`GET /api/profile`)
- ✅ Update profile information (`PUT /api/profile`)

#### Experience API
- ✅ Get all experience entries (`GET /api/experience`)
- ✅ Get experience by ID (`GET /api/experience/:id`)
- ✅ Create new experience (`POST /api/experience`)

#### Skills API
- ✅ Get all skills (`GET /api/skills`)
- ✅ Get skills by category (`GET /api/skills?category=Technical`)

#### Projects API
- ✅ Get all projects (`GET /api/projects`)
- ✅ Get projects with pagination (`GET /api/projects?_page=1&_limit=3`)
- ✅ Get featured projects (`GET /api/projects?featured=true`)

#### Education & Certifications API
- ✅ Get all education entries (`GET /api/education`)
- ✅ Get all certifications (`GET /api/certifications`)

#### Contact API
- ✅ Get contact information (`GET /api/contact`)
- ✅ Submit contact message (`POST /api/contact/message`)

#### Testimonials API
- ✅ Get all testimonials (`GET /api/testimonials`)
- ✅ Get featured testimonials (`GET /api/testimonials?featured=true`)

### Performance Collection Tests

#### Load Testing
- 🔥 Health endpoint load test
- 🔥 Detailed health endpoint load test
- 🔥 Profile endpoint performance
- 🔥 Experience list performance
- 🔥 Projects list performance
- 🔥 Skills endpoint performance

#### Stress Testing
- 🔥 Rate limiting behavior
- 🔥 Rapid consecutive requests
- 🔥 Rate limit header validation

#### Resource Testing
- 🔥 Large data request handling
- 🔥 Memory usage monitoring
- 🔥 CPU usage tracking
- 🔥 System metrics validation

## 📊 Test Features

### Automated Validations
- **Response Status Codes**: Validates correct HTTP status codes
- **Response Structure**: Checks JSON schema and required fields
- **Response Time**: Monitors API performance
- **Data Integrity**: Validates data format and content
- **Error Handling**: Tests error scenarios and messages
- **Rate Limiting**: Validates rate limiting behavior

### Global Test Scripts
- **Response Time Monitoring**: Tracks all response times
- **Server Error Detection**: Ensures no 5xx server errors
- **Timestamp Tracking**: Adds timestamps to all requests
- **Performance Metrics**: Collects response time statistics

### Environment Variables
- `baseUrl`: Express REST API base URL
- `jsonServerUrl`: JSON Server base URL
- `apiTimeout`: Request timeout configuration
- `rateLimitWindow`: Rate limiting window
- `rateLimitMax`: Maximum requests per window
- Test data variables for consistent testing

## 📈 Reporting

### Available Report Formats

#### Console Output (CLI)
- Real-time test execution feedback
- Summary statistics
- Failure details
- Performance metrics

#### HTML Reports
- Visual test results dashboard
- Request/response details
- Performance charts
- Export capabilities

#### JSON Reports
- Machine-readable test results
- Detailed execution data
- Integration with external tools
- Programmatic analysis

#### JUnit XML Reports
- CI/CD integration format
- Jenkins/GitLab CI compatible
- Test case results
- Build pipeline integration

### Report Locations
- Default: `./test-reports/`
- Customizable via `-o` option
- Timestamped file names
- Multiple format support

## 🔧 Configuration

### Environment Configuration
Edit `Portfolio-API-Environment.postman_environment.json`:

```json
{
  "key": "baseUrl",
  "value": "http://localhost:3001",
  "enabled": true
}
```

### Collection Variables
- Response time thresholds
- Test data configurations
- Iteration counts
- Performance benchmarks

### Newman Options
- `--iteration-count`: Number of test iterations
- `--bail`: Stop on first failure
- `--verbose`: Detailed output
- `--timeout-request`: Request timeout
- `--delay-request`: Delay between requests

## 🚨 Troubleshooting

### Common Issues

#### Connection Errors
- Ensure Express REST API is running on `http://localhost:3001`
- Verify JSON Server is running on `http://localhost:3000`
- Check firewall and network settings

#### Test Failures
- Verify API endpoints are properly implemented
- Check JSON Server data is loaded correctly
- Ensure rate limiting is configured properly

#### Performance Issues
- Monitor system resources during tests
- Adjust performance thresholds in collections
- Check database connections and queries

#### Newman Errors
- Verify Node.js version (>=14.0.0)
- Update Newman to latest version
- Check collection and environment file syntax

### Debug Commands

```bash
# Verify API is running
curl http://localhost:3001/health

# Check JSON Server
curl http://localhost:3000/profile

# Validate collection syntax
npx newman run Portfolio-API-Main.postman_collection.json --dry-run

# Verbose test execution
./run-tests.js -v -c main
```

## 📚 Integration

### CI/CD Pipeline Integration

#### GitHub Actions
```yaml
- name: Run API Tests
  run: |
    cd postman-collection
    npm install
    npm run test:ci
```

#### Jenkins Pipeline
```groovy
stage('API Tests') {
    steps {
        sh 'cd postman-collection && npm install && npm run test:ci'
        publishTestResults testResultsPattern: 'postman-collection/reports/*.xml'
    }
}
```

#### GitLab CI
```yaml
test_api:
  script:
    - cd postman-collection
    - npm install
    - npm run test:ci
  artifacts:
    reports:
      junit: postman-collection/reports/*.xml
```

### External Tool Integration
- **Monitoring**: Import reports into monitoring dashboards
- **Quality Gates**: Set pass/fail criteria based on test results
- **Notifications**: Send alerts on test failures
- **Documentation**: Auto-generate API documentation from tests

## 🤝 Contributing

### Adding New Tests
1. Import collection into Postman
2. Add new requests to appropriate folders
3. Write comprehensive test scripts
4. Update environment variables if needed
5. Export updated collection
6. Update documentation

### Best Practices
- Use descriptive test names
- Include proper assertions
- Handle edge cases
- Document test scenarios  
- Keep collections organized
- Use environment variables for configuration

## 📝 License

This testing suite is part of the Portfolio API project and follows the same license terms.

## 🔗 Related Documentation

- [Portfolio API Documentation](../README.md)
- [Express REST API Setup](../express-rest-api/README.md)
- [JSON Server Configuration](../json-server/README.md)
- [Application User Guide](../docs/Application-User-Guide.md)