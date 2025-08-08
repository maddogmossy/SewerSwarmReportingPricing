# Warning System Category Mapping

Based on dashboard.tsx analysis, here's the complete mapping of warnings and their triggering categories:

## 1. SERVICE SECTION WARNINGS (F606/F608)

### Day Rate Missing Warning
- **Triggered by**: F606 (cctv-jet-vac) OR F608 (cctv-van-pack)
- **When**: `section.defectType === 'service'` AND `needsCleaning === true` AND `isRestrictedSection === true`
- **Selection Logic**: `equipmentPriority === 'f608' ? f608Config : f606Config`
- **Current Issue**: F606 is being selected by default instead of F608
- **Warning Details**:
  - Status: `day_rate_missing`
  - Method: `'Day Rate Not Configured'`
  - ConfigType: F608 shows `'F608 Van Pack'`, F606 shows `'F606 Jet Vac'`

### MM4 Range Violation Warning  
- **Triggered by**: F606 (cctv-jet-vac) OR F608 (cctv-van-pack)
- **When**: Service section exceeds MM4 debris/length ranges BEFORE day rate check
- **Selection Logic**: Same as above - uses `equipmentPriority`
- **Warning Details**:
  - Status: `mm4_outside_ranges`
  - Method: `'MM4 Outside Ranges'`
  - WarningType: `debris_out_of_range`, `length_out_of_range`, or `both_out_of_range`

## 2. STRUCTURAL SECTION WARNINGS (F615)

### Day Rate Missing Warning
- **Triggered by**: F615 (patching) ONLY
- **When**: `section.defectType === 'structural'`
- **Selection Logic**: Finds `config.categoryId === 'patching' && config.sector === 'utilities'`
- **Warning Details**:
  - Status: `day_rate_missing`
  - Method: `'Day Rate Not Configured'`
  - ConfigType: `'F615 Patching'`

## 3. CURRENT CONFIGURATION STATUS

### F606 (cctv-jet-vac)
- Day Rate: **EMPTY** (`""`)
- Currently: **DEFAULT** selection for service sections
- **PROBLEM**: This causes £0 day rate warnings

### F608 (cctv-van-pack)  
- Day Rate: **1000** (correctly saved)
- Currently: Only selected when `equipmentPriority === 'f608'`
- **SOLUTION**: Should be default instead of F606

### F615 (patching)
- Day Rate: **1650** (working correctly)
- Used for: All structural sections
- **STATUS**: Working as expected

## 4. IDENTIFIED ISSUES

1. **Default Priority Bug**: F606 defaults instead of F608 for service sections
2. **Empty F606 Day Rate**: Causes £0 warnings when F606 is selected
3. **Equipment Priority Logic**: Not switching to F608 automatically
4. **localStorage Override**: Existing F606 preference preventing F608 default

## 5. SOLUTION IMPLEMENTED

1. Changed default from F606 to F608 in `useState` initialization
2. Updated selection logic to prefer F608 over F606 when available
3. Added `shouldUpdatePriority = true` to force priority sync

## 6. VERIFICATION NEEDED

Test with service sections (items 6, 8, 9) that need cleaning to verify:
- F608 is selected instead of F606
- Day rate shows 1000 instead of 0
- Warning displays correct F608 configuration details