#!/bin/bash

################################################################################
# Angular Todo API Comprehensive Test Suite
# Author: Test Automation System
# Date: $(date +%Y-%m-%d)
# Description: Complete API testing including unit, integration, and functional tests
################################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Configuration
BASE_URL="${API_URL:-http://localhost:3000}"
API_BASE="${BASE_URL}/api"
REPORT_DIR="./reports"
TEST_DATA_DIR="./test-data"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPORT_FILE="${REPORT_DIR}/test_report_${TIMESTAMP}.html"
JSON_REPORT="${REPORT_DIR}/test_report_${TIMESTAMP}.json"
LOG_FILE="${REPORT_DIR}/test_log_${TIMESTAMP}.log"

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
SKIPPED_TESTS=0

# Test results array
declare -A TEST_RESULTS
declare -A TEST_TIMES
declare -A TEST_RESPONSES

# Timing
START_TIME=$(date +%s)

################################################################################
# Utility Functions
################################################################################

log() {
    echo -e "${1}" | tee -a "${LOG_FILE}"
}

log_info() {
    log "${BLUE}[INFO]${NC} $1"
}

log_success() {
    log "${GREEN}[✓]${NC} $1"
}

log_error() {
    log "${RED}[✗]${NC} $1"
}

log_warning() {
    log "${YELLOW}[!]${NC} $1"
}

log_test_header() {
    log "\n${PURPLE}${"="*60}${NC}"
    log "${BOLD}${CYAN}$1${NC}"
    log "${PURPLE}${"="*60}${NC}"
}

# Execute curl request and capture response
execute_curl() {
    local method=$1
    local endpoint=$2
    local data=$3
    local token=$4
    local expected_status=$5
    local test_name=$6
    
    local auth_header=""
    if [ ! -z "$token" ]; then
        auth_header="-H 'Authorization: Bearer $token'"
    fi
    
    local response_file="/tmp/response_${RANDOM}.json"
    local http_code_file="/tmp/http_code_${RANDOM}.txt"
    
    # Build curl command
    local curl_cmd="curl -s -w '%{http_code}' -o '${response_file}' -X ${method} '${API_BASE}${endpoint}' \
        -H 'Content-Type: application/json' \
        -H 'Accept: application/json' \
        ${auth_header}"
    
    if [ ! -z "$data" ] && [ "$data" != "null" ]; then
        curl_cmd="${curl_cmd} -d '${data}'"
    fi
    
    # Execute curl command
    local start_time=$(date +%s%N)
    eval "${curl_cmd}" > "${http_code_file}" 2>/dev/null
    local end_time=$(date +%s%N)
    local duration=$((($end_time - $start_time) / 1000000))
    
    local http_code=$(cat "${http_code_file}")
    local response=$(cat "${response_file}" 2>/dev/null || echo "{}")
    
    # Cleanup temp files
    rm -f "${response_file}" "${http_code_file}"
    
    # Store results
    TEST_TIMES["${test_name}"]="${duration}"
    TEST_RESPONSES["${test_name}"]="${response}"
    
    # Check result
    if [ "$http_code" == "$expected_status" ]; then
        return 0
    else
        log_error "Expected status: ${expected_status}, Got: ${http_code}"
        log_error "Response: ${response}"
        return 1
    fi
}

# Run a single test
run_test() {
    local test_name=$1
    local test_description=$2
    local method=$3
    local endpoint=$4
    local data=$5
    local token=$6
    local expected_status=$7
    
    ((TOTAL_TESTS++))
    log "\n${CYAN}[TEST ${TOTAL_TESTS}]${NC} ${test_name}"
    log "Description: ${test_description}"
    log "Method: ${method} | Endpoint: ${endpoint} | Expected: ${expected_status}"
    
    if execute_curl "$method" "$endpoint" "$data" "$token" "$expected_status" "$test_name"; then
        ((PASSED_TESTS++))
        TEST_RESULTS["${test_name}"]="PASS"
        log_success "Test passed (${TEST_TIMES["${test_name}"]}ms)"
    else
        ((FAILED_TESTS++))
        TEST_RESULTS["${test_name}"]="FAIL"
        log_error "Test failed"
    fi
}

