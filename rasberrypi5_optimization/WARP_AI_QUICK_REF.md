# 🤖 Warp.dev AI Agent - Quick Reference Card

## 🚨 EMERGENCY COMMANDS (Copy-Paste Ready)

### Critical System Recovery:
```bash
# COMPLETE EMERGENCY ROLLBACK (if system boots)
sudo cp /boot/firmware/config.txt.backup /boot/firmware/config.txt && sudo reboot

# STRUCTURED COMPLETE ROLLBACK
sudo /home/sri/rasberrypi5_optimization/scripts/current/rollback/rollback_all_optimizations.sh
```

### System Status Check:
```bash
# Quick health check
/home/sri/rasberrypi5_optimization/scripts/current/monitoring/check_system_health.sh

# Temperature check
vcgencmd measure_temp && vcgencmd get_throttled
```

### Selective Rollbacks:
```bash
# CPU issues (overheating)
sudo /home/sri/rasberrypi5_optimization/scripts/current/rollback/rollback_cpu_overclock.sh

# GPU/Display issues
sudo /home/sri/rasberrypi5_optimization/scripts/current/rollback/rollback_gpu_settings.sh
```

## 🎯 Success Indicators
- **CPU Max:** 2800MHz
- **GPU V3D:** ~1100MHz  
- **Temperature:** <75°C
- **Throttling:** `throttled=0x0`
- **Dual Monitors:** Working

## 📁 Critical Files
- **Config:** `/boot/firmware/config.txt`
- **Backup:** `/boot/firmware/config.txt.backup`
- **Full Doc:** `/home/sri/rasberrypi5_optimization/docs/WARP_AI_SYSTEM_RECOVERY.md`

## 🔍 Quick Diagnostics
```bash
# Check overclocking status
cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_max_freq
vcgencmd measure_clock v3d

# Monitor continuously  
watch -n 1 'vcgencmd measure_temp && vcgencmd get_throttled'
```

---
**Full Documentation:** `WARP_AI_SYSTEM_RECOVERY.md`