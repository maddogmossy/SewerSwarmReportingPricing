# DEBRIS VALUE INVESTIGATION

## THE ISSUE:
- **User Changed:** Debris from 30% to 35% in dashboard
- **Database Shows:** "3%" (wrong - missing the "5")
- **Buffer Cache Shows:** "35%" (correct)

## ROOT CAUSE:
The database update from the dashboard configuration didn't persist properly. The user entered 35% but only "3" was saved to the database.

## BUFFER VS DATABASE:
- **Buffer Cache:** `"606-150-1501-1-purpleDebris":"35"` ✓ CORRECT
- **Database Value:** `"purpleDebris": "3"` ❌ WRONG (truncated)

## SERVICE SECTIONS vs CORRECTED 35% LIMIT:
- **Item 6:** 5% debris < 35% limit ✓ **WITHIN RANGE**
- **Item 8:** 5% debris < 35% limit ✓ **WITHIN RANGE**

## EXPECTED RESULT:
With 35% debris limit, both service sections should now be within range and show normal cost calculations, not blue warnings.

## DATABASE CORRECTION:
Updating database to match the correct 35% value the user entered.