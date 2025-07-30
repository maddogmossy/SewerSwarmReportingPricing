# F606/F607 Configuration Selection System Implementation Plan

## Executive Summary

This document provides a comprehensive analysis and implementation plan for enhancing the blue recommendation card click functionality to present users with two configuration options: F606 (CCTV/Jet Vac) as the default highlighted option and F607 (CCTV/Van Pack) as the secondary option. The system will provide visual feedback showing which configuration is selected for cost calculations on the dashboard.

## Current System Analysis

### 1. Blue Recommendation Card Architecture

**Current Flow:**
- Dashboard blue cleaning recommendations → CleaningOptionsPopover click → Direct routing to F606 or F607
- Location: `client/src/pages/dashboard.tsx` lines 1164-1199
- Handler: CleaningOptionsPopover component wraps blue recommendations with `onClick={handleDirectClick}`

**Current CleaningOptionsPopover Logic (`client/src/components/cleaning-options-popover.tsx`):**
```typescript
// Priority routing: F607 CCTV/Van Pack if available, fallback to F606 CCTV/Jet Vac
if (cctvVanPackConfig) {
  // Route to F607 f-cctv-van-pack configuration
  window.location.href = `/pr2-config-clean?id=${cctvVanPackConfig.id}&categoryId=f-cctv-van-pack&sector=utilities&pipeSize=${pipeSizeNumber}&selectedId=id1`;
} else if (cctvJetVacConfig) {
  // Fallback to F606 cctv-jet-vac configuration
  window.location.href = `/pr2-config-clean?id=${cctvJetVacConfig.id}&categoryId=cctv-jet-vac&sector=utilities&pipeSize=${pipeSizeNumber}&selectedId=id1`;
}
```

### 2. Current Configuration Status

**F606 (CCTV/Jet Vac):**
- Category ID: `cctv-jet-vac`
- Template Type: MMP1
- Database ID: 606 (confirmed operational)
- Status: Fully configured with MMP1 template

**F607 (CCTV/Van Pack):**
- Category ID: `f-cctv-van-pack`
- Template Type: MMP1 
- Database ID: 607 (confirmed operational)
- Status: Fully configured with MMP1 template

### 3. Visual Display System

**Current ID Display Logic:**
- Main category grid shows "f606" and "f607" labels instead of numeric IDs
- Implemented in `pr2-pricing.tsx` lines 637-641:
```typescript
<DevLabel id={existingConfiguration ? 
  (existingConfiguration.categoryId === 'f-cctv-van-pack' ? 'f607' : 
   existingConfiguration.categoryId === 'cctv-jet-vac' ? 'f606' : 
   `F${existingConfiguration.id}`) : 
  `F-${category.id}`} />
```

## Problem Analysis

### Current Issues:
1. **No User Choice**: Users are automatically routed to F607 if available, F606 as fallback
2. **No Visual Feedback**: No indication of which configuration is being used for cost calculations
3. **No Selection Interface**: Missing intermediate selection step for user preference
4. **No Green Highlighting**: No visual indicator showing preferred/selected option

### User Requirements:
1. **Two-Option Selection**: Present F606 (default, green highlight) and F607 (secondary option) 
2. **Visual Feedback**: Show which configuration is selected for cost calculations
3. **Green Highlighting**: Default F606 highlighted green, F607 highlighted when selected
4. **No Test Buttons**: Clean interface without test functions (explicitly requested)

## Technical Architecture Analysis

### 1. Current Routing Pattern
```
Dashboard Click → CleaningOptionsPopover → Direct Navigation to F606/F607
```

### 2. Required New Pattern
```
Dashboard Click → Selection Dialog → User Choice → Navigation to Selected Config
```

### 3. Selection Dialog Requirements
- **Modal/Popover Interface**: Present F606 and F607 options
- **Green Highlighting**: F606 default green, F607 green when selected
- **Configuration Details**: Show pipe size and sector context
- **Navigation Buttons**: Route to selected configuration with proper parameters

### 4. State Management Requirements
- **Selected Configuration Tracking**: Remember user's choice
- **Cost Calculation Integration**: Use selected config for dashboard calculations
- **Visual Feedback**: Update dashboard to show which config is active

## Implementation Plan

### Phase 1: Selection Dialog Component Creation (30-45 minutes)

**1.1 Create ConfigurationSelectionDialog Component**

Location: `client/src/components/configuration-selection-dialog.tsx`

```typescript
interface ConfigurationSelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  sectionData: {
    pipeSize: string;
    sector: string;
    itemNo?: number;
  };
  onConfigurationSelect: (configId: string, categoryId: string) => void;
}

interface ConfigOption {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  isDefault: boolean;
  icon: React.ComponentType;
}

const CONFIG_OPTIONS: ConfigOption[] = [
  {
    id: 'f606',
    categoryId: 'cctv-jet-vac',
    name: 'F606 - CCTV/Jet Vac',
    description: 'High-pressure jetting with CCTV inspection',
    isDefault: true,
    icon: Wrench
  },
  {
    id: 'f607', 
    categoryId: 'f-cctv-van-pack',
    name: 'F607 - CCTV/Van Pack',
    description: 'Comprehensive van-based cleaning equipment',
    isDefault: false,
    icon: Building
  }
];
```

**1.2 Dialog Interface Design**
- **Header**: "Select Cleaning Configuration for {pipeSize} Pipe"
- **Two Cards**: F606 and F607 options with green highlighting system
- **Default Selection**: F606 highlighted green by default
- **Selection Logic**: Click to toggle green highlighting
- **Action Buttons**: "Configure Selected" and "Cancel"

**1.3 Green Highlighting System**
- **Selected State**: `bg-green-100 border-green-300 text-green-700`
- **Unselected State**: `bg-white border-gray-200 text-gray-600`
- **Hover Effects**: Enhanced border colors and shadows
- **Selection Feedback**: Clear visual indication of active choice

### Phase 2: CleaningOptionsPopover Enhancement (20-30 minutes)

**2.1 Modify CleaningOptionsPopover Component**

Location: `client/src/components/cleaning-options-popover.tsx`

Changes Required:
- Replace direct navigation with dialog trigger
- Add state management for dialog visibility
- Integrate ConfigurationSelectionDialog component
- Handle configuration selection and routing

```typescript
export function CleaningOptionsPopover({ children, sectionData, onPricingNeeded, hasLinkedPR2, configColor }: CleaningOptionsPopoverProps) {
  const [showSelectionDialog, setShowSelectionDialog] = useState(false);

  const handleDirectClick = () => {
    // Open selection dialog instead of direct navigation
    setShowSelectionDialog(true);
  };

  const handleConfigurationSelect = (configId: string, categoryId: string) => {
    // Handle navigation to selected configuration
    const pipeSize = sectionData.pipeSize || '150mm';
    const pipeSizeNumber = pipeSize.replace('mm', '');
    
    // Route to selected configuration with proper parameters
    window.location.href = `/pr2-config-clean?categoryId=${categoryId}&sector=${sectionData.sector}&pipeSize=${pipeSizeNumber}&selectedId=id1`;
    
    setShowSelectionDialog(false);
  };

  return (
    <>
      <div onClick={handleDirectClick} style={{ cursor: 'pointer' }}>
        {children}
      </div>
      
      <ConfigurationSelectionDialog
        isOpen={showSelectionDialog}
        onClose={() => setShowSelectionDialog(false)}
        sectionData={sectionData}
        onConfigurationSelect={handleConfigurationSelect}
      />
    </>
  );
}
```

### Phase 3: Dashboard Integration Enhancement (25-35 minutes)

**3.1 Cost Calculation Integration**

Location: `client/src/pages/dashboard.tsx`

Requirements:
- Track which configuration is selected for each section
- Use selected configuration for cost calculations
- Display visual feedback showing active configuration

**3.2 Selected Configuration State Management**

```typescript
// Add state for tracking selected configurations per section
const [selectedConfigurations, setSelectedConfigurations] = useState<Record<number, string>>({});

// Default configuration logic
const getSelectedConfiguration = (itemNo: number) => {
  return selectedConfigurations[itemNo] || 'f606'; // Default to F606
};

// Update cost calculation to use selected configuration
const calculateCostWithSelectedConfig = (section: any) => {
  const selectedConfig = getSelectedConfiguration(section.itemNo);
  // Use selectedConfig for cost calculation logic
  return calculateMM4AutoCost(section, selectedConfig);
};
```

**3.3 Visual Feedback Implementation**

Enhance blue recommendation cards to show selected configuration:
- Add configuration indicator (f606/f607) in recommendation text
- Color-code based on selected configuration
- Update statusMessage to reflect active configuration

### Phase 4: Configuration Detection and Routing (15-25 minutes)

**4.1 API Integration**

Ensure proper detection of F606 and F607 configurations:
- Verify `/api/pr2-clean?sector=utilities` returns both configurations
- Confirm category ID mapping works correctly
- Test configuration availability detection

**4.2 URL Parameter Handling**

Enhance configuration pages to handle selection parameters:
- Parse `selectedConfig` URL parameter
- Apply appropriate highlighting based on selection
- Maintain selection state during configuration editing

### Phase 5: Testing and Validation (20-30 minutes)

**5.1 End-to-End Workflow Testing**
1. Dashboard blue recommendation click
2. Selection dialog opens with F606 highlighted green
3. User can select F607 (highlighting switches)
4. Configuration navigation works correctly
5. Dashboard cost calculations use selected configuration

**5.2 Visual Feedback Testing**
- Verify green highlighting works correctly
- Confirm selected configuration appears in dashboard
- Test configuration switching and cost updates

**5.3 Regression Testing**
- Ensure existing F606/F607 functionality preserved
- Verify MMP1 template integration still works
- Confirm no breaking changes to other components

## Risk Assessment

### Low Risk
- ConfigurationSelectionDialog component creation (new isolated component)
- CleaningOptionsPopover enhancement (well-defined interface)
- Visual feedback implementation (CSS and state changes)

### Medium Risk
- Dashboard state management integration (affects multiple components)
- Cost calculation modification (impacts financial calculations)
- URL parameter handling enhancement (routing changes)

### High Risk
- Breaking existing F606/F607 configuration access
- MMP1 template integration disruption
- Dashboard cost calculation accuracy

## Success Criteria

### 1. Functional Requirements Met
- ✅ Blue recommendation cards open selection dialog
- ✅ F606 highlighted green by default
- ✅ F607 selectable with green highlighting
- ✅ Configuration navigation works correctly
- ✅ Dashboard shows selected configuration for cost calculations

### 2. User Experience Goals
- ✅ Clean interface without test buttons
- ✅ Clear visual feedback for configuration selection
- ✅ Intuitive two-option selection process
- ✅ Professional appearance matching existing design

### 3. Technical Standards
- ✅ No breaking changes to existing functionality
- ✅ Proper state management and data flow
- ✅ TypeScript type safety maintained
- ✅ Component reusability and maintainability

## File Modification Summary

### New Files:
1. `client/src/components/configuration-selection-dialog.tsx` - Selection dialog component

### Modified Files:
1. `client/src/components/cleaning-options-popover.tsx` - Dialog integration
2. `client/src/pages/dashboard.tsx` - State management and cost calculation
3. `client/src/pages/pr2-config-clean.tsx` - URL parameter handling (if needed)

### Key Dependencies:
- shadcn/ui Dialog components
- React useState for state management
- Existing MMP1 template system
- Current F606/F607 configuration structure

## Implementation Timeline

### Phase 1 (Dialog Component): 30-45 minutes
- Create ConfigurationSelectionDialog component
- Implement green highlighting system
- Add proper TypeScript interfaces

### Phase 2 (Popover Enhancement): 20-30 minutes
- Modify CleaningOptionsPopover to use dialog
- Add state management for dialog visibility
- Implement configuration selection handling

### Phase 3 (Dashboard Integration): 25-35 minutes
- Add selected configuration state management
- Modify cost calculation to use selected config
- Implement visual feedback in recommendations

### Phase 4 (Routing and Detection): 15-25 minutes
- Verify API integration works correctly
- Test configuration detection and availability
- Enhance URL parameter handling if needed

### Phase 5 (Testing): 20-30 minutes
- End-to-end workflow testing
- Visual feedback validation
- Regression testing for existing functionality

**Total Estimated Time: 110-165 minutes (approximately 2-3 hours)**

## Next Steps

1. **Immediate Implementation**: Start with Phase 1 - ConfigurationSelectionDialog component creation
2. **Iterative Testing**: Test each phase before proceeding to next
3. **User Feedback Integration**: Validate user experience after Phase 3
4. **Final Validation**: Complete end-to-end testing in Phase 5

This implementation plan provides a systematic approach to creating the F606/F607 selection system while maintaining existing functionality and meeting all user requirements for visual feedback and configuration choice.

## Technical Notes

### State Management Pattern
The implementation uses React useState for local component state management, avoiding complex global state solutions for this focused feature enhancement.

### Green Highlighting Pattern
Following established shadcn/ui design patterns with `bg-green-100 border-green-300 text-green-700` for selected states and smooth transitions for user interaction feedback.

### Configuration Routing Pattern
Maintaining existing URL parameter structure (`categoryId`, `sector`, `pipeSize`, `selectedId`) while adding selection logic for F606/F607 choice persistence.

### Cost Calculation Integration
Leveraging existing MM4 cost calculation system while adding configuration selection awareness for accurate financial projections based on user choice.

This plan ensures comprehensive implementation of the F606/F607 selection system while maintaining system stability and user experience consistency.