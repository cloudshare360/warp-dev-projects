#!/bin/bash

# Manual revert script - immediately restore 2800MHz configuration
echo "Manually reverting to stable 2800MHz configuration..."

if [[ -f "/home/sri/rpi5-optimization-backup/restore_points/2800mhz_stable_20250923_144453/auto_heal/restore_2800mhz.sh" ]]; then
    /home/sri/rpi5-optimization-backup/restore_points/2800mhz_stable_20250923_144453/auto_heal/restore_2800mhz.sh
    echo "Manual revert completed. Reboot to apply 2800MHz configuration."
else
    echo "Error: Restore script not found!"
    exit 1
fi