################################################################################
# Test Suites
################################################################################

# Authentication Tests
run_auth_tests() {
    log_test_header "AUTHENTICATION TESTS"
    
    # Normal flow - successful registration
    run_test \
        "auth_register_success" \
        "Register new user with valid data" \
        "POST" \
        "/auth/register" \
        '{
            "username": "testuser'${RANDOM}'",
            "email": "test'${RANDOM}'@example.com",
            "password": "TestPass123!",
            "confirmPassword": "TestPass123!",
            "firstName": "Test",
            "lastName": "User"
        }' \
        "" \
        "201"
    
    # Error flow - duplicate registration
    run_test \
        "auth_register_duplicate" \
        "Register with existing email (should fail)" \
        "POST" \
        "/auth/register" \
        '{
            "username": "duplicate",
            "email": "test'${RANDOM}'@example.com",
            "password": "TestPass123!",
            "confirmPassword": "TestPass123!",
            "firstName": "Test",
            "lastName": "User"
        }' \
        "" \
        "400"
    
    # Exception flow - invalid data
    run_test \
        "auth_register_invalid" \
        "Register with invalid email format" \
        "POST" \
        "/auth/register" \
        '{
            "username": "invalid",
            "email": "not-an-email",
            "password": "TestPass123!",
            "confirmPassword": "TestPass123!",
            "firstName": "Test",
            "lastName": "User"
        }' \
        "" \
        "400"
    
    # Login tests
    run_test \
        "auth_login_success" \
        "Login with valid credentials" \
        "POST" \
        "/auth/login" \
        '{
            "usernameOrEmail": "testuser1",
            "password": "TestPass123!"
        }' \
        "" \
        "200"
    
    run_test \
        "auth_login_invalid" \
        "Login with wrong password" \
        "POST" \
        "/auth/login" \
        '{
            "usernameOrEmail": "testuser1",
            "password": "WrongPassword"
        }' \
        "" \
        "401"
}

# User Management Tests
run_user_tests() {
    log_test_header "USER MANAGEMENT TESTS"
    
    # Get a valid token first
    local token=$(get_auth_token)
    
    if [ -z "$token" ]; then
        log_warning "Could not obtain auth token, skipping user tests"
        return
    fi
    
    # Get profile
    run_test \
        "user_get_profile" \
        "Get authenticated user profile" \
        "GET" \
        "/users/profile" \
        "" \
        "$token" \
        "200"
    
    # Update profile
    run_test \
        "user_update_profile" \
        "Update user profile information" \
        "PUT" \
        "/users/profile" \
        '{
            "firstName": "Updated",
            "lastName": "Name",
            "phone": "+9876543210"
        }' \
        "$token" \
        "200"
    
    # Change password
    run_test \
        "user_change_password" \
        "Change user password" \
        "PUT" \
        "/users/change-password" \
        '{
            "currentPassword": "TestPass123!",
            "newPassword": "NewPass456!"
        }' \
        "$token" \
        "200"
}

# List Management Tests
run_list_tests() {
    log_test_header "LIST MANAGEMENT TESTS"
    
    local token=$(get_auth_token)
    
    # Create list
    run_test \
        "list_create" \
        "Create new todo list" \
        "POST" \
        "/lists" \
        '{
            "title": "Test List",
            "description": "Test list description",
            "color": "#FF5722"
        }' \
        "$token" \
        "201"
    
    # Get all lists
    run_test \
        "list_get_all" \
        "Get all user lists" \
        "GET" \
        "/lists" \
        "" \
        "$token" \
        "200"
    
    # Update list
    local list_id="test_list_id"  # This should be extracted from previous response
    run_test \
        "list_update" \
        "Update existing list" \
        "PUT" \
        "/lists/${list_id}" \
        '{
            "title": "Updated List",
            "color": "#2196F3"
        }' \
        "$token" \
        "200"
}

