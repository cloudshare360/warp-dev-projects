#!/bin/bash
# =================================================================
# GPU SETTINGS ROLLBACK SCRIPT - Raspberry Pi 5
# =================================================================
# This script reverts ONLY GPU and dual monitor settings
# Keeps: CPU overclocking, memory settings
# =================================================================

echo "🔄 RASPBERRY PI 5 - GPU SETTINGS ROLLBACK"
echo "========================================="

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo "❌ This script must be run as root (use sudo)"
   exit 1
fi

# Create backup before changes
cp /boot/firmware/config.txt /boot/firmware/config.txt.gpu-rollback-backup

echo "🔄 Removing GPU and dual monitor settings..."

# Remove GPU overclocking lines
sed -i '/^gpu_freq=/d' /boot/firmware/config.txt
sed -i '/^v3d_freq=/d' /boot/firmware/config.txt

# Remove dual monitor optimization lines
sed -i '/^hdmi_force_hotplug:/d' /boot/firmware/config.txt
sed -i '/^config_hdmi_boost:/d' /boot/firmware/config.txt
sed -i '/^hdmi_enable_4kp60:/d' /boot/firmware/config.txt

# Remove GPU memory settings
sed -i '/^gpu_mem=/d' /boot/firmware/config.txt
sed -i '/^cma=/d' /boot/firmware/config.txt
sed -i '/dtoverlay=vc4-kms-v3d,cma-512/d' /boot/firmware/config.txt

# Restore basic VC4 overlay
if ! grep -q "dtoverlay=vc4-kms-v3d$" /boot/firmware/config.txt; then
    echo "dtoverlay=vc4-kms-v3d" >> /boot/firmware/config.txt
fi

echo "✅ GPU and dual monitor settings removed"
echo ""
echo "🔄 CHANGES APPLIED:"
echo "==================="
echo "❌ GPU Overclocking: Removed"
echo "❌ GPU Memory: 512MB → 8MB (stock)"
echo "❌ Dual Monitor Optimizations: Removed"
echo "✅ CPU Overclock: Kept"
echo "✅ Memory Overclock: Kept"

echo ""
echo "⚠️  WARNING: Dual monitor support may be reduced"
echo "⚠️  REBOOT REQUIRED"
read -p "🔄 Reboot now? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    reboot
fi