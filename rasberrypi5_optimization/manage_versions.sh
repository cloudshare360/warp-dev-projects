#!/bin/bash
# =================================================================
# VERSION MANAGEMENT SYSTEM - Raspberry Pi 5 Optimization Suite
# =================================================================
# This script manages different versions of optimization scripts
# =================================================================

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
VERSIONS_DIR="$SCRIPT_DIR/scripts"
CURRENT_DIR="$VERSIONS_DIR/current"
BACKUPS_DIR="$SCRIPT_DIR/backups"
LOGS_DIR="$SCRIPT_DIR/logs"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔄 RASPBERRY PI 5 - VERSION MANAGEMENT${NC}"
echo "================================================"

# Function to list available versions
list_versions() {
    echo -e "\n${BLUE}📂 Available Versions:${NC}"
    echo "====================="
    for dir in "$VERSIONS_DIR"/v*; do
        if [ -d "$dir" ]; then
            version=$(basename "$dir")
            echo "  ✅ $version"
        fi
    done
    
    echo -e "\n${GREEN}📍 Current Active Version:${NC}"
    if [ -L "$CURRENT_DIR" ]; then
        current_target=$(readlink "$CURRENT_DIR")
        echo "  → $(basename "$current_target")"
    else
        echo "  → Directory-based current version"
    fi
}

# Function to switch versions
switch_version() {
    local target_version="$1"
    local target_dir="$VERSIONS_DIR/$target_version"
    
    if [ ! -d "$target_dir" ]; then
        echo -e "${RED}❌ Version $target_version not found!${NC}"
        return 1
    fi
    
    echo -e "${YELLOW}⚠️  Switching to version: $target_version${NC}"
    echo "This will replace all current scripts."
    read -p "Continue? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Create backup of current version
        local timestamp=$(date +"%Y%m%d_%H%M%S")
        local backup_name="current_backup_$timestamp"
        
        echo "📂 Creating backup: $backup_name"
        cp -r "$CURRENT_DIR" "$BACKUPS_DIR/$backup_name"
        
        # Switch to new version
        rm -rf "$CURRENT_DIR"
        cp -r "$target_dir" "$CURRENT_DIR"
        
        echo -e "${GREEN}✅ Successfully switched to $target_version${NC}"
        
        # Log the change
        echo "$(date): Switched from current to $target_version" >> "$LOGS_DIR/version_changes.log"
    else
        echo "Cancelled version switch."
    fi
}

# Function to create new version
create_version() {
    local new_version="$1"
    local new_dir="$VERSIONS_DIR/$new_version"
    
    if [ -d "$new_dir" ]; then
        echo -e "${RED}❌ Version $new_version already exists!${NC}"
        return 1
    fi
    
    echo -e "${YELLOW}📦 Creating new version: $new_version${NC}"
    echo "This will copy current scripts to a new version."
    read -p "Continue? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cp -r "$CURRENT_DIR" "$new_dir"
        echo -e "${GREEN}✅ Created version $new_version${NC}"
        
        # Log the creation
        echo "$(date): Created new version $new_version from current" >> "$LOGS_DIR/version_changes.log"
    else
        echo "Cancelled version creation."
    fi
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  list                List all available versions"
    echo "  switch <version>    Switch to specified version"
    echo "  create <version>    Create new version from current"
    echo "  backup             Create backup of current version"
    echo "  history            Show version change history"
    echo ""
    echo "Examples:"
    echo "  $0 list"
    echo "  $0 switch v1.0"
    echo "  $0 create v2.0"
}

# Function to create backup
create_backup() {
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    local backup_name="manual_backup_$timestamp"
    
    cp -r "$CURRENT_DIR" "$BACKUPS_DIR/$backup_name"
    echo -e "${GREEN}✅ Backup created: $backup_name${NC}"
    
    # Log the backup
    echo "$(date): Manual backup created: $backup_name" >> "$LOGS_DIR/version_changes.log"
}

# Function to show history
show_history() {
    echo -e "\n${BLUE}📜 Version Change History:${NC}"
    echo "=========================="
    if [ -f "$LOGS_DIR/version_changes.log" ]; then
        tail -20 "$LOGS_DIR/version_changes.log"
    else
        echo "No history available."
    fi
}

# Create necessary directories
mkdir -p "$BACKUPS_DIR" "$LOGS_DIR"

# Main logic
case "$1" in
    "list")
        list_versions
        ;;
    "switch")
        if [ -z "$2" ]; then
            echo -e "${RED}❌ Please specify version to switch to${NC}"
            show_usage
        else
            switch_version "$2"
        fi
        ;;
    "create")
        if [ -z "$2" ]; then
            echo -e "${RED}❌ Please specify new version name${NC}"
            show_usage
        else
            create_version "$2"
        fi
        ;;
    "backup")
        create_backup
        ;;
    "history")
        show_history
        ;;
    *)
        list_versions
        echo ""
        show_usage
        ;;
esac