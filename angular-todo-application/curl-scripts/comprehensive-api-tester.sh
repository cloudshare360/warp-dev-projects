#!/bin/bash

################################################################################
# Comprehensive Angular Todo API Testing Framework
# Features: Normal Flow, Alternative Flow, Error Flow, Exception Flow
# Integration Testing: Full user journey from signup to logout
################################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# Configuration
BASE_URL="${API_URL:-http://localhost:3000}"
API_BASE="${BASE_URL}/api"
REPORT_DIR="./reports"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPORT_FILE="${REPORT_DIR}/comprehensive_test_report_${TIMESTAMP}.html"
JSON_REPORT="${REPORT_DIR}/comprehensive_test_report_${TIMESTAMP}.json"
LOG_FILE="${REPORT_DIR}/comprehensive_test_log_${TIMESTAMP}.log"

# Test counters
declare -A FLOW_COUNTERS=(
    ["normal_total"]=0 ["normal_pass"]=0 ["normal_fail"]=0
    ["alternative_total"]=0 ["alternative_pass"]=0 ["alternative_fail"]=0
    ["error_total"]=0 ["error_pass"]=0 ["error_fail"]=0
    ["exception_total"]=0 ["exception_pass"]=0 ["exception_fail"]=0
    ["integration_total"]=0 ["integration_pass"]=0 ["integration_fail"]=0
)

# Test results storage
declare -A TEST_RESULTS
declare -A TEST_TIMES
declare -A TEST_RESPONSES

# Global variables for integration testing
TEST_USER_EMAIL=""
TEST_USER_TOKEN=""
TEST_LIST_ID=""
TEST_TODO_ID=""

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

log_flow_header() {
    log "\n${PURPLE}${"="*80}${NC}"
    log "${BOLD}${CYAN}$1${NC}"
    log "${PURPLE}${"="*80}${NC}"
}

log_test_section() {
    log "\n${BOLD}${YELLOW}--- $1 ---${NC}"
}

# Execute API call with timeout and detailed logging
api_call() {
    local method=$1
    local endpoint=$2
    local data=$3
    local token=$4
    local expected_status=$5
    local test_name=$6
    local flow_type=$7
    
    # Build headers
    local auth_header=""
    if [ ! -z "$token" ]; then
        auth_header="-H 'Authorization: Bearer $token'"
    fi
    
    # Temporary files for response
    local response_file="/tmp/response_${RANDOM}.json"
    local http_code_file="/tmp/http_code_${RANDOM}.txt"
    local headers_file="/tmp/headers_${RANDOM}.txt"
    
    # Build curl command with timeout
    local curl_cmd="timeout 10 curl -s -w '%{http_code}' -D '${headers_file}' -o '${response_file}' -X ${method} '${API_BASE}${endpoint}' \
        -H 'Content-Type: application/json' \
        -H 'Accept: application/json' \
        ${auth_header}"
    
    if [ ! -z "$data" ] && [ "$data" != "null" ]; then
        curl_cmd="${curl_cmd} -d '${data}'"
    fi
    
    # Execute with timing
    local start_time=$(date +%s%N)
    local http_code
    if eval "${curl_cmd}" > "${http_code_file}" 2>/dev/null; then
        http_code=$(cat "${http_code_file}")
        local end_time=$(date +%s%N)
        local duration=$((($end_time - $start_time) / 1000000))
        
        local response=$(cat "${response_file}" 2>/dev/null || echo "{}")
        local headers=$(cat "${headers_file}" 2>/dev/null || echo "")
        
        # Store results
        TEST_TIMES["${test_name}"]="${duration}"
        TEST_RESPONSES["${test_name}"]="${response}"
        
        # Update counters
        ((FLOW_COUNTERS["${flow_type}_total"]++))
        
        # Check result
        if [ "$http_code" == "$expected_status" ]; then
            ((FLOW_COUNTERS["${flow_type}_pass"]++))
            TEST_RESULTS["${test_name}"]="PASS"
            log_success "${test_name} (${duration}ms) - Status: ${http_code}"
            
            # Store important data for integration tests
            case "$test_name" in
                "auth_register_success")
                    TEST_USER_EMAIL=$(echo "$data" | grep -o '"email":"[^"]*' | cut -d'"' -f4)
                    ;;
                "auth_login_success")
                    TEST_USER_TOKEN=$(echo "$response" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
                    log_info "Token obtained: ${TEST_USER_TOKEN:0:20}..."
                    ;;
                "list_create_success")
                    TEST_LIST_ID=$(echo "$response" | grep -o '"_id":"[^"]*' | cut -d'"' -f4)
                    log_info "List ID obtained: $TEST_LIST_ID"
                    ;;
                "todo_create_success")
                    TEST_TODO_ID=$(echo "$response" | grep -o '"_id":"[^"]*' | cut -d'"' -f4)
                    log_info "Todo ID obtained: $TEST_TODO_ID"
                    ;;
            esac
            
        else
            ((FLOW_COUNTERS["${flow_type}_fail"]++))
            TEST_RESULTS["${test_name}"]="FAIL"
            log_error "${test_name} - Expected: ${expected_status}, Got: ${http_code}"
            log_error "Response: ${response}"
        fi
        
        # Additional validation for successful responses
        if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
            # Validate JSON response
            if ! echo "$response" | jq . > /dev/null 2>&1; then
                log_warning "Invalid JSON response for ${test_name}"
            fi
        fi
        
    else
        # Timeout or connection error
        ((FLOW_COUNTERS["${flow_type}_total"]++))
        ((FLOW_COUNTERS["${flow_type}_fail"]++))
        TEST_RESULTS["${test_name}"]="TIMEOUT"
        TEST_TIMES["${test_name}"]=">10000"
        log_error "${test_name} - Connection timeout or error"
    fi
    
    # Cleanup
    rm -f "${response_file}" "${http_code_file}" "${headers_file}"
}

################################################################################
# API Test Functions by Flow Type
################################################################################

# AUTHENTICATION TESTS
test_auth_flows() {
    log_flow_header "AUTHENTICATION API TESTS"
    
    # Normal Flow Tests
    log_test_section "NORMAL FLOW - Authentication"
    
    local timestamp=$(date +%s)
    local test_username="testuser_${timestamp}"
    local test_email="test_${timestamp}@example.com"
    
    # Test 1: Successful Registration
    api_call "POST" "/auth/register" \
        '{
            "username": "'${test_username}'",
            "email": "'${test_email}'",
            "password": "TestPass123!",
            "confirmPassword": "TestPass123!",
            "firstName": "Test",
            "lastName": "User"
        }' \
        "" "201" "auth_register_success" "normal"
    
    # Test 2: Successful Login
    api_call "POST" "/auth/login" \
        '{
            "usernameOrEmail": "'${test_username}'",
            "password": "TestPass123!"
        }' \
        "" "200" "auth_login_success" "normal"
    
    # Test 3: Token Refresh (if endpoint exists)
    api_call "POST" "/auth/refresh" \
        '{}' \
        "$TEST_USER_TOKEN" "200" "auth_refresh_success" "normal"
    
    # Alternative Flow Tests
    log_test_section "ALTERNATIVE FLOW - Authentication"
    
    # Test 4: Login with email instead of username
    api_call "POST" "/auth/login" \
        '{
            "usernameOrEmail": "'${test_email}'",
            "password": "TestPass123!"
        }' \
        "" "200" "auth_login_with_email" "alternative"
    
    # Error Flow Tests  
    log_test_section "ERROR FLOW - Authentication"
    
    # Test 5: Registration with existing email
    api_call "POST" "/auth/register" \
        '{
            "username": "duplicate_user",
            "email": "'${test_email}'",
            "password": "TestPass123!",
            "confirmPassword": "TestPass123!",
            "firstName": "Duplicate",
            "lastName": "User"
        }' \
        "" "400" "auth_register_duplicate_email" "error"
    
    # Test 6: Login with wrong password
    api_call "POST" "/auth/login" \
        '{
            "usernameOrEmail": "'${test_username}'",
            "password": "WrongPassword123!"
        }' \
        "" "401" "auth_login_wrong_password" "error"
    
    # Test 7: Login with non-existent user
    api_call "POST" "/auth/login" \
        '{
            "usernameOrEmail": "nonexistent_user",
            "password": "TestPass123!"
        }' \
        "" "401" "auth_login_nonexistent_user" "error"
    
    # Exception Flow Tests
    log_test_section "EXCEPTION FLOW - Authentication"
    
    # Test 8: Registration with invalid email format
    api_call "POST" "/auth/register" \
        '{
            "username": "invalid_email_user",
            "email": "not-an-email",
            "password": "TestPass123!",
            "confirmPassword": "TestPass123!",
            "firstName": "Invalid",
            "lastName": "Email"
        }' \
        "" "400" "auth_register_invalid_email" "exception"
    
    # Test 9: Registration with password mismatch
    api_call "POST" "/auth/register" \
        '{
            "username": "mismatch_user",
            "email": "mismatch@example.com",
            "password": "TestPass123!",
            "confirmPassword": "DifferentPass123!",
            "firstName": "Mismatch",
            "lastName": "User"
        }' \
        "" "400" "auth_register_password_mismatch" "exception"
    
    # Test 10: Registration with weak password
    api_call "POST" "/auth/register" \
        '{
            "username": "weak_password_user",
            "email": "weak@example.com",
            "password": "123",
            "confirmPassword": "123",
            "firstName": "Weak",
            "lastName": "Password"
        }' \
        "" "400" "auth_register_weak_password" "exception"
}

# USER MANAGEMENT TESTS
test_user_flows() {
    log_flow_header "USER MANAGEMENT API TESTS"
    
    if [ -z "$TEST_USER_TOKEN" ]; then
        log_warning "No auth token available, skipping user management tests"
        return
    fi
    
    # Normal Flow Tests
    log_test_section "NORMAL FLOW - User Management"
    
    # Test 1: Get user profile
    api_call "GET" "/users/profile" \
        "" \
        "$TEST_USER_TOKEN" "200" "user_get_profile" "normal"
    
    # Test 2: Update user profile
    api_call "PUT" "/users/profile" \
        '{
            "firstName": "Updated",
            "lastName": "Name",
            "phone": "+1234567890",
            "dateOfBirth": "1990-01-01"
        }' \
        "$TEST_USER_TOKEN" "200" "user_update_profile" "normal"
    
    # Alternative Flow Tests
    log_test_section "ALTERNATIVE FLOW - User Management"
    
    # Test 3: Partial profile update
    api_call "PUT" "/users/profile" \
        '{
            "firstName": "PartialUpdate"
        }' \
        "$TEST_USER_TOKEN" "200" "user_partial_update" "alternative"
    
    # Error Flow Tests
    log_test_section "ERROR FLOW - User Management"
    
    # Test 4: Get profile without token
    api_call "GET" "/users/profile" \
        "" \
        "" "401" "user_get_profile_no_token" "error"
    
    # Test 5: Update profile with invalid token
    api_call "PUT" "/users/profile" \
        '{
            "firstName": "Invalid",
            "lastName": "Token"
        }' \
        "invalid_token_12345" "401" "user_update_invalid_token" "error"
    
    # Exception Flow Tests
    log_test_section "EXCEPTION FLOW - User Management"
    
    # Test 6: Update profile with invalid data types
    api_call "PUT" "/users/profile" \
        '{
            "firstName": 12345,
            "lastName": true,
            "phone": "invalid-phone-format"
        }' \
        "$TEST_USER_TOKEN" "400" "user_update_invalid_data" "exception"
}

# LIST MANAGEMENT TESTS
test_list_flows() {
    log_flow_header "LIST MANAGEMENT API TESTS"
    
    if [ -z "$TEST_USER_TOKEN" ]; then
        log_warning "No auth token available, skipping list management tests"
        return
    fi
    
    # Normal Flow Tests
    log_test_section "NORMAL FLOW - List Management"
    
    # Test 1: Create a new list
    api_call "POST" "/lists" \
        '{
            "title": "My Test List",
            "description": "A comprehensive test list",
            "color": "#FF5722",
            "isPublic": false
        }' \
        "$TEST_USER_TOKEN" "201" "list_create_success" "normal"
    
    # Test 2: Get all lists
    api_call "GET" "/lists" \
        "" \
        "$TEST_USER_TOKEN" "200" "list_get_all" "normal"
    
    # Test 3: Update the created list
    if [ ! -z "$TEST_LIST_ID" ]; then
        api_call "PUT" "/lists/${TEST_LIST_ID}" \
            '{
                "title": "Updated Test List",
                "description": "Updated description",
                "color": "#2196F3"
            }' \
            "$TEST_USER_TOKEN" "200" "list_update_success" "normal"
    fi
    
    # Alternative Flow Tests
    log_test_section "ALTERNATIVE FLOW - List Management"
    
    # Test 4: Create list with minimal data
    api_call "POST" "/lists" \
        '{
            "title": "Minimal List"
        }' \
        "$TEST_USER_TOKEN" "201" "list_create_minimal" "alternative"
    
    # Test 5: Get specific list by ID
    if [ ! -z "$TEST_LIST_ID" ]; then
        api_call "GET" "/lists/${TEST_LIST_ID}" \
            "" \
            "$TEST_USER_TOKEN" "200" "list_get_by_id" "alternative"
    fi
    
    # Error Flow Tests
    log_test_section "ERROR FLOW - List Management"
    
    # Test 6: Create list without authentication
    api_call "POST" "/lists" \
        '{
            "title": "Unauthorized List",
            "description": "This should fail"
        }' \
        "" "401" "list_create_unauthorized" "error"
    
    # Test 7: Get non-existent list
    api_call "GET" "/lists/507f1f77bcf86cd799439011" \
        "" \
        "$TEST_USER_TOKEN" "404" "list_get_nonexistent" "error"
    
    # Exception Flow Tests
    log_test_section "EXCEPTION FLOW - List Management"
    
    # Test 8: Create list with invalid data
    api_call "POST" "/lists" \
        '{
            "title": "",
            "color": "invalid-color-format"
        }' \
        "$TEST_USER_TOKEN" "400" "list_create_invalid_data" "exception"
    
    # Test 9: Update list with invalid ID format
    api_call "PUT" "/lists/invalid-id-format" \
        '{
            "title": "Updated List"
        }' \
        "$TEST_USER_TOKEN" "400" "list_update_invalid_id" "exception"
}

# TODO MANAGEMENT TESTS
test_todo_flows() {
    log_flow_header "TODO MANAGEMENT API TESTS"
    
    if [ -z "$TEST_USER_TOKEN" ]; then
        log_warning "No auth token available, skipping todo management tests"
        return
    fi
    
    # Normal Flow Tests
    log_test_section "NORMAL FLOW - Todo Management"
    
    # Test 1: Create a new todo
    api_call "POST" "/todos" \
        '{
            "title": "Test Todo Item",
            "description": "A comprehensive test todo",
            "priority": "high",
            "dueDate": "2025-12-31T23:59:59.000Z",
            "tags": ["test", "automation"],
            "list": "'${TEST_LIST_ID}'"
        }' \
        "$TEST_USER_TOKEN" "201" "todo_create_success" "normal"
    
    # Test 2: Get all todos
    api_call "GET" "/todos" \
        "" \
        "$TEST_USER_TOKEN" "200" "todo_get_all" "normal"
    
    # Test 3: Update todo
    if [ ! -z "$TEST_TODO_ID" ]; then
        api_call "PUT" "/todos/${TEST_TODO_ID}" \
            '{
                "title": "Updated Todo Item",
                "description": "Updated description",
                "priority": "medium"
            }' \
            "$TEST_USER_TOKEN" "200" "todo_update_success" "normal"
    fi
    
    # Test 4: Toggle todo completion
    if [ ! -z "$TEST_TODO_ID" ]; then
        api_call "PATCH" "/todos/${TEST_TODO_ID}/toggle" \
            "" \
            "$TEST_USER_TOKEN" "200" "todo_toggle_completion" "normal"
    fi
    
    # Alternative Flow Tests
    log_test_section "ALTERNATIVE FLOW - Todo Management"
    
    # Test 5: Create todo with minimal data
    api_call "POST" "/todos" \
        '{
            "title": "Minimal Todo"
        }' \
        "$TEST_USER_TOKEN" "201" "todo_create_minimal" "alternative"
    
    # Test 6: Get todos with filters
    api_call "GET" "/todos?completed=false&priority=high" \
        "" \
        "$TEST_USER_TOKEN" "200" "todo_get_filtered" "alternative"
    
    # Error Flow Tests
    log_test_section "ERROR FLOW - Todo Management"
    
    # Test 7: Create todo without authentication
    api_call "POST" "/todos" \
        '{
            "title": "Unauthorized Todo",
            "description": "This should fail"
        }' \
        "" "401" "todo_create_unauthorized" "error"
    
    # Test 8: Get non-existent todo
    api_call "GET" "/todos/507f1f77bcf86cd799439011" \
        "" \
        "$TEST_USER_TOKEN" "404" "todo_get_nonexistent" "error"
    
    # Exception Flow Tests
    log_test_section "EXCEPTION FLOW - Todo Management"
    
    # Test 9: Create todo with invalid data
    api_call "POST" "/todos" \
        '{
            "title": "",
            "priority": "invalid-priority",
            "dueDate": "invalid-date-format"
        }' \
        "$TEST_USER_TOKEN" "400" "todo_create_invalid_data" "exception"
}

# INTEGRATION TESTS - Full User Journey
test_integration_flows() {
    log_flow_header "INTEGRATION TESTING - FULL USER JOURNEY"
    
    log_test_section "INTEGRATION TEST - Complete User Workflow"
    
    local journey_timestamp=$(date +%s)
    local journey_username="journey_user_${journey_timestamp}"
    local journey_email="journey_${journey_timestamp}@example.com"
    local journey_token=""
    local journey_list_id=""
    local journey_todo_id=""
    
    # Step 1: User Registration
    log_info "Step 1: User Registration"
    api_call "POST" "/auth/register" \
        '{
            "username": "'${journey_username}'",
            "email": "'${journey_email}'",
            "password": "JourneyPass123!",
            "confirmPassword": "JourneyPass123!",
            "firstName": "Journey",
            "lastName": "User"
        }' \
        "" "201" "integration_user_registration" "integration"
    
    # Step 2: User Login
    log_info "Step 2: User Login"
    local login_response_file="/tmp/login_response_${RANDOM}.json"
    local login_code_file="/tmp/login_code_${RANDOM}.txt"
    
    eval "curl -s -w '%{http_code}' -o '${login_response_file}' -X POST '${API_BASE}/auth/login' \
        -H 'Content-Type: application/json' \
        -d '{
            \"usernameOrEmail\": \"${journey_username}\",
            \"password\": \"JourneyPass123!\"
        }'" > "${login_code_file}" 2>/dev/null
    
    local login_code=$(cat "${login_code_file}")
    if [ "$login_code" == "200" ]; then
        journey_token=$(cat "${login_response_file}" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
        ((FLOW_COUNTERS["integration_total"]++))
        ((FLOW_COUNTERS["integration_pass"]++))
        TEST_RESULTS["integration_user_login"]="PASS"
        log_success "integration_user_login - Token obtained"
    else
        ((FLOW_COUNTERS["integration_total"]++))
        ((FLOW_COUNTERS["integration_fail"]++))
        TEST_RESULTS["integration_user_login"]="FAIL"
        log_error "integration_user_login - Login failed"
        rm -f "${login_response_file}" "${login_code_file}"
        return
    fi
    
    rm -f "${login_response_file}" "${login_code_file}"
    
    # Step 3: Create List
    log_info "Step 3: Create Todo List"
    local list_response_file="/tmp/list_response_${RANDOM}.json"
    local list_code_file="/tmp/list_code_${RANDOM}.txt"
    
    eval "curl -s -w '%{http_code}' -o '${list_response_file}' -X POST '${API_BASE}/lists' \
        -H 'Content-Type: application/json' \
        -H 'Authorization: Bearer ${journey_token}' \
        -d '{
            \"title\": \"Journey Test List\",
            \"description\": \"Integration test list\",
            \"color\": \"#4CAF50\"
        }'" > "${list_code_file}" 2>/dev/null
    
    local list_code=$(cat "${list_code_file}")
    if [ "$list_code" == "201" ]; then
        journey_list_id=$(cat "${list_response_file}" | grep -o '"_id":"[^"]*' | cut -d'"' -f4)
        ((FLOW_COUNTERS["integration_total"]++))
        ((FLOW_COUNTERS["integration_pass"]++))
        TEST_RESULTS["integration_create_list"]="PASS"
        log_success "integration_create_list - List created with ID: $journey_list_id"
    else
        ((FLOW_COUNTERS["integration_total"]++))
        ((FLOW_COUNTERS["integration_fail"]++))
        TEST_RESULTS["integration_create_list"]="FAIL"
        log_error "integration_create_list - Failed to create list"
    fi
    
    rm -f "${list_response_file}" "${list_code_file}"
    
    # Step 4: Create Todo in List
    log_info "Step 4: Create Todo in List"
    if [ ! -z "$journey_list_id" ]; then
        api_call "POST" "/todos" \
            '{
                "title": "Integration Test Todo",
                "description": "A todo created during integration testing",
                "priority": "high",
                "list": "'${journey_list_id}'",
                "tags": ["integration", "test"]
            }' \
            "$journey_token" "201" "integration_create_todo" "integration"
        
        # Extract todo ID for further tests
        if [[ "${TEST_RESULTS["integration_create_todo"]}" == "PASS" ]]; then
            journey_todo_id=$(echo "${TEST_RESPONSES["integration_create_todo"]}" | grep -o '"_id":"[^"]*' | cut -d'"' -f4)
            log_info "Todo created with ID: $journey_todo_id"
        fi
    fi
    
    # Step 5: Mark Todo as Complete
    log_info "Step 5: Mark Todo as Complete"
    if [ ! -z "$journey_todo_id" ]; then
        api_call "PATCH" "/todos/${journey_todo_id}/toggle" \
            "" \
            "$journey_token" "200" "integration_complete_todo" "integration"
    fi
    
    # Step 6: Get User's Todos
    log_info "Step 6: Retrieve All User Todos"
    api_call "GET" "/todos" \
        "" \
        "$journey_token" "200" "integration_get_todos" "integration"
    
    # Step 7: Get User's Lists
    log_info "Step 7: Retrieve All User Lists"
    api_call "GET" "/lists" \
        "" \
        "$journey_token" "200" "integration_get_lists" "integration"
    
    # Step 8: Update User Profile
    log_info "Step 8: Update User Profile"
    api_call "PUT" "/users/profile" \
        '{
            "firstName": "Updated Journey",
            "lastName": "Updated User",
            "phone": "+1987654321"
        }' \
        "$journey_token" "200" "integration_update_profile" "integration"
    
    # Step 9: Test Logout (if endpoint exists)
    log_info "Step 9: User Logout"
    api_call "POST" "/auth/logout" \
        '{}' \
        "$journey_token" "200" "integration_user_logout" "integration"
    
    # Step 10: Verify token is invalid after logout
    log_info "Step 10: Verify Token Invalidation"
    api_call "GET" "/users/profile" \
        "" \
        "$journey_token" "401" "integration_token_invalidated" "integration"
}

# SECURITY AND PERFORMANCE TESTS
test_security_performance() {
    log_flow_header "SECURITY AND PERFORMANCE TESTS"
    
    log_test_section "SECURITY TESTS"
    
    # SQL Injection Test
    api_call "POST" "/auth/login" \
        '{
            "usernameOrEmail": "admin'"'"' OR '"'"'1'"'"'='"'"'1",
            "password": "password"
        }' \
        "" "401" "security_sql_injection" "exception"
    
    # XSS Test
    api_call "POST" "/auth/register" \
        '{
            "username": "<script>alert(\"XSS\")</script>",
            "email": "xss@test.com",
            "password": "Test123!",
            "confirmPassword": "Test123!",
            "firstName": "XSS",
            "lastName": "Test"
        }' \
        "" "400" "security_xss_prevention" "exception"
    
    log_test_section "PERFORMANCE TESTS"
    
    # Performance test - multiple rapid requests
    local performance_token=""
    if [ ! -z "$TEST_USER_TOKEN" ]; then
        performance_token=$TEST_USER_TOKEN
    fi
    
    log_info "Testing API response times..."
    local total_time=0
    local iterations=5
    
    for i in $(seq 1 $iterations); do
        local start=$(date +%s%N)
        timeout 5 curl -s -X GET "${API_BASE}/lists" \
            -H "Authorization: Bearer ${performance_token}" \
            -H "Content-Type: application/json" > /dev/null 2>&1
        local end=$(date +%s%N)
        local duration=$((($end - $start) / 1000000))
        total_time=$((total_time + duration))
        log_info "Performance test iteration ${i}: ${duration}ms"
    done
    
    local avg_time=$((total_time / iterations))
    ((FLOW_COUNTERS["normal_total"]++))
    if [ $avg_time -lt 200 ]; then
        ((FLOW_COUNTERS["normal_pass"]++))
        TEST_RESULTS["performance_response_time"]="PASS"
        log_success "Performance test passed (avg: ${avg_time}ms < 200ms)"
    else
        ((FLOW_COUNTERS["normal_fail"]++))
        TEST_RESULTS["performance_response_time"]="FAIL"
        log_warning "Performance could be improved (avg: ${avg_time}ms >= 200ms)"
    fi
}

################################################################################
# Report Generation
################################################################################

generate_comprehensive_report() {
    local end_time=$(date +%s)
    local total_time=$((end_time - START_TIME))
    
    # Calculate totals
    local total_tests=$((
        FLOW_COUNTERS["normal_total"] + 
        FLOW_COUNTERS["alternative_total"] + 
        FLOW_COUNTERS["error_total"] + 
        FLOW_COUNTERS["exception_total"] + 
        FLOW_COUNTERS["integration_total"]
    ))
    
    local total_passed=$((
        FLOW_COUNTERS["normal_pass"] + 
        FLOW_COUNTERS["alternative_pass"] + 
        FLOW_COUNTERS["error_pass"] + 
        FLOW_COUNTERS["exception_pass"] + 
        FLOW_COUNTERS["integration_pass"]
    ))
    
    local total_failed=$((
        FLOW_COUNTERS["normal_fail"] + 
        FLOW_COUNTERS["alternative_fail"] + 
        FLOW_COUNTERS["error_fail"] + 
        FLOW_COUNTERS["exception_fail"] + 
        FLOW_COUNTERS["integration_fail"]
    ))
    
    local pass_rate=0
    if [ $total_tests -gt 0 ]; then
        pass_rate=$((total_passed * 100 / total_tests))
    fi
    
    # Generate HTML Report
    cat > "${REPORT_FILE}" << EOF
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Comprehensive API Test Report - $(date +%Y-%m-%d\ %H:%M:%S)</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .container { max-width: 1600px; margin: 0 auto; }
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
        .flow-summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .flow-card {
            background: white;
            padding: 25px;
            border-radius: 12px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            text-align: center;
            position: relative;
            overflow: hidden;
        }
        .flow-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
        }
        .flow-card.normal::before { background: #4CAF50; }
        .flow-card.alternative::before { background: #2196F3; }
        .flow-card.error::before { background: #FF9800; }
        .flow-card.exception::before { background: #F44336; }
        .flow-card.integration::before { background: #9C27B0; }
        .flow-card h3 {
            color: #666;
            font-size: 14px;
            margin-bottom: 10px;
            text-transform: uppercase;
        }
        .flow-stats {
            display: flex;
            justify-content: space-between;
            margin-top: 15px;
        }
        .stat {
            text-align: center;
        }
        .stat .value {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .stat .label {
            font-size: 12px;
            color: #666;
        }
        .stat.pass .value { color: #4CAF50; }
        .stat.fail .value { color: #F44336; }
        .stat.total .value { color: #2196F3; }
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
            margin-bottom: 20px;
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
        tr:hover { background: #f8f9fa; }
        .status {
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .status.pass { background: #E8F5E9; color: #2E7D32; }
        .status.fail { background: #FFEBEE; color: #C62828; }
        .status.timeout { background: #FFF3E0; color: #E65100; }
        .time { color: #666; font-size: 14px; }
        .footer {
            text-align: center;
            padding: 20px;
            color: white;
            margin-top: 30px;
        }
        .flow-breakdown {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
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
                Comprehensive API Test Report
            </h1>
            <p style="color: #666;">Generated on $(date +%Y-%m-%d\ %H:%M:%S)</p>
            <p style="color: #666;">Total Duration: ${total_time} seconds</p>
            <p style="color: #666;">Total Tests: ${total_tests} | Passed: ${total_passed} | Failed: ${total_failed}</p>
        </div>

        <div class="progress-bar">
            <div class="progress-fill">
                Overall Pass Rate: ${pass_rate}%
            </div>
        </div>

        <div class="flow-summary">
            <div class="flow-card normal">
                <h3>Normal Flow</h3>
                <div class="flow-stats">
                    <div class="stat total">
                        <div class="value">${FLOW_COUNTERS["normal_total"]}</div>
                        <div class="label">Total</div>
                    </div>
                    <div class="stat pass">
                        <div class="value">${FLOW_COUNTERS["normal_pass"]}</div>
                        <div class="label">Passed</div>
                    </div>
                    <div class="stat fail">
                        <div class="value">${FLOW_COUNTERS["normal_fail"]}</div>
                        <div class="label">Failed</div>
                    </div>
                </div>
            </div>
            
            <div class="flow-card alternative">
                <h3>Alternative Flow</h3>
                <div class="flow-stats">
                    <div class="stat total">
                        <div class="value">${FLOW_COUNTERS["alternative_total"]}</div>
                        <div class="label">Total</div>
                    </div>
                    <div class="stat pass">
                        <div class="value">${FLOW_COUNTERS["alternative_pass"]}</div>
                        <div class="label">Passed</div>
                    </div>
                    <div class="stat fail">
                        <div class="value">${FLOW_COUNTERS["alternative_fail"]}</div>
                        <div class="label">Failed</div>
                    </div>
                </div>
            </div>
            
            <div class="flow-card error">
                <h3>Error Flow</h3>
                <div class="flow-stats">
                    <div class="stat total">
                        <div class="value">${FLOW_COUNTERS["error_total"]}</div>
                        <div class="label">Total</div>
                    </div>
                    <div class="stat pass">
                        <div class="value">${FLOW_COUNTERS["error_pass"]}</div>
                        <div class="label">Passed</div>
                    </div>
                    <div class="stat fail">
                        <div class="value">${FLOW_COUNTERS["error_fail"]}</div>
                        <div class="label">Failed</div>
                    </div>
                </div>
            </div>
            
            <div class="flow-card exception">
                <h3>Exception Flow</h3>
                <div class="flow-stats">
                    <div class="stat total">
                        <div class="value">${FLOW_COUNTERS["exception_total"]}</div>
                        <div class="label">Total</div>
                    </div>
                    <div class="stat pass">
                        <div class="value">${FLOW_COUNTERS["exception_pass"]}</div>
                        <div class="label">Passed</div>
                    </div>
                    <div class="stat fail">
                        <div class="value">${FLOW_COUNTERS["exception_fail"]}</div>
                        <div class="label">Failed</div>
                    </div>
                </div>
            </div>
            
            <div class="flow-card integration">
                <h3>Integration Testing</h3>
                <div class="flow-stats">
                    <div class="stat total">
                        <div class="value">${FLOW_COUNTERS["integration_total"]}</div>
                        <div class="label">Total</div>
                    </div>
                    <div class="stat pass">
                        <div class="value">${FLOW_COUNTERS["integration_pass"]}</div>
                        <div class="label">Passed</div>
                    </div>
                    <div class="stat fail">
                        <div class="value">${FLOW_COUNTERS["integration_fail"]}</div>
                        <div class="label">Failed</div>
                    </div>
                </div>
            </div>
        </div>

        <div class="test-results">
            <h2>Detailed Test Results</h2>
            <table>
                <thead>
                    <tr>
                        <th>Test Name</th>
                        <th>Status</th>
                        <th>Duration (ms)</th>
                        <th>Flow Type</th>
                    </tr>
                </thead>
                <tbody>
EOF

    # Add test results to table
    for test_name in "${!TEST_RESULTS[@]}"; do
        local status="${TEST_RESULTS[$test_name]}"
        local duration="${TEST_TIMES[$test_name]:-0}"
        local status_class=$(echo "$status" | tr '[:upper:]' '[:lower:]')
        local flow_type="normal"
        
        # Determine flow type from test name
        case "$test_name" in
            *alternative*) flow_type="alternative" ;;
            *error*) flow_type="error" ;;
            *exception*) flow_type="exception" ;;
            *integration*) flow_type="integration" ;;
        esac
        
        echo "<tr>" >> "${REPORT_FILE}"
        echo "<td>${test_name}</td>" >> "${REPORT_FILE}"
        echo "<td><span class='status ${status_class}'>${status}</span></td>" >> "${REPORT_FILE}"
        echo "<td class='time'>${duration}ms</td>" >> "${REPORT_FILE}"
        echo "<td>${flow_type}</td>" >> "${REPORT_FILE}"
        echo "</tr>" >> "${REPORT_FILE}"
    done

    cat >> "${REPORT_FILE}" << EOF
                </tbody>
            </table>
        </div>

        <div class="footer">
            <p>© 2025 Angular Todo Application - Comprehensive API Test Suite</p>
            <p>Report generated automatically by the comprehensive testing system</p>
        </div>
    </div>
</body>
</html>
EOF
    
    log_success "Comprehensive HTML report generated: ${REPORT_FILE}"
    
    # Generate JSON Report
    cat > "${JSON_REPORT}" << EOF
{
    "timestamp": "$(date -Iseconds)",
    "duration_seconds": ${total_time},
    "summary": {
        "total_tests": ${total_tests},
        "total_passed": ${total_passed},
        "total_failed": ${total_failed},
        "pass_rate": ${pass_rate},
        "flows": {
            "normal": {
                "total": ${FLOW_COUNTERS["normal_total"]},
                "passed": ${FLOW_COUNTERS["normal_pass"]},
                "failed": ${FLOW_COUNTERS["normal_fail"]}
            },
            "alternative": {
                "total": ${FLOW_COUNTERS["alternative_total"]},
                "passed": ${FLOW_COUNTERS["alternative_pass"]},
                "failed": ${FLOW_COUNTERS["alternative_fail"]}
            },
            "error": {
                "total": ${FLOW_COUNTERS["error_total"]},
                "passed": ${FLOW_COUNTERS["error_pass"]},
                "failed": ${FLOW_COUNTERS["error_fail"]}
            },
            "exception": {
                "total": ${FLOW_COUNTERS["exception_total"]},
                "passed": ${FLOW_COUNTERS["exception_pass"]},
                "failed": ${FLOW_COUNTERS["exception_fail"]}
            },
            "integration": {
                "total": ${FLOW_COUNTERS["integration_total"]},
                "passed": ${FLOW_COUNTERS["integration_pass"]},
                "failed": ${FLOW_COUNTERS["integration_fail"]}
            }
        }
    },
    "tests": [
EOF

    local first=true
    for test_name in "${!TEST_RESULTS[@]}"; do
        if [ "$first" = false ]; then
            echo "," >> "${JSON_REPORT}"
        fi
        first=false
        
        local flow_type="normal"
        case "$test_name" in
            *alternative*) flow_type="alternative" ;;
            *error*) flow_type="error" ;;
            *exception*) flow_type="exception" ;;
            *integration*) flow_type="integration" ;;
        esac
        
        cat >> "${JSON_REPORT}" << EOF
        {
            "name": "${test_name}",
            "status": "${TEST_RESULTS[$test_name]}",
            "duration_ms": ${TEST_TIMES[$test_name]:-0},
            "flow_type": "${flow_type}"
        }
EOF
    done

    cat >> "${JSON_REPORT}" << EOF
    ]
}
EOF
    
    log_success "Comprehensive JSON report generated: ${JSON_REPORT}"
}

################################################################################
# Main Execution
################################################################################

main() {
    # Create report directory
    mkdir -p "${REPORT_DIR}"
    
    log "${BOLD}${PURPLE}"
    log "╔══════════════════════════════════════════════════════════════════════════════╗"
    log "║                   COMPREHENSIVE API TESTING FRAMEWORK                        ║"
    log "║                                                                              ║"
    log "║  Testing Flows: Normal | Alternative | Error | Exception | Integration      ║"
    log "╚══════════════════════════════════════════════════════════════════════════════╝${NC}"
    
    # Check API availability with timeout
    log_info "Checking API availability..."
    if timeout 5 curl -s "${BASE_URL}/health" > /dev/null 2>&1; then
        log_success "API is accessible at ${BASE_URL}"
    else
        log_error "API is not accessible at ${BASE_URL}"
        log_info "Please ensure the backend server is running"
        exit 1
    fi
    
    # Run all test suites
    test_auth_flows
    test_user_flows
    test_list_flows
    test_todo_flows
    test_integration_flows
    test_security_performance
    
    # Generate comprehensive report
    log_flow_header "GENERATING COMPREHENSIVE REPORTS"
    generate_comprehensive_report
    
    # Summary
    local total_tests=$((
        FLOW_COUNTERS["normal_total"] + 
        FLOW_COUNTERS["alternative_total"] + 
        FLOW_COUNTERS["error_total"] + 
        FLOW_COUNTERS["exception_total"] + 
        FLOW_COUNTERS["integration_total"]
    ))
    
    local total_passed=$((
        FLOW_COUNTERS["normal_pass"] + 
        FLOW_COUNTERS["alternative_pass"] + 
        FLOW_COUNTERS["error_pass"] + 
        FLOW_COUNTERS["exception_pass"] + 
        FLOW_COUNTERS["integration_pass"]
    ))
    
    local total_failed=$((
        FLOW_COUNTERS["normal_fail"] + 
        FLOW_COUNTERS["alternative_fail"] + 
        FLOW_COUNTERS["error_fail"] + 
        FLOW_COUNTERS["exception_fail"] + 
        FLOW_COUNTERS["integration_fail"]
    ))
    
    log_flow_header "COMPREHENSIVE TEST EXECUTION SUMMARY"
    log "${BOLD}═══════════════════════════════════════════════════════════════════════════════${NC}"
    log "${BOLD}Total Tests: ${total_tests}${NC}"
    log "${GREEN}✓ Passed: ${total_passed}${NC}"
    log "${RED}✗ Failed: ${total_failed}${NC}"
    log "${BOLD}Pass Rate: $((total_passed * 100 / total_tests))%${NC}"
    log "Total Time: $(($(date +%s) - START_TIME)) seconds"
    log ""
    log "${BOLD}Flow Breakdown:${NC}"
    log "  ${GREEN}Normal Flow:     ${FLOW_COUNTERS["normal_pass"]}/${FLOW_COUNTERS["normal_total"]}${NC}"
    log "  ${BLUE}Alternative Flow: ${FLOW_COUNTERS["alternative_pass"]}/${FLOW_COUNTERS["alternative_total"]}${NC}"
    log "  ${YELLOW}Error Flow:      ${FLOW_COUNTERS["error_pass"]}/${FLOW_COUNTERS["error_total"]}${NC}"
    log "  ${RED}Exception Flow:  ${FLOW_COUNTERS["exception_pass"]}/${FLOW_COUNTERS["exception_total"]}${NC}"
    log "  ${PURPLE}Integration:     ${FLOW_COUNTERS["integration_pass"]}/${FLOW_COUNTERS["integration_total"]}${NC}"
    log "${BOLD}═══════════════════════════════════════════════════════════════════════════════${NC}"
    
    # Open report in browser if available
    if command -v xdg-open > /dev/null; then
        xdg-open "${REPORT_FILE}" 2>/dev/null &
    elif command -v open > /dev/null; then
        open "${REPORT_FILE}" 2>/dev/null &
    fi
    
    # Exit with appropriate code
    if [ ${total_failed} -gt 0 ]; then
        exit 1
    else
        exit 0
    fi
}

# Run main function
main "$@"