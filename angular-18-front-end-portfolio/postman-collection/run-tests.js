#!/usr/bin/env node

/**
 * Portfolio API Testing Automation Script
 * 
 * This script runs Postman collections using Newman for automated testing
 * Supports main API tests, performance tests, and custom test scenarios
 * 
 * Usage:
 *   node run-tests.js [options]
 * 
 * Options:
 *   --collection <name>    Specify collection to run (main, performance, all)
 *   --environment <env>    Environment to use (development, production)
 *   --iterations <num>     Number of iterations for performance tests
 *   --reporter <type>      Reporter type (cli, json, html, junit)
 *   --output <path>        Output directory for reports
 *   --bail                 Stop on first failure
 *   --verbose              Verbose output
 *   --help                 Show help
 */

const newman = require('newman');
const path = require('path');
const fs = require('fs');
const { Command } = require('commander');

const program = new Command();

program
  .version('1.0.0')
  .description('Portfolio API Testing Automation')
  .option('-c, --collection <name>', 'Collection to run (main, performance, all)', 'main')
  .option('-e, --environment <env>', 'Environment to use', 'development')
  .option('-n, --iterations <num>', 'Number of iterations', '1')
  .option('-r, --reporter <type>', 'Reporter type', 'cli')
  .option('-o, --output <path>', 'Output directory', './test-reports')
  .option('-b, --bail', 'Stop on first failure', false)
  .option('-v, --verbose', 'Verbose output', false)
  .option('--help', 'Show help');

program.parse();

const options = program.opts();

// Collection mapping
const collections = {
  main: 'Portfolio-API-Main.postman_collection.json',
  performance: 'Portfolio-API-Performance.postman_collection.json'
};

// Environment mapping
const environments = {
  development: 'Portfolio-API-Environment.postman_environment.json'
};

/**
 * Ensure output directory exists
 */
function ensureOutputDir(outputPath) {
  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
    console.log(`Created output directory: ${outputPath}`);
  }
}

/**
 * Get reporter configuration
 */
function getReporterConfig(reporter, outputDir, collectionName) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const baseFilename = `${collectionName}-${timestamp}`;
  
  const reporters = {
    cli: {
      reporter: 'cli'
    },
    json: {
      reporter: 'json',
      reporterOptions: {
        export: path.join(outputDir, `${baseFilename}.json`)
      }
    },
    html: {
      reporter: 'html',
      reporterOptions: {
        export: path.join(outputDir, `${baseFilename}.html`)
      }
    },
    junit: {
      reporter: 'junit',
      reporterOptions: {
        export: path.join(outputDir, `${baseFilename}-junit.xml`)
      }
    }
  };
  
  return reporters[reporter] || reporters.cli;
}

/**
 * Run a single collection
 */
function runCollection(collectionFile, environmentFile, config) {
  return new Promise((resolve, reject) => {
    console.log(`\n🚀 Running collection: ${collectionFile}`);
    console.log(`📊 Environment: ${environmentFile}`);
    console.log(`🔄 Iterations: ${config.iterationCount}`);
    console.log(`📝 Reporter: ${config.reporter}`);
    
    if (config.reporterOptions && config.reporterOptions.export) {
      console.log(`📁 Output: ${config.reporterOptions.export}`);
    }
    
    console.log('─'.repeat(60));
    
    const newmanOptions = {
      collection: collectionFile,
      environment: environmentFile,
      iterationCount: parseInt(config.iterationCount),
      reporter: config.reporter,
      bail: config.bail,
      verbose: config.verbose
    };
    
    if (config.reporterOptions) {
      newmanOptions.reporterOptions = config.reporterOptions;
    }
    
    newman.run(newmanOptions, (err, summary) => {
      if (err) {
        console.error('❌ Collection run failed:', err);
        reject(err);
        return;
      }
      
      console.log('─'.repeat(60));
      console.log('📊 Test Summary:');
      console.log(`   Total Assertions: ${summary.run.stats.assertions.total}`);
      console.log(`   Passed: ${summary.run.stats.assertions.passed}`);
      console.log(`   Failed: ${summary.run.stats.assertions.failed}`);
      console.log(`   Test Scripts: ${summary.run.stats.testScripts.total}`);
      console.log(`   Requests: ${summary.run.stats.requests.total}`);
      
      const avgResponseTime = summary.run.timings.responseAverage || 0;
      console.log(`   Average Response Time: ${avgResponseTime.toFixed(2)}ms`);
      
      if (summary.run.failures && summary.run.failures.length > 0) {
        console.log('\\n❌ Failures:');
        summary.run.failures.forEach((failure, index) => {
          console.log(`   ${index + 1}. ${failure.error.name}: ${failure.error.message}`);
          if (failure.source) {
            console.log(`      Source: ${failure.source.name}`);
          }
        });
      }
      
      const success = !summary.run.failures || summary.run.failures.length === 0;
      console.log(`\\n${success ? '✅ All tests passed!' : '❌ Some tests failed!'}`);
      
      resolve(summary);
    });
  });
}

