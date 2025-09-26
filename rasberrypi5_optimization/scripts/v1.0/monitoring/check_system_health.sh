#!/bin/bash
# =================================================================
# SYSTEM HEALTH CHECKER - Raspberry Pi 5
# =================================================================
# Quick check of overclocking status and system health
# =================================================================

echo "🔍 RASPBERRY PI 5 - SYSTEM HEALTH CHECK"
echo "======================================="

# CPU Status
echo "📊 CPU STATUS:"
echo "  Current Freq: $(vcgencmd measure_clock arm | awk -F'=' '{printf "%.1f MHz\n", $2/1000000}')"
echo "  Max Freq:     $(cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_max_freq | awk '{printf "%.1f MHz\n", $1/1000}')"
echo "  Governor:     $(cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_governor)"

# GPU Status  
echo ""
echo "🎮 GPU STATUS:"
echo "  Core Freq:    $(vcgencmd measure_clock core | awk -F'=' '{printf "%.1f MHz\n", $2/1000000}')"
echo "  V3D Freq:     $(vcgencmd measure_clock v3d | awk -F'=' '{printf "%.1f MHz\n", $2/1000000}')"

# Memory Status
echo ""
echo "💾 MEMORY STATUS:"
ARM_MEM=$(vcgencmd get_mem arm | awk -F'=' '{print $2}')
GPU_MEM=$(vcgencmd get_mem gpu | awk -F'=' '{print $2}')
echo "  ARM Memory:   $ARM_MEM"
echo "  GPU Memory:   $GPU_MEM"

# Thermal Status
TEMP=$(vcgencmd measure_temp | awk -F'=' '{print $2}')
THROTTLED=$(vcgencmd get_throttled)
echo ""
echo "🌡️  THERMAL STATUS:"
echo "  Temperature:  $TEMP"
echo "  Throttled:    $THROTTLED"

# Voltage Status
CORE_VOLT=$(vcgencmd measure_volts core | awk -F'=' '{print $2}')
echo ""
echo "⚡ VOLTAGE STATUS:"
echo "  Core Voltage: $CORE_VOLT"

# Health Assessment
echo ""
echo "🏥 HEALTH ASSESSMENT:"

# Temperature check
TEMP_NUM=$(echo $TEMP | sed 's/°C//' | sed "s/'//")
if (( $(echo "$TEMP_NUM < 60" | bc -l) )); then
    echo "  ✅ Temperature: GOOD ($TEMP)"
elif (( $(echo "$TEMP_NUM < 75" | bc -l) )); then
    echo "  ⚠️  Temperature: WARM ($TEMP) - Monitor closely"
else
    echo "  ❌ Temperature: HOT ($TEMP) - Consider cooling"
fi

# Throttling check
if [[ "$THROTTLED" == "throttled=0x0" ]]; then
    echo "  ✅ Throttling: NONE - System running stable"
else
    echo "  ⚠️  Throttling: DETECTED - $THROTTLED"
fi

# CPU frequency check
MAX_FREQ=$(cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_max_freq)
if [[ $MAX_FREQ -gt 2400000 ]]; then
    echo "  🚀 CPU Overclock: ACTIVE ($(echo $MAX_FREQ | awk '{printf "%.1f MHz\n", $1/1000}'))"
else
    echo "  📊 CPU Overclock: STOCK (2.4 GHz)"
fi

echo ""
echo "🔧 AVAILABLE ROLLBACK OPTIONS:"
echo "  ./rollback_all_optimizations.sh    - Revert everything"
echo "  ./rollback_cpu_overclock.sh        - Revert CPU only"
echo "  ./rollback_gpu_settings.sh         - Revert GPU only"
echo "  EMERGENCY_RECOVERY.md               - Boot failure help"

echo ""
echo "📋 QUICK ACTIONS:"
echo "  Monitor: watch -n 1 './check_system_health.sh'"
echo "  Stress:  stress-ng --cpu 4 --timeout 60s"
echo "  Cool:    sudo vcgencmd measure_temp"