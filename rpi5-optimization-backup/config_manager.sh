#!/bin/bash

# RPi5 Configuration Manager
# Create, manage, and restore named system configurations

set -e

BACKUP_BASE_DIR="/home/sri/rpi5-optimization-backup"
CONFIGS_DIR="$BACKUP_BASE_DIR/configurations"
CURRENT_CONFIG_FILE="$BACKUP_BASE_DIR/current_configuration.txt"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
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

# Create configurations directory
mkdir -p "$CONFIGS_DIR"

# Function to create a named configuration snapshot
create_config_snapshot() {
    local config_name="$1"
    local config_description="$2"
    local timestamp=$(date '+%Y%m%d_%H%M%S')
    local config_dir="$CONFIGS_DIR/${config_name}_${timestamp}"
    
    if [[ -z "$config_name" ]]; then
        print_error "Configuration name is required"
        return 1
    fi
    
    print_header "Creating Configuration Snapshot: $config_name"
    
    # Create configuration directory
    mkdir -p "$config_dir"
    
    # Create configuration metadata
    cat > "$config_dir/config_info.txt" << EOF
Configuration Name: $config_name
Description: ${config_description:-"No description provided"}
Created: $(date)
Hostname: $(hostname)
Kernel: $(uname -r)
User: $(whoami)
EOF
    
    # Backup system files
    print_status "Backing up system configuration files..."
    
    # System configuration files
    sudo cp /etc/sysctl.conf "$config_dir/sysctl.conf" 2>/dev/null || touch "$config_dir/sysctl.conf"
    sudo cp /etc/dphys-swapfile "$config_dir/dphys-swapfile" 2>/dev/null || echo "# No dphys-swapfile" > "$config_dir/dphys-swapfile"
    sudo cp /boot/firmware/config.txt "$config_dir/config.txt" 2>/dev/null || sudo cp /boot/config.txt "$config_dir/config.txt" 2>/dev/null || echo "# No config.txt" > "$config_dir/config.txt"
    sudo cp /etc/systemd/system.conf "$config_dir/system.conf" 2>/dev/null || echo "# Default system.conf" > "$config_dir/system.conf"
    
    # Boot command line
    sudo cp /boot/firmware/cmdline.txt "$config_dir/cmdline.txt" 2>/dev/null || sudo cp /boot/cmdline.txt "$config_dir/cmdline.txt" 2>/dev/null || echo "# No cmdline.txt" > "$config_dir/cmdline.txt"
    
    # Capture current system state
    print_status "Capturing system state..."
    
    # Memory and swap information
    free -h > "$config_dir/memory_state.txt"
    swapon --show > "$config_dir/swap_state.txt" 2>/dev/null || echo "No swap active" > "$config_dir/swap_state.txt"
    
    # CPU information
    cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_governor > "$config_dir/cpu_governor.txt" 2>/dev/null || echo "N/A" > "$config_dir/cpu_governor.txt"
    lscpu > "$config_dir/cpu_info.txt"
    
    # System parameters
    sysctl -a > "$config_dir/sysctl_current.txt" 2>/dev/null
    
    # Process information
    ps aux --sort=-%mem | head -20 > "$config_dir/top_processes.txt"
    
    # System services
    systemctl list-units --state=running --type=service > "$config_dir/running_services.txt"
    
    # Temperature and performance
    vcgencmd measure_temp > "$config_dir/temperature.txt" 2>/dev/null || echo "N/A" > "$config_dir/temperature.txt"
    cat /proc/loadavg > "$config_dir/load_average.txt"
    
    # Network configuration
    ip addr show > "$config_dir/network_config.txt"
    
    # Disk usage
    df -h > "$config_dir/disk_usage.txt"
    
    # Create restoration script for this configuration
    cat > "$config_dir/restore_to_this_config.sh" << 'EOF'
#!/bin/bash

# Restore to this specific configuration
CONFIG_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_NAME="$(basename "$CONFIG_DIR" | cut -d'_' -f1)"

echo "=== RESTORING TO CONFIGURATION: $CONFIG_NAME ==="
echo "Configuration directory: $CONFIG_DIR"
echo ""

# Read configuration info
if [[ -f "$CONFIG_DIR/config_info.txt" ]]; then
    echo "Configuration Details:"
    cat "$CONFIG_DIR/config_info.txt"
    echo ""
fi

echo "WARNING: This will replace current system configuration!"
read -p "Continue with restoration? (yes/no): " confirm

if [[ "$confirm" != "yes" ]]; then
    echo "Restoration cancelled."
    exit 0
fi

echo ""
echo "Stopping swap..."
sudo swapoff -a || true

echo "Restoring configuration files..."
sudo cp "$CONFIG_DIR/sysctl.conf" "/etc/sysctl.conf"
sudo cp "$CONFIG_DIR/dphys-swapfile" "/etc/dphys-swapfile"

# Determine correct boot config location
if [[ -d /boot/firmware ]]; then
    sudo cp "$CONFIG_DIR/config.txt" "/boot/firmware/config.txt"
    sudo cp "$CONFIG_DIR/cmdline.txt" "/boot/firmware/cmdline.txt" 2>/dev/null || true
else
    sudo cp "$CONFIG_DIR/config.txt" "/boot/config.txt"
    sudo cp "$CONFIG_DIR/cmdline.txt" "/boot/cmdline.txt" 2>/dev/null || true
fi

sudo cp "$CONFIG_DIR/system.conf" "/etc/systemd/system.conf"

echo "Restarting services..."
sudo systemctl restart dphys-swapfile || true
sudo swapon -a || true

# Restore CPU governor
if [[ -f "$CONFIG_DIR/cpu_governor.txt" ]]; then
    governor=$(cat "$CONFIG_DIR/cpu_governor.txt")
    if [[ "$governor" != "N/A" ]]; then
        echo "Restoring CPU governor to: $governor"
        for cpu in /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor; do
            [[ -w "$cpu" ]] && echo "$governor" | sudo tee "$cpu" > /dev/null
        done
    fi
fi

echo "Reloading system configuration..."
sudo sysctl -p || true
sudo systemctl daemon-reload || true

# Update current configuration marker
echo "$CONFIG_NAME" > "/home/sri/rpi5-optimization-backup/current_configuration.txt"

echo ""
echo "=== RESTORATION COMPLETED ==="
echo "System has been restored to configuration: $CONFIG_NAME"
echo "Please reboot to ensure all changes take effect:"
echo "sudo reboot"
EOF
    
    chmod +x "$config_dir/restore_to_this_config.sh"
    
    # Create performance benchmark for this configuration
    cat > "$config_dir/benchmark_this_config.sh" << 'EOF'
#!/bin/bash

CONFIG_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_NAME="$(basename "$CONFIG_DIR" | cut -d'_' -f1)"

echo "=== BENCHMARKING CONFIGURATION: $CONFIG_NAME ==="

# Quick system performance check
echo "Current System State:"
echo "Memory Usage:"
free -h
echo ""
echo "Swap Usage:"
swapon --show
echo ""
echo "CPU Governor:"
cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_governor 2>/dev/null || echo "N/A"
echo ""
echo "Temperature:"
vcgencmd measure_temp 2>/dev/null || echo "N/A"
echo ""
echo "Load Average:"
cat /proc/loadavg

# Run quick stress test if available
if command -v stress-ng >/dev/null 2>&1; then
    echo ""
    echo "Running 30-second stress test..."
    stress-ng --cpu $(nproc) --vm 2 --vm-bytes 512M --timeout 30s --metrics-brief
fi

echo ""
echo "Benchmark completed for configuration: $CONFIG_NAME"
EOF
    
    chmod +x "$config_dir/benchmark_this_config.sh"
    
    # Set ownership
    sudo chown -R sri:sri "$config_dir"
    
    # Update current configuration marker
    echo "$config_name" > "$CURRENT_CONFIG_FILE"
    
    print_success "Configuration snapshot '$config_name' created successfully"
    print_info "Location: $config_dir"
    print_info "Files backed up: $(ls "$config_dir" | wc -l) items"
    
    return 0
}

