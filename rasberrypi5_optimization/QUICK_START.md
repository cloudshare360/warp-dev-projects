# ⚡ Quick Start Guide - Raspberry Pi 5 Optimization

## 🚀 Immediate Actions

### 1. Check Current Status
```bash
cd ~/rasberrypi5_optimization
./scripts/current/monitoring/check_system_health.sh
```

### 2. If You Need to Rollback IMMEDIATELY
```bash
# COMPLETE ROLLBACK (safest option)
cd ~/rasberrypi5_optimization
sudo ./scripts/current/rollback/rollback_all_optimizations.sh

# The script will:
# ✅ Create backup before changes
# ✅ Restore original config
# ✅ Offer immediate reboot
# ✅ Show exactly what was reverted
```

## 🔧 Selective Rollbacks

### CPU Running Too Hot?
```bash
sudo ./scripts/current/rollback/rollback_cpu_overclock.sh
# Keeps: GPU optimizations, dual monitor support
# Removes: CPU overclock (2.8GHz → 2.4GHz)
```

### Display Issues?
```bash
sudo ./scripts/current/rollback/rollback_gpu_settings.sh
# Keeps: CPU overclock  
# Removes: GPU optimizations, dual monitor settings
```

## 📊 Monitor Your System

### Real-time Health Check
```bash
watch -n 1 './scripts/current/monitoring/check_system_health.sh'
```

### Just Temperature
```bash
watch -n 1 'vcgencmd measure_temp'
```

### Stress Test (Optional)
```bash
stress-ng --cpu 4 --timeout 60s
# Run health check during this to see max temps
```

## 🚨 Emergency Situations

### System Won't Boot?
1. **Power off** Pi completely
2. **Remove SD card**
3. **Insert in another computer**
4. **Find boot partition** (auto-mounts)
5. **Run:** `cp config.txt.backup config.txt`
6. **Safely eject and reinsert** in Pi
7. **Boot** - should work with stock settings

### System Boots but Unstable?
```bash
# Quick emergency rollback
sudo cp /boot/firmware/config.txt.backup /boot/firmware/config.txt
sudo reboot
```

## 📋 What's Currently Applied

- ✅ **CPU:** 2400MHz → **2800MHz** (+400MHz boost)
- ✅ **GPU:** V3D 960MHz → **1100MHz** (+140MHz boost)  
- ✅ **Memory:** GPU 8MB → **512MB** (for dual monitors)
- ✅ **Dual Monitor:** HDMI force hotplug enabled

## 🌡️ Temperature Guidelines

| Temperature | Status | Action |
|-------------|--------|---------|
| < 60°C | ✅ Excellent | Continue normal use |
| 60-70°C | ⚠️ Warm | Monitor closely |
| 70-75°C | ⚠️ Hot | Consider CPU rollback |
| > 75°C | ❌ Critical | Immediate rollback needed |

## ⚡ One-Line Commands

```bash
# Status check
~/rasberrypi5_optimization/scripts/current/monitoring/check_system_health.sh

# Complete rollback
sudo ~/rasberrypi5_optimization/scripts/current/rollback/rollback_all_optimizations.sh

# CPU rollback only  
sudo ~/rasberrypi5_optimization/scripts/current/rollback/rollback_cpu_overclock.sh

# GPU rollback only
sudo ~/rasberrypi5_optimization/scripts/current/rollback/rollback_gpu_settings.sh
```

## 🔍 Quick Checks

### Is Overclocking Active?
```bash
# Should show 2800000 (2.8GHz) if CPU overclock active
cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_max_freq

# Should show ~1100MHz if GPU overclock active
vcgencmd measure_clock v3d
```

### Is System Stable?
```bash
# Should show 0x0 (no throttling)
vcgencmd get_throttled
```

### Current Temperature?
```bash
# Should be under 75°C
vcgencmd measure_temp
```

## 📁 Important Files

- **Main Docs:** `~/rasberrypi5_optimization/README.md`
- **Emergency Guide:** `~/rasberrypi5_optimization/scripts/current/emergency/EMERGENCY_RECOVERY.md`
- **Original Backup:** `/boot/firmware/config.txt.backup`

---

**⚠️ When in doubt, use complete rollback first, then re-apply optimizations gradually!**