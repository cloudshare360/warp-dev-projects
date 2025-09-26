#!/bin/bash

# Auto-Healing Restoration Script for 2800MHz Configuration
# This script automatically restores the stable 2800MHz configuration

set -e

RESTORE_POINT_PATH="$(dirname "$(dirname "$(realpath "$0")")")"
LOG_FILE="$RESTORE_POINT_PATH/auto_heal/restore.log"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
    echo -e "${YELLOW}RESTORE: $1${NC}"
}

log_success() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] SUCCESS: $1" >> "$LOG_FILE"
    echo -e "${GREEN}✓ RESTORE: $1${NC}"
}

log_error() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1" >> "$LOG_FILE"
    echo -e "${RED}✗ RESTORE: $1${NC}"
}

# Find and restore config.txt
restore_boot_config() {
    log_message "Starting 2800MHz configuration restoration"
    
    local config_backup="$RESTORE_POINT_PATH/configs/config.txt.backup"
    local config_restored=false
    
    if [[ ! -f "$config_backup" ]]; then
        log_error "Config backup not found: $config_backup"
        return 1
    fi
    
    # Try different possible locations
    for boot_path in "/boot/firmware/config.txt" "/boot/config.txt"; do
        if [[ -d "$(dirname "$boot_path")" ]]; then
            log_message "Restoring to: $boot_path"
            sudo cp "$config_backup" "$boot_path" && config_restored=true
            break
        fi
    done
    
    if [[ "$config_restored" == "true" ]]; then
        log_success "2800MHz configuration restored successfully"
        return 0
    else
        log_error "Failed to restore configuration"
        return 1
    fi
}

# Main restoration
main() {
    log_message "=== EMERGENCY AUTO-HEALING RESTORATION ==="
    log_message "Restoring stable 2800MHz configuration"
    
    if restore_boot_config; then
        log_success "2800MHz restore completed successfully"
        log_message "System will boot with stable 2800MHz configuration"
        echo "Restoration completed successfully. Reboot to apply 2800MHz configuration."
        exit 0
    else
        log_error "Restoration failed"
        exit 1
    fi
}

main "$@"
