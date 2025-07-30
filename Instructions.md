# MMP1 Template Integration into p003 f-cctv-van-pack Configuration

## Executive Summary

This document provides a comprehensive analysis and implementation plan for integrating the MMP1 template system into a new p003 f-cctv-van-pack configuration, while maintaining existing F605/F606 dashboard routing for cleanse/survey recommendations.

## Current System Analysis

### 1. Template System Architecture

The system currently supports 5 template types:
- **TP1**: Standard template with 4-window structure (Blue/Green/Orange/Purple)
- **P26**: Central day rate configuration with multiple pipe sizes
- **P006**: Original CTF templates (removed per user preference)
- **P006a**: Full F175-style interface with W020/C029/W007 components
- **MMP1**: 5-section template system (MM1-MM5) with advanced features

### 2. Existing MMP1 Configurations

Current MMP1 configurations in database:
- **F605 (ID: 605)**: test-card category, id4 sector, MMP1 template
- **F606 (ID: 606)**: cctv-jet-vac category, utilities sector, MMP1 template

### 3. Template Detection Logic

Location: `client/src/pages/pr2-config-clean.tsx` lines 320-340

```typescript
const getTemplateType = (categoryId: string): 'TP1' | 'P26' | 'P006' | 'P006a' | 'MMP1' => {
  if (categoryId === 'cart-card') {
    return 'TP1';
  } else if (categoryId === 'day-rate-db11') {
    return 'P26';
  } else if (categoryId?.startsWith('P006-')) {
    return 'P006';
  } else if (categoryId === 'test-card' || categoryId === 'cctv-jet-vac') {
    return 'MMP1'; // Current MMP1 detection
  } else if (categoryId?.includes('-p006a') || /* various P006a patterns */) {
    return 'P006a';
  } else {
    return 'TP1';
  }
}
```

### 4. MMP1 Template Component Structure

Location: `client/src/components/MMP1Template.tsx`

**MM1 - ID Selection System**: P002-style cards for sector-based pricing (ID1-ID6 → Utilities/Adoption/Highways/Insurance/Construction/Domestic)

**MM2 - Color Picker System**: 20 Outlook diary-style colors + custom color picker with hex input

**MM3 - UK Drainage Pipe Sizes**: MSCC5-compliant pipe sizes (100-2400mm) with custom size management

**MM4 - Cost Configuration**: Pipe-size-specific data with Blue/Green/Purple/Length fields

**MM5 - Vehicle Cost Configuration**: Independent vehicle weight and cost per mile management

### 5. Dashboard Routing Analysis

Location: `client/src/components/cleaning-options-popover.tsx`

Current routing for cleanse/survey recommendations:
- Detects utilities sector sections
- Routes to F606 (cctv-jet-vac) configuration
- Connects via `window.location.href = `/pr2-config-clean?id=${cctvJetVacConfig.id}&categoryId=cctv-jet-vac&sector=utilities&pipeSize=${pipeSizeNumber}&selectedId=id1`

## Problem Analysis

### 1. Missing p003 f-cctv-van-pack Configuration

**Issue**: No database configuration exists for p003 f-cctv-van-pack category
- No SQL records found matching p003, f-cctv-van-pack, or van-pack patterns
- No categoryId mapping for cctv-van-pack in template detection logic

### 2. Template Detection Gap

**Issue**: MMP1 template detection only covers 'test-card' and 'cctv-jet-vac'
- No recognition for cctv-van-pack categoryId
- Would default to TP1 template instead of MMP1

### 3. Dashboard Routing Limitation

**Issue**: Cleaning options popover only routes to F606 cctv-jet-vac
- No alternative routing for CCTV/Van Pack equipment combinations
- Missing connection between dashboard recommendations and p003 configuration

### 4. Naming Convention Inconsistency

**Issue**: Mixed naming patterns across system
- F605/F606 use direct categoryId (test-card, cctv-jet-vac)
- P003 naming suggests different pattern
- Need to establish consistent f-cctv-van-pack categoryId

## Implementation Plan

### Phase 1: Database Configuration Creation

**1.1 Create F607 p003 Configuration**
```sql
INSERT INTO pr2_configurations (
  id, category_id, category_name, sector, description,
  user_id, is_active, created_at, updated_at
) VALUES (
  607,
  'f-cctv-van-pack', -- or 'cctv-van-pack' based on preference
  'F607 CCTV/Van Pack',
  'utilities',
  'MMP1 template configuration for CCTV inspection with van pack cleansing operations',
  'test-user',
  true,
  NOW(),
  NOW()
);
```

**1.2 Initialize MMP1 Data Structure**
```sql
UPDATE pr2_configurations SET 
  pricing_options = '[{"id":"mm1_id1","label":"Utilities Pricing","enabled":true,"value":""}]',
  quantity_options = '[{"id":"mm4_150_day_rate","label":"150mm Day Rate","enabled":true,"value":""}]',
  mm_data = '{
    "mm1Colors": "#10B981",
    "mm2IdData": ["id1"],
    "mm3CustomPipeSizes": [],
    "mm4DataByPipeSize": {
      "150-1501": [{"id":1,"blueValue":"","greenValue":"","purpleDebris":"","purpleLength":""}]
    },
    "mm5Data": [{"id":1,"vehicleWeight":"3.5t","costPerMile":""}]
  }'
WHERE id = 607;
```

### Phase 2: Template Detection Enhancement

**2.1 Update getTemplateType Function**

Location: `client/src/pages/pr2-config-clean.tsx` line ~330

```typescript
const getTemplateType = (categoryId: string): 'TP1' | 'P26' | 'P006' | 'P006a' | 'MMP1' => {
  if (categoryId === 'cart-card') {
    return 'TP1';
  } else if (categoryId === 'day-rate-db11') {
    return 'P26';
  } else if (categoryId?.startsWith('P006-')) {
    return 'P006';
  } else if (categoryId === 'test-card' || 
             categoryId === 'cctv-jet-vac' || 
             categoryId === 'f-cctv-van-pack' || 
             categoryId === 'cctv-van-pack') {
    return 'MMP1'; // ENHANCED: Include f-cctv-van-pack
  } else if (categoryId?.includes('-p006a') || /* existing P006a patterns */) {
    return 'P006a';
  } else {
    return 'TP1';
  }
}
```

### Phase 3: Dashboard Routing Integration

**3.1 Enhanced Cleaning Options Popover**

Location: `client/src/components/cleaning-options-popover.tsx`

```typescript
const handleDirectClick = async () => {
  const pipeSize = sectionData.pipeSize || '150mm';
  const pipeSizeNumber = pipeSize.replace('mm', '');
  
  try {
    if (sectionData.sector === 'utilities') {
      const response = await fetch(`/api/pr2-clean?sector=utilities`);
      
      if (response.ok) {
        const configs = await response.json();
        
        // ENHANCED: Support multiple MMP1 configurations
        const cctvJetVacConfig = configs.find((config: any) => 
          config.categoryId === 'cctv-jet-vac'
        );
        const cctvVanPackConfig = configs.find((config: any) => 
          config.categoryId === 'f-cctv-van-pack' || 
          config.categoryId === 'cctv-van-pack'
        );
        
        // Route based on equipment preference or show selection
        if (cctvVanPackConfig) {
          window.location.href = `/pr2-config-clean?id=${cctvVanPackConfig.id}&categoryId=${cctvVanPackConfig.categoryId}&sector=utilities&pipeSize=${pipeSizeNumber}&selectedId=id1`;
        } else if (cctvJetVacConfig) {
          // Fallback to existing F606
          window.location.href = `/pr2-config-clean?id=${cctvJetVacConfig.id}&categoryId=cctv-jet-vac&sector=utilities&pipeSize=${pipeSizeNumber}&selectedId=id1`;
        }
      }
    }
  } catch (error) {
    console.error('Navigation error:', error);
  }
};
```

**3.2 Equipment Selection Enhancement**

Add CCTV/Van Pack as equipment option in cleaning recommendations:

```typescript
// In dashboard rendering logic
const equipmentOptions = [
  { id: 'cctv-jet-vac', name: 'CCTV/Jet Vac', configId: 606 },
  { id: 'f-cctv-van-pack', name: 'CCTV/Van Pack', configId: 607 }
];
```

### Phase 4: MMP1 Component Integration

**4.1 Component Conditional Rendering**

Location: `client/src/pages/pr2-config-clean.tsx` line ~2800

```typescript
{/* MMP1 Template - Enhanced for f-cctv-van-pack */}
{getTemplateType(categoryId || '') === 'MMP1' && (
  <MMP1Template 
    categoryId={categoryId || ''} 
    sector={sector}
    editId={editId ? parseInt(editId) : undefined}
    onSave={() => {
      // Invalidate queries and refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/pr2-clean'] });
    }}
  />
)}
```

**4.2 MMP1 Template Protection Maintenance**

Ensure MMP1Template.tsx remains protected from modifications:
- Maintain user-controlled template zone
- Preserve existing MM1-MM5 functionality
- No structural changes to protected component

### Phase 5: Data Migration and Setup

**5.1 Create Setup Script**

File: `setup-f607-cctv-van-pack.js`

```javascript
#!/usr/bin/env node

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { pr2Configurations } from './shared/schema.ts';

const client = postgres(process.env.DATABASE_URL);
const db = drizzle(client);

async function setupF607Configuration() {
  console.log('🚀 Setting up F607 CCTV/Van Pack MMP1 configuration...');
  
  const newConfig = {
    id: 607,
    categoryId: 'f-cctv-van-pack',
    categoryName: 'F607 CCTV/Van Pack',
    description: 'MMP1 template configuration for CCTV inspection with van pack cleansing operations',
    categoryColor: '#8B5CF6', // Purple color for van pack
    sector: 'utilities',
    userId: 'test-user',
    isActive: true,
    
    // MMP1 structure
    pricingOptions: [
      { id: 'mm1_id1', label: 'Utilities Pricing', enabled: true, value: '' }
    ],
    quantityOptions: [
      { id: 'mm4_150_day_rate', label: '150mm Day Rate', enabled: true, value: '' }
    ],
    minQuantityOptions: [],
    rangeOptions: [],
    vehicleTravelRates: [],
    mathOperators: ['N/A'],
    
    // MMP1 data
    mmData: {
      mm1Colors: '#8B5CF6',
      mm2IdData: ['id1'], // Default to Utilities
      mm3CustomPipeSizes: [],
      mm4DataByPipeSize: {
        '150-1501': [{ id: 1, blueValue: '', greenValue: '', purpleDebris: '', purpleLength: '' }]
      },
      mm5Data: [{ id: 1, vehicleWeight: '3.5t', costPerMile: '' }],
      selectedPipeSize: '150',
      selectedPipeSizeId: 1501,
      timestamp: Date.now()
    }
  };
  
  await db.insert(pr2Configurations).values(newConfig);
  console.log('✅ F607 CCTV/Van Pack configuration created successfully');
  
  await client.end();
}

setupF607Configuration().catch(console.error);
```

### Phase 6: Testing and Validation

**6.1 Template Detection Testing**
- Verify getTemplateType('f-cctv-van-pack') returns 'MMP1'
- Confirm conditional rendering shows MMP1Template component
- Test navigation from dashboard to F607 configuration

**6.2 Dashboard Integration Testing**
- Test cleanse/survey recommendations route to F607
- Verify pipe size and sector parameters pass correctly
- Confirm MM1 ID1 (Utilities) auto-selection works

**6.3 MMP1 Functionality Testing**
- Test MM1 sector selection (ID1-ID6)
- Verify MM2 color picker functionality
- Test MM4 pipe-size-specific data management
- Validate MM5 vehicle cost configuration
- Confirm auto-save functionality across all sections

## Risk Assessment

### Low Risk
- Template detection enhancement (simple categoryId addition)
- Database configuration creation (follows existing patterns)
- MMP1 component integration (existing component)

### Medium Risk  
- Dashboard routing modification (affects user workflow)
- Data migration script execution (database changes)

### High Risk
- MMP1Template component modifications (protected zone)
- Breaking existing F605/F606 functionality
- Data loss during migration

## Success Criteria

### Functional Requirements
1. F607 configuration accessible via `/pr2-config-clean?categoryId=f-cctv-van-pack&sector=utilities`
2. Dashboard cleanse/survey recommendations route to F607 for van pack operations
3. MMP1 template renders correctly with all MM1-MM5 sections
4. Auto-save functionality works across all MMP1 sections
5. Existing F605/F606 routing remains intact

### Technical Requirements
1. Template detection correctly identifies f-cctv-van-pack as MMP1
2. Database schema supports MMP1 data structure
3. Component conditional rendering includes f-cctv-van-pack
4. API endpoints handle f-cctv-van-pack categoryId
5. No modifications to protected MMP1Template component

### User Experience Requirements
1. Seamless navigation from dashboard to F607 configuration
2. Intuitive pipe size and sector parameter passing
3. Consistent MMP1 interface behavior across F605/F606/F607
4. No disruption to existing cleanse/survey workflows

## Implementation Timeline

### Phase 1 (Database Setup): 1-2 hours
- Create F607 configuration
- Initialize MMP1 data structure
- Test database connectivity

### Phase 2 (Template Detection): 30 minutes
- Update getTemplateType function
- Test template type detection
- Verify conditional rendering

### Phase 3 (Dashboard Integration): 1-2 hours
- Enhance cleaning options popover
- Add equipment selection logic
- Test dashboard routing

### Phase 4 (Component Integration): 30 minutes  
- Update MMP1 conditional rendering
- Test component display
- Verify auto-save functionality

### Phase 5 (Testing): 1-2 hours
- End-to-end workflow testing
- Regression testing on F605/F606
- Performance validation

**Total Estimated Time: 4-6 hours**

## Conclusion

This plan provides a comprehensive approach to integrating MMP1 template functionality into a new p003 f-cctv-van-pack configuration while maintaining existing system stability. The implementation leverages existing MMP1 architecture patterns and follows established naming conventions to ensure seamless integration with minimal risk.

The key success factor is maintaining the protected status of the MMP1Template component while extending template detection and routing logic to support the new configuration. This approach preserves user-controlled template functionality while expanding system capabilities for CCTV/Van Pack operations.

## Next Steps

1. Execute Phase 1 database setup script
2. Implement Phase 2 template detection enhancement  
3. Test basic F607 configuration accessibility
4. Proceed with dashboard integration (Phase 3)
5. Complete end-to-end testing and validation

This implementation plan ensures a systematic approach to feature integration while maintaining system stability and user experience consistency.