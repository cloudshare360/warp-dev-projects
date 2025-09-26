#!/bin/bash

# Restore this specific adaptive configuration
CONFIG_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FREQUENCY="2400"

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
