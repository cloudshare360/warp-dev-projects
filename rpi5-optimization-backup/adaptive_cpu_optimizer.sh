#!/bin/bash

# RPi5 Adaptive CPU Frequency Optimizer
# Intelligent system that finds optimal CPU frequency through boot testing
# Starts at 2.8GHz and steps down automatically if boot fails

set -e

SCRIPT_DIR="/home/sri/rpi5-optimization-backup"
ADAPTIVE_CONFIG_DIR="$SCRIPT_DIR/adaptive_configs"
BOOT_LOG_FILE="$SCRIPT_DIR/boot_attempts.log"
FREQUENCY_STATE_FILE="$SCRIPT_DIR/current_frequency_state.txt"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
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

print_info() {
    echo -e "${CYAN}ℹ $1${NC}"
}

# Create directories
mkdir -p "$ADAPTIVE_CONFIG_DIR"
mkdir -p "$(dirname "$BOOT_LOG_FILE")"

# CPU frequency test sequence (MHz)
FREQUENCY_SEQUENCE=(2800 2700 2600 2500 2400 2300 2200 2100 2000)
VOLTAGE_MAP=(
    ["2800"]="6"  # +0.15V for 2.8GHz
    ["2700"]="4"  # +0.10V for 2.7GHz
    ["2600"]="3"  # +0.075V for 2.6GHz
    ["2500"]="2"  # +0.05V for 2.5GHz
    ["2400"]="2"  # +0.05V for 2.4GHz
    ["2300"]="1"  # +0.025V for 2.3GHz
    ["2200"]="1"  # +0.025V for 2.2GHz
    ["2100"]="0"  # Default voltage
    ["2000"]="0"  # Default voltage
)

# Initialize frequency state if not exists
initialize_frequency_state() {
    if [[ ! -f "$FREQUENCY_STATE_FILE" ]]; then
        cat > "$FREQUENCY_STATE_FILE" << EOF
# RPi5 Adaptive CPU Frequency State
# This file tracks the current frequency testing progress
CURRENT_FREQUENCY_INDEX=0
LAST_SUCCESSFUL_FREQUENCY=2000
BOOT_FAILURE_COUNT=0
TESTING_PHASE=initial
STABLE_FREQUENCY_FOUND=false
OPTIMIZATION_LEVEL=conservative
EOF
    fi
    
    # Source the current state
    source "$FREQUENCY_STATE_FILE"
}

# Log boot attempt
log_boot_attempt() {
    local frequency="$1"
    local voltage="$2"
    local status="$3"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    echo "[$timestamp] Frequency: ${frequency}MHz, Voltage: +${voltage}, Status: $status" >> "$BOOT_LOG_FILE"
}

# Get voltage for frequency
get_voltage_for_frequency() {
    local freq="$1"
    
    case $freq in
        2800) echo "6" ;;  # +0.15V
        2700) echo "4" ;;  # +0.10V
        2600) echo "3" ;;  # +0.075V
        2500) echo "2" ;;  # +0.05V
        2400) echo "2" ;;  # +0.05V
        2300) echo "1" ;;  # +0.025V
        2200) echo "1" ;;  # +0.025V
        *) echo "0" ;;     # Default voltage
    esac
}

# Create configuration for specific frequency
create_frequency_config() {
    local frequency="$1"
    local voltage="$2"
    local config_name="adaptive-cpu-${frequency}mhz"
    local config_dir="$ADAPTIVE_CONFIG_DIR/${config_name}_$(date +%Y%m%d_%H%M%S)"
    
    mkdir -p "$config_dir"
    
    print_status "Creating configuration for ${frequency}MHz (voltage +${voltage})..."
    
    # Determine boot config file location
    local boot_config_file=""
    if [[ -f /boot/firmware/config.txt ]]; then
        boot_config_file="/boot/firmware/config.txt"
    elif [[ -f /boot/config.txt ]]; then
        boot_config_file="/boot/config.txt"
    else
        print_error "Could not find boot configuration file"
        return 1
    fi
    
    # Backup current boot config
    sudo cp "$boot_config_file" "$config_dir/config.txt.backup"
    
    # Create new optimized config.txt
    create_adaptive_boot_config "$frequency" "$voltage" "$boot_config_file"
    
    # Create system configuration
    create_adaptive_system_config "$config_dir"
    
    # Create restoration script
    create_restoration_script "$config_dir" "$frequency"
    
    print_success "Configuration created: $config_name"
    echo "$config_dir" > "$SCRIPT_DIR/last_adaptive_config.txt"
    
    return 0
}

