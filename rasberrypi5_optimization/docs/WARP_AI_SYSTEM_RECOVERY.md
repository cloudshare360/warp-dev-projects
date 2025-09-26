# 🤖 Warp.dev AI Agent - Raspberry Pi 5 System Recovery Guide

**Document Version:** 1.0  
**Created:** 2025-09-17  
**System:** Raspberry Pi 5 8GB  
**OS:** Debian GNU/Linux (Raspberry Pi OS)  
**Purpose:** AI agent system understanding and recovery procedures  

---

## 🎯 AI Agent Context Summary

This document provides complete technical context for Warp.dev AI agents to understand, troubleshoot, and recover a Raspberry Pi 5 optimization system. The system includes CPU/GPU overclocking, dual monitor support, and comprehensive rollback mechanisms.

---

## 🏗️ System Architecture Overview

### **Core Problem Solved:**
- **Original Issue:** Raspberry Pi 5 went blank when connecting dual monitors
- **Root Cause:** Insufficient GPU memory allocation (8MB) + no display optimizations
- **Solution:** Comprehensive overclocking + 512MB GPU memory + dual monitor optimizations

### **Directory Structure:**
```
/home/sri/rasberrypi5_optimization/
├── pi5_optimize                     # Main launcher script
├── manage_versions.sh               # Version control system
├── README.md                        # User documentation
├── QUICK_START.md                   # Emergency procedures
├── scripts/
│   ├── current/                     # Active scripts (v1.0)
│   │   ├── rollback/               # Rollback tools
│   │   │   ├── rollback_all_optimizations.sh
│   │   │   ├── rollback_cpu_overclock.sh
│   │   │   └── rollback_gpu_settings.sh
│   │   ├── monitoring/             # System monitoring
│   │   │   └── check_system_health.sh
│   │   └── emergency/              # Recovery guides
│   │       └── EMERGENCY_RECOVERY.md
│   └── v1.0/                       # Archived version
├── backups/                         # Script backups
├── docs/                           # Documentation
│   ├── CHANGELOG.md
│   └── WARP_AI_SYSTEM_RECOVERY.md  # This file
└── logs/                           # Operation logs
    └── version_changes.log
```

---

## ⚙️ Configuration Changes Applied

### **File Modified:** `/boot/firmware/config.txt`
**Original Backup Location:** `/boot/firmware/config.txt.backup`

### **Applied Configurations:**
```ini
# === CPU OVERCLOCKING ===
arm_freq=2800                    # CPU: 2400MHz → 2800MHz (+400MHz)
over_voltage=6                   # CPU voltage boost (+0.15V)
temp_limit=75                    # Conservative thermal limit
initial_turbo=60                 # Turbo boost duration

# === GPU OVERCLOCKING ===
gpu_freq=700                     # GPU core: ~545MHz → 700MHz
v3d_freq=1100                    # V3D graphics: 960MHz → 1100MHz

# === MEMORY OPTIMIZATION ===
sdram_freq=3600                  # RAM frequency boost
over_voltage_sdram=2             # RAM voltage for stability
cma=256                          # Contiguous Memory Allocator

# === GPU MEMORY (Pi 5 Specific) ===
dtoverlay=vc4-kms-v3d,cma-512   # 512MB GPU memory allocation
max_framebuffers=2               # Dual monitor support

# === DUAL MONITOR OPTIMIZATION ===
hdmi_force_hotplug:0=1           # Force HDMI 0 output
hdmi_force_hotplug:1=1           # Force HDMI 1 output
config_hdmi_boost:0=7            # Maximum signal strength port 0
config_hdmi_boost:1=7            # Maximum signal strength port 1
hdmi_enable_4kp60:0=1            # 4K support port 0
hdmi_enable_4kp60:1=1            # 4K support port 1
```

---

## 🔍 System Status Verification

### **Expected Performance Indicators:**
```bash
# CPU Status (should show 2800MHz max)
cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_max_freq
# Expected: 2800000

# GPU V3D Status (should show ~1100MHz)
vcgencmd measure_clock v3d
# Expected: frequency(0)=1100000000+

# Temperature Check (should be <75°C)
vcgencmd measure_temp
# Expected: temp=XX.X'C (XX < 75)

# Throttling Check (should show no throttling)
vcgencmd get_throttled
# Expected: throttled=0x0

# GPU Memory (may show 8M due to Pi 5 CMA system)
vcgencmd get_mem gpu
# Note: Uses CMA instead of traditional gpu_mem
```

### **Quick Health Check Command:**
```bash
/home/sri/rasberrypi5_optimization/scripts/current/monitoring/check_system_health.sh
```

---

## 🚨 Emergency Recovery Procedures

### **CRITICAL: System Won't Boot**

#### Method 1: SD Card Recovery (Most Reliable)
```bash
# On another computer with SD card access:
# 1. Power off Pi completely
# 2. Remove SD card, insert in computer
# 3. Navigate to boot partition (auto-mounts)
# 4. Execute recovery:
cp config.txt.backup config.txt

# 5. Safely eject, reinsert in Pi, power on
```

#### Method 2: Emergency One-Liner (if system boots unstable)
```bash
sudo cp /boot/firmware/config.txt.backup /boot/firmware/config.txt && sudo reboot
```

### **CRITICAL: System Boots but Unstable**

#### Complete System Rollback:
```bash
sudo /home/sri/rasberrypi5_optimization/scripts/current/rollback/rollback_all_optimizations.sh
```

#### Selective Rollbacks:
```bash
# CPU overheating issues:
sudo /home/sri/rasberrypi5_optimization/scripts/current/rollback/rollback_cpu_overclock.sh

# Display/GPU issues:
sudo /home/sri/rasberrypi5_optimization/scripts/current/rollback/rollback_gpu_settings.sh
```

---

## 🔄 Rollback Script Functionality

### **rollback_all_optimizations.sh**
- **Purpose:** Complete reversion to stock settings
- **Action:** Restores original `/boot/firmware/config.txt.backup`
- **Scope:** All optimizations removed
- **Safety:** Creates pre-rollback backup
- **Reboot:** Required after execution

### **rollback_cpu_overclock.sh**
- **Purpose:** Remove only CPU overclocking
- **Preserves:** GPU settings, dual monitor config
- **Removes:** arm_freq, over_voltage, temp_limit, initial_turbo
- **Use Case:** Thermal issues, CPU instability

### **rollback_gpu_settings.sh**
- **Purpose:** Remove GPU and display optimizations
- **Preserves:** CPU overclocking
- **Removes:** GPU frequencies, dual monitor settings, GPU memory
- **Use Case:** Display issues, graphics problems

---

## 📊 AI Agent Diagnostic Commands

### **System Health Assessment:**
```bash
# Comprehensive health check
/home/sri/rasberrypi5_optimization/scripts/current/monitoring/check_system_health.sh

# Quick status
/home/sri/pi5_optimize status

# Temperature monitoring
watch -n 1 'vcgencmd measure_temp && vcgencmd get_throttled'
```

### **Configuration Verification:**
```bash
# Check applied overclocking settings
grep -E "arm_freq|gpu_freq|v3d_freq|over_voltage" /boot/firmware/config.txt

# Verify dual monitor settings
grep -E "hdmi_force_hotplug|config_hdmi_boost|hdmi_enable_4kp60" /boot/firmware/config.txt

# Check GPU memory configuration
grep -E "cma|dtoverlay=vc4-kms-v3d" /boot/firmware/config.txt
```

### **Performance Validation:**
```bash
# CPU frequency validation
for cpu in /sys/devices/system/cpu/cpu*/cpufreq/scaling_max_freq; do
    echo "$(basename $(dirname $(dirname $cpu))): $(cat $cpu) Hz"
done

# GPU frequencies
vcgencmd measure_clock arm && vcgencmd measure_clock core && vcgencmd measure_clock v3d

# Voltage monitoring
vcgencmd measure_volts core && vcgencmd measure_volts sdram_c
```

---

## 🎯 AI Agent Decision Tree

### **If Temperature > 75°C:**
```bash
sudo /home/sri/rasberrypi5_optimization/scripts/current/rollback/rollback_cpu_overclock.sh
```

### **If Throttling Detected (get_throttled != 0x0):**
```bash
# Check thermal first, then:
sudo /home/sri/rasberrypi5_optimization/scripts/current/rollback/rollback_all_optimizations.sh
```

### **If Dual Monitor Issues:**
```bash
sudo /home/sri/rasberrypi5_optimization/scripts/current/rollback/rollback_gpu_settings.sh
```

### **If Complete System Instability:**
```bash
sudo /home/sri/rasberrypi5_optimization/scripts/current/rollback/rollback_all_optimizations.sh
```

### **If Boot Failure:**
```
1. SD card recovery method
2. Restore config.txt.backup
3. Power cycle system
```

---

## 📁 Critical File Locations

### **Configuration Files:**
- **Active Config:** `/boot/firmware/config.txt`
- **Original Backup:** `/boot/firmware/config.txt.backup`
- **Pre-rollback Backup:** `/boot/firmware/config.txt.pre-rollback`

### **Script Locations:**
- **Main Launcher:** `/home/sri/pi5_optimize`
- **Health Monitor:** `/home/sri/rasberrypi5_optimization/scripts/current/monitoring/check_system_health.sh`
- **Complete Rollback:** `/home/sri/rasberrypi5_optimization/scripts/current/rollback/rollback_all_optimizations.sh`
- **Emergency Guide:** `/home/sri/rasberrypi5_optimization/scripts/current/emergency/EMERGENCY_RECOVERY.md`

### **Documentation:**
- **Main README:** `/home/sri/rasberrypi5_optimization/README.md`
- **Quick Start:** `/home/sri/rasberrypi5_optimization/QUICK_START.md`
- **This Document:** `/home/sri/rasberrypi5_optimization/docs/WARP_AI_SYSTEM_RECOVERY.md`

---

## 🔄 Version Control Understanding

### **Version Management:**
```bash
# List available versions
/home/sri/rasberrypi5_optimization/manage_versions.sh list

# Switch to previous version (if available)
/home/sri/rasberrypi5_optimization/manage_versions.sh switch v1.0

# Create backup before changes
/home/sri/rasberrypi5_optimization/manage_versions.sh backup
```

### **Current Version:** v1.0
- All scripts archived in `/home/sri/rasberrypi5_optimization/scripts/v1.0/`
- Active scripts in `/home/sri/rasberrypi5_optimization/scripts/current/`
- Change history logged in `/home/sri/rasberrypi5_optimization/logs/version_changes.log`

---

## 🎯 Success Indicators

### **System is Healthy When:**
- CPU max frequency: 2800MHz
- GPU V3D frequency: ~1100MHz
- Temperature: <60°C (excellent), <70°C (good), <75°C (acceptable)
- Throttling: `throttled=0x0`
- Dual monitors: Both working without blank screens
- Voltage: ~1.0V core (boosted from ~0.89V stock)

### **Performance Gains Achieved:**
- **CPU Performance:** +17% (2400MHz → 2800MHz)
- **GPU Performance:** +15% (960MHz → 1100MHz V3D)
- **Dual Monitor Support:** Fixed (was completely broken)
- **System Stability:** Maintained (no throttling)

---

## 🚨 AI Agent Recovery Commands

### **Quick Recovery (Copy-Paste Ready):**
```bash
# Emergency complete rollback
sudo cp /boot/firmware/config.txt.backup /boot/firmware/config.txt && sudo reboot

# Structured complete rollback
sudo /home/sri/rasberrypi5_optimization/scripts/current/rollback/rollback_all_optimizations.sh

# Check system status
/home/sri/rasberrypi5_optimization/scripts/current/monitoring/check_system_health.sh

# Monitor temperature continuously
watch -n 1 'vcgencmd measure_temp && vcgencmd get_throttled'
```

---

## 📝 AI Agent Notes

1. **Always check temperature first** - overheating is the primary failure mode
2. **Throttling detection is critical** - `get_throttled` output other than `0x0` indicates problems
3. **Dual monitor issues** were the original problem - GPU memory and HDMI settings fix this
4. **Rollback scripts are safe** - they create backups before making changes
5. **Boot failures require SD card recovery** - software recovery won't work if system won't boot
6. **Version control preserves working states** - v1.0 is known-good configuration
7. **Conservative thermal limits applied** - 75°C instead of default 85°C for safety

---

**End of Document - AI Agent Recovery Guide v1.0**