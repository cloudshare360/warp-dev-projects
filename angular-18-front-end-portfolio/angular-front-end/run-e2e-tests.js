#!/usr/bin/env node

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  apiUrl: 'http://localhost:3001',
  jsonServerUrl: 'http://localhost:3000',
  frontendUrl: 'http://localhost:4200',
  testTimeout: 300000, // 5 minutes
  retries: 2
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function checkServices() {
  return new Promise(async (resolve, reject) => {
    log('🔍 Checking service availability...', colors.cyan);
    
    const services = [
      { name: 'JSON Server', url: config.jsonServerUrl, endpoint: '/profile' },
      { name: 'Express API', url: config.apiUrl, endpoint: '/health' },
      { name: 'Angular Frontend', url: config.frontendUrl, endpoint: '/' }
    ];

    const results = [];
    
    for (const service of services) {
      try {
        const response = await fetch(`${service.url}${service.endpoint}`);
        const status = response.ok ? '✅ ONLINE' : '❌ ERROR';
        results.push({ ...service, status, statusCode: response.status });
        log(`  ${service.name}: ${status} (${response.status})`, 
            response.ok ? colors.green : colors.red);
      } catch (error) {
        results.push({ ...service, status: '❌ OFFLINE', error: error.message });
        log(`  ${service.name}: ❌ OFFLINE - ${error.message}`, colors.red);
      }
    }
    
    const allOnline = results.every(r => r.status === '✅ ONLINE');
    if (allOnline) {
      log('✅ All services are online and ready for testing!', colors.green);
      resolve(results);
    } else {
      log('❌ Some services are not available. Please start all services before running E2E tests.', colors.red);
      reject(new Error('Services not available'));
    }
  });
}

function runCypressTest(testSpec, browser = 'chrome') {
  return new Promise((resolve, reject) => {
    log(`🚀 Running E2E test: ${testSpec}`, colors.blue);
    
    const cypressCommand = [
      'npx', 'cypress', 'run',
      '--browser', browser,
      '--spec', `cypress/e2e/${testSpec}`,
      '--env', `apiUrl=${config.apiUrl},jsonServerUrl=${config.jsonServerUrl}`,
      '--reporter', 'json',
      '--reporter-options', 'outputFile=cypress/results/results.json'
    ];

    const cypress = spawn(cypressCommand[0], cypressCommand.slice(1), {
      cwd: process.cwd(),
      stdio: 'pipe',
      env: { ...process.env, NODE_ENV: 'test' }
    });

    let output = '';
    let errorOutput = '';

    cypress.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;
      process.stdout.write(text);
    });

    cypress.stderr.on('data', (data) => {
      const text = data.toString();
      errorOutput += text;
      process.stderr.write(text);
    });

    cypress.on('close', (code) => {
      if (code === 0) {
        log(`✅ Test completed successfully: ${testSpec}`, colors.green);
        resolve({ success: true, output, testSpec });
      } else {
        log(`❌ Test failed: ${testSpec} (exit code: ${code})`, colors.red);
        reject({ success: false, output, errorOutput, testSpec, code });
      }
    });

    // Timeout handling
    setTimeout(() => {
      cypress.kill('SIGTERM');
      reject({ success: false, error: 'Test timeout', testSpec });
    }, config.testTimeout);
  });
}

function generateTestReport(results) {
  const timestamp = new Date().toISOString();
  const totalTests = results.length;
  const passedTests = results.filter(r => r.success).length;
  const failedTests = totalTests - passedTests;
  
  const report = {
    timestamp,
    summary: {
      total: totalTests,
      passed: passedTests,
      failed: failedTests,
      successRate: Math.round((passedTests / totalTests) * 100)
    },
    results: results.map(r => ({
      testSpec: r.testSpec,
      success: r.success,
      duration: r.duration || 'N/A',
      error: r.error || null
    })),
    environment: {
      apiUrl: config.apiUrl,
      jsonServerUrl: config.jsonServerUrl,
      frontendUrl: config.frontendUrl
    }
  };

  // Save report to file
  const reportPath = path.join('cypress', 'reports', `e2e-test-report-${Date.now()}.json`);
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  // Display report
  log('\n📊 E2E Test Report Summary:', colors.bright);
  log('═'.repeat(50), colors.blue);
  log(`Total Tests: ${totalTests}`, colors.cyan);
  log(`Passed: ${passedTests}`, colors.green);
  log(`Failed: ${failedTests}`, failedTests > 0 ? colors.red : colors.green);
  log(`Success Rate: ${report.summary.successRate}%`, 
      report.summary.successRate >= 80 ? colors.green : colors.red);
  log(`Report saved to: ${reportPath}`, colors.yellow);
  log('═'.repeat(50), colors.blue);

  return report;
}

async function main() {
  log('🎯 Starting Portfolio E2E Test Suite', colors.bright);
  log('=' * 60, colors.blue);
  
  try {
    // Check if all services are running
    await checkServices();
    
    // Create results directory
    fs.mkdirSync('cypress/results', { recursive: true });
    fs.mkdirSync('cypress/reports', { recursive: true });
    
    // Test specifications to run
    const testSpecs = [
      'portfolio-app.cy.ts',
      'api-integration.cy.ts', 
      'responsive-design.cy.ts'
    ];
    
    const results = [];
    
    for (const testSpec of testSpecs) {
      try {
        const startTime = Date.now();
        const result = await runCypressTest(testSpec);
        const duration = Date.now() - startTime;
        results.push({ ...result, duration });
      } catch (error) {
        const duration = Date.now() - startTime;
        results.push({ ...error, duration });
      }
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Generate comprehensive report
    const report = generateTestReport(results);
    
    // Final status
    if (report.summary.failed === 0) {
      log('🎉 All E2E tests passed successfully!', colors.green);
      process.exit(0);
    } else {
      log(`⚠️  ${report.summary.failed} test(s) failed. Check the report for details.`, colors.yellow);
      process.exit(1);
    }
    
  } catch (error) {
    log(`❌ E2E test suite failed: ${error.message}`, colors.red);
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  log('\n🛑 E2E test suite interrupted by user', colors.yellow);
  process.exit(1);
});

process.on('SIGTERM', () => {
  log('\n🛑 E2E test suite terminated', colors.yellow);
  process.exit(1);
});

if (require.main === module) {
  main();
}