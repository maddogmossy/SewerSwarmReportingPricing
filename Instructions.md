# Template System Analysis & Fix Plan

## Issues Identified

### 1. MMP2Template Component Missing
- **Problem**: `MMP2Template` component does not exist in the codebase
- **Impact**: Any reference to MMP2Template will cause compilation errors
- **Location**: No MMP2Template.tsx file found in `/client/src/components/`

### 2. P003Config.ts File Missing
- **Problem**: No P003Config.ts file exists to define P003 category templates
- **Impact**: P003 category cannot be properly configured or displayed
- **Expected Location**: Should define templates array with MMP1 and MMP2 options

### 3. f-cctv-jet-vac Category Not Registered
- **Problem**: `f-cctv-jet-vac` category ID is not present in `STANDARD_CATEGORIES` array
- **Current State**: Only `f-cctv-van-pack` exists in database (ID 607)
- **Impact**: P003 category card won't display in UI

### 4. Template Routing Mismatch  
- **Problem**: `getTemplateType()` function maps categories incorrectly
- **Current Mapping**: 
  - `cctv-jet-vac` → P006a template
  - `f-cctv-van-pack` → MMP1 template
  - `f-cctv-jet-vac` → NOT DEFINED
- **Impact**: Template selection fails for P003 category

### 5. Database Configuration Missing
- **Problem**: No `f-cctv-jet-vac` configuration exists in database
- **Current State**: Only F607 (f-cctv-van-pack) configuration exists
- **Impact**: "No configuration found" error when clicking P003 card

## Fix Plan

### Phase 1: Create Missing Components
1. **Create MMP2Template.tsx**
   - Copy MMP1Template structure as base
   - Modify for MMP2-specific functionality
   - Ensure proper import/export structure

2. **Create P003Config.ts** 
   - Define P003 category configuration
   - Include templates array with MMP1 and MMP2 options
   - Set proper category metadata

### Phase 2: Update Category Registration
1. **Add f-cctv-jet-vac to STANDARD_CATEGORIES**
   - Add P003 entry in pr2-pricing.tsx
   - Include proper icon, description, and routing
   - Ensure consistent naming with other categories

2. **Update getTemplateType() Function**
   - Add `f-cctv-jet-vac` → MMP2 mapping
   - Ensure proper template selection logic
   - Maintain backward compatibility

### Phase 3: Database Configuration
1. **Create F606 Configuration**
   - Insert `f-cctv-jet-vac` configuration in database
   - Set proper categoryId, name, and sector
   - Include MMP2 template structure with placeholder data

2. **Update Template Registry**
   - Ensure TemplateMap includes P003 → MMP2 mapping
   - Verify routing consistency across components
   - Test template selection logic

### Phase 4: UI Integration
1. **Update Category Cards**
   - Verify P003 card displays properly
   - Test click navigation to MMP2 template
   - Ensure proper "Edit" vs "Add" button logic

2. **Template Rendering**
   - Test MMP2Template component renders correctly
   - Verify all UI elements display properly
   - Ensure auto-save functionality works

### Phase 5: Testing & Validation
1. **Component Integration Test**
   - Verify P003 card appears in category grid
   - Test navigation from P003 → MMP2 template
   - Confirm configuration persistence

2. **Cross-Reference Validation**
   - Check TemplateMap consistency
   - Verify STANDARD_CATEGORIES alignment
   - Test templateId routing in pr2-pricing.tsx

## Files Requiring Changes

### New Files to Create:
- `client/src/components/MMP2Template.tsx`
- `P003Config.ts` (location TBD based on existing pattern)

### Existing Files to Modify:
- `client/src/pages/pr2-pricing.tsx` (STANDARD_CATEGORIES)
- `client/src/pages/pr2-config-clean.tsx` (getTemplateType function)
- Database: Insert F606 configuration record

### Dependencies to Verify:
- TemplateMap registration (if exists)
- TemplateRegistry integration (if exists)
- Category routing in pr2-pricing.tsx

## Expected Outcome
After implementation:
1. P003 category card displays in pricing interface
2. Clicking P003 opens MMP2Template component
3. MMP2Template renders with proper UI elements
4. Configuration saves/loads correctly
5. Template selection logic works consistently
6. MM1Template remains visible and functional

## Risk Assessment
- **Low Risk**: Component creation and category registration
- **Medium Risk**: Template routing changes (requires thorough testing)
- **High Risk**: Database schema changes (backup recommended)

---
**Status**: ANALYSIS COMPLETE - AWAITING USER APPROVAL BEFORE IMPLEMENTATION