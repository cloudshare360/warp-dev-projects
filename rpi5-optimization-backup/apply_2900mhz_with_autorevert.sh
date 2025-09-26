#!/bin/bash

# Apply 2900MHz Configuration with Auto-Revert Protection
# This script applies 2900MHz configuration with automatic fallback to 2800MHz on failure

set -e

BACKUP_DIR="/home/sri/rpi5-optimization-backup"
RESTORE_POINT=$(cat "$BACKUP_DIR/current_stable_restore_point.txt" 2>/dev/null || echo "")
RESTORE_POINT_PATH="$BACKUP_DIR/restore_points/$RESTORE_POINT"

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

# Verify restore point exists
verify_restore_point() {
    print_header "Verifying Auto-Revert Protection"
    
    if [[ -z "$RESTORE_POINT" ]]; then
        print_error "No restore point found! Cannot proceed safely."
        echo "Please create a restore point first using create_2800mhz_restore_point.sh"
        exit 1
    fi
    
    if [[ ! -d "$RESTORE_POINT_PATH" ]]; then
        print_error "Restore point directory not found: $RESTORE_POINT_PATH"
        exit 1
    fi
    
    if [[ ! -f "$RESTORE_POINT_PATH/auto_heal/restore_2800mhz.sh" ]]; then
        print_error "Auto-healing script not found in restore point!"
        exit 1
    fi
    
    print_success "Restore point verified: $RESTORE_POINT"
    print_success "Auto-revert protection: ACTIVE"
}

# Create 2900MHz configuration
create_2900mhz_config() {
    print_header "Creating 2900MHz Configuration"
    
    # Get current config location
    local config_file=""
    if [[ -f /boot/firmware/config.txt ]]; then
        config_file="/boot/firmware/config.txt"
    elif [[ -f /boot/config.txt ]]; then
        config_file="/boot/config.txt"
    else
        print_error "Could not find config.txt"
        exit 1
    fi
    
    print_status "Working with: $config_file"
    
    # Create backup of current config
    sudo cp "$config_file" "$BACKUP_DIR/config_backup_pre_2900mhz_$(date +%Y%m%d_%H%M%S).txt"
    
    # Read current config
    local current_config=$(sudo cat "$config_file")
    
    # Create new 2900MHz configuration
    local new_config=""
    
    # Remove existing overclocking settings
    new_config=$(echo "$current_config" | grep -v "^arm_freq=" | grep -v "^over_voltage=" | grep -v "^temp_limit=" | grep -v "^force_turbo=" | grep -v "^initial_turbo=")
    
    # Add 2900MHz settings with appropriate voltage boost
    cat << 'EOF' > /tmp/2900mhz_additions.txt

# === 2900MHz Overclock Configuration ===
# Applied by auto-revert 2900MHz script
# Timestamp: $(date)
# Fallback: Auto-revert to 2800MHz on boot failure

# Core overclocking settings
arm_freq=2900              # Target 2900MHz (45% overclock)
over_voltage=13            # Higher voltage for stability (+0.325V)
temp_limit=85              # Allow higher temperatures for 2900MHz
force_turbo=1              # Always run at max frequency
initial_turbo=0            # Disable turbo timeout

# Enhanced memory and GPU settings
gpu_freq=850               # Slightly higher GPU frequency
core_freq=850              # Higher core frequency
h264_freq=850              # Video processing boost
isp_freq=850               # Image processing boost

# Memory optimization
sdram_freq=3600            # Higher memory frequency
over_voltage_sdram=6       # Memory voltage boost

# Stability and monitoring
avoid_warnings=1           # Bypass voltage warnings
dtparam=watchdog=on        # Enable hardware watchdog

# === End 2900MHz Configuration ===
EOF

    # Apply timestamp
    sed "s/# Timestamp: \$(date)/# Timestamp: $(date)/" /tmp/2900mhz_additions.txt > /tmp/2900mhz_final.txt
    
    # Combine configuration
    {
        echo "$new_config"
        cat /tmp/2900mhz_final.txt
    } > /tmp/new_config.txt
    
    # Apply new configuration
    sudo cp /tmp/new_config.txt "$config_file"
    
    # Clean up temporary files
    rm -f /tmp/2900mhz_additions.txt /tmp/2900mhz_final.txt /tmp/new_config.txt
    
    print_success "2900MHz configuration applied"
    print_status "Settings: 2900MHz @ +13 over_voltage, temp_limit=85°C"
}

# Set up boot failure detection
setup_boot_monitoring() {
    print_header "Setting Up Boot Failure Detection"
    
    # Create boot test flag
    sudo touch /tmp/boot_test_2900mhz
    print_success "Boot test flag created"
    
    # Reset boot attempt counter
    echo "0" | sudo tee /tmp/boot_attempts_2900mhz > /dev/null
    print_success "Boot attempt counter reset"
    
    # Install boot monitor as a service
    local service_file="/etc/systemd/system/rpi5-boot-monitor.service"
    
    sudo tee "$service_file" > /dev/null << EOF
[Unit]
Description=RPi5 2900MHz Boot Monitor and Auto-Healing Service
After=multi-user.target
Wants=multi-user.target

[Service]
Type=oneshot
ExecStart=$RESTORE_POINT_PATH/auto_heal/boot_monitor.sh
RemainAfterExit=no
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF
    
    # Enable the service
    sudo systemctl daemon-reload
    sudo systemctl enable rpi5-boot-monitor.service
    
    print_success "Boot monitor service installed and enabled"
    print_status "Will automatically revert to 2800MHz after 3 failed boot attempts"
}

# Create manual revert script
create_manual_revert() {
    print_header "Creating Manual Revert Script"
    
    cat > "$BACKUP_DIR/revert_to_2800mhz.sh" << EOF
#!/bin/bash

# Manual revert script - immediately restore 2800MHz configuration
echo "Manually reverting to stable 2800MHz configuration..."

if [[ -f "$RESTORE_POINT_PATH/auto_heal/restore_2800mhz.sh" ]]; then
    $RESTORE_POINT_PATH/auto_heal/restore_2800mhz.sh
    echo "Manual revert completed. Reboot to apply 2800MHz configuration."
else
    echo "Error: Restore script not found!"
    exit 1
fi
EOF
    
    chmod +x "$BACKUP_DIR/revert_to_2800mhz.sh"
    
    print_success "Manual revert script created: $BACKUP_DIR/revert_to_2800mhz.sh"
}

# Show pre-reboot summary
show_summary() {
    print_header "2900MHz Configuration Summary"
    
    print_status "Configuration Applied:"
    echo "  • Frequency: 2900MHz (45% overclock from 2000MHz base)"
    echo "  • Voltage: +13 over_voltage (+0.325V)"
    echo "  • Temperature Limit: 85°C"
    echo "  • GPU Frequency: 850MHz"
    echo "  • Memory: 3600MHz with voltage boost"
    echo ""
    
    print_status "Safety Mechanisms Active:"
    echo "  • Auto-revert after 3 failed boot attempts"
    echo "  • Boot monitor service enabled"
    echo "  • Manual revert script available"
    echo "  • Hardware watchdog enabled"
    echo ""
    
    print_status "Restore Point:"
    echo "  • Location: $RESTORE_POINT_PATH"
    echo "  • Manual restore: $RESTORE_POINT_PATH/auto_heal/restore_2800mhz.sh"
    echo "  • Quick revert: $BACKUP_DIR/revert_to_2800mhz.sh"
    echo ""
    
    print_status "Next Steps:"
    echo "  1. System will reboot automatically in 10 seconds"
    echo "  2. If 2900MHz boots successfully, it will be validated"
    echo "  3. If boot fails 3 times, auto-revert to 2800MHz will activate"
    echo "  4. You can manually revert anytime using the revert script"
    echo ""
    
    print_success "Ready for 2900MHz boot test!"
}

# Automatic reboot with countdown
reboot_with_countdown() {
    print_header "Preparing for 2900MHz Boot Test"
    
    for i in {10..1}; do
        echo -e "${YELLOW}Rebooting in ${i} seconds... (Ctrl+C to cancel)${NC}"
        sleep 1
    done
    
    print_status "Rebooting now to test 2900MHz configuration..."
    print_status "Auto-revert protection is ACTIVE"
    
    # Log the attempt
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting 2900MHz boot test with auto-revert protection" >> "$BACKUP_DIR/2900mhz_attempt.log"
    
    sudo reboot
}

# Main execution
main() {
    print_header "2900MHz Configuration with Auto-Revert Protection"
    
    print_status "This script will:"
    echo "  • Apply 2900MHz overclock configuration"
    echo "  • Set up automatic boot failure detection"
    echo "  • Enable auto-revert to stable 2800MHz on failure"
    echo "  • Reboot to test the new configuration"
    echo ""
    
    verify_restore_point
    create_2900mhz_config
    setup_boot_monitoring
    create_manual_revert
    show_summary
    
    print_status "Press Ctrl+C in the next 10 seconds to cancel..."
    reboot_with_countdown
}

# Handle script interruption
trap 'print_error "2900MHz configuration cancelled by user"; exit 1' INT TERM

main "$@"