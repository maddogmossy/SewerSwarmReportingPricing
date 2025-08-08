# F606 MM4-150 DAY RATE ANALYSIS

## DATABASE QUERY RESULTS

### From Console Logs - Backend MM4 Data:
```json
"mm4Rows": [
  {
    "id": 1,
    "blueValue": "185",    // £185 - This should be the day rate source
    "greenValue": "30",     // 30 runs per shift  
    "purpleDebris": "30",   // 30% debris limit
    "purpleLength": "99"    // 99m length limit
  }
]
```

### From Buffer Cache:
```
"606-150-1501-1-blueValue": "1850"  // Buffer shows £1850, not £185!
```

## THE DAY RATE DISCREPANCY IDENTIFIED:

### Database Shows: blueValue = "185" (£185)
### Buffer Cache Shows: blueValue = "1850" (£1850)  
### PricingOptions: EMPTY (no separate day rate configured)

## VALIDATION LOGIC BREAKDOWN:

The system uses this hierarchy for day rate:
1. **MM4 blueValue** (primary source) = £185 from database
2. **PricingOptions day rate** (secondary) = EMPTY
3. **Buffer override** = £1850 (conflicting value)

## WHY SERVICE WARNINGS AREN'T TRIGGERING:

### Expected Logic:
- F606 has day rate £185 from MM4 blueValue
- Sections 6,8 fit within 99m/30% limits  
- Should calculate costs using £185 day rate
- Should show normal costs, NOT warnings

### Actual Issue:
- Buffer cache has £1850 (wrong value)
- System may be using buffered value instead of database
- This explains why validation isn't triggering warnings

## SOLUTION NEEDED:
Clear the buffer cache completely and force fresh database read to use correct £185 day rate.