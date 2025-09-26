#!/bin/bash

# Auto-Healing System for 2800MHz Boot Test
# This script provides automatic recovery if 2800MHz fails

set -e

SCRIPT_DIR="/home/sri/rpi5-optimization-backup"
HEAL_LOG_FILE="$SCRIPT_DIR/auto_heal.log"
BOOT_TEST_FLAG="$SCRIPT_DIR/.boot_test_2800mhz"
HEALTHY_CONFIG="2700mhz-validated"
TARGET_CONFIG="2800MHz (+12 voltage)"

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

log_heal() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] HEAL: $1" >> "$HEAL_LOG_FILE"
}

# Check if this is a recovery boot
check_recovery_needed() {
    if [[ -f "$BOOT_TEST_FLAG" ]]; then
        local boot_time=$(cat "$BOOT_TEST_FLAG")
        local current_time=$(date +%s)
        local elapsed=$((current_time - boot_time))
        
        log_heal "Boot test flag found. Elapsed time: ${elapsed}s"
        
        # If more than 10 minutes have passed, assume successful boot
        if [[ $elapsed -gt 600 ]]; then
            print_success "2800MHz boot successful after ${elapsed}s"
            rm "$BOOT_TEST_FLAG"
            log_heal "2800MHz boot validated successful - removing test flag"
            return 1  # No recovery needed
        else
            print_status "Boot test in progress. Elapsed: ${elapsed}s"
            return 1  # Still testing
        fi
    else
        return 1  # No recovery needed
    fi
}

# Verify current system status
verify_system() {
    local freq=$(vcgencmd measure_clock arm | cut -d'=' -f2 | awk '{print int($1/1000000)}')
    local temp=$(vcgencmd measure_temp | cut -d'=' -f2 | cut -d"'" -f1)
    local throttled=$(vcgencmd get_throttled)
    
    print_status "System check: ${freq}MHz at ${temp}°C (throttling: $throttled)"
    log_heal "System status: ${freq}MHz at ${temp}°C, throttling: $throttled"
    
    # Check if we're running the target frequency
    if [[ $freq -eq 2800 ]]; then
        print_success "2800MHz is running successfully!"
        
        # Check for throttling
        if [[ "$throttled" == "throttled=0x0" ]]; then
            print_success "No throttling detected - 2800MHz is stable!"
            log_heal "2800MHz validated - no throttling, temp: ${temp}°C"
            return 0
        else
            print_error "Throttling detected at 2800MHz"
            log_heal "2800MHz unstable - throttling detected"
            return 1
        fi
    elif [[ $freq -eq 2700 ]]; then
        print_status "System recovered to 2700MHz (auto-healing worked)"
        log_heal "System already at safe 2700MHz frequency"
        return 0
    else
        print_error "Unexpected frequency: ${freq}MHz"
        log_heal "Unexpected frequency detected: ${freq}MHz"
        return 1
    fi
}

# Perform automatic recovery
perform_recovery() {
    print_header "Auto-Healing: Restoring to Safe 2700MHz"
    log_heal "Starting auto-recovery to $HEALTHY_CONFIG"
    
    cd "$SCRIPT_DIR"
    
    if ./config_manager.sh restore "$HEALTHY_CONFIG"; then
        print_success "Successfully restored to validated 2700MHz configuration"
        log_heal "Auto-recovery successful - restored to $HEALTHY_CONFIG"
        
        # Remove boot test flag
        rm -f "$BOOT_TEST_FLAG"
        
        print_status "System will reboot to safe 2700MHz configuration..."
        log_heal "Initiating reboot to safe configuration"
        
        sleep 3
        sudo reboot
    else
        print_error "Failed to restore configuration!"
        log_heal "CRITICAL: Auto-recovery failed!"
        return 1
    fi
}

# Set up boot test for 2800MHz
setup_boot_test() {
    print_header "Setting up 2800MHz Boot Test with Auto-Healing"
    
    # Create boot test flag with current timestamp
    echo "$(date +%s)" > "$BOOT_TEST_FLAG"
    log_heal "Boot test flag created for 2800MHz test"
    
    # Create systemd service for auto-healing (if not exists)
    create_healing_service
    
    print_success "Auto-healing system ready"
    print_status "If 2800MHz fails, system will auto-restore to 2700MHz"
}

# Create systemd auto-healing service
create_healing_service() {
    local service_file="/etc/systemd/system/pi-auto-heal.service"
    
    if [[ ! -f "$service_file" ]]; then
        print_status "Creating auto-healing service..."
        
        sudo tee "$service_file" > /dev/null << EOF
[Unit]
Description=RPi5 Auto-Healing Service
After=network.target
StartLimitBurst=3
StartLimitIntervalSec=60

[Service]
Type=oneshot
User=root
ExecStart=$SCRIPT_DIR/auto_heal_2800mhz.sh check
RemainAfterExit=yes
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF
        
        sudo systemctl daemon-reload
        sudo systemctl enable pi-auto-heal.service
        log_heal "Auto-healing service created and enabled"
        print_success "Auto-healing service installed"
    else
        print_status "Auto-healing service already exists"
    fi
}

# Check system on boot
check_system() {
    print_header "Auto-Healing Boot Check"
    log_heal "Boot check initiated"
    
    # Wait a bit for system to stabilize
    sleep 10
    
    if verify_system; then
        print_success "System check passed"
        
        # If we have a boot test flag, validate the test
        if [[ -f "$BOOT_TEST_FLAG" ]]; then
            local freq=$(vcgencmd measure_clock arm | cut -d'=' -f2 | awk '{print int($1/1000000)}')
            if [[ $freq -eq 2800 ]]; then
                print_success "2800MHz boot test successful!"
                rm "$BOOT_TEST_FLAG"
                log_heal "2800MHz boot validated and confirmed stable"
                
                # Update status
                echo "[$(date '+%Y-%m-%d %H:%M:%S')] SUCCESS: 2800MHz auto-validated on boot - no issues detected" >> "$SCRIPT_DIR/advanced_overclocking.log"
            fi
        fi
        
        return 0
    else
        print_error "System check failed - initiating recovery"
        perform_recovery
        return 1
    fi
}

# Manual recovery trigger
manual_recovery() {
    print_header "Manual Recovery to Safe 2700MHz"
    
    print_status "This will restore your system to the validated 2700MHz configuration"
    read -p "Continue with recovery? (yes/no): " confirm
    
    if [[ "$confirm" == "yes" ]]; then
        perform_recovery
    else
        print_status "Recovery cancelled"
    fi
}

# Show current healing status
show_status() {
    print_header "Auto-Healing Status"
    
    local freq=$(vcgencmd measure_clock arm | cut -d'=' -f2 | awk '{print int($1/1000000)}')
    local temp=$(vcgencmd measure_temp | cut -d'=' -f2 | cut -d"'" -f1)
    
    echo "Current frequency: ${freq}MHz"
    echo "Current temperature: ${temp}°C"
    
    if [[ -f "$BOOT_TEST_FLAG" ]]; then
        local boot_time=$(cat "$BOOT_TEST_FLAG")
        local current_time=$(date +%s)
        local elapsed=$((current_time - boot_time))
        echo "Boot test active: ${elapsed}s elapsed"
    else
        echo "No active boot test"
    fi
    
    echo "Healthy restore point: $HEALTHY_CONFIG"
    
    if systemctl is-enabled pi-auto-heal.service &>/dev/null; then
        echo "Auto-healing service: ENABLED"
    else
        echo "Auto-healing service: DISABLED"
    fi
    
    if [[ -f "$HEAL_LOG_FILE" ]]; then
        echo ""
        echo "Recent healing activity:"
        tail -5 "$HEAL_LOG_FILE"
    fi
}

# Main execution
case "${1:-}" in
    "setup")
        setup_boot_test
        ;;
    "check")
        check_system
        ;;
    "recover")
        manual_recovery
        ;;
    "status")
        show_status
        ;;
    "help"|"-h"|"--help"|"")
        echo "RPi5 Auto-Healing System for 2800MHz Test"
        echo ""
        echo "Usage: $0 <command>"
        echo ""
        echo "Commands:"
        echo "  setup    - Set up auto-healing for 2800MHz test"
        echo "  check    - Check system and heal if needed (auto-run on boot)"
        echo "  recover  - Manually recover to safe 2700MHz"
        echo "  status   - Show current healing system status"
        echo "  help     - Show this help message"
        echo ""
        echo "The auto-healing system will:"
        echo "- Monitor 2800MHz boot attempts"
        echo "- Automatically restore to 2700MHz if issues detected"
        echo "- Validate successful boots and remove test flags"
        echo "- Provide manual recovery options"
        ;;
    *)
        echo "Unknown command: $1"
        echo "Run '$0 help' for usage information"
        exit 1
        ;;
esac