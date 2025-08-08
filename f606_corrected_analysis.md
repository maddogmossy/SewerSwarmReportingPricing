# F606 DAY RATE CORRECTION

## USER IS CORRECT:

The dashboard **CLEARLY SHOWS £1850** was entered in the F606 configuration, but the database was still showing the old £185 value.

## WHAT HAPPENED:

1. **User entered £1850** in the dashboard F606 MM4 configuration
2. **Database wasn't updated** - still showed old £185 value  
3. **Buffer cache was correct** - showing £1850 as entered
4. **System was using cached value** which was actually the RIGHT value

## THE REAL ISSUE:

The database update didn't persist properly when the user entered £1850 in the dashboard. The buffer cache was actually correct.

## NOW WITH CORRECT £1850 DAY RATE:

### Service Sections Should Work:
- Item 6: 33.34m < 99m limit ✓, 5% < 30% debris ✓
- Item 8: 11.35m < 99m limit ✓, 5% < 30% debris ✓  
- F606 Day Rate: £1850 (now correctly in database)
- **Expected:** Normal cost calculations using £1850 day rate
- **No warnings expected** - everything is within limits

## WHY SERVICE VALIDATION STILL NOT TRIGGERING:

The real issue isn't the day rate - it's that service sections aren't entering the validation logic at all. The debugging logs show no "SERVICE SECTION VALIDATION TRACE" output for items 6,8.

This suggests `calculateAutoCost` is not being called for service sections, despite the routing logic showing it should be.