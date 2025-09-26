#!/bin/bash

# RPi5 8GB Optimization Configuration Script
# Optimized for heavy browser usage and multitasking

set -e

echo "=== RPi5 8GB OPTIMIZATION CONFIGURATION ==="
echo "This script applies optimizations for:"
echo "- Heavy browser usage (multiple tabs/windows)"
echo "- Increased swap space (4GB)"
echo "- Optimized memory management"
echo "- Performance CPU scaling"
echo "- Thermal optimization"
echo ""

# 1. SWAP OPTIMIZATION
# Current: 512MB -> Recommended: 4GB (half of RAM for browser-heavy usage)
echo "Configuring swap space (512MB -> 4GB)..."
sudo swapoff -a || true

# Configure dphys-swapfile
sudo tee /etc/dphys-swapfile > /dev/null << 'EOF'
# /etc/dphys-swapfile - user settings for dphys-swapfile package
# author Neil Franklin, last modification 2010.05.05
# copyright ETH Zurich Physics Departement
#   use under either modified/non-advertising BSD or GPL license

# this file is sourced with . so full normal sh syntax applies

# the default settings are added as commented out CONF_*=* lines


# where we want the swapfile to be, this is the default
#CONF_SWAPFILE=/var/swap
CONF_SWAPFILE=/var/swap

# set size to absolute value, leaving empty (default) then uses computed value
#   you most likely don't want this, unless you have an special disk situation
# RPi5 8GB: Set to 4GB for browser-heavy usage
CONF_SWAPSIZE=4096

# set size to computed value, this times RAM size, dynamically adapts,
#   guarantees that there is enough swap without wasting disk space on excess
#CONF_SWAPFACTOR=2

# restrict size (computed and absolute!) to maximally this limit
#   can be set to empty for no limit, but beware of filled partitions!
#   this is/was a (outdated?) 32bit kernel limit (in MBytes), do not overrun it
#   but is also sensible on 64bit to prevent filling /var or even / partition
#CONF_MAXSWAP=2048
CONF_MAXSWAP=4096
EOF

# 2. MEMORY MANAGEMENT OPTIMIZATION
echo "Optimizing memory management parameters..."
sudo tee -a /etc/sysctl.conf > /dev/null << 'EOF'

# RPi5 8GB Browser Optimization Settings
# Applied $(date)

# Reduce swappiness for better performance (default: 60 -> 10)
# This makes the kernel prefer RAM over swap, reducing disk I/O
vm.swappiness=10

# Optimize cache pressure (default: 100 -> 50)
# This helps retain more directory/inode cache for better performance
vm.vfs_cache_pressure=50

# Optimize dirty page handling for better responsiveness
# Reduce dirty ratio to flush pages sooner (default: 20 -> 15)
vm.dirty_ratio=15
vm.dirty_background_ratio=5

# Optimize network buffer sizes for better browser performance
net.core.rmem_default=262144
net.core.rmem_max=16777216
net.core.wmem_default=262144
net.core.wmem_max=16777216

# Optimize shared memory for better application performance
kernel.shmmax=268435456

# Optimize file descriptor limits for browser tabs
fs.file-max=2097152

# Memory overcommit optimization for better memory utilization
vm.overcommit_memory=1
vm.overcommit_ratio=50

# Optimize page allocation for large memory systems
vm.min_free_kbytes=65536
EOF

# 3. CPU SCALING OPTIMIZATION
echo "Setting up performance CPU governor..."
# Create systemd service for CPU governor
sudo tee /etc/systemd/system/cpu-performance.service > /dev/null << 'EOF'
[Unit]
Description=Set CPU Governor to Performance
After=multi-user.target

[Service]
Type=oneshot
ExecStart=/bin/bash -c 'for cpu in /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor; do [[ -w "$cpu" ]] && echo "performance" > "$cpu"; done'
RemainAfterExit=yes

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable cpu-performance.service

# 4. BOOT CONFIGURATION OPTIMIZATION
echo "Optimizing boot configuration..."

# Check which config file exists and backup/modify accordingly
CONFIG_FILE=""
if [[ -f /boot/firmware/config.txt ]]; then
    CONFIG_FILE="/boot/firmware/config.txt"
elif [[ -f /boot/config.txt ]]; then
    CONFIG_FILE="/boot/config.txt"
fi

if [[ -n "$CONFIG_FILE" ]]; then
    # Add optimization settings to config.txt
    sudo tee -a "$CONFIG_FILE" > /dev/null << 'EOF'

# RPi5 Performance Optimizations
# GPU memory split - minimize for more system RAM (default: 76M -> 8M)
gpu_mem=8

# Disable unnecessary features for performance
disable_splash=1

# ARM frequency optimization
arm_freq=2800
over_voltage=2

# Memory frequency optimization
#arm_freq_min=1500

# Enable hardware acceleration
dtparam=audio=on
EOF
fi

# 5. SYSTEMD OPTIMIZATION
echo "Optimizing systemd settings..."
sudo mkdir -p /etc/systemd/system.conf.d/
sudo tee /etc/systemd/system.conf.d/rpi5-optimization.conf > /dev/null << 'EOF'
[Manager]
# Optimize service startup
DefaultTimeoutStopSec=10s
DefaultTimeoutStartSec=10s

# Optimize memory limits
DefaultMemoryAccounting=yes
DefaultTasksMax=8192

# Optimize for desktop usage
DefaultLimitNOFILE=65536
EOF

echo ""
echo "=== CONFIGURATION CREATED ==="
echo "Optimizations prepared:"
echo "✓ Swap: 512MB -> 4GB"
echo "✓ Swappiness: 60 -> 10 (prefer RAM)"
echo "✓ CPU Governor: ondemand -> performance"
echo "✓ GPU Memory: reduced to 8MB (more system RAM)"
echo "✓ Memory management optimized for browsers"
echo "✓ Network buffers optimized"
echo "✓ File descriptor limits increased"
echo ""
echo "Ready for stress testing and application!"