# Complete MM4 Cost Calculation Workflow Documentation

## Current Issue Summary
- **Expected**: £1850 ÷ 22 = £84.09 per length rate
- **Actual**: £1850 ÷ 2 = £925.00 per length rate
- **Root Cause**: Backend database still has `greenValue: "2"` instead of updated value

## Complete Cost Calculation Flow

### 1. Dashboard Cost Calculation Process
**File**: `client/src/pages/dashboard.tsx` (lines 2760-2796)

```typescript
// STEP 1: MM4 Rate Calculation
const ratePerMeter = blueValue / greenValue;  // £1850 ÷ greenValue

// STEP 2: Section Matching Logic
const debrisMatch = sectionDebrisPercent <= purpleDebris;  // 5% ≤ 30% ✓
const lengthMatch = sectionLength <= purpleLength;        // 30.24m ≤ 40m ✓

// STEP 3: Return Cost Object
return {
  cost: ratePerMeter,          // Display per-length rate (£84.09 expected)
  status: 'mm4_calculated',    // Success status
  recommendation: `MM4 cleansing rate: £${blueValue} ÷ ${greenValue} = £${ratePerMeter.toFixed(2)} per length`
};
```

### 2. Data Flow Source Chain
1. **MMP1 Template** → User inputs greenValue: 22
2. **Auto-Save Function** → Calls backend API to save
3. **Backend Database** → Stores in pr2_configurations.mm_data
4. **Dashboard Query** → Fetches latest configuration 606
5. **Cost Calculation** → Uses greenValue from database

### 3. Database Structure
**Table**: `pr2_configurations`
**ID**: 606 (cctv-jet-vac, utilities sector)
**MM Data Path**: `mmData.mm4DataByPipeSize["150-1501"][0].greenValue`

### 4. Current Database State Issue
**Problem**: Database still shows:
```json
{
  "greenValue": "2",        // ❌ Should be "22"
  "timestamp": 1753954264675 // Old timestamp
}
```

## Data Sync Issue Analysis

### Frontend Cache vs Backend Database
- **Frontend localStorage**: May have greenValue: 22
- **Backend database**: Still has greenValue: "2"
- **API Response**: Returns old value causing £925.00 calculation

### Cache Invalidation Points
1. **React Query Cache**: Dashboard query cache
2. **Browser localStorage**: MMP1 template data
3. **Database Persistence**: Actual saved values

## Items 21, 22, 23 Display Issue

### Database Confirmation
Items exist in `section_inspections` table:
- Item 21: Service + Structural (21a)
- Item 22: Service + Structural (22a) 
- Item 23: Service only

### Filtering Logic
**File**: `client/src/pages/dashboard.tsx` (line 2676)
```typescript
const restrictedCleaningSections = [3, 6, 7, 8, 10, 13, 14, 15, 21, 22, 23];
```

Items 21-23 are included in restricted sections and should display with cleaning calculations.

## Required Fixes

### 1. Force Database Update
- Update configuration 606 with correct greenValue
- Invalidate all related caches
- Verify persistence with fresh API call

### 2. Verify Cost Display
- Item 3: £84.09 (£1850 ÷ 22) - RED text when minimum not met
- Items 21, 22, 23: Same calculation if they match criteria
- Warning popup for day rate recalculation options

### 3. Complete Workflow Test
- Change greenValue in MMP1 template
- Verify auto-save to database
- Check dashboard cost calculation
- Confirm cache invalidation