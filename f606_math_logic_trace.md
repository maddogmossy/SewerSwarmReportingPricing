# F606 MM4-150 MATH LOGIC TRACE

## CURRENT F606 MM4-150 CONFIG:
- **Blue Value (Day Rate):** £1950
- **Green Value (Runs per shift):** 30 
- **Purple Debris:** 35% limit
- **Purple Length:** 99m limit

## SERVICE SECTIONS DATA:

### Item 3: (FIRST SERVICE SECTION - KEY FOR CONFIGURATION)
- **Defects:** "DES Settled deposits, fine, 5% cross-sectional area loss at 13.27m, 16.63m, 17.73m. DER Settled deposits, coarse, 5% cross-sectional area loss at 21.6m. Line deviates left at 29.82m"
- **Length:** 30.24m
- **Debris:** 5% (extracted from defects text)
- **Pipe Size:** 150mm
- **Severity Grade:** "3" (service defect)  
- **Defect Type:** "service"
- **Severity Grades:** `{"service": 3, "structural": 0}`

### Item 6:
- **Defects:** "DER Settled deposits, coarse, 5% cross-sectional area loss at 8.1m, 9.26m, 27.13m. Line deviates left at 33.34m"
- **Length:** ~33.34m (from defects text)
- **Debris:** 5% (from defects text)
- **Pipe Size:** 150mm
- **Severity Grade:** "3" (service defect)
- **Defect Type:** "service"

### Item 8:
- **Defects:** "DER Settled deposits, coarse, 5% cross-sectional area loss at 11.35m"
- **Length:** ~11.35m 
- **Debris:** 5%
- **Pipe Size:** 150mm  
- **Severity Grade:** "3" (service defect)
- **Defect Type:** "service"

## VALIDATION CHECKS:

### Range Validation:
- **Item 3:** 30.24m < 99m ✓, 5% < 35% ✓ = **WITHIN RANGE** ⭐ KEY SECTION
- Item 6: 33.34m < 99m ✓, 5% < 35% ✓ = **WITHIN RANGE**
- Item 8: 11.35m < 99m ✓, 5% < 35% ✓ = **WITHIN RANGE**

### Equipment Priority:
- Current: F606 (forced default)
- Config Used: F606 (categoryId: 'cctv-jet-vac')

## EXPECTED COST CALCULATION:

### Formula: (Day Rate ÷ Runs per shift) × Section Length
- **Cost per run:** £1950 ÷ 30 = £65 per run
- **Item 3:** £65 × (30.24m run factor) = estimated £65-130 ⭐ **KEY CALCULATION**
- **Item 6:** £65 × (33.34m run factor) = estimated £65-130
- **Item 8:** £65 × (11.35m run factor) = estimated £65

## MISSING ELEMENTS TO INVESTIGATE:

1. **hasDefectsRequiringCost** - Are service sections triggering cost calculation?
2. **calculateAutoCost** - Is this function being called for service sections?
3. **Service validation logic** - Why no debugging output for items 6,8?
4. **Cost column rendering** - What's being returned instead of costs?

## EXPECTED DASHBOARD BEHAVIOR:
- Items 6,8 should show calculated costs (£65-130 range)
- No blue triangles (sections within range)
- No orange triangles (day rate configured)