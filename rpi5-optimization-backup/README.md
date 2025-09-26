# Raspberry Pi 5 8GB Performance Optimization Suite

**Comprehensive optimization package for heavy browser usage and multitasking**

## 🚀 Quick Start

```bash
# Run the complete optimization process (recommended)
./rpi5_optimize.sh

# Or check current status first
./rpi5_optimize.sh status
```

## 📋 What This Package Does

This optimization suite addresses the common issue of RPi5 hanging when running multiple browsers or applications by implementing targeted performance improvements:

### 🔧 Core Optimizations

- **Swap Expansion**: 512MB → 4GB (8x increase for browser tab management)
- **Memory Management**: Optimized swappiness (60→10) to prefer RAM over disk
- **CPU Performance**: Performance governor for maximum responsiveness
- **Browser Optimization**: Enhanced network buffers and file descriptor limits
- **System Tuning**: GPU memory reduction (more system RAM), optimized caching

### 🛡️ Safety Features

- **Complete Backup**: All system files backed up before changes
- **Boot Rollback**: Multiple rollback methods including boot-time recovery
- **Stress Testing**: Comprehensive validation before and after optimization
- **Incremental Application**: Changes applied and tested step-by-step

## 📁 Package Contents

```
/home/sri/rpi5-optimization-backup/
├── rpi5_optimize.sh          # Master optimization script
├── stress_test_suite.sh      # Comprehensive testing suite
├── optimized_config.sh       # Core optimization configuration
├── restore_system.sh         # System restoration script
├── boot_rollback_setup.sh    # Boot-time rollback setup
├── ROLLBACK_INSTRUCTIONS.txt # Recovery documentation
└── [timestamp]/              # Backup directory
    ├── sysctl.conf.backup
    ├── dphys-swapfile.backup
    ├── config.txt.backup
    └── [system state files]
```

## 🎯 Usage Scenarios

### Standard Optimization Process
```bash
./rpi5_optimize.sh
```
**Duration**: ~15 minutes (includes testing)
**What it does**: Complete optimization with safety checks

### Quick Status Check
```bash
./rpi5_optimize.sh status
```
Shows current system configuration and performance metrics

### Testing Only
```bash
./rpi5_optimize.sh test-only
```
Runs stress tests without applying changes (good for baseline)

### Apply Without Testing
```bash
./rpi5_optimize.sh apply-only
```
Applies optimizations immediately (use with caution)

## 🧪 Stress Testing

The package includes comprehensive stress testing:

```bash
# Quick tests (1 minute each)
./stress_test_suite.sh quick

# Medium tests (5 minutes each) 
./stress_test_suite.sh medium

# Thorough tests (15 minutes each)
./stress_test_suite.sh thorough
```

### Test Categories
- **CPU Stress**: Maximum processor load testing
- **Memory Stress**: RAM and swap usage validation
- **I/O Stress**: Storage performance and stability
- **Combined Stress**: Multi-component load simulation
- **Browser Simulation**: Heavy multitasking scenario

## 🔄 Rollback Options

If your system becomes unstable after optimization, multiple recovery methods are available:

### Method 1: Interactive Rollback (Recommended)
```bash
sudo rpi5-request-rollback
sudo reboot
```

### Method 2: Boot Flag Rollback
1. Power off RPi5
2. Remove SD card, mount on another computer
3. Create empty file `rpi5_rollback_requested` in boot partition
4. Reinsert SD card and boot

### Method 3: Manual Script
```bash
./restore_system.sh
sudo reboot
```

## 📊 Expected Performance Improvements

### Memory Management
- **Browser Stability**: Handles 20+ tabs without hanging
- **Swap Efficiency**: 8x more virtual memory for heavy applications
- **RAM Preference**: Reduced disk I/O with lower swappiness

### CPU Performance
- **Response Time**: Maximum frequency (2.8GHz) for better responsiveness
- **Multitasking**: Performance governor eliminates CPU throttling
- **Temperature**: Optimized thermal management

