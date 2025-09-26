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
