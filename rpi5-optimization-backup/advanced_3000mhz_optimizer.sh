#!/bin/bash

# Advanced RPi5 3000MHz Optimizer
# Aggressive overclocking with proper safety measures

set -e

SCRIPT_DIR="/home/sri/rpi5-optimization-backup"
ADVANCED_LOG_FILE="$SCRIPT_DIR/advanced_overclocking.log"

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

print_warning() {
    echo -e "${MAGENTA}⚠ $1${NC}"
}

# Advanced frequency and voltage combinations for 3000MHz
ADVANCED_FREQUENCY_MAP=(
    # Format: "frequency:voltage:description"
    "2000:0:Current stable baseline"
    "2200:6:Conservative step (+10%)"
    "2400:8:Moderate overclock (+20%)"
    "2600:10:Aggressive overclock (+30%)"
    "2700:11:High overclock (+35%)"
    "2800:12:Very high overclock (+40%)"
    "2900:13:Extreme overclock (+45%)"
    "3000:14:Maximum target (+50%)"
    "3100:15:Beyond target (+55%)"
    "3200:16:Extreme target (+60%)"
)

# Get optimal voltage for frequency
get_optimal_voltage() {
    local freq="$1"
    
    case $freq in
        2000) echo "0" ;;
        2100) echo "4" ;;
        2200) echo "6" ;;
        2300) echo "7" ;;
        2400) echo "8" ;;
        2500) echo "9" ;;
        2600) echo "10" ;;
        2700) echo "11" ;;
        2800) echo "12" ;;
        2900) echo "13" ;;
        3000) echo "14" ;;
        3100) echo "15" ;;
        3200) echo "16" ;;
        *) echo "8" ;;
    esac
}

# Assess system cooling capability
assess_cooling() {
    print_header "Cooling Assessment"
    
    local current_temp=$(vcgencmd measure_temp | cut -d'=' -f2 | cut -d"'" -f1)
    local current_freq=$(vcgencmd measure_clock arm | cut -d'=' -f2 | awk '{print int($1/1000000)}')
    
    echo "Current temperature: ${current_temp}°C at ${current_freq}MHz"
    
    # Temperature analysis
    if (( $(echo "$current_temp < 50" | bc -l) )); then
        echo "✅ Excellent cooling - temperatures very low"
        echo "🚀 3000MHz+ may be possible with proper voltage"
        return 0
    elif (( $(echo "$current_temp < 60" | bc -l) )); then
        echo "✅ Good cooling - temperatures reasonable" 
        echo "🎯 2800-3000MHz likely achievable"
        return 1
    elif (( $(echo "$current_temp < 70" | bc -l) )); then
        echo "⚠️ Moderate cooling - temperatures getting warm"
        echo "🔄 2400-2600MHz probably maximum"
        return 2
    else
        echo "❌ Poor cooling - temperatures already high"
        echo "🛑 Overclocking not recommended without better cooling"
        return 3
    fi
}

# Create advanced boot configuration
create_advanced_config() {
    local frequency="$1"
    local voltage="$2"
    local description="$3"
    local cooling_level="$4"
    
    print_header "Creating Advanced Configuration: ${frequency}MHz"
    print_status "Voltage: +${voltage} (+$(echo "scale=2; $voltage * 0.025" | bc)V)"
    print_status "Description: $description"
    
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
    
    # Backup current config
    sudo cp "$boot_config_file" "$SCRIPT_DIR/config_backup_$(date +%Y%m%d_%H%M%S).txt"
    
    # Remove existing frequency/voltage settings
    sudo sed -i '/^arm_freq=/d' "$boot_config_file"
    sudo sed -i '/^over_voltage=/d' "$boot_config_file"
    sudo sed -i '/^temp_limit=/d' "$boot_config_file"
    sudo sed -i '/^force_turbo=/d' "$boot_config_file"
    
    # Determine temperature limit based on cooling
    local temp_limit=85
    case $cooling_level in
        0) temp_limit=85 ;;  # Excellent cooling
        1) temp_limit=80 ;;  # Good cooling  
        2) temp_limit=75 ;;  # Moderate cooling
        3) temp_limit=70 ;;  # Poor cooling
    esac
    
    # Create advanced configuration
    sudo tee -a "$boot_config_file" > /dev/null << EOF

# Advanced RPi5 Overclocking Configuration - ${frequency}MHz
# Generated: $(date)
# Target: ${frequency}MHz at +${voltage} voltage
# Description: $description

# Core CPU Configuration
arm_freq=$frequency
over_voltage=$voltage

