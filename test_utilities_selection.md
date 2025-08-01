# Complete Dashboard to F615 Utilities Selection Workflow

## STEP 1: Dashboard Detection of Structural Defects
When dashboard loads with utilities report, it detects:
- Item 13a (structural defect with letterSuffix 'a')
- Defect: "D Deformation, 5% cross-sectional area loss at 5.67m"
- DefectType: "structural"

## STEP 2: Dashboard Navigation Triggers
Dashboard calls `handleResolveConfiguration()` when:
1. User clicks recommendation button
2. Or validation warning appears 
3. Or navigation button clicked

The function routes to:
```javascript
// Navigate to patching configuration with auto-select utilities
window.location.href = `/pr2-config-clean?categoryId=patching&sector=${currentSector.id}&autoSelectUtilities=true`;
```

Expected URL: `/pr2-config-clean?categoryId=patching&sector=utilities&autoSelectUtilities=true`

## STEP 3: F615 Page Load with Auto-Selection
When F615 loads, it should:
1. Parse URL parameter: `autoSelectUtilities=true`
2. Trigger useEffect in pr2-config-clean.tsx
3. Auto-select utilities (id1) card in MM1 section
4. Show debug log: "🎯 AUTO-SELECTING utilities (id1) card due to autoSelectUtilities=true"

## STEP 4: Expected Visual Result
- MM1 utilities card shows selected with blue border and settings icon
- F615 pricing shows correct £450 green window calculation for structural defects
- Database saves pricing to utilities sector

## CURRENT ISSUE
Debug logs show: `autoSelectUtilities: false` instead of `true`
This means the URL parameter isn't being passed or parsed correctly.

## TEST REQUIREMENT
Need to trigger dashboard navigation from Item 13a structural defect to see if autoSelectUtilities=true parameter appears in URL.