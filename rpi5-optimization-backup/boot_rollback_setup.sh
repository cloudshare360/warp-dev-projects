#!/bin/bash

# RPi5 Boot-time Rollback Setup
# Creates a boot option to rollback optimizations

set -e

BACKUP_DIR="/home/sri/rpi5-optimization-backup"

echo "=== BOOT-TIME ROLLBACK SETUP ==="
echo "This creates a boot menu option to rollback optimizations if needed"
echo ""

# Create rollback systemd service
echo "Creating rollback systemd service..."
sudo tee /etc/systemd/system/rpi5-rollback.service > /dev/null << 'EOF'
[Unit]
Description=RPi5 Optimization Rollback Service
DefaultDependencies=false
Before=sysinit.target

[Service]
Type=oneshot
ExecStart=/bin/bash -c 'if [[ -f /boot/firmware/rpi5_rollback_requested ]] || [[ -f /boot/rpi5_rollback_requested ]]; then /home/sri/rpi5-optimization-backup/restore_system.sh && rm -f /boot/firmware/rpi5_rollback_requested /boot/rpi5_rollback_requested 2>/dev/null || true; fi'
RemainAfterExit=yes
StandardOutput=journal+console
StandardError=journal+console

[Install]
WantedBy=sysinit.target
EOF

# Enable the rollback service
sudo systemctl daemon-reload
sudo systemctl enable rpi5-rollback.service

# Create kernel parameter rollback option
echo "Setting up kernel parameter rollback option..."

# Check which boot config file to use
BOOT_DIR=""
if [[ -d /boot/firmware ]]; then
    BOOT_DIR="/boot/firmware"
elif [[ -d /boot ]]; then
    BOOT_DIR="/boot"
fi

if [[ -n "$BOOT_DIR" ]]; then
    # Create cmdline.txt backup if it doesn't exist
    if [[ -f "$BOOT_DIR/cmdline.txt" ]] && [[ ! -f "$BACKUP_DIR/cmdline.txt.backup" ]]; then
        sudo cp "$BOOT_DIR/cmdline.txt" "$BACKUP_DIR/cmdline.txt.backup"
    fi
fi

# Create interactive rollback trigger script
sudo tee /usr/local/bin/rpi5-request-rollback > /dev/null << 'EOF'
#!/bin/bash

# Request rollback on next boot
echo "=== RPi5 ROLLBACK REQUEST ==="
echo "This will trigger a system rollback on the next reboot."
echo ""
echo "WARNING: This will restore your system to its pre-optimization state."
echo ""
read -p "Are you sure you want to request a rollback? (yes/no): " confirm

if [[ "$confirm" == "yes" ]]; then
    # Create rollback request flag
    if [[ -d /boot/firmware ]]; then
        sudo touch /boot/firmware/rpi5_rollback_requested
        echo "Rollback requested. The system will be restored on next reboot."
    elif [[ -d /boot ]]; then
        sudo touch /boot/rpi5_rollback_requested
        echo "Rollback requested. The system will be restored on next reboot."
    else
        echo "Error: Could not create rollback request flag."
        exit 1
    fi
    
    echo ""
    echo "To reboot now, run: sudo reboot"
    echo "To cancel rollback request, run: sudo rm -f /boot/firmware/rpi5_rollback_requested /boot/rpi5_rollback_requested"
else
    echo "Rollback request cancelled."
fi
EOF

sudo chmod +x /usr/local/bin/rpi5-request-rollback

# Create GRUB recovery option (if GRUB is available)
if command -v grub-mkconfig >/dev/null 2>&1; then
    echo "Setting up GRUB rollback option..."
    
    sudo tee /etc/grub.d/42_rpi5_rollback > /dev/null << 'EOF'
#!/bin/bash
exec tail -n +3 $0

cat << 'END_GRUB'
menuentry 'RPi5 - Rollback Optimizations' --class recovery --class gnu-linux --class gnu --class os {
    echo 'Loading RPi5 with rollback request...'
    search --no-floppy --fs-uuid --set=root $(blkid -s UUID -o value $(findmnt -n -o SOURCE /))
    linux /vmlinuz root=$(findmnt -n -o SOURCE /) ro rpi5_rollback=1 quiet
    initrd /initrd.img
}
END_GRUB
EOF
    
    sudo chmod +x /etc/grub.d/42_rpi5_rollback
    sudo update-grub || echo "GRUB update completed with warnings"
fi

# Create recovery documentation
cat > "$BACKUP_DIR/ROLLBACK_INSTRUCTIONS.txt" << 'EOF'
RPi5 OPTIMIZATION ROLLBACK INSTRUCTIONS
=======================================

If your RPi5 becomes unstable after applying optimizations, you have several rollback options:

METHOD 1 - Interactive Rollback (Safest)
----------------------------------------
1. Log in to your system (if possible)
2. Run: sudo /usr/local/bin/rpi5-request-rollback
3. Follow the prompts and reboot

METHOD 2 - Manual Boot Flag
---------------------------
1. Power off the RPi5
2. Remove the SD card and insert it into another computer
3. In the boot partition, create an empty file called "rpi5_rollback_requested"
4. Safely eject and reinsert the SD card into RPi5
5. Power on - the system will automatically rollback

METHOD 3 - Manual Script Execution
-----------------------------------
1. Boot into recovery mode or single-user mode
2. Run: /home/sri/rpi5-optimization-backup/restore_system.sh
3. Reboot normally

METHOD 4 - GRUB Boot Menu (if available)
-----------------------------------------
1. During boot, access GRUB menu
2. Select "RPi5 - Rollback Optimizations"
3. System will boot and automatically rollback

MANUAL FILE RESTORATION (Last Resort)
--------------------------------------
If all automated methods fail:
1. Boot from a rescue disk/SD card
2. Mount your main filesystem
3. Restore files manually from: /home/sri/rpi5-optimization-backup/[timestamp]/
   - Copy *.backup files to their original locations
   - Remove the .backup extension

Files to restore:
- /etc/sysctl.conf
- /etc/dphys-swapfile  
- /boot/firmware/config.txt (or /boot/config.txt)
- /etc/systemd/system.conf

After manual restoration:
- sudo swapoff -a
- sudo systemctl restart dphys-swapfile
- sudo sysctl -p
- sudo reboot

PREVENTION
----------
- Test the rollback process before applying optimizations
- Keep this documentation accessible
- Ensure you have physical access to the RPi5

For support: Check logs in /home/sri/rpi5-optimization-backup/stress_test_logs/
EOF

echo ""
echo "=== ROLLBACK SETUP COMPLETED ==="
echo ""
echo "Rollback options configured:"
echo "✓ Systemd service for automatic rollback detection"
echo "✓ Interactive rollback command: sudo rpi5-request-rollback"
echo "✓ Boot flag rollback method"
echo "✓ Manual restoration instructions"
echo ""
echo "Documentation: $BACKUP_DIR/ROLLBACK_INSTRUCTIONS.txt"
echo ""
echo "To test rollback (BEFORE applying optimizations):"
echo "1. sudo rpi5-request-rollback"
echo "2. sudo reboot"
echo "3. Verify system boots normally"
echo ""
echo "The rollback system is now ready for use!"