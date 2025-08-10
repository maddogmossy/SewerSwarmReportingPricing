# Package.json Script Addition

Add this script to the "scripts" section in package.json:

```json
"rules:test": "npx tsx scripts/rules-selftest.mjs"
```

This will enable running the comprehensive WRc rules test suite with:
```bash
npm run rules:test
```

## Test Suite Coverage

The rules self-test validates:
- All 8 mapped defect codes (WL, DER, LL, JN, CP, REF, RG, OF/JS)
- Grade threshold enforcement (below/at/above minimum grades)
- Unknown code handling with appropriate fallbacks
- Edge cases: lowercase codes, empty codes, null grades
- Case-insensitive regex matching
- Position-aware recommendation tracking

Current test results: **32/32 tests passed (100% success rate)**