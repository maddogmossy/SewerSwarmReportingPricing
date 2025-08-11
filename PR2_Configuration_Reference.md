# PR2 Configuration Reference Guide

## 🧹 CLEANED Database Mapping (Post-Cleanup)

| DB ID | category_id | Frontend Name | DevLabel | Equipment Type | Description |
|-------|-------------|---------------|----------|----------------|-------------|
| ~~605~~ | ~~`test-card`~~ | ~~Test Card~~ | ~~F605~~ | ~~System Testing~~ | **REMOVED** |
| 608 | `cctv-van-pack` | CCTV/Van Pack | F608 | CCTV + Van Pack | CCTV Van Pack equipment with MM4 robotic cutting |
| 609 | `van-pack` | Van Pack | F609 | Van Pack Equipment | Van Pack mobile equipment for sewer maintenance |
| 610 | `jet-vac` | Jet Vac | F610 | Jet Vac Services | High-pressure water jetting and vacuum services |
| 611 | `cctv-cleansing-root-cutting` | CCTV/Cleansing/Root Cutting | F611 | Multi-Service | Combined CCTV inspection, cleansing and root cutting |
| 612 | `cctv` | CCTV | F612 | CCTV Survey | CCTV inspection and condition assessment surveys |
| 614 | `directional-water-cutter` | Directional Water Cutter | F614 | Water Cutting | Precise directional water cutting services |
| 615 | `patching` | Patching | F615 | Patch Repair | Patch repair and reinstatement services |
| 619 | `f-robot-cutting` | Robotic Cutting | F619 | Robotic Operations | Robotic cutting and grinding operations |
| 690 | `cctv-jet-vac` | CCTV/Jet Vac | F690 | CCTV + Jet Vac | Combined CCTV inspection with jet vac services |

## 🗑️ Removed Duplicates
- Deleted 6 duplicate entries in invalid sectors (`id11`, `id2`, `id3`)
- Fixed P012 → cctv mapping issue
- Standardized all descriptions

## Frontend Integration

### How DevLabels Work
- Each configuration gets a DevLabel like `F612`, `F690` etc.
- These appear in the UI for debugging/identification
- They correspond directly to the database ID (F612 = ID 612)

### Category ID Usage
The `category_id` field is the key used throughout the codebase:
- API endpoints use it for filtering
- Frontend components match against it
- Dashboard configuration selection uses it

### Missing Categories (Frontend Only)
These exist in frontend code but not in database yet:
- `ambient-lining` (F700+)
- `hot-cure-lining` (F700+)  
- `uv-lining` (F700+)
- `excavation` (F700+)
- `tankering` (F700+)

## Quick Reference for Debugging

When you see in logs:
- **F612** = CCTV configuration
- **F690** = CCTV/Jet Vac (most common)
- **F615** = Patching operations
- **F619** = Robotic cutting

When API calls fail, check:
1. Does `category_id` exist in database?
2. Does it match frontend `STANDARD_CATEGORIES`?
3. Is the sector correct (utilities/adoption/etc.)?