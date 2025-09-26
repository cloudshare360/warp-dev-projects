#!/bin/bash
# =================================================================
# COMPLETE ROLLBACK SCRIPT - Raspberry Pi 5 Optimizations
# =================================================================
# This script reverts ALL optimizations back to stock settings
# Created: $(date)
# Backup: /boot/firmware/config.txt.backup
# =================================================================

echo "🔄 RASPBERRY PI 5 - COMPLETE ROLLBACK TO STOCK SETTINGS"
echo "======================================================="

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo "❌ This script must be run as root (use sudo)"
   exit 1
fi

# Create additional backup before rollback
echo "📂 Creating pre-rollback backup..."
cp /boot/firmware/config.txt /boot/firmware/config.txt.pre-rollback
echo "✅ Backup created: /boot/firmware/config.txt.pre-rollback"

# Restore original configuration
echo "🔄 Restoring original config.txt..."
if [ -f /boot/firmware/config.txt.backup ]; then
    cp /boot/firmware/config.txt.backup /boot/firmware/config.txt
    echo "✅ Original configuration restored"
else
    echo "❌ ERROR: Original backup not found!"
    echo "   Manual recovery required - see emergency instructions"
    exit 1
fi

# Show what was reverted
echo ""
echo "🔄 REVERTED SETTINGS:"
echo "====================="
echo "❌ CPU Overclock: 2800MHz → 2400MHz (stock)"
echo "❌ GPU Overclock: V3D 1100MHz → 960MHz (stock)"
echo "❌ GPU Memory: 512MB → 8MB (stock)"
echo "❌ Voltage Boosts: Removed"
echo "❌ Memory Overclock: Removed"
echo "❌ Dual Monitor Optimizations: Removed"

echo ""
echo "⚠️  REBOOT REQUIRED TO APPLY CHANGES"
echo "📋 Next steps:"
echo "   1. sudo reboot"
echo "   2. Verify with: vcgencmd measure_clock arm"
echo "   3. Check temps: vcgencmd measure_temp"

echo ""
read -p "🔄 Reboot now to apply rollback? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🔄 Rebooting in 3 seconds..."
    sleep 3
    reboot
else
    echo "⚠️  Remember to reboot manually to apply changes!"
fi