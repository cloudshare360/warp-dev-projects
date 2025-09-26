#!/bin/bash

# RPi5 Master Optimization Script
# Comprehensive optimization with safety checks and validation

set -e

SCRIPT_DIR="/home/sri/rpi5-optimization-backup"
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

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

confirm_action() {
    local message="$1"
    echo -e "${YELLOW}$message${NC}"
    read -p "Continue? (yes/no): " response
    if [[ "$response" != "yes" ]]; then
        echo "Operation cancelled."
        exit 0
    fi
}

check_prerequisites() {
    print_header "Checking Prerequisites"
    
    # Check if running as non-root user with sudo access
    if [[ $EUID -eq 0 ]]; then
        print_error "Please run this script as a regular user (not root)"
        exit 1
    fi
    
    if ! sudo -n true 2>/dev/null; then
        print_status "Testing sudo access..."
        sudo true
    fi
    
    # Check available disk space (need at least 5GB for new swap)
    local available_space=$(df / | awk 'NR==2 {print $4}')
    local required_space=$((5 * 1024 * 1024))  # 5GB in KB
    
    if [[ $available_space -lt $required_space ]]; then
        print_error "Insufficient disk space. Need at least 5GB free for swap expansion."
        echo "Available: $(df -h / | awk 'NR==2 {print $4}')"
        exit 1
    fi
    
    # Check if stress testing tools are available
    for tool in stress-ng htop vcgencmd; do
        if ! command -v "$tool" >/dev/null 2>&1; then
            print_warning "$tool not found, some tests may be limited"
        fi
    done
    
    print_success "Prerequisites check completed"
}

display_current_status() {
    print_header "Current System Status"
    
    echo "Memory and Swap:"
    free -h | grep -E "(Mem|Swap):"
    echo ""
    echo "CPU Governor: $(cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_governor 2>/dev/null || echo 'N/A')"
    echo "Temperature: $(vcgencmd measure_temp 2>/dev/null || echo 'N/A')"
    echo "Load Average: $(cat /proc/loadavg | cut -d' ' -f1-3)"
    echo "Swappiness: $(cat /proc/sys/vm/swappiness)"
}

display_planned_changes() {
    print_header "Planned Optimizations"
    
    echo "📊 MEMORY & SWAP:"
    echo "   • Swap size: 512MB → 4GB (8x increase)"
    echo "   • Swappiness: 60 → 10 (prefer RAM over swap)"
    echo "   • Cache pressure: 100 → 50 (keep more cache)"
    echo ""
    echo "🚀 CPU & PERFORMANCE:"
    echo "   • CPU Governor: ondemand → performance"
    echo "   • ARM frequency: maximum (2.8GHz)"
    echo "   • Voltage optimization for stability"
    echo ""
    echo "🎯 SYSTEM TUNING:"
    echo "   • GPU memory: reduced to 8MB (more system RAM)"
    echo "   • Network buffers: optimized for browsers"
    echo "   • File descriptor limits: increased"
    echo "   • Memory overcommit: optimized"
    echo ""
    echo "🛡️ SAFETY FEATURES:"
    echo "   • Complete system backup created"
    echo "   • Boot-time rollback capability"
    echo "   • Stress testing before/after changes"
    echo "   • Incremental application with validation"
}

run_pre_optimization_tests() {
    print_header "Pre-Optimization Testing"
    
    confirm_action "Run baseline stress tests? This will take about 5 minutes."
    
    print_status "Running baseline stress tests..."
    if "$SCRIPT_DIR/stress_test_suite.sh" quick 2>&1 | tee "$SCRIPT_DIR/pre_optimization_test.log"; then
        print_success "Baseline tests completed successfully"
    else
        print_error "Baseline tests failed. System may be unstable."
        confirm_action "System stability concerns detected. Continue anyway?"
    fi
}

apply_optimizations() {
    print_header "Applying Optimizations"
    
    print_status "Applying optimization configuration..."
    if "$SCRIPT_DIR/optimized_config.sh" 2>&1 | tee "$SCRIPT_DIR/optimization_apply.log"; then
        print_success "Optimizations applied successfully"
    else
        print_error "Failed to apply optimizations"
        exit 1
    fi
    
    # Apply sysctl changes immediately
    print_status "Reloading system parameters..."
    sudo sysctl -p
    
    # Restart swap with new configuration
    print_status "Restarting swap service..."
    sudo systemctl restart dphys-swapfile
    
    # Set CPU governor immediately
    print_status "Setting CPU governor to performance..."
    for cpu in /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor; do
        [[ -w "$cpu" ]] && echo "performance" | sudo tee "$cpu" > /dev/null
    done
    
    print_success "All optimizations applied and activated"
}