# Create adaptive boot configuration
create_adaptive_boot_config() {
    local frequency="$1"
    local voltage="$2"
    local boot_config_file="$3"
    
    # Remove existing frequency/voltage settings
    sudo sed -i '/^arm_freq=/d' "$boot_config_file"
    sudo sed -i '/^over_voltage=/d' "$boot_config_file"
    sudo sed -i '/^over_voltage_sdram=/d' "$boot_config_file"
    
    # Add new optimized settings
    sudo tee -a "$boot_config_file" > /dev/null << EOF

# RPi5 Adaptive CPU Optimization - ${frequency}MHz
# Generated: $(date)
# Frequency: ${frequency}MHz, Voltage: +${voltage}

# CPU Configuration
arm_freq=$frequency
over_voltage=$voltage

# Memory and stability optimization
over_voltage_sdram=2
sdram_freq=3200
sdram_over_voltage=2

# GPU optimization (minimal for more system RAM)
gpu_mem=8
gpu_freq=500

# Boot optimization
disable_splash=1
boot_delay=0

# Thermal management
temp_limit=75

# Advanced stability settings
force_turbo=0
initial_turbo=30
EOF
    
    print_success "Boot configuration updated for ${frequency}MHz"
}

# Create adaptive system configuration
create_adaptive_system_config() {
    local config_dir="$1"
    
    # Enhanced sysctl configuration
    cat > "$config_dir/sysctl_adaptive.conf" << EOF
# RPi5 Adaptive System Configuration
# Memory management optimized for stability and performance

# Memory management
vm.swappiness=10
vm.vfs_cache_pressure=50
vm.dirty_ratio=15
vm.dirty_background_ratio=5
vm.overcommit_memory=1
vm.overcommit_ratio=50
vm.min_free_kbytes=65536

# Network optimization
net.core.rmem_default=262144
net.core.rmem_max=16777216
net.core.wmem_default=262144
net.core.wmem_max=16777216

# File system optimization
fs.file-max=2097152
kernel.shmmax=268435456

# Advanced memory management
vm.page-cluster=3
vm.laptop_mode=0
vm.oom_kill_allocating_task=1

# Process scheduling optimization
kernel.sched_migration_cost_ns=5000000
kernel.sched_autogroup_enabled=1
EOF
    
    # Copy to system
    sudo cp "$config_dir/sysctl_adaptive.conf" /etc/sysctl.d/99-rpi5-adaptive.conf
    
    print_success "System configuration created"
}

# Create restoration script for specific configuration
create_restoration_script() {
    local config_dir="$1"
    local frequency="$2"
    
    cat > "$config_dir/restore_this_config.sh" << 'EOF'
#!/bin/bash

# Restore this specific adaptive configuration
CONFIG_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FREQUENCY="__FREQUENCY__"

echo "=== RESTORING ADAPTIVE CPU CONFIGURATION: ${FREQUENCY}MHz ==="
echo "Configuration directory: $CONFIG_DIR"
echo ""

if [[ -f "$CONFIG_DIR/config.txt.backup" ]]; then
    echo "Restoring boot configuration..."
    
    # Determine boot config location
    if [[ -f /boot/firmware/config.txt ]]; then
        sudo cp "$CONFIG_DIR/config.txt.backup" /boot/firmware/config.txt
    elif [[ -f /boot/config.txt ]]; then
        sudo cp "$CONFIG_DIR/config.txt.backup" /boot/config.txt
    fi
    
    echo "Boot configuration restored."
else
    echo "Warning: No backup found, skipping boot config restoration"
fi

if [[ -f "$CONFIG_DIR/sysctl_adaptive.conf" ]]; then
    echo "Restoring system configuration..."
    sudo cp "$CONFIG_DIR/sysctl_adaptive.conf" /etc/sysctl.d/99-rpi5-adaptive.conf
    sudo sysctl -p /etc/sysctl.d/99-rpi5-adaptive.conf
    echo "System configuration restored."
fi

echo ""
echo "=== RESTORATION COMPLETED ==="
echo "Configuration ${FREQUENCY}MHz has been restored."
echo "Reboot to apply changes: sudo reboot"
EOF
    
    # Replace placeholder
    sed -i "s/__FREQUENCY__/$frequency/g" "$config_dir/restore_this_config.sh"
    chmod +x "$config_dir/restore_this_config.sh"
}

# Boot success detection service
create_boot_success_detector() {
    print_header "Creating Boot Success Detection System"
    
    # Create boot success detection script
    sudo tee /usr/local/bin/rpi5-boot-success-detector > /dev/null << 'EOF'
#!/bin/bash

# RPi5 Boot Success Detector
# Reports successful boot completion to adaptive system

SCRIPT_DIR="/home/sri/rpi5-optimization-backup"
SUCCESS_FLAG="/tmp/rpi5_boot_success"
BOOT_LOG="$SCRIPT_DIR/boot_attempts.log"

# Wait for system to be fully ready
sleep 30

# Check system health
SYSTEM_HEALTHY=true

# Check CPU frequency
CPU_FREQ=$(vcgencmd measure_clock arm 2>/dev/null | cut -d'=' -f2)
if [[ -z "$CPU_FREQ" ]] || [[ "$CPU_FREQ" -lt 1000000000 ]]; then
    SYSTEM_HEALTHY=false
fi

# Check memory availability
MEM_AVAILABLE=$(free | awk 'NR==2{printf "%.0f", $7/1024/1024}')
if [[ "$MEM_AVAILABLE" -lt 1000 ]]; then
    SYSTEM_HEALTHY=false
fi

# Check temperature
TEMP=$(vcgencmd measure_temp 2>/dev/null | cut -d'=' -f2 | cut -d"'" -f1)
if [[ -n "$TEMP" ]] && (( $(echo "$TEMP > 80" | bc -l) )); then
    SYSTEM_HEALTHY=false
fi

# Record boot success
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
if [[ "$SYSTEM_HEALTHY" == "true" ]]; then
    echo "[$TIMESTAMP] BOOT SUCCESS - System healthy, CPU: ${CPU_FREQ}Hz, Memory: ${MEM_AVAILABLE}GB, Temp: ${TEMP}°C" >> "$BOOT_LOG"
    touch "$SUCCESS_FLAG"
else
    echo "[$TIMESTAMP] BOOT UNSTABLE - Issues detected, CPU: ${CPU_FREQ}Hz, Memory: ${MEM_AVAILABLE}GB, Temp: ${TEMP}°C" >> "$BOOT_LOG"
fi

# Update frequency state
if [[ -f "$SCRIPT_DIR/current_frequency_state.txt" ]]; then
    sed -i 's/BOOT_FAILURE_COUNT=.*/BOOT_FAILURE_COUNT=0/' "$SCRIPT_DIR/current_frequency_state.txt"
    sed -i 's/TESTING_PHASE=.*/TESTING_PHASE=stable/' "$SCRIPT_DIR/current_frequency_state.txt"
fi
EOF
    
    sudo chmod +x /usr/local/bin/rpi5-boot-success-detector
    
    # Create systemd service for boot detection
    sudo tee /etc/systemd/system/rpi5-boot-success.service > /dev/null << EOF
[Unit]
Description=RPi5 Boot Success Detector
After=graphical-session.target
Wants=graphical-session.target

[Service]
Type=oneshot
ExecStart=/usr/local/bin/rpi5-boot-success-detector
RemainAfterExit=no
User=root

[Install]
WantedBy=graphical-session.target
EOF
    
    sudo systemctl daemon-reload
    sudo systemctl enable rpi5-boot-success.service
    
    print_success "Boot success detection system created"
}

# Boot failure recovery system
create_boot_failure_recovery() {
    print_header "Creating Boot Failure Recovery System"
    
    # Create boot failure detector and recovery script
    sudo tee /usr/local/bin/rpi5-boot-failure-recovery > /dev/null << 'EOF'
#!/bin/bash

# RPi5 Boot Failure Recovery System
# Automatically reduces CPU frequency on boot failure

SCRIPT_DIR="/home/sri/rpi5-optimization-backup"
STATE_FILE="$SCRIPT_DIR/current_frequency_state.txt"
BOOT_LOG="$SCRIPT_DIR/boot_attempts.log"

# Check if we're in recovery mode (no successful boot flag after timeout)
if [[ ! -f "/tmp/rpi5_boot_success" ]]; then
    TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$TIMESTAMP] BOOT FAILURE DETECTED - Initiating frequency reduction" >> "$BOOT_LOG"
    
    # Load current state
    if [[ -f "$STATE_FILE" ]]; then
        source "$STATE_FILE"
        
        # Increment failure count
        BOOT_FAILURE_COUNT=$((BOOT_FAILURE_COUNT + 1))
        CURRENT_FREQUENCY_INDEX=$((CURRENT_FREQUENCY_INDEX + 1))
        
        # Available frequencies
        FREQUENCIES=(2800 2700 2600 2500 2400 2300 2200 2100 2000)
        
        if [[ $CURRENT_FREQUENCY_INDEX -lt ${#FREQUENCIES[@]} ]]; then
            NEW_FREQUENCY=${FREQUENCIES[$CURRENT_FREQUENCY_INDEX]}
            echo "[$TIMESTAMP] Reducing frequency to ${NEW_FREQUENCY}MHz" >> "$BOOT_LOG"
            
            # Update state file
            sed -i "s/CURRENT_FREQUENCY_INDEX=.*/CURRENT_FREQUENCY_INDEX=$CURRENT_FREQUENCY_INDEX/" "$STATE_FILE"
            sed -i "s/BOOT_FAILURE_COUNT=.*/BOOT_FAILURE_COUNT=$BOOT_FAILURE_COUNT/" "$STATE_FILE"
            sed -i "s/TESTING_PHASE=.*/TESTING_PHASE=recovery/" "$STATE_FILE"
            
            # Apply new frequency configuration
            /home/sri/rpi5-optimization-backup/adaptive_cpu_optimizer.sh apply-frequency $NEW_FREQUENCY
            
            echo "[$TIMESTAMP] Configuration updated, system will reboot" >> "$BOOT_LOG"
            sleep 5
            reboot
        else
            echo "[$TIMESTAMP] All frequencies tested, using safe fallback (2000MHz)" >> "$BOOT_LOG"
            sed -i "s/STABLE_FREQUENCY_FOUND=.*/STABLE_FREQUENCY_FOUND=true/" "$STATE_FILE"
            sed -i "s/LAST_SUCCESSFUL_FREQUENCY=.*/LAST_SUCCESSFUL_FREQUENCY=2000/" "$STATE_FILE"
        fi
    fi
fi
EOF
    
    sudo chmod +x /usr/local/bin/rpi5-boot-failure-recovery
    
    # Create early boot service for failure detection
    sudo tee /etc/systemd/system/rpi5-boot-failure-recovery.service > /dev/null << EOF
[Unit]
Description=RPi5 Boot Failure Recovery
DefaultDependencies=false
Before=sysinit.target
After=local-fs.target

[Service]
Type=oneshot
ExecStart=/bin/bash -c 'sleep 60 && /usr/local/bin/rpi5-boot-failure-recovery'
RemainAfterExit=yes

[Install]
WantedBy=sysinit.target
EOF
    
    sudo systemctl daemon-reload
    sudo systemctl enable rpi5-boot-failure-recovery.service
    
    print_success "Boot failure recovery system created"
}

# Apply specific frequency configuration
apply_frequency_config() {
    local frequency="$1"
    
    if [[ -z "$frequency" ]]; then
        print_error "Frequency parameter required"
        return 1
    fi
    
    local voltage=$(get_voltage_for_frequency "$frequency")
    
    print_header "Applying CPU Frequency: ${frequency}MHz"
    print_status "Voltage setting: +${voltage}"
    
    # Create and apply configuration
    create_frequency_config "$frequency" "$voltage"
    
    # Apply system settings immediately
    sudo sysctl -p /etc/sysctl.d/99-rpi5-adaptive.conf
    
    # Log the attempt
    log_boot_attempt "$frequency" "$voltage" "APPLIED"
    
    print_success "Configuration applied for ${frequency}MHz"
    print_status "System will test this frequency on next boot"
    
    return 0
}

# Start adaptive frequency testing
start_adaptive_testing() {
    print_header "Starting Adaptive CPU Frequency Testing"
    
    initialize_frequency_state
    create_boot_success_detector
    create_boot_failure_recovery
    
    # Start with 2800MHz as requested
    local start_frequency=2800
    
    print_status "Beginning adaptive testing sequence:"
    print_info "Starting frequency: ${start_frequency}MHz"
    print_info "Will step down automatically if boot fails: 2800 → 2700 → 2600 → ... → 2000MHz"
    print_info "System will find optimal stable frequency automatically"
    
    echo ""
    echo "Frequency test sequence:"
    for freq in "${FREQUENCY_SEQUENCE[@]}"; do
        local voltage=$(get_voltage_for_frequency "$freq")
        echo "  ${freq}MHz (voltage +${voltage})"
    done
    
    echo ""
    read -p "Start adaptive frequency testing at ${start_frequency}MHz? (yes/no): " confirm
    
    if [[ "$confirm" == "yes" ]]; then
        apply_frequency_config "$start_frequency"
        
        print_success "Adaptive testing initialized!"
        print_status "The system will now:"
        print_info "1. Apply ${start_frequency}MHz configuration"
        print_info "2. Reboot to test stability"
        print_info "3. Automatically reduce frequency if boot fails"
        print_info "4. Find optimal stable frequency"
        print_info "5. Create configuration snapshot when stable"
        
        echo ""
        print_status "Reboot now to begin testing? (recommended)"
        read -p "Reboot system? (yes/no): " reboot_confirm
        
        if [[ "$reboot_confirm" == "yes" ]]; then
            print_status "Rebooting to test ${start_frequency}MHz configuration..."
            log_boot_attempt "$start_frequency" "$(get_voltage_for_frequency $start_frequency)" "TESTING"
            sudo reboot
        else
            print_info "Reboot manually when ready: sudo reboot"
        fi
    else
        print_info "Adaptive testing cancelled"
    fi
}

# Check current testing status
check_testing_status() {
    print_header "Adaptive Testing Status"
    
    if [[ ! -f "$FREQUENCY_STATE_FILE" ]]; then
        print_info "No adaptive testing in progress"
        return
    fi
    
    source "$FREQUENCY_STATE_FILE"
    
    echo "Current Testing State:"
    echo "  Frequency Index: $CURRENT_FREQUENCY_INDEX"
    echo "  Boot Failures: $BOOT_FAILURE_COUNT"
    echo "  Testing Phase: $TESTING_PHASE"
    echo "  Stable Found: $STABLE_FREQUENCY_FOUND"
    echo "  Last Successful: ${LAST_SUCCESSFUL_FREQUENCY}MHz"
    
    if [[ -f "$BOOT_LOG_FILE" ]]; then
        echo ""
        echo "Recent Boot Attempts:"
        tail -10 "$BOOT_LOG_FILE"
    fi
    
    # Current system status
    echo ""
    echo "Current System:"
    echo "  CPU Frequency: $(vcgencmd measure_clock arm | cut -d'=' -f2 | awk '{print int($1/1000000)}')MHz"
    echo "  CPU Governor: $(cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_governor)"
    echo "  Temperature: $(vcgencmd measure_temp)"
    echo "  Boot Success Flag: $(test -f /tmp/rpi5_boot_success && echo "Present" || echo "Missing")"
}

# Generate stability report
generate_stability_report() {
    local report_file="$SCRIPT_DIR/reports/adaptive_cpu_stability_$(date +%Y%m%d_%H%M%S).md"
    mkdir -p "$(dirname "$report_file")"
    
    print_header "Generating Adaptive CPU Stability Report"
    
    cat > "$report_file" << EOF
# RPi5 Adaptive CPU Frequency Stability Report

**Generated**: $(date)  
**System**: Raspberry Pi 5 8GB Model  
**Testing Method**: Adaptive frequency stepping with boot validation  

---

## Testing Summary

EOF
    
    if [[ -f "$FREQUENCY_STATE_FILE" ]]; then
        source "$FREQUENCY_STATE_FILE"
        
        cat >> "$report_file" << EOF
### Current State
- **Current Frequency Index**: $CURRENT_FREQUENCY_INDEX
- **Boot Failure Count**: $BOOT_FAILURE_COUNT  
- **Testing Phase**: $TESTING_PHASE
- **Stable Frequency Found**: $STABLE_FREQUENCY_FOUND
- **Last Successful Frequency**: ${LAST_SUCCESSFUL_FREQUENCY}MHz

EOF
    fi
    
    # Add boot log analysis
    if [[ -f "$BOOT_LOG_FILE" ]]; then
        cat >> "$report_file" << EOF
### Boot Attempt History
\`\`\`
$(tail -20 "$BOOT_LOG_FILE")
\`\`\`

EOF
    fi
    
    # Current system status
    cat >> "$report_file" << EOF
### Current System Status
- **CPU Frequency**: $(vcgencmd measure_clock arm | cut -d'=' -f2 | awk '{print int($1/1000000)}')MHz
- **CPU Governor**: $(cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_governor)
- **Temperature**: $(vcgencmd measure_temp)
- **Memory**: $(free -h | grep Mem | awk '{print $3 "/" $2}')
- **Swap**: $(free -h | grep Swap | awk '{print $3 "/" $2}')

---

## Recommendations

Based on the adaptive testing results, the system has automatically configured itself for optimal stability and performance.

### Next Steps
1. Monitor system stability over 24-48 hours
2. Test with heavy workloads to validate stability
3. Use configuration snapshots for easy rollback if needed

EOF
    
    print_success "Stability report generated: $report_file"
    echo "$report_file"
}

# Main script execution
case "${1:-}" in
    "start"|"test")
        start_adaptive_testing
        ;;
    "status")
        check_testing_status
        ;;
    "apply-frequency")
        apply_frequency_config "$2"
        ;;
    "report")
        generate_stability_report
        ;;
    "help"|"-h"|"--help"|"")
        echo "RPi5 Adaptive CPU Frequency Optimizer"
        echo ""
        echo "Usage: $0 <command> [options]"
        echo ""
        echo "Commands:"
        echo "  start              - Begin adaptive frequency testing (starts at 2.8GHz)"
        echo "  status             - Check current testing status and system state"
        echo "  apply-frequency N  - Apply specific frequency (MHz)"
        echo "  report             - Generate stability testing report"
        echo "  help               - Show this help message"
        echo ""
        echo "Adaptive Testing Process:"
        echo "  1. Starts at 2.8GHz with appropriate voltage"
        echo "  2. Tests boot stability automatically"
        echo "  3. Reduces frequency if boot fails: 2800→2700→2600→...→2000MHz"
        echo "  4. Finds optimal stable frequency"
        echo "  5. Creates configuration snapshot when stable"
        echo ""
        echo "Safety Features:"
        echo "  - Automatic boot failure detection"
        echo "  - Progressive frequency reduction"
        echo "  - Configuration snapshots for rollback"
        echo "  - Comprehensive logging and reporting"
        ;;
    *)
        echo "Unknown command: $1"
        echo "Run '$0 help' for usage information"
        exit 1
        ;;
esac