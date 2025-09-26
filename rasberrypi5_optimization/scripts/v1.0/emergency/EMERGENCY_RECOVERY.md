# 🚨 EMERGENCY RECOVERY - Raspberry Pi 5

## If Your Pi Won't Boot After Overclocking

### Method 1: SD Card Recovery (Recommended)
1. **Power off** the Raspberry Pi completely
2. **Remove SD card** and insert into another computer
3. **Navigate to** the boot partition (usually auto-mounted)
4. **Restore backup:**
   ```bash
   cp config.txt.backup config.txt
   ```
5. **Safely eject** SD card and reinsert into Pi
6. **Power on** - Pi should boot with stock settings

### Method 2: Recovery Boot (Pi 5)
1. **Hold SHIFT** during boot to enter recovery mode
2. **Access file system** through recovery interface
3. **Restore config file** from backup

### Method 3: Manual Boot Parameters
1. **Edit cmdline.txt** on SD card from another computer
2. **Add:** `dwc_otg.fiq_fix_enable=1`
3. **Boot once**, then fix config.txt

## 🔍 Backup Locations
- **Main backup:** `/boot/firmware/config.txt.backup`
- **Pre-rollback:** `/boot/firmware/config.txt.pre-rollback`
- **CPU rollback:** `/boot/firmware/config.txt.cpu-rollback-backup`
- **GPU rollback:** `/boot/firmware/config.txt.gpu-rollback-backup`

## 📋 Stock Settings (Safe Values)
```ini
# Safe/Stock Pi 5 config.txt values
arm_freq=2400          # Stock max CPU
gpu_freq=500           # Stock GPU
v3d_freq=960           # Stock V3D
over_voltage=0         # No voltage boost
gpu_mem=8              # Minimum GPU memory
temp_limit=85          # Default thermal limit
```

## 🆘 If All Else Fails
1. **Download fresh Raspberry Pi OS image**
2. **Flash to new SD card**
3. **Copy your data** from old card
4. **Start fresh** with incremental overclocking

## ⚡ Quick Recovery Commands
```bash
# Quick revert to stock (if system boots)
sudo cp /boot/firmware/config.txt.backup /boot/firmware/config.txt
sudo reboot

# Check if overclocking caused issues
vcgencmd get_throttled
# 0x0 = no issues
# Non-zero = throttling occurred
```

## 🌡️ Temperature Monitoring
```bash
# Continuous temperature monitoring
watch -n 1 'vcgencmd measure_temp && vcgencmd get_throttled'

# Safe temperature ranges:
# Idle: 40-55°C
# Load: 60-70°C  
# Critical: >80°C (will throttle)
```

## 📞 Emergency Contacts
- **Raspberry Pi Forums:** https://www.raspberrypi.org/forums/
- **Official Documentation:** https://www.raspberrypi.org/documentation/

---
**Created:** $(date)
**System:** Raspberry Pi 5 8GB
**Backup Status:** ✅ Available