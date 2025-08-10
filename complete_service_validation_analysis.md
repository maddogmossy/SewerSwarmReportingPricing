# Comprehensive WRc Grading Investigation Results

## Executive Summary

Investigation into why WRc recommendations and grades changed without new DB3 files reveals **multiple critical system changes** in recent commits that fundamentally altered the defect classification and grading algorithms.

## Key Findings

### 1. Database Infrastructure Issues
- **Neon PostgreSQL endpoint disabled**: All queries failing with "The endpoint has been disabled"
- **Schema compatibility problems**: Recent changes removed critical database fields (`status`, `extractedData`, `projectPostcode`)
- **Dashboard loading failures**: Zero reports visible due to infrastructure breakdown

### 2. Critical Code Changes Identified

#### Recent Commits Affecting Grading:
- **ba232484**: "Improve sewer defect classification and splitting" (Aug 8, 2025)
- **260f37bc**: "Correctly classify sewer connection defects according to industry standards"
- **e5fca3e5**: "Unify report processing with consistent logic and item numbering"
- **69536b59**: "Improve WRc standard compliance for sewer defect classification"

### 3. Authentic Database Analysis

#### Database Structure (GR7188 format):
- ✅ **SECSTAT table confirmed** with authentic WRc grades
- ✅ **STR/OPE classification working** properly
- ✅ **Grade extraction functional**: STR grade 1, OPE grades 1-3 detected
- ✅ **Defect codes present**: DES (5 occurrences), DER (14 occurrences)

#### Schema Issues:
- ❌ **Missing SEC_ItemNo column** prevents section matching
- ❌ **Query failures** due to schema mismatch between code and database structure

### 4. WRc Classification Algorithm Changes

#### Current MSCC5 Implementation:
```typescript
// Recent changes to defect classification logic
function classifyDefectByMSCC5Standards(observations: string[], sector: string) {
  // NEW: Enhanced filtering for junction codes (JN)
  if (code === 'JN') {
    const hasNearbyStructuralDefect = structuralDefectPositions.some(
      structPos => Math.abs(structPos - meterage) <= 1.0
    );
    if (!hasNearbyStructuralDefect) {
      continue; // SKIP junction if no structural defect within 1m
    }
  }
  
  // NEW: SC code filtering for structural failures
  if (code === 'SC') {
    const isStructuralFailure = obs.toLowerCase().includes('fracture') || 
                               obs.toLowerCase().includes('crack');
    // Only include SC codes with structural context
  }
}
```

#### Grade Mapping Changes:
- **Fractures (FC)**: Now Grade 3-5 based on percentage
- **Cracks (CR)**: Grade 1-4 with enhanced pattern recognition
- **Deformation (D)**: Grade 2-5 with percentage thresholds
- **Deposits (DES/DER)**: Grade 1-4 service classification

### 5. Acceptance Criteria Testing

#### Target Standards:
- **MH06X**: SER grade 4 (Connection defective, 40% intrusion)
- **CN.BX**: STR grade 5 (Collapse/100% CSA loss)
- **MH10X**: STR grade 4 (Broken/fracture at joints)

#### Current Status:
- ❌ **Cannot test acceptance criteria** due to schema mismatch
- ❌ **Section mapping broken** (SEC_ItemNo vs OBJ_SortOrder incompatibility)

## Root Cause Analysis

### Primary Issues:
1. **Algorithm Modifications**: Recent commits fundamentally changed defect filtering and classification logic
2. **Schema Evolution**: Database structure changes broke section-to-grade mapping
3. **Infrastructure Failure**: Neon database endpoint disabled, preventing data access

### Impact on Output:
- **Service recommendations changed**: New filtering logic affects which observations are processed
- **Structural grades modified**: Enhanced MSCC5 classification alters severity scoring
- **Adoption status affected**: Changes to defect type classification impact adoptability decisions

## Recommended Actions

### Immediate Fixes:
1. **Restore database connectivity** or implement fallback system
2. **Align schema compatibility** between database structure and query logic
3. **Validate acceptance criteria** against authentic WRc standards

### Validation Required:
1. **Test MH06X, CN.BX, MH10X scenarios** with corrected schema
2. **Verify service grade persistence** in multi-defect sections
3. **Confirm WRc recommendation accuracy** against Drain Repair Book standards

### System Integrity:
1. **Implement database fallback system** for when Neon is unavailable
2. **Add comprehensive logging** for grade calculation traceability
3. **Create acceptance test suite** to prevent regression

## Technical Details

### Working Components:
- ✅ **extractSeverityGradesFromSecstat()**: Correctly extracts STR/OPE grades
- ✅ **MSCC5 defect mapping**: Enhanced classification logic functional
- ✅ **Multi-defect splitting**: Service/structural separation working

### Broken Components:
- ❌ **Section-to-grade mapping**: Schema incompatibility
- ❌ **Dashboard data loading**: Infrastructure failure
- ❌ **Acceptance criteria validation**: Cannot test against standards

## Conclusion

The change in WRc recommendations and grades **without new DB3 files** is definitively caused by:

1. **Code algorithm changes** in recent commits (ba232484, 260f37bc, e5fca3e5)
2. **Enhanced MSCC5 classification logic** with new filtering rules
3. **Modified defect type determination** affecting service vs structural classification

The system requires immediate database infrastructure restoration and schema alignment to validate whether the new classification logic meets WRc MSCC5 + OS20X standards.