# Todo Management Tests
run_todo_tests() {
    log_test_header "TODO MANAGEMENT TESTS"
    
    local token=$(get_auth_token)
    local list_id="test_list_id"
    
    # Create todo
    run_test \
        "todo_create" \
        "Create new todo item" \
        "POST" \
        "/todos" \
        '{
            "title": "Test Todo",
            "description": "Test todo description",
            "priority": "high",
            "list": "'${list_id}'",
            "tags": ["test", "automated"]
        }' \
        "$token" \
        "201"
    
    # Get all todos
    run_test \
        "todo_get_all" \
        "Get all todos" \
        "GET" \
        "/todos" \
        "" \
        "$token" \
        "200"
    
    # Toggle todo completion
    local todo_id="test_todo_id"
    run_test \
        "todo_toggle" \
        "Toggle todo completion status" \
        "PATCH" \
        "/todos/${todo_id}/toggle" \
        "" \
        "$token" \
        "200"
}

# Performance Tests
run_performance_tests() {
    log_test_header "PERFORMANCE TESTS"
    
    local token=$(get_auth_token)
    local total_time=0
    local iterations=10
    
    log_info "Running ${iterations} iterations for performance testing..."
    
    for i in $(seq 1 $iterations); do
        local start=$(date +%s%N)
        curl -s -X GET "${API_BASE}/todos" \
            -H "Authorization: Bearer ${token}" \
            -H "Content-Type: application/json" > /dev/null
        local end=$(date +%s%N)
        local duration=$((($end - $start) / 1000000))
        total_time=$((total_time + duration))
        log_info "Iteration ${i}: ${duration}ms"
    done
    
    local avg_time=$((total_time / iterations))
    log_info "Average response time: ${avg_time}ms"
    
    if [ $avg_time -lt 100 ]; then
        log_success "Performance test passed (avg: ${avg_time}ms < 100ms)"
        ((PASSED_TESTS++))
    else
        log_warning "Performance could be improved (avg: ${avg_time}ms)"
    fi
    ((TOTAL_TESTS++))
}

# Security Tests
run_security_tests() {
    log_test_header "SECURITY TESTS"
    
    # SQL Injection test
    run_test \
        "security_sql_injection" \
        "Test SQL injection prevention" \
        "POST" \
        "/auth/login" \
        '{
            "usernameOrEmail": "admin'\'' OR '\''1'\''='\''1",
            "password": "password"
        }' \
        "" \
        "401"
    
    # XSS test
    run_test \
        "security_xss" \
        "Test XSS prevention" \
        "POST" \
        "/auth/register" \
        '{
            "username": "<script>alert(\"XSS\")</script>",
            "email": "xss@test.com",
            "password": "Test123!",
            "confirmPassword": "Test123!",
            "firstName": "XSS",
            "lastName": "Test"
        }' \
        "" \
        "400"
    
    # Auth bypass test
    run_test \
        "security_auth_bypass" \
        "Test unauthorized access prevention" \
        "GET" \
        "/users/profile" \
        "" \
        "" \
        "401"
}

# Helper function to get auth token
get_auth_token() {
    # Create a test user and login to get token
    local username="testuser_${RANDOM}"
    local email="test_${RANDOM}@example.com"
    
    # Register
    curl -s -X POST "${API_BASE}/auth/register" \
        -H "Content-Type: application/json" \
        -d '{
            "username": "'${username}'",
            "email": "'${email}'",
            "password": "TestPass123!",
            "confirmPassword": "TestPass123!",
            "firstName": "Test",
            "lastName": "User"
        }' > /dev/null 2>&1
    
    # Login and get token
    local response=$(curl -s -X POST "${API_BASE}/auth/login" \
        -H "Content-Type: application/json" \
        -d '{
            "usernameOrEmail": "'${username}'",
            "password": "TestPass123!"
        }')
    
    echo "$response" | grep -o '"token":"[^"]*' | cut -d'"' -f4
}

################################################################################
# Report Generation
################################################################################

