#!/bin/bash

# RPi5 System Optimization Restore Script
# This script restores the system to its pre-optimization state

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LATEST_BACKUP=$(find "$SCRIPT_DIR" -maxdepth 1 -type d -name "20*" | sort | tail -1)

if [[ -z "$LATEST_BACKUP" ]]; then
    echo "ERROR: No backup directory found!"
    exit 1
fi

echo "=== RPi5 SYSTEM RESTORE ==="
echo "Restore point: $LATEST_BACKUP"
echo "Starting system restore..."
echo ""

# Function to restore file if backup exists
restore_file() {
    local backup_file="$1"
    local target_file="$2"
    
    if [[ -f "$LATEST_BACKUP/$backup_file" ]]; then
        echo "Restoring $target_file"
        sudo cp "$LATEST_BACKUP/$backup_file" "$target_file"
    else
        echo "Warning: Backup file $backup_file not found, skipping..."
    fi
}

# Stop swap before making changes
echo "Stopping current swap..."
sudo swapoff -a || true

# Restore configuration files
restore_file "sysctl.conf.backup" "/etc/sysctl.conf"
restore_file "dphys-swapfile.backup" "/etc/dphys-swapfile"
restore_file "config.txt.backup" "/boot/firmware/config.txt"
restore_file "system.conf.backup" "/etc/systemd/system.conf"

# Restore original swap settings
if [[ -f "$LATEST_BACKUP/dphys-swapfile.backup" ]]; then
    echo "Restarting swap service..."
    sudo systemctl restart dphys-swapfile || true
    sudo swapon -a || true
fi

# Restore CPU governor
if [[ -f "$LATEST_BACKUP/cpu_governor_before.txt" ]]; then
    original_governor=$(cat "$LATEST_BACKUP/cpu_governor_before.txt")
    echo "Restoring CPU governor to: $original_governor"
    for cpu in /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor; do
        [[ -w "$cpu" ]] && echo "$original_governor" | sudo tee "$cpu" > /dev/null
    done
fi

# Reload system settings
echo "Reloading system configuration..."
sudo sysctl -p || true
sudo systemctl daemon-reload || true

echo ""
echo "=== SYSTEM RESTORE COMPLETED ==="
echo "Original system state has been restored."
echo "Please reboot your system to ensure all changes take effect:"
echo "sudo reboot"
echo ""
echo "Backup location: $LATEST_BACKUP"