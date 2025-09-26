#!/bin/bash
# =================================================================
# CPU OVERCLOCK ROLLBACK SCRIPT - Raspberry Pi 5
# =================================================================
# This script reverts ONLY CPU overclocking settings
# Keeps: GPU optimizations, memory settings, dual monitor config
# =================================================================

echo "🔄 RASPBERRY PI 5 - CPU OVERCLOCK ROLLBACK"
echo "=========================================="

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo "❌ This script must be run as root (use sudo)"
   exit 1
fi

# Create backup before changes
cp /boot/firmware/config.txt /boot/firmware/config.txt.cpu-rollback-backup

echo "🔄 Removing CPU overclock settings..."

# Remove CPU overclocking lines
sed -i '/^arm_freq=/d' /boot/firmware/config.txt
sed -i '/^over_voltage=[0-9]/d' /boot/firmware/config.txt
sed -i '/^initial_turbo=/d' /boot/firmware/config.txt
sed -i '/^temp_limit=/d' /boot/firmware/config.txt

echo "✅ CPU overclock settings removed"
echo ""
echo "🔄 CHANGES APPLIED:"
echo "==================="
echo "❌ CPU Frequency: 2800MHz → 2400MHz (stock)"
echo "❌ CPU Voltage: Removed boost"
echo "✅ GPU Settings: Kept"
echo "✅ Memory Settings: Kept"
echo "✅ Dual Monitor Config: Kept"

echo ""
echo "⚠️  REBOOT REQUIRED"
read -p "🔄 Reboot now? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    reboot
fi