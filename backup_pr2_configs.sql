-- Backup PR2 Configurations - Emergency Restore Script
-- Created: $(date)
-- Current state backup before implementing protection

\copy (SELECT * FROM pr2_configurations ORDER BY id) TO 'pr2_configs_backup.csv' WITH CSV HEADER;

-- Current live configurations:
-- ID 133: Van Pack Configuration
-- ID 134: Jet Vac Configuration  
-- ID 135: CCTV Van Pack Configuration
-- ID 137: Directional Water Cutter Configuration
-- ID 138: Tankering Configuration
-- ID 141: CCTV Configuration
-- ID 152: CCTV Jet Vac Configuration (authentic data)
-- ID 153: TP2 Patching Configuration

-- MISSING (DELETED):
-- 225mm Patching Configuration (likely ID 154/155)
-- 300mm Patching Configuration (likely ID 156/157)