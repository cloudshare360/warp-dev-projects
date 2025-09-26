#!/bin/bash

# Boot Failure Detection and Auto-Healing Service
# Monitors boot success and triggers restoration if needed

RESTORE_POINT_PATH="/home/sri/rpi5-optimization-backup/restore_points/2800mhz_stable_20250923_144453"
LOG_FILE="$RESTORE_POINT_PATH/auto_heal/boot_monitor.log"
BOOT_SUCCESS_FLAG="/tmp/boot_success_2900mhz"
MAX_BOOT_ATTEMPTS=3
CURRENT_ATTEMPTS=0

log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# Check if this is a failed boot attempt
check_boot_failure() {
    if [[ -f "/tmp/boot_test_2900mhz" ]] && [[ ! -f "$BOOT_SUCCESS_FLAG" ]]; then
        # Boot test flag exists but success flag doesn't - this indicates failure
        CURRENT_ATTEMPTS=$(cat /tmp/boot_attempts_2900mhz 2>/dev/null || echo "0")
        CURRENT_ATTEMPTS=$((CURRENT_ATTEMPTS + 1))
        echo "$CURRENT_ATTEMPTS" > /tmp/boot_attempts_2900mhz
        
        log_message "Boot failure detected. Attempt $CURRENT_ATTEMPTS/$MAX_BOOT_ATTEMPTS"
        
        if [[ $CURRENT_ATTEMPTS -ge $MAX_BOOT_ATTEMPTS ]]; then
            log_message "Maximum boot attempts reached. Triggering auto-healing restoration"
            $RESTORE_POINT_PATH/auto_heal/restore_2800mhz.sh
            
            # Clean up test flags
            rm -f /tmp/boot_test_2900mhz /tmp/boot_attempts_2900mhz
            
            log_message "Auto-healing completed. System restored to stable 2800MHz"
            return 0
        fi
    fi
    
    return 1
}

# Mark successful boot
mark_boot_success() {
    if [[ -f "/tmp/boot_test_2900mhz" ]]; then
        touch "$BOOT_SUCCESS_FLAG"
        log_message "2900MHz boot successful - marking as stable"
        
        # Clean up after successful boot
        rm -f /tmp/boot_test_2900mhz /tmp/boot_attempts_2900mhz
    fi
}

# Main execution
main() {
    log_message "Boot monitor service started"
    
    # Wait a bit for system to stabilize
    sleep 30
    
    if check_boot_failure; then
        log_message "Auto-healing restoration triggered"
    else
        # Check system health and mark as successful if stable
        local temp=$(vcgencmd measure_temp | cut -d'=' -f2 | cut -d"'" -f1)
        local throttled=$(vcgencmd get_throttled)
        
        if [[ "$throttled" == "throttled=0x0" ]] && (( $(echo "$temp < 75" | bc -l) )); then
            mark_boot_success
        else
            log_message "System health check failed: temp=$temp, throttled=$throttled"
        fi
    fi
}

main "$@"