generate_html_report() {
    log_info "Generating HTML report..."
    
    local end_time=$(date +%s)
    local total_time=$((end_time - START_TIME))
    local pass_rate=$((PASSED_TESTS * 100 / TOTAL_TESTS))
    
    cat > "${REPORT_FILE}" << EOF
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>API Test Report - $(date +%Y-%m-%d\ %H:%M:%S)</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
        }
        .header {
            background: white;
            border-radius: 12px;
            padding: 30px;
            margin-bottom: 30px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .summary-card {
            background: white;
            padding: 20px;
            border-radius: 12px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            text-align: center;
        }
        .summary-card h3 {
            color: #666;
            font-size: 14px;
            margin-bottom: 10px;
            text-transform: uppercase;
        }
        .summary-card .value {
            font-size: 36px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .summary-card.passed .value { color: #4CAF50; }
        .summary-card.failed .value { color: #F44336; }
        .summary-card.skipped .value { color: #FF9800; }
        .summary-card.total .value { color: #2196F3; }
        .progress-bar {
            height: 30px;
            background: #f0f0f0;
            border-radius: 15px;
            overflow: hidden;
            margin: 20px 0;
        }
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #4CAF50 ${pass_rate}%, #F44336 ${pass_rate}%);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
        }
        .test-results {
            background: white;
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        th {
            background: #f8f9fa;
            padding: 12px;
            text-align: left;
            font-weight: 600;
            color: #333;
            border-bottom: 2px solid #dee2e6;
        }
        td {
            padding: 12px;
            border-bottom: 1px solid #dee2e6;
        }
        tr:hover {
            background: #f8f9fa;
        }
        .status {
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .status.pass {
            background: #E8F5E9;
            color: #2E7D32;
        }
        .status.fail {
            background: #FFEBEE;
            color: #C62828;
        }
        .status.skip {
            background: #FFF3E0;
            color: #E65100;
        }
        .time {
            color: #666;
            font-size: 14px;
        }
        .footer {
            text-align: center;
            padding: 20px;
            color: white;
            margin-top: 30px;
        }
        .chart-container {
            display: flex;
            justify-content: space-around;
            margin: 30px 0;
        }
        .pie-chart {
            width: 200px;
            height: 200px;
            position: relative;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .container > * {
            animation: fadeIn 0.5s ease-out;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 11l3 3L22 4"></path>
                    <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"></path>
                </svg>
                API Test Report
            </h1>
            <p style="color: #666;">Generated on $(date +%Y-%m-%d\ %H:%M:%S)</p>
            <p style="color: #666;">Total Duration: ${total_time} seconds</p>
        </div>

        <div class="summary">
            <div class="summary-card total">
                <h3>Total Tests</h3>
                <div class="value">${TOTAL_TESTS}</div>
            </div>
            <div class="summary-card passed">
                <h3>Passed</h3>
                <div class="value">${PASSED_TESTS}</div>
                <small>${pass_rate}%</small>
            </div>
            <div class="summary-card failed">
                <h3>Failed</h3>
                <div class="value">${FAILED_TESTS}</div>
                <small>$((FAILED_TESTS * 100 / TOTAL_TESTS))%</small>
            </div>
            <div class="summary-card skipped">
                <h3>Skipped</h3>
                <div class="value">${SKIPPED_TESTS}</div>
                <small>$((SKIPPED_TESTS * 100 / TOTAL_TESTS))%</small>
            </div>
        </div>

        <div class="progress-bar">
            <div class="progress-fill" style="width: 100%;">
                Pass Rate: ${pass_rate}%
            </div>
        </div>

        <div class="test-results">
            <h2>Test Results Details</h2>
            <table>
                <thead>
                    <tr>
                        <th>Test Name</th>
                        <th>Status</th>
                        <th>Duration (ms)</th>
                        <th>Details</th>
                    </tr>
                </thead>
                <tbody>
EOF

    # Add test results to table
    for test_name in "${!TEST_RESULTS[@]}"; do
        local status="${TEST_RESULTS[$test_name]}"
        local duration="${TEST_TIMES[$test_name]:-0}"
        local status_class=$(echo "$status" | tr '[:upper:]' '[:lower:]')
        
        echo "<tr>" >> "${REPORT_FILE}"
        echo "<td>${test_name}</td>" >> "${REPORT_FILE}"
        echo "<td><span class='status ${status_class}'>${status}</span></td>" >> "${REPORT_FILE}"
        echo "<td class='time'>${duration}ms</td>" >> "${REPORT_FILE}"
        echo "<td>-</td>" >> "${REPORT_FILE}"
        echo "</tr>" >> "${REPORT_FILE}"
    done

    cat >> "${REPORT_FILE}" << EOF
                </tbody>
            </table>
        </div>

        <div class="footer">
            <p>© 2025 Angular Todo Application - API Test Suite</p>
            <p>Report generated automatically by the test automation system</p>
        </div>
    </div>
</body>
</html>
EOF
    
    log_success "HTML report generated: ${REPORT_FILE}"
}

generate_json_report() {
    log_info "Generating JSON report..."
    
    cat > "${JSON_REPORT}" << EOF
{
    "timestamp": "$(date -Iseconds)",
    "duration_seconds": $(($(date +%s) - START_TIME)),
    "summary": {
        "total": ${TOTAL_TESTS},
        "passed": ${PASSED_TESTS},
        "failed": ${FAILED_TESTS},
        "skipped": ${SKIPPED_TESTS},
        "pass_rate": $((PASSED_TESTS * 100 / TOTAL_TESTS))
    },
    "tests": [
EOF

    local first=true
    for test_name in "${!TEST_RESULTS[@]}"; do
        if [ "$first" = false ]; then
            echo "," >> "${JSON_REPORT}"
        fi
        first=false
        
        cat >> "${JSON_REPORT}" << EOF
        {
            "name": "${test_name}",
            "status": "${TEST_RESULTS[$test_name]}",
            "duration_ms": ${TEST_TIMES[$test_name]:-0}
        }
EOF
    done

    cat >> "${JSON_REPORT}" << EOF
    ]
}
EOF
    
    log_success "JSON report generated: ${JSON_REPORT}"
}

################################################################################
# Main Execution
################################################################################

main() {
    log "${BOLD}${PURPLE}"
    log "╔══════════════════════════════════════════════════════════╗"
    log "║         ANGULAR TODO API COMPREHENSIVE TEST SUITE         ║"
    log "║                                                          ║"
    log "║  Testing: Unit | Integration | Functional | Performance   ║"
    log "╚══════════════════════════════════════════════════════════╝${NC}"
    
    # Create report directory
    mkdir -p "${REPORT_DIR}"
    
    # Check if API is running
    log_info "Checking API availability..."
    if ! curl -s "${BASE_URL}/health" > /dev/null 2>&1; then
        log_error "API is not accessible at ${BASE_URL}"
        log_info "Starting the API server..."
        
        # Start the backend
        cd ../Back-End/express-rest-todo-api
        npm run dev > /tmp/api_server.log 2>&1 &
        API_PID=$!
        
        # Wait for server to start
        sleep 5
        
        if ! curl -s "${BASE_URL}/health" > /dev/null 2>&1; then
            log_error "Failed to start API server"
            exit 1
        fi
        log_success "API server started (PID: ${API_PID})"
    else
        log_success "API is accessible"
    fi
    
    # Run test suites
    run_auth_tests
    run_user_tests
    run_list_tests
    run_todo_tests
    run_security_tests
    run_performance_tests
    
    # Generate reports
    log_test_header "GENERATING REPORTS"
    generate_html_report
    generate_json_report
    
    # Summary
    log_test_header "TEST EXECUTION SUMMARY"
    log "${BOLD}Total Tests: ${TOTAL_TESTS}${NC}"
    log "${GREEN}Passed: ${PASSED_TESTS}${NC}"
    log "${RED}Failed: ${FAILED_TESTS}${NC}"
    log "${YELLOW}Skipped: ${SKIPPED_TESTS}${NC}"
    log "Pass Rate: $((PASSED_TESTS * 100 / TOTAL_TESTS))%"
    log "Total Time: $(($(date +%s) - START_TIME)) seconds"
    
    # Open report in browser if available
    if command -v xdg-open > /dev/null; then
        xdg-open "${REPORT_FILE}" 2>/dev/null &
    elif command -v open > /dev/null; then
        open "${REPORT_FILE}" 2>/dev/null &
    fi
    
    # Cleanup
    if [ ! -z "${API_PID}" ]; then
        log_info "Stopping API server..."
        kill ${API_PID} 2>/dev/null
    fi
    
    # Exit with appropriate code
    if [ ${FAILED_TESTS} -gt 0 ]; then
        exit 1
    else
        exit 0
    fi
}

# Run main function
main "$@"