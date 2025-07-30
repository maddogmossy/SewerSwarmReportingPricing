# F606/F607 Dashboard Cost Integration Analysis & Fix Plan

## Current System Analysis

### Template System Status
**WORKING CORRECTLY:**
- **F607 (ID 607)**: `f-cctv-van-pack` → MMP1 template ✅
- **F606 (ID 606)**: `cctv-jet-vac` → MMP1 template ✅ (has MM4 data)
- **Master MMP1**: Saved as protected component in `client/src/components/MMP1Template.tsx` ✅

**PROBLEM IDENTIFIED:**
- **Template Registry Mismatch**: `f-cctv-jet-vac` → MMP2 (incorrect, should be MMP1)
- **Cost Calculation Failure**: F606 configured with MM4 data but dashboard not calculating costs

### Database Current State
```sql
ID 606: cctv-jet-vac, "CCTV/Jet Vac", utilities
- MM4 Data: blueValue="1850", greenValue="33", purpleDebris="30", purpleLength="4"
- Status: CONFIGURED with valid MM4 calculation data

ID 607: f-cctv-van-pack, "F607 CCTV/Van Pack", utilities  
- MM4 Data: Empty values (blueValue="", greenValue="")
- Status: Template only, no calculation data

ID 608: cctv-jet-vac, "150mm Cctv Jet Vac Configuration", utilities
- MM4 Data: Empty values
- Status: Duplicate/test configuration
```

### Cost Calculation Flow Analysis

**CURRENT IMPLEMENTATION:**
1. `CleaningOptionsPopover` → `triggerMM4DashboardAnalysis()` 
2. Fetches F606 config from `/api/pr2-clean/606`
3. Extracts MM4 data from `mmData.mm4DataByPipeSize['150-1501']`
4. Calls `calculateAutoCost()` which checks `getMM4Cost()` FIRST
5. Dashboard displays calculated costs

**PROBLEMS IDENTIFIED:**

### Problem 1: Template Registry Inconsistency
**Location**: `client/src/utils/template-registry.ts` line 7
**Current**: `"f-cctv-jet-vac": return "MMP2"`
**Should Be**: `"f-cctv-jet-vac": return "MMP1"`
**Impact**: F606 tries to load non-existent MMP2Template instead of MMP1Template

### Problem 2: Category ID Duplication 
**Issue**: Both ID 606 and ID 608 use `categoryId: "cctv-jet-vac"`
**Consequence**: Cost calculation confusion between configs
**Solution**: F606 should use unique `f-cctv-jet-vac` categoryId

### Problem 3: MM4 Trigger Hardcoded to F606
**Location**: `client/src/pages/dashboard.tsx` line 847
**Current**: Hardcoded fetch to `/api/pr2-clean/606`
**Problem**: Only works for specific ID, not dynamic F606 detection
**Impact**: Fragile system dependent on exact database ID

### Problem 4: Template Routing Mismatch
**Location**: `client/src/pages/pr2-config-clean.tsx` 
**Issue**: F606 configurations don't route to correct template due to registry mismatch
**Symptom**: "Template not found" or incorrect template loading

## Root Cause Analysis

**PRIMARY ISSUE**: Template registry maps `f-cctv-jet-vac` to MMP2 but:
1. No MMP2Template.tsx component exists
2. User wants both F606 and F607 to use MMP1 templates
3. System tries to load missing MMP2, causing template failures

**SECONDARY ISSUE**: Cost calculation system is implemented but fails due to template loading errors preventing proper configuration access.

## Fix Plan - Phase Implementation

### Phase 1: Template Registry Correction (CRITICAL)
**File**: `client/src/utils/template-registry.ts`
**Change**: 
```typescript
// BEFORE
case "f-cctv-jet-vac": return "MMP2";

// AFTER  
case "f-cctv-jet-vac": return "MMP1";
```
**Result**: F606 will now correctly load MMP1Template

### Phase 2: Database Category ID Standardization
**Action**: Update F606 configuration to use proper `f-cctv-jet-vac` categoryId
**SQL**:
```sql
UPDATE pr2_configurations 
SET category_id = 'f-cctv-jet-vac', 
    category_name = 'F606 CCTV/Jet Vac'  
WHERE id = 606;
```
**Result**: F606 gets unique categoryId distinct from other cctv-jet-vac configs

### Phase 3: Cost Calculation Dynamic Lookup
**File**: `client/src/pages/dashboard.tsx`
**Change**: Replace hardcoded ID 606 lookup with dynamic F606 category search
**Before**: `fetch('/api/pr2-clean/606')`
**After**: Search for `categoryId: 'f-cctv-jet-vac'` in current sector
**Result**: Robust cost calculation independent of database IDs

### Phase 4: Clean Navigation Routing
**File**: `client/src/components/cleaning-options-popover.tsx`
**Update**: Ensure F606 routing uses `f-cctv-jet-vac` categoryId consistently
**Result**: Blue recommendation clicks properly route to F606 configuration

### Phase 5: Remove Duplicate/Test Configuration
**Action**: Delete or repurpose ID 608 to prevent confusion
**SQL**: `DELETE FROM pr2_configurations WHERE id = 608;`
**Result**: Clean database with single F606 configuration

## Expected Outcome

**After Implementation**:
1. **F606 Template**: `f-cctv-jet-vac` → MMP1Template ✅
2. **F607 Template**: `f-cctv-van-pack` → MMP1Template ✅  
3. **Cost Calculation**: Blue clicks trigger MM4 analysis using F606 MM4 data ✅
4. **Dashboard Display**: Service defect sections show calculated costs from F606 ✅
5. **Template Consistency**: Both F606/F607 use same MMP1 master template ✅

## Testing Plan

### Test 1: Template Loading
1. Navigate to F606 configuration page
2. Verify MMP1Template loads (not MMP2)
3. Confirm all 5 sections (MM1-MM5) display properly

### Test 2: Cost Calculation  
1. Click blue recommendation on dashboard item with service defects
2. Verify MM4 analysis triggers
3. Check console for "✅ MM4 Analysis Complete - Results"
4. Confirm calculated costs appear in dashboard cost column

### Test 3: Cross-Template Consistency
1. Compare F606 and F607 template interfaces
2. Verify both use identical MMP1Template component
3. Test auto-save functionality on both configurations

## Files Requiring Changes

1. **client/src/utils/template-registry.ts** - Fix f-cctv-jet-vac → MMP1 mapping
2. **Database** - Update F606 categoryId to f-cctv-jet-vac  
3. **client/src/pages/dashboard.tsx** - Dynamic F606 lookup in MM4 trigger
4. **client/src/components/cleaning-options-popover.tsx** - Consistent F606 routing

## Risk Assessment

**LOW RISK**: Template registry change (single line fix)
**MEDIUM RISK**: Database categoryId update (affects existing configs)  
**LOW RISK**: Dashboard lookup change (improves robustness)

## Implementation Priority

**IMMEDIATE**: Phase 1 (template registry) - fixes template loading
**HIGH**: Phase 2 (database) - enables proper cost calculation  
**MEDIUM**: Phase 3 (dynamic lookup) - makes system robust
**LOW**: Phase 4-5 (cleanup) - improves maintainability

This plan addresses the core issue: F606 and F607 both need MMP1 templates, and F606's MM4 data needs to integrate with dashboard cost calculations.