# Advanced Overclocking Settings
force_turbo=1                    # Always run at maximum frequency
temp_limit=$temp_limit          # Temperature limit based on cooling
initial_turbo=0                  # Disable turbo timeout
avoid_warnings=1                 # Bypass overclocking warnings

# Enhanced Memory Configuration  
sdram_freq=3600                  # High-speed RAM
over_voltage_sdram=6             # RAM voltage boost
sdram_over_voltage=6             # Additional RAM voltage

# GPU and Core Overclocking
gpu_freq=800                     # Overclock GPU
core_freq=800                    # Core frequency boost  
h264_freq=800                    # Video encoding boost
isp_freq=800                     # Image processing boost

# Stability Enhancements
arm_freq_min=$frequency          # Minimum frequency (no scaling)
gpu_mem=8                        # Minimal GPU memory
disable_splash=1                 # Faster boot
boot_delay=0                     # No boot delay

# Thermal Management
dtparam=act_led_trigger=cpu      # LED shows CPU activity for monitoring
EOF
    
    print_success "Advanced configuration created for ${frequency}MHz"
    
    # Log the attempt
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ADVANCED CONFIG: ${frequency}MHz, voltage +${voltage}, temp_limit=${temp_limit}°C" >> "$ADVANCED_LOG_FILE"
    
    return 0
}

# Test specific frequency with monitoring
test_frequency() {
    local frequency="$1"
    local voltage="$2"
    
    if [[ -z "$frequency" ]] || [[ -z "$voltage" ]]; then
        print_error "Usage: test_frequency <frequency_mhz> <voltage_boost>"
        return 1
    fi
    
    print_header "Testing ${frequency}MHz with +${voltage} voltage"
    
    # Assess cooling first
    assess_cooling
    local cooling_level=$?
    
    if [[ $cooling_level -gt 2 ]] && [[ $frequency -gt 2400 ]]; then
        print_warning "Your cooling may not support ${frequency}MHz safely"
        print_status "Consider adding active cooling before attempting high frequencies"
        
        read -p "Continue anyway? (yes/no): " continue_anyway
        if [[ "$continue_anyway" != "yes" ]]; then
            print_status "Test cancelled for safety"
            return 1
        fi
    fi
    
    # Create configuration
    create_advanced_config "$frequency" "$voltage" "Test configuration" "$cooling_level"
    
    # Create test snapshot
    print_status "Creating configuration snapshot..."
    cd "$SCRIPT_DIR"
    ./config_manager.sh create "test-${frequency}mhz-v${voltage}" "Test configuration ${frequency}MHz with +${voltage} voltage boost"
    
    print_success "Configuration ready for ${frequency}MHz test"
    print_status "System will reboot to test this configuration"
    print_warning "If boot fails, auto-recovery will restore stable configuration"
    
    echo ""
    print_status "Reboot now to test ${frequency}MHz? (Ctrl+C to cancel)"
    read -p "Reboot and test? (yes/no): " confirm_reboot
    
    if [[ "$confirm_reboot" == "yes" ]]; then
        print_status "Rebooting to test ${frequency}MHz..."
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] TESTING: ${frequency}MHz with voltage +${voltage}" >> "$ADVANCED_LOG_FILE"
        sudo reboot
    else
        print_status "Test cancelled. Configuration ready but not applied."
    fi
}

# Progressive overclocking wizard
progressive_overclock() {
    print_header "Progressive Overclocking to 3000MHz"
    
    # Current status
    local current_freq=$(vcgencmd measure_clock arm | cut -d'=' -f2 | awk '{print int($1/1000000)}')
    local current_temp=$(vcgencmd measure_temp | cut -d'=' -f2 | cut -d"'" -f1)
    
    echo "Current system: ${current_freq}MHz at ${current_temp}°C"
    
    # Assess cooling
    assess_cooling
    local cooling_level=$?
    
    echo ""
    echo "Progressive overclocking plan based on your cooling:"
    
    case $cooling_level in
        0)  # Excellent cooling
            echo "🚀 AGGRESSIVE PLAN (Excellent Cooling):"
            echo "  Step 1: 2200MHz (+6 voltage)"
            echo "  Step 2: 2400MHz (+8 voltage)" 
            echo "  Step 3: 2600MHz (+10 voltage)"
            echo "  Step 4: 2800MHz (+12 voltage)"
            echo "  Step 5: 3000MHz (+14 voltage)"
            echo "  Step 6: 3200MHz (+16 voltage) - if desired"
            ;;
        1)  # Good cooling
            echo "🎯 MODERATE PLAN (Good Cooling):"
            echo "  Step 1: 2200MHz (+6 voltage)"
            echo "  Step 2: 2400MHz (+8 voltage)"
            echo "  Step 3: 2600MHz (+10 voltage)" 
            echo "  Step 4: 2800MHz (+12 voltage)"
            echo "  Step 5: 3000MHz (+14 voltage) - push limits"
            ;;
        2)  # Moderate cooling
            echo "⚠️ CONSERVATIVE PLAN (Moderate Cooling):"
            echo "  Step 1: 2200MHz (+6 voltage)"
            echo "  Step 2: 2400MHz (+8 voltage)"
            echo "  Step 3: 2600MHz (+10 voltage) - likely maximum"
            echo "  Note: 3000MHz unlikely without better cooling"
            ;;
        3)  # Poor cooling
            echo "🛑 MINIMAL PLAN (Poor Cooling):"
            echo "  Step 1: 2200MHz (+6 voltage) - conservative test"
            echo "  Note: Higher frequencies not recommended"
            echo "  Suggestion: Add active cooling first"
            ;;
    esac
    
    echo ""
    read -p "Start progressive overclocking? (yes/no): " start_progressive
    
    if [[ "$start_progressive" != "yes" ]]; then
        print_status "Progressive overclocking cancelled"
        return 0
    fi
    
    # Start with first step
    if [[ $current_freq -lt 2200 ]]; then
        print_status "Starting with 2200MHz (+6 voltage)..."
        test_frequency 2200 6
    else
        print_status "Already above 2200MHz. Try next step manually:"
        echo "./advanced_3000mhz_optimizer.sh test-frequency <frequency> <voltage>"
    fi
}

# Show current advanced status
show_advanced_status() {
    print_header "Advanced Overclocking Status"
    
    local current_freq=$(vcgencmd measure_clock arm | cut -d'=' -f2 | awk '{print int($1/1000000)}')
    local current_volt=$(vcgencmd measure_volts core | cut -d'=' -f2)
    local current_temp=$(vcgencmd measure_temp | cut -d'=' -f2 | cut -d"'" -f1)
    local throttled=$(vcgencmd get_throttled)
    
    echo "Current Performance:"
    echo "  CPU Frequency: ${current_freq}MHz"
    echo "  Core Voltage: $current_volt"
    echo "  Temperature: ${current_temp}°C"
    echo "  Throttling: $throttled"
    
    # Progress toward 3000MHz
    local progress_percent=$(echo "scale=1; ($current_freq - 2000) / (3000 - 2000) * 100" | bc)
    echo "  Progress to 3000MHz: ${progress_percent}%"
    
    # Cooling assessment
    assess_cooling
    
    # Recent attempts
    if [[ -f "$ADVANCED_LOG_FILE" ]]; then
        echo ""
        echo "Recent Overclocking Attempts:"
        tail -5 "$ADVANCED_LOG_FILE"
    fi
}

# Main script execution
case "${1:-}" in
    "test-frequency")
        test_frequency "$2" "$3"
        ;;
    "progressive")
        progressive_overclock
        ;;
    "status")
        show_advanced_status
        ;;
    "help"|"-h"|"--help"|"")
        echo "Advanced RPi5 3000MHz Optimizer"
        echo ""
        echo "Usage: $0 <command> [options]"
        echo ""
        echo "Commands:"
        echo "  test-frequency <mhz> <voltage>  - Test specific frequency with voltage"
        echo "  progressive                     - Start progressive overclocking wizard"
        echo "  status                          - Show current overclocking status"
        echo "  help                            - Show this help message"
        echo ""
        echo "Examples:"
        echo "  $0 test-frequency 2200 6       - Test 2200MHz with +6 voltage"
        echo "  $0 test-frequency 2400 8       - Test 2400MHz with +8 voltage"
        echo "  $0 test-frequency 3000 14      - Test 3000MHz with +14 voltage"
        echo "  $0 progressive                  - Start guided overclocking"
        echo ""
        echo "Voltage Guidelines:"
        echo "  +6 to +8   - Conservative overclocking"
        echo "  +10 to +12 - Moderate overclocking  "
        echo "  +14 to +16 - Aggressive overclocking"
        echo ""
        echo "Cooling Requirements:"
        echo "  2000-2400MHz: Passive cooling okay"
        echo "  2400-2800MHz: Active cooling recommended"
        echo "  2800-3000MHz: Good active cooling required"
        echo "  3000MHz+: Excellent cooling essential"
        ;;
    *)
        echo "Unknown command: $1"
        echo "Run '$0 help' for usage information"
        exit 1
        ;;
esac