/**
 * Run tests based on collection option
 */
async function runTests() {
  try {
    // Ensure output directory exists
    ensureOutputDir(options.output);
    
    // Get environment file
    const environmentFile = environments[options.environment];
    if (!environmentFile) {
      throw new Error(`Environment '${options.environment}' not found`);
    }
    
    const envPath = path.join(__dirname, environmentFile);
    if (!fs.existsSync(envPath)) {
      throw new Error(`Environment file not found: ${envPath}`);
    }
    
    // Get reporter configuration
    const collectionsToRun = options.collection === 'all' 
      ? Object.keys(collections) 
      : [options.collection];
    
    const results = [];
    
    for (const collectionName of collectionsToRun) {
      const collectionFile = collections[collectionName];
      if (!collectionFile) {
        throw new Error(`Collection '${collectionName}' not found`);
      }
      
      const collectionPath = path.join(__dirname, collectionFile);
      if (!fs.existsSync(collectionPath)) {
        throw new Error(`Collection file not found: ${collectionPath}`);
      }
      
      const reporterConfig = getReporterConfig(options.reporter, options.output, collectionName);
      
      const config = {
        iterationCount: options.iterations,
        bail: options.bail,
        verbose: options.verbose,
        ...reporterConfig
      };
      
      try {
        const summary = await runCollection(collectionPath, envPath, config);
        results.push({
          collection: collectionName,
          success: !summary.run.failures || summary.run.failures.length === 0,
          summary
        });
      } catch (error) {
        console.error(`❌ Failed to run collection '${collectionName}':`, error.message);
        results.push({
          collection: collectionName,
          success: false,
          error: error.message
        });
        
        if (options.bail) {
          break;
        }
      }
    }
    
    // Final summary
    console.log('\\n' + '='.repeat(60));
    console.log('🎯 FINAL SUMMARY');
    console.log('='.repeat(60));
    
    let allPassed = true;
    results.forEach(result => {
      const status = result.success ? '✅ PASSED' : '❌ FAILED';
      console.log(`   ${result.collection}: ${status}`);
      if (!result.success) {
        allPassed = false;
        if (result.error) {
          console.log(`      Error: ${result.error}`);
        }
      }
    });
    
    console.log(`\\n🏁 Overall Result: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    
    // Exit with appropriate code
    process.exit(allPassed ? 0 : 1);
    
  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
    process.exit(1);
  }
}

// Show help if requested
if (options.help) {
  console.log(`
Portfolio API Testing Automation

Usage: node run-tests.js [options]

Options:
  -c, --collection <name>   Collection to run (main, performance, all) [default: main]
  -e, --environment <env>   Environment to use [default: development]  
  -n, --iterations <num>    Number of iterations [default: 1]
  -r, --reporter <type>     Reporter type (cli, json, html, junit) [default: cli]
  -o, --output <path>       Output directory [default: ./test-reports]
  -b, --bail               Stop on first failure
  -v, --verbose            Verbose output
  --help                   Show this help

Examples:
  node run-tests.js                                    # Run main collection with default settings
  node run-tests.js -c performance -n 5               # Run performance tests 5 times
  node run-tests.js -c all -r html -o ./reports       # Run all collections with HTML report
  node run-tests.js -c main -b -v                     # Run main collection, bail on failure, verbose
  
Collections:
  main         - Comprehensive API functional tests
  performance  - Performance and load testing
  all          - Run all collections

Reporters:
  cli          - Console output (default)
  json         - JSON report file
  html         - HTML report file  
  junit        - JUnit XML report file
`);
  process.exit(0);
}

// Run the tests
console.log('🧪 Portfolio API Testing Automation');
console.log('====================================');
runTests();