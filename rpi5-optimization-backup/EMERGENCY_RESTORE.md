# 🆘 EMERGENCY RESTORE INSTRUCTIONS

## If 2700MHz fails to boot or is unstable:

### Quick Restore to Working 2600MHz:
```bash
cd /home/sri/rpi5-optimization-backup
./config_manager.sh restore 2600mhz-stable
sudo reboot
```

### Alternative restore points (in order of preference):
1. **2600mhz-stable** - Latest working 2600MHz (56.5°C, incredible)
2. **2500mhz-stable** - Previous working 2500MHz (57.1°C, excellent)
3. **2400mhz-stable** - Earlier working 2400MHz (54.3°C, excellent)
4. **2200mhz-stable** - Conservative working 2200MHz (55.4°C, stable)

### Manual recovery if scripts fail:
```bash
sudo cp /home/sri/rpi5-optimization-backup/config_backup_2200mhz_* /boot/firmware/config.txt
sudo reboot
```

### Boot recovery sequence:
If system doesn't boot:
1. Power off completely
2. Remove SD card and edit config.txt on another computer
3. Remove overclocking lines (arm_freq, over_voltage, etc.)
4. Reinsert and boot

## Current Status:
- **Testing:** 2700MHz (+11 voltage, 35% boost)
- **Last Stable:** 2600MHz at 56.5°C (incredible performance)
- **Recovery Ready:** Yes, multiple restore points available