### System Resources
- **File Descriptors**: Increased limits for browser tab handling
- **Network Buffers**: Optimized for web browsing and streaming
- **Cache Management**: Better retention of frequently accessed data

## ⚠️ Important Considerations

### Before Running
- **Backup External Data**: While system files are backed up, ensure personal data is safe
- **Stable Power**: Use reliable power supply during optimization
- **Physical Access**: Ensure you can physically access the RPi5 for recovery
- **Free Space**: Requires at least 5GB free space for swap expansion

### After Optimization
- **Monitor Stability**: Watch system behavior for 24-48 hours
- **Temperature Monitoring**: Keep an eye on thermal performance
- **Performance Testing**: Test your typical workload scenarios
- **Keep Documentation**: Maintain access to rollback instructions

## 🔧 Manual Configuration Details

### Memory Management (`/etc/sysctl.conf`)
```bash
vm.swappiness=10                    # Prefer RAM over swap
vm.vfs_cache_pressure=50           # Keep more directory cache
vm.dirty_ratio=15                  # Flush dirty pages sooner
vm.dirty_background_ratio=5        # Background flushing
vm.overcommit_memory=1             # Allow memory overcommit
vm.min_free_kbytes=65536          # Reserve free memory
```

### Swap Configuration (`/etc/dphys-swapfile`)
```bash
CONF_SWAPSIZE=4096                # 4GB swap file
CONF_MAXSWAP=4096                 # Maximum swap limit
```

### CPU Performance
```bash
# Performance governor for all CPU cores
echo "performance" > /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor
```

### Boot Configuration (`/boot/firmware/config.txt`)
```bash
gpu_mem=8                         # Minimal GPU memory
arm_freq=2800                     # Maximum ARM frequency
over_voltage=2                    # Stable overclocking
disable_splash=1                  # Faster boot
```

## 📈 Monitoring Commands

### System Status
```bash
# Memory usage
free -h

# Swap usage
swapon --show

# CPU governor
cat /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor

# Temperature
vcgencmd measure_temp

# System load
cat /proc/loadavg

# Top memory consumers
ps aux --sort=-%mem | head -10
```

### Performance Testing
```bash
# Browser simulation stress test
stress-ng --fork 8 --vm 6 --vm-bytes 256M --timeout 60s

# Memory pressure test
stress-ng --vm 2 --vm-bytes $(free -m | awk 'NR==2{printf "%.0f\n", $7*0.8}')M --timeout 60s
```

## 🐛 Troubleshooting

### Common Issues

**Issue**: System becomes unresponsive during heavy browser usage
**Solution**: Check swap usage with `free -h`, may need larger swap or memory optimization

**Issue**: High temperature warnings
**Solution**: Monitor with `watch vcgencmd measure_temp`, consider additional cooling

**Issue**: Slow boot after optimization
**Solution**: Check systemd services with `systemctl list-units --failed`

### Log Locations
- Optimization logs: `/home/sri/rpi5-optimization-backup/`
- Stress test results: `/home/sri/rpi5-optimization-backup/stress_test_logs/`
- System logs: `journalctl -u rpi5-rollback.service`

### Recovery Testing
Before applying optimizations, test the rollback process:
```bash
sudo rpi5-request-rollback
# Confirm rollback request
sudo reboot
# Verify system boots normally
```

## 🤝 Support

For issues or questions:
1. Check logs in `/home/sri/rpi5-optimization-backup/stress_test_logs/`
2. Review rollback documentation: `ROLLBACK_INSTRUCTIONS.txt`
3. Test individual components with specific scripts
4. Monitor system stability over several days

## 📝 Version History

- **v1.0**: Initial optimization suite with comprehensive safety features
- Backup system, stress testing, rollback capability
- Optimized for RPi5 8GB with heavy browser usage

---

**⚡ Optimized for Raspberry Pi 5 8GB Model with Heavy Browser Usage**