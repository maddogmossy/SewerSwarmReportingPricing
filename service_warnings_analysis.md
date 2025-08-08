# SERVICE WARNINGS ANALYSIS - F606 MM4-150

## CURRENT F606 DATABASE VALUES:
✅ **Blue Value (Day Rate):** £1950  
✅ **Green Value (Runs per shift):** 30
❌ **Purple Debris Limit:** 3% (very strict!)
✅ **Purple Length Limit:** 99m

## SERVICE SECTIONS vs LIMITS:

### Item 6: "DER Settled deposits, coarse, 5% cross-sectional area loss..."
- **Length:** ~33.34m < 99m limit ✓ **WITHIN RANGE**
- **Debris:** 5% > 3% limit ❌ **EXCEEDS LIMIT** 
- **Result:** BLUE service warning (debris out of range)

### Item 8: "DER Settled deposits, coarse, 5% cross-sectional area loss at 11.35m"  
- **Length:** ~11.35m < 99m limit ✓ **WITHIN RANGE**
- **Debris:** 5% > 3% limit ❌ **EXCEEDS LIMIT**
- **Result:** BLUE service warning (debris out of range)

## ROOT CAUSE IDENTIFIED:

You set the **purple debris limit to 3%**, but both service sections have **5% debris** from the defects text. This triggers the out-of-range validation and shows blue service warnings.

## WHY DEBUGGING LOGS NOT SHOWING:

The enhanced debugging may not be triggering because `hasDefectsRequiringCost` could be evaluating to false for service sections. Let me check the severity grade logic.

## EXPECTED BEHAVIOR:
- Service sections with 5% debris exceed 3% limit
- System shows blue triangles indicating out-of-range debris
- This is working correctly based on your F606 configuration

## SOLUTION:
Either:
1. **Increase purple debris limit** from 3% to 6% or higher
2. **Accept the warnings** as valid - sections exceed your configured limits