validate_changes() {
    print_header "Validating Changes"
    
    # Wait a moment for changes to take effect
    sleep 5
    
    echo "Checking applied changes:"
    
    # Check swap size
    local new_swap=$(free -m | awk '/Swap:/ {print $2}')
    if [[ $new_swap -gt 3000 ]]; then
        print_success "Swap size increased to ${new_swap}MB"
    else
        print_warning "Swap size is ${new_swap}MB (expected >3000MB)"
    fi
    
    # Check swappiness
    local swappiness=$(cat /proc/sys/vm/swappiness)
    if [[ $swappiness -eq 10 ]]; then
        print_success "Swappiness set to $swappiness"
    else
        print_warning "Swappiness is $swappiness (expected 10)"
    fi
    
    # Check CPU governor
    local governor=$(cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_governor)
    if [[ "$governor" == "performance" ]]; then
        print_success "CPU governor set to $governor"
    else
        print_warning "CPU governor is $governor (expected performance)"
    fi
    
    # Check temperature
    local temp=$(vcgencmd measure_temp 2>/dev/null | cut -d= -f2 | cut -d\' -f1 || echo "N/A")
    if [[ "$temp" != "N/A" && $(echo "$temp < 65" | bc -l 2>/dev/null || echo 1) -eq 1 ]]; then
        print_success "Temperature is ${temp}°C (good)"
    elif [[ "$temp" != "N/A" ]]; then
        print_warning "Temperature is ${temp}°C (monitor for stability)"
    fi
}

run_post_optimization_tests() {
    print_header "Post-Optimization Testing"
    
    confirm_action "Run validation stress tests? This will take about 5 minutes."
    
    print_status "Running post-optimization stress tests..."
    if "$SCRIPT_DIR/stress_test_suite.sh" quick 2>&1 | tee "$SCRIPT_DIR/post_optimization_test.log"; then
        print_success "Post-optimization tests passed!"
    else
        print_error "Post-optimization tests failed!"
        print_warning "Consider running rollback: sudo rpi5-request-rollback"
        return 1
    fi
}

display_completion_summary() {
    print_header "Optimization Complete!"
    
    # Create post-optimization configuration snapshot
    print_status "Creating post-optimization configuration snapshot..."
    "$SCRIPT_DIR/config_manager.sh" create "optimized-config-sept-23-2025" "Post-optimization configuration with enhanced performance settings" || true
    
    echo "🎉 RPi5 8GB optimization completed successfully!"
    echo ""
    echo "📈 Performance Improvements:"
    echo "   • 8x larger swap space (4GB vs 512MB)"
    echo "   • Reduced swap usage with vm.swappiness=10"
    echo "   • Maximum CPU performance mode"
    echo "   • Optimized memory management"
    echo "   • Enhanced browser compatibility"
    echo ""
    echo "📋 System Status:"
    free -h | grep -E "(Mem|Swap):"
    echo "   CPU Governor: $(cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_governor)"
    echo "   Temperature: $(vcgencmd measure_temp 2>/dev/null || echo 'N/A')"
    echo ""
    
    # Generate quick comparison table
    print_header "Configuration Comparison Summary"
    if "$SCRIPT_DIR/optimization_reporter.sh" compare "health-configuration-sept-23-2025" "optimized-config-sept-23-2025" 2>/dev/null; then
        echo ""
        print_info "Detailed report available: ./optimization_reporter.sh report health-configuration-sept-23-2025 optimized-config-sept-23-2025"
    else
        print_info "Comparison table will be available after creating optimized configuration snapshot"
    fi
    
    echo ""
    echo "🛡️ Safety & Rollback:"
    echo "   • Backup location: $SCRIPT_DIR/"
    echo "   • Rollback command: sudo rpi5-request-rollback"
    echo "   • Configuration restore: ./config_manager.sh restore health-configuration-sept-23-2025"
    echo "   • Documentation: $SCRIPT_DIR/ROLLBACK_INSTRUCTIONS.txt"
    echo ""
    echo "📊 Available Reports:"
    echo "   • Configuration snapshots: ./config_manager.sh list"
    echo "   • Comparison table: ./optimization_reporter.sh compare health-configuration-sept-23-2025 optimized-config-sept-23-2025"
    echo "   • Full report: ./optimization_reporter.sh report health-configuration-sept-23-2025 optimized-config-sept-23-2025"
    echo ""
    echo "⚠️  IMPORTANT:"
    echo "   • Monitor system stability over the next few days"
    echo "   • Watch temperatures during heavy loads"
    echo "   • Keep rollback instructions accessible"
    echo ""
    echo "🔄 To reboot and test:"
    echo "   sudo reboot"
    echo ""
    print_success "Optimization process completed!"
}

main() {
    print_header "RPi5 8GB Performance Optimization Suite"
    echo "This script will optimize your Raspberry Pi 5 for heavy browser usage"
    echo "and multitasking with proper safety measures and rollback capability."
    echo ""
    
    check_prerequisites
    display_current_status
    display_planned_changes
    
    echo ""
    confirm_action "Proceed with the complete optimization process?"
    
    # Phase 1: Pre-testing
    run_pre_optimization_tests
    
    # Phase 2: Apply optimizations
    apply_optimizations
    
    # Phase 3: Validate changes
    validate_changes
    
    # Phase 4: Post-testing
    if run_post_optimization_tests; then
        display_completion_summary
    else
        print_error "Optimization validation failed. Review logs and consider rollback."
        exit 1
    fi
}

# Handle script arguments
case "${1:-}" in
    "status")
        display_current_status
        exit 0
        ;;
    "test-only")
        run_pre_optimization_tests
        exit 0
        ;;
    "apply-only")
        apply_optimizations
        validate_changes
        exit 0
        ;;
    "help"|"-h"|"--help")
        echo "Usage: $0 [option]"
        echo ""
        echo "Options:"
        echo "  status      - Show current system status only"
        echo "  test-only   - Run stress tests without applying changes"
        echo "  apply-only  - Apply optimizations without testing"
        echo "  help        - Show this help message"
        echo ""
        echo "Run without arguments for full optimization process"
        exit 0
        ;;
    "")
        main
        ;;
    *)
        echo "Unknown option: $1"
        echo "Run '$0 help' for usage information"
        exit 1
        ;;
esac