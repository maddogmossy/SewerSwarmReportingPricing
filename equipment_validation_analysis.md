# F606/F608 Equipment Selection & Validation Analysis

## COMPLETE PROCESS WALKTHROUGH

### 1. EQUIPMENT PRIORITY INITIALIZATION
**Location:** `client/src/pages/dashboard.tsx:612-614`
```javascript
const [equipmentPriority, setEquipmentPriority] = useState<'f606' | 'f608'>(() => {
  return localStorage.getItem('equipmentPriority') === 'f606' ? 'f606' : 'f608';
});
```
**Current State:** Defaults to F608, only switches to F606 if localStorage explicitly contains 'f606'

### 2. EQUIPMENT CONFIGURATION SELECTION
**Location:** `client/src/pages/dashboard.tsx:3922`
```javascript
const cctvConfig = equipmentPriority === 'f608' ? f608Config : f606Config;
```
**Logic:** 
- F608 Priority → Uses F608 configuration (ID: 608, categoryId: 'cctv-van-pack')
- F606 Priority → Uses F606 configuration (ID: 606, categoryId: 'cctv-jet-vac')

### 3. SERVICE SECTION DETECTION
**Location:** `client/src/pages/dashboard.tsx:67-77`
```javascript
const requiresCleaning = (defects: string): boolean => {
  const cleaningCodes = ['DES', 'DER', 'DEC', 'GRE', 'RO', 'BLO'];
  const defectsUpper = defects.toUpperCase();
  return cleaningCodes.some(code => defectsUpper.includes(code));
};
```
**Identifies:** Sections 6, 8, 9 contain 'DER' (deposits, coarse) → require cleaning

### 4. VALIDATION TRIGGER CONDITIONS
**Location:** `client/src/pages/dashboard.tsx:3900-3904`
```javascript
if (section.defectType === 'service' && pr2Configurations && pr2Configurations.length > 0) {
  const needsCleaning = requiresCleaning(section.defects || '');
  const isRestrictedSection = [3, 6, 7, 8, 10, 13, 14, 15, 20, 21, 22, 23].includes(section.itemNo);
  
  if (needsCleaning && isRestrictedSection) {
    // Validation logic runs here
  }
}
```

### 5. MM4 CONFIGURATION READING
**F606 Configuration (ID: 606):**
```json
"mm4DataByPipeSize": {
  "150-1501": [
    {"id": 1, "blueValue": "185", "greenValue": "30", "purpleDebris": "30", "purpleLength": "10"},
    {"id": 2, "blueValue": "1850", "greenValue": "2", "purpleDebris": "30", "purpleLength": "15"}
  ]
}
```
**Day Rate:** Empty string "" (no day rate configured)

**F608 Configuration (ID: 608):**
- Day Rate: "950" (configured)
- MM4 Ranges: Likely higher limits than F606

## CURRENT PROBLEM ANALYSIS

### Issue 1: Equipment Priority Logic
**Problem:** System defaults to F608 because:
1. localStorage is likely empty or doesn't contain 'f606'
2. F608 has higher length limits than F606
3. F606 length warnings (10m, 15m limits) never trigger

### Issue 2: Service Validation Not Running
**Current Debug Output Missing:**
- No "🔍 EQUIPMENT PRIORITY DEBUG" logs
- No "🔍 SELECTED EQUIPMENT CONFIG" logs  
- No "🔍 RANGE VALIDATION START" logs

**This indicates:** Service sections (6, 8, 9) are NOT triggering the validation logic

### Issue 3: Structural vs Service Warning Logic
**Structural Warnings Trigger Because:**
- Structural sections have costs > £0
- Day rate comparison logic runs for structural sections
- Cost decisions exist, preventing re-triggering

**Service Warnings Don't Trigger Because:**
- Service validation logic may not be running
- F608 ranges accommodate section lengths
- Equipment priority prevents F606 validation

## SOLUTION REQUIRED

1. **Force F606 as Default** for testing length validation
2. **Debug Service Section Processing** - why validation logic not running  
3. **Add Comprehensive Logging** to trace complete validation path
4. **Fix Red Triangle Logic** - warnings should only trigger when all costs are red (£0)