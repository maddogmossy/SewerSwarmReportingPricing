# PR2 Configuration Data Cleanup Analysis

## Current Database State (ID 605-694)

| DB ID | category_id | category_name | description | Frontend Match | DevLabel | Issues |
|-------|-------------|---------------|-------------|----------------|----------|--------|
| 605 | `test-card` | MMP1 Template Configuration | Test card template | ✅ Matches | F605 | Good |
| 608 | `cctv-van-pack` | F608 Van Pack | CCTV Van Pack with MM4 | ❌ Not in frontend | F608 | Missing from frontend |
| 609 | `van-pack` | MMP1 Template | Generic template | ✅ Matches | F609 | Description unclear |
| 610 | `jet-vac` | Jet Vac MMP1 Template | Master template | ✅ Matches | F610 | Good |
| 611 | `cctv-cleansing-root-cutting` | CCTV/Cleansing/Root Cutting | Master template | ✅ Matches | F611 | Good |
| 612 | `P012` | CCTV MMP1 Template | Master template | ❌ Wrong key | F612 | Should be 'cctv' |
| 614 | `directional-water-cutter` | Directional Water Cutter | Master template | ✅ Matches | F614 | Good |
| 615 | `patching` | MMP1 Template (F615) | Clean PR2 config | ✅ Matches | F615 | Good |
| 619 | `f-robot-cutting` | TP3 - Robotic Cutting | Clean PR2 config | ✅ Matches | F619 | Good |
| 690 | `cctv-jet-vac` | F690 CCTV/Jet Vac | Clean PR2 config | ✅ Matches | F690 | Good |

## Frontend Categories Expected

From `pr2-pricing.tsx`, the frontend expects these category_id values:

```javascript
const STANDARD_CATEGORIES = [
  { id: 'cctv', name: 'CCTV', icon: Video },                    // Missing! (ID 612 uses 'P012')
  { id: 'van-pack', name: 'Van Pack', icon: Truck },            // ✅ ID 609
  { id: 'jet-vac', name: 'Jet Vac', icon: Waves },             // ✅ ID 610
  { id: 'cctv-van-pack', name: 'CCTV/Van Pack', icon: Monitor }, // ✅ ID 608 (but missing from frontend)
  { id: 'cctv-jet-vac', name: 'CCTV/Jet Vac', icon: Video },   // ✅ ID 690
  { id: 'cctv-cleansing-root-cutting', name: 'CCTV/Cleansing/Root Cutting', icon: Settings }, // ✅ ID 611
  { id: 'test-card', name: 'Test Card', icon: Zap },            // ✅ ID 605
  { id: 'directional-water-cutter', name: 'Directional Water Cutter', icon: Waves }, // ✅ ID 614
  { id: 'patching', name: 'Patching', icon: Edit },             // ✅ ID 615
  { id: 'f-robot-cutting', name: 'Robotic Cutting', icon: Settings }, // ✅ ID 619
  // Missing from database: ambient-lining, hot-cure-lining, uv-lining, excavation, tankering
];
```

## Issues Identified

### 1. **ID 612 Wrong Key**
- Database: `category_id = 'P012'`
- Frontend expects: `category_id = 'cctv'`
- Fix: Update category_id to 'cctv'

### 2. **ID 608 Missing from Frontend**
- Database has `cctv-van-pack` 
- Frontend STANDARD_CATEGORIES missing this entry
- Fix: Add to frontend categories

### 3. **Inconsistent Descriptions**
- Multiple "MMP1 Template" generic descriptions
- Should be specific to equipment type

### 4. **Missing Categories**
Frontend defines but database lacks:
- ambient-lining
- hot-cure-lining  
- uv-lining
- excavation
- tankering

## Proposed DevLabel ID Mapping

| Equipment Type | category_id | DB ID | DevLabel | Frontend Name |
|----------------|-------------|-------|----------|---------------|
| CCTV | `cctv` | 612 | F612 | CCTV |
| Van Pack | `van-pack` | 609 | F609 | Van Pack |
| Jet Vac | `jet-vac` | 610 | F610 | Jet Vac |
| CCTV/Van Pack | `cctv-van-pack` | 608 | F608 | CCTV/Van Pack |
| CCTV/Jet Vac | `cctv-jet-vac` | 690 | F690 | CCTV/Jet Vac |
| CCTV/Cleansing/Root | `cctv-cleansing-root-cutting` | 611 | F611 | CCTV/Cleansing/Root Cutting |
| Directional Water | `directional-water-cutter` | 614 | F614 | Directional Water Cutter |
| Patching | `patching` | 615 | F615 | Patching |
| Robotic Cutting | `f-robot-cutting` | 619 | F619 | Robotic Cutting |
| Test Card | `test-card` | 605 | F605 | Test Card |

## Recommended Cleanup Actions

1. **Fix ID 612**: Update category_id from 'P012' to 'cctv'
2. **Add missing frontend entry**: Include cctv-van-pack in STANDARD_CATEGORIES
3. **Standardize descriptions**: Update generic "MMP1 Template" descriptions
4. **Create missing configs**: Add database entries for missing frontend categories