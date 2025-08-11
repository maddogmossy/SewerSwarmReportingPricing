# Sector Card Naming System Proposal

## Current Mess vs. Clean Solution

### Current Problems:
- **Database sectors**: `id1`, `id2`, `id3`, `id4`, `id5`, `id6` (meaningless)
- **F-Series**: F605, F608, F609, F610, F611, F612, F614, F615, F619, F690 (random)
- **P-Series**: P012, P112, P212, P312, P412 (inconsistent)
- **DevLabels**: Show "F612" but users don't know what that means

### Proposed Clean System:

| Sector ID | Real Sector | Letter Code | Card Range | Example Cards |
|-----------|-------------|-------------|------------|---------------|
| id1 | utilities | **A** | A1-A16 | A1=CCTV, A2=Van Pack, A3=Jet Vac |
| id2 | adoption | **B** | B1-B16 | B1=CCTV, B2=Van Pack, B3=Jet Vac |
| id3 | highways | **C** | C1-C16 | C1=CCTV, C2=Van Pack, C3=Jet Vac |
| id4 | insurance | **D** | D1-D16 | D1=CCTV, D2=Van Pack, D3=Jet Vac |
| id5 | construction | **E** | E1-E16 | E1=CCTV, E2=Van Pack, E3=Jet Vac |
| id6 | domestic | **F** | F1-F16 | F1=CCTV, F2=Van Pack, F3=Jet Vac |

## Equipment Type Standardization:

| Card # | Equipment Type | All Sectors |
|--------|---------------|-------------|
| 1 | CCTV | A1, B1, C1, D1, E1, F1 |
| 2 | Van Pack | A2, B2, C2, D2, E2, F2 |
| 3 | Jet Vac | A3, B3, C3, D3, E3, F3 |
| 4 | CCTV/Van Pack | A4, B4, C4, D4, E4, F4 |
| 5 | CCTV/Jet Vac | A5, B5, C5, D5, E5, F5 |
| 6 | CCTV/Cleansing/Root | A6, B6, C6, D6, E6, F6 |
| 7 | Directional Water Cutter | A7, B7, C7, D7, E7, F7 |
| 8 | Patching | A8, B8, C8, D8, E8, F8 |
| 9 | Robotic Cutting | A9, B9, C9, D9, E9, F9 |
| 10+ | Future equipment | A10-A16, B10-B16, etc. |

## Database Changes Needed:

### 1. Fix Sector Names:
```sql
-- Change meaningless id1-id6 to real sector names
UPDATE pr2_configurations SET sector = 'utilities' WHERE sector = 'id1';
UPDATE pr2_configurations SET sector = 'adoption' WHERE sector = 'id2';
UPDATE pr2_configurations SET sector = 'highways' WHERE sector = 'id3';
UPDATE pr2_configurations SET sector = 'insurance' WHERE sector = 'id4';
UPDATE pr2_configurations SET sector = 'construction' WHERE sector = 'id5';
UPDATE pr2_configurations SET sector = 'domestic' WHERE sector = 'id6';
```

### 2. Standardize category_id across sectors:
```sql
-- Every sector gets the same equipment types
-- A1, B1, C1, D1, E1, F1 all use category_id = 'cctv'
-- A2, B2, C2, D2, E2, F2 all use category_id = 'van-pack'
-- etc.
```

### 3. Create DevLabel system:
- **Frontend shows**: "A1" (Utilities CCTV), "B2" (Adoption Van Pack)
- **Database stores**: sector='utilities', category_id='cctv', devlabel='A1'
- **Users understand**: A=Utilities, 1=CCTV

## Benefits:

1. **Clear identification**: "A1" instantly means "Utilities CCTV"
2. **Scalable**: Each sector gets 16 card slots (A1-A16)
3. **Consistent**: Same equipment types across all sectors
4. **User-friendly**: No more random F612 numbers
5. **Easy debugging**: Logs show "A1" instead of "F612"

## Frontend/Backend Matching:

**Frontend DevLabel**: Shows "A1" to user
**Database lookup**: sector='utilities' AND category_id='cctv'
**Perfect match**: One-to-one correspondence