# Function to list available configurations
list_configurations() {
    print_header "Available Configurations"
    
    if [[ ! -d "$CONFIGS_DIR" ]] || [[ -z "$(ls -A "$CONFIGS_DIR" 2>/dev/null)" ]]; then
        print_info "No configurations found. Create one with: $0 create <name>"
        return
    fi
    
    local current_config=""
    if [[ -f "$CURRENT_CONFIG_FILE" ]]; then
        current_config=$(cat "$CURRENT_CONFIG_FILE")
    fi
    
    echo "Format: [Name] [Created] [Description]"
    echo "----------------------------------------"
    
    for config_dir in "$CONFIGS_DIR"/*; do
        if [[ -d "$config_dir" ]]; then
            local dir_name=$(basename "$config_dir")
            local config_name=$(echo "$dir_name" | cut -d'_' -f1)
            local timestamp=$(echo "$dir_name" | cut -d'_' -f2-)
            
            # Format timestamp for display
            local display_date=""
            if [[ ${#timestamp} -eq 13 ]]; then
                display_date="${timestamp:0:4}-${timestamp:4:2}-${timestamp:6:2} ${timestamp:9:2}:${timestamp:11:2}"
            else
                display_date="$timestamp"
            fi
            
            # Get description
            local description=""
            if [[ -f "$config_dir/config_info.txt" ]]; then
                description=$(grep "Description:" "$config_dir/config_info.txt" | cut -d':' -f2- | xargs)
            fi
            
            # Mark current configuration
            local marker=""
            if [[ "$config_name" == "$current_config" ]]; then
                marker=" ${GREEN}(CURRENT)${NC}"
            fi
            
            echo -e "${CYAN}$config_name${NC} | $display_date | $description$marker"
        fi
    done
    
    echo ""
    print_info "To restore: $0 restore <config-name>"
    print_info "To compare: $0 compare <config1> <config2>"
    print_info "To delete: $0 delete <config-name>"
}

# Function to restore a specific configuration
restore_configuration() {
    local config_name="$1"
    
    if [[ -z "$config_name" ]]; then
        print_error "Configuration name is required"
        list_configurations
        return 1
    fi
    
    # Find the configuration directory
    local config_dir=""
    for dir in "$CONFIGS_DIR"/${config_name}_*; do
        if [[ -d "$dir" ]]; then
            config_dir="$dir"
            break
        fi
    done
    
    if [[ -z "$config_dir" ]]; then
        print_error "Configuration '$config_name' not found"
        list_configurations
        return 1
    fi
    
    print_header "Restoring Configuration: $config_name"
    
    # Show configuration details
    if [[ -f "$config_dir/config_info.txt" ]]; then
        echo "Configuration Details:"
        cat "$config_dir/config_info.txt"
        echo ""
    fi
    
    # Run the restoration script
    "$config_dir/restore_to_this_config.sh"
}

# Function to compare two configurations
compare_configurations() {
    local config1="$1"
    local config2="$2"
    
    if [[ -z "$config1" ]] || [[ -z "$config2" ]]; then
        print_error "Two configuration names are required"
        list_configurations
        return 1
    fi
    
    # Find configuration directories
    local config1_dir=""
    local config2_dir=""
    
    for dir in "$CONFIGS_DIR"/${config1}_*; do
        [[ -d "$dir" ]] && config1_dir="$dir" && break
    done
    
    for dir in "$CONFIGS_DIR"/${config2}_*; do
        [[ -d "$dir" ]] && config2_dir="$dir" && break
    done
    
    if [[ -z "$config1_dir" ]]; then
        print_error "Configuration '$config1' not found"
        return 1
    fi
    
    if [[ -z "$config2_dir" ]]; then
        print_error "Configuration '$config2' not found"
        return 1
    fi
    
    print_header "Comparing Configurations: $config1 vs $config2"
    
    # Compare key configuration files
    echo "=== SYSCTL.CONF DIFFERENCES ==="
    diff -u "$config1_dir/sysctl.conf" "$config2_dir/sysctl.conf" || echo "No differences in sysctl.conf"
    
    echo ""
    echo "=== SWAP CONFIGURATION DIFFERENCES ==="
    diff -u "$config1_dir/dphys-swapfile" "$config2_dir/dphys-swapfile" || echo "No differences in swap configuration"
    
    echo ""
    echo "=== BOOT CONFIGURATION DIFFERENCES ==="
    diff -u "$config1_dir/config.txt" "$config2_dir/config.txt" || echo "No differences in boot configuration"
    
    echo ""
    echo "=== CPU GOVERNOR COMPARISON ==="
    echo "$config1: $(cat "$config1_dir/cpu_governor.txt")"
    echo "$config2: $(cat "$config2_dir/cpu_governor.txt")"
    
    echo ""
    echo "=== MEMORY STATE COMPARISON ==="
    echo "--- $config1 ---"
    cat "$config1_dir/memory_state.txt"
    echo ""
    echo "--- $config2 ---"
    cat "$config2_dir/memory_state.txt"
}

# Function to delete a configuration
delete_configuration() {
    local config_name="$1"
    
    if [[ -z "$config_name" ]]; then
        print_error "Configuration name is required"
        list_configurations
        return 1
    fi
    
    # Find the configuration directory
    local config_dir=""
    for dir in "$CONFIGS_DIR"/${config_name}_*; do
        if [[ -d "$dir" ]]; then
            config_dir="$dir"
            break
        fi
    done
    
    if [[ -z "$config_dir" ]]; then
        print_error "Configuration '$config_name' not found"
        return 1
    fi
    
    print_header "Delete Configuration: $config_name"
    
    # Show configuration details
    if [[ -f "$config_dir/config_info.txt" ]]; then
        echo "Configuration to delete:"
        cat "$config_dir/config_info.txt"
        echo ""
    fi
    
    echo -e "${RED}WARNING: This action cannot be undone!${NC}"
    read -p "Are you sure you want to delete configuration '$config_name'? (yes/no): " confirm
    
    if [[ "$confirm" == "yes" ]]; then
        rm -rf "$config_dir"
        print_success "Configuration '$config_name' deleted successfully"
        
        # Clear current config marker if this was the current config
        if [[ -f "$CURRENT_CONFIG_FILE" ]] && [[ "$(cat "$CURRENT_CONFIG_FILE")" == "$config_name" ]]; then
            rm -f "$CURRENT_CONFIG_FILE"
            print_info "Cleared current configuration marker"
        fi
    else
        print_info "Deletion cancelled"
    fi
}

# Function to show current system status
show_current_status() {
    print_header "Current System Status"
    
    local current_config="Unknown"
    if [[ -f "$CURRENT_CONFIG_FILE" ]]; then
        current_config=$(cat "$CURRENT_CONFIG_FILE")
    fi
    
    echo "Current Configuration: ${CYAN}$current_config${NC}"
    echo ""
    
    echo "Memory and Swap:"
    free -h | grep -E "(Mem|Swap):"
    echo ""
    
    echo "CPU Governor: $(cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_governor 2>/dev/null || echo 'N/A')"
    echo "Temperature: $(vcgencmd measure_temp 2>/dev/null || echo 'N/A')"
    echo "Load Average: $(cat /proc/loadavg | cut -d' ' -f1-3)"
    echo "Swappiness: $(cat /proc/sys/vm/swappiness)"
}

# Main script execution
case "${1:-}" in
    "create")
        create_config_snapshot "$2" "$3"
        ;;
    "list"|"ls")
        list_configurations
        ;;
    "restore")
        restore_configuration "$2"
        ;;
    "compare"|"diff")
        compare_configurations "$2" "$3"
        ;;
    "delete"|"rm")
        delete_configuration "$2"
        ;;
    "status")
        show_current_status
        ;;
    "help"|"-h"|"--help"|"")
        echo "RPi5 Configuration Manager"
        echo ""
        echo "Usage: $0 <command> [arguments]"
        echo ""
        echo "Commands:"
        echo "  create <name> [description]  - Create a named configuration snapshot"
        echo "  list                         - List all available configurations"
        echo "  restore <name>               - Restore to a specific configuration"
        echo "  compare <name1> <name2>      - Compare two configurations"
        echo "  delete <name>                - Delete a configuration"
        echo "  status                       - Show current system status"
        echo "  help                         - Show this help message"
        echo ""
        echo "Examples:"
        echo "  $0 create health-configuration-sept-23-2025 \"Baseline healthy config\""
        echo "  $0 list"
        echo "  $0 restore health-configuration-sept-23-2025"
        echo "  $0 compare health-configuration optimized-config"
        ;;
    *)
        echo "Unknown command: $1"
        echo "Run '$0 help' for usage information"
        exit 1
        ;;
esac