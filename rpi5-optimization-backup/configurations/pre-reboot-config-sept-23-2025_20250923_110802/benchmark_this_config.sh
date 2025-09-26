#!/bin/bash

CONFIG_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_NAME="$(basename "$CONFIG_DIR" | cut -d'_' -f1)"

echo "=== BENCHMARKING CONFIGURATION: $CONFIG_NAME ==="

# Quick system performance check
echo "Current System State:"
echo "Memory Usage:"
free -h
echo ""
echo "Swap Usage:"
swapon --show
echo ""
echo "CPU Governor:"
cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_governor 2>/dev/null || echo "N/A"
echo ""
echo "Temperature:"
vcgencmd measure_temp 2>/dev/null || echo "N/A"
echo ""
echo "Load Average:"
cat /proc/loadavg

# Run quick stress test if available
if command -v stress-ng >/dev/null 2>&1; then
    echo ""
    echo "Running 30-second stress test..."
    stress-ng --cpu $(nproc) --vm 2 --vm-bytes 512M --timeout 30s --metrics-brief
fi

echo ""
echo "Benchmark completed for configuration: $CONFIG_NAME"
