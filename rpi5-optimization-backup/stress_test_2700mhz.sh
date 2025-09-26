#!/bin/bash

# Comprehensive Stress Test for 2700MHz Configuration
# Tests CPU, memory, I/O, and thermal stability

set -e

LOG_FILE="/home/sri/rpi5-optimization-backup/stress_test_results.log"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
    echo -e "\n${BLUE}=== $1 ===${NC}"
}

print_status() {
    echo -e "${YELLOW}$1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Log test results
log_test() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# Get system status
get_system_status() {
    local freq=$(vcgencmd measure_clock arm | cut -d'=' -f2 | awk '{print int($1/1000000)}')
    local temp=$(vcgencmd measure_temp | cut -d'=' -f2 | cut -d"'" -f1)
    local volt=$(vcgencmd measure_volts core | cut -d'=' -f2)
    local throttled=$(vcgencmd get_throttled)
    
    echo "CPU: ${freq}MHz | Temp: ${temp}°C | Voltage: $volt | Throttling: $throttled"
}

# Test 1: CPU intensive computation
test_cpu_intensive() {
    print_header "Test 1: CPU Intensive Computation (5 minutes)"
    
    local start_temp=$(vcgencmd measure_temp | cut -d'=' -f2 | cut -d"'" -f1)
    print_status "Starting temperature: ${start_temp}°C"
    log_test "CPU_TEST_START: Temperature ${start_temp}°C"
    
    # Run CPU stress test for 5 minutes
    print_status "Running CPU stress test (all cores, 5 minutes)..."
    timeout 300 stress-ng --cpu $(nproc) --timeout 300s --metrics-brief &
    local stress_pid=$!
    
    # Monitor during test
    for i in {1..10}; do
        sleep 30
        local current_temp=$(vcgencmd measure_temp | cut -d'=' -f2 | cut -d"'" -f1)
        local current_freq=$(vcgencmd measure_clock arm | cut -d'=' -f2 | awk '{print int($1/1000000)}')
        local throttled=$(vcgencmd get_throttled)
        
        print_status "Progress ${i}/10: ${current_freq}MHz at ${current_temp}°C (throttling: $throttled)"
        log_test "CPU_TEST_PROGRESS_${i}: ${current_freq}MHz at ${current_temp}°C, throttling: $throttled"
        
        # Check for throttling
        if [[ "$throttled" != "throttled=0x0" ]]; then
            print_error "Throttling detected during CPU test!"
            kill $stress_pid 2>/dev/null || true
            return 1
        fi
        
        # Check for overheating
        if (( $(echo "$current_temp > 75" | bc -l) )); then
            print_error "Temperature too high: ${current_temp}°C"
            kill $stress_pid 2>/dev/null || true
            return 1
        fi
    done
    
    wait $stress_pid
    local end_temp=$(vcgencmd measure_temp | cut -d'=' -f2 | cut -d"'" -f1)
    print_success "CPU test completed. Final temperature: ${end_temp}°C"
    log_test "CPU_TEST_END: Temperature ${end_temp}°C - PASSED"
    
    return 0
}

# Test 2: Memory stress test
test_memory() {
    print_header "Test 2: Memory Stress Test (3 minutes)"
    
    print_status "Running memory stress test..."
    log_test "MEMORY_TEST_START"
    
    # Test memory with stress-ng
    timeout 180 stress-ng --vm 4 --vm-bytes 1G --timeout 180s --metrics-brief &
    local stress_pid=$!
    
    # Monitor during test
    for i in {1..6}; do
        sleep 30
        local status=$(get_system_status)
        print_status "Memory test progress ${i}/6: $status"
        log_test "MEMORY_TEST_PROGRESS_${i}: $status"
        
        # Check throttling
        local throttled=$(vcgencmd get_throttled)
        if [[ "$throttled" != "throttled=0x0" ]]; then
            print_error "Throttling detected during memory test!"
            kill $stress_pid 2>/dev/null || true
            return 1
        fi
    done
    
    wait $stress_pid
    print_success "Memory test completed successfully"
    log_test "MEMORY_TEST_END: PASSED"
    
    return 0
}

# Test 3: Mixed workload
test_mixed_workload() {
    print_header "Test 3: Mixed CPU+Memory+I/O Test (3 minutes)"
    
    print_status "Running mixed workload test..."
    log_test "MIXED_TEST_START"
    
    # Mixed stress test
    timeout 180 stress-ng --cpu 2 --vm 2 --vm-bytes 512M --io 1 --timeout 180s --metrics-brief &
    local stress_pid=$!
    
    # Monitor during test
    for i in {1..6}; do
        sleep 30
        local status=$(get_system_status)
        print_status "Mixed test progress ${i}/6: $status"
        log_test "MIXED_TEST_PROGRESS_${i}: $status"
        
        # Check throttling
        local throttled=$(vcgencmd get_throttled)
        if [[ "$throttled" != "throttled=0x0" ]]; then
            print_error "Throttling detected during mixed test!"
            kill $stress_pid 2>/dev/null || true
            return 1
        fi
    done
    
    wait $stress_pid
    print_success "Mixed workload test completed successfully"
    log_test "MIXED_TEST_END: PASSED"
    
    return 0
}

# Test 4: System responsiveness
test_responsiveness() {
    print_header "Test 4: System Responsiveness Test"
    
    print_status "Testing system responsiveness under load..."
    log_test "RESPONSIVENESS_TEST_START"
    
    # Start background load
    stress-ng --cpu 1 --timeout 60s &
    local stress_pid=$!
    
    # Test basic commands
    local start_time=$(date +%s.%N)
    ls -la /home/sri > /dev/null
    local end_time=$(date +%s.%N)
    local duration=$(echo "$end_time - $start_time" | bc)
    
    print_status "File listing took: ${duration} seconds"
    log_test "RESPONSIVENESS_TEST: File listing took ${duration}s"
    
    # Test process creation
    start_time=$(date +%s.%N)
    echo "test" > /tmp/stress_test_temp
    cat /tmp/stress_test_temp > /dev/null
    rm /tmp/stress_test_temp
    end_time=$(date +%s.%N)
    duration=$(echo "$end_time - $start_time" | bc)
    
    print_status "I/O operations took: ${duration} seconds"
    log_test "RESPONSIVENESS_TEST: I/O operations took ${duration}s"
    
    wait $stress_pid
    print_success "Responsiveness test completed"
    log_test "RESPONSIVENESS_TEST_END: PASSED"
    
    return 0
}

# Main stress test execution
main() {
    print_header "2700MHz Comprehensive Stress Test Suite"
    
    # Check initial status
    local initial_status=$(get_system_status)
    print_status "Initial status: $initial_status"
    log_test "STRESS_TEST_SUITE_START: $initial_status"
    
    # Install stress-ng if not available
    if ! command -v stress-ng &> /dev/null; then
        print_status "Installing stress-ng..."
        sudo apt-get update -qq && sudo apt-get install -y stress-ng bc
    fi
    
    # Run all tests
    local tests_passed=0
    local total_tests=4
    
    if test_cpu_intensive; then
        ((tests_passed++))
    fi
    
    if test_memory; then
        ((tests_passed++))
    fi
    
    if test_mixed_workload; then
        ((tests_passed++))
    fi
    
    if test_responsiveness; then
        ((tests_passed++))
    fi
    
    # Final results
    print_header "Stress Test Results"
    local final_status=$(get_system_status)
    print_status "Final status: $final_status"
    
    if [ $tests_passed -eq $total_tests ]; then
        print_success "ALL TESTS PASSED! 2700MHz is rock solid stable!"
        log_test "STRESS_TEST_SUITE_END: ALL ${total_tests} TESTS PASSED - 2700MHz VALIDATED"
        return 0
    else
        print_error "Some tests failed: ${tests_passed}/${total_tests} passed"
        log_test "STRESS_TEST_SUITE_END: FAILED - Only ${tests_passed}/${total_tests} tests passed"
        return 1
    fi
}

# Run main function
main "$@"