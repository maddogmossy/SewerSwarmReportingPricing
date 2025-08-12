import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Building, Building2, Car, ShieldCheck, HardHat, Users, Settings, Plus, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';

// 🔒🔒🔒 MMP1 TEMPLATE PROTECTED COMPONENT - DO NOT MODIFY WITHOUT USER PERMISSION 🔒🔒🔒
// ⚠️ WARNING: USER-CONTROLLED TEMPLATE - AI MODIFICATIONS PROHIBITED ⚠️

interface MMP1TemplateProps {
  categoryId: string;
  sector: string;
  editId?: number;
  onSave?: () => void;
}

// MMP1 ID definitions (ID7-ID12 for MM1 cards - separate from main sector selection IDs 1-6)
const MMP1_IDS = [
  { id: 'id7', name: 'Utilities', label: 'Utilities', devId: 'id7', description: 'Water, gas, electricity and telecommunications infrastructure', icon: Building, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  { id: 'id8', name: 'Adoption', label: 'Adoption', devId: 'id8', description: 'New development infrastructure adoption processes', icon: Building2, color: 'text-teal-600', bgColor: 'bg-teal-50' },
  { id: 'id9', name: 'Highways', label: 'Highways', devId: 'id9', description: 'Road infrastructure and highway drainage systems', icon: Car, color: 'text-orange-600', bgColor: 'bg-orange-50' },
  { id: 'insurance', name: 'Insurance', label: 'Insurance', devId: 'D1-D16', description: 'Insurance claim assessment and documentation', icon: ShieldCheck, color: 'text-red-600', bgColor: 'bg-red-50' },
  { id: 'construction', name: 'Construction', label: 'Construction', devId: 'E1-E16', description: 'Construction project infrastructure services', icon: HardHat, color: 'text-cyan-600', bgColor: 'bg-cyan-50' },
  { id: 'domestic', name: 'Domestic', label: 'Domestic', devId: 'F1-F16', description: 'Residential and domestic property services', icon: Users, color: 'text-amber-600', bgColor: 'bg-amber-50' }
];

// Outlook Diary Style Colors (20 colors in 10x2 grid)
const OUTLOOK_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  '#F8C471', '#82E0AA', '#F1948A', '#FFB347', '#D2B4DE', '#A9DFBF', '#F9E79F', '#AED6F1', '#D7BDE2', '#A3E4D7'
];

// UK Drainage Pipe Sizes (MSCC5 compliant)
const UK_PIPE_SIZES = [
  100, 125, 150, 175, 200, 225, 250, 275, 300, 350, 375, 400, 450, 500, 525, 600, 675, 750, 825, 900, 975, 1050, 1200, 1350, 1500, 1800, 2100, 2400
];

export function MMP1Template({ categoryId, sector, editId, onSave }: MMP1TemplateProps) {
  // State management - Initialize empty to prevent persistent highlighting
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedSectorsForCopying, setSelectedSectorsForCopying] = useState<string[]>([]);
  const [idsWithConfig, setIdsWithConfig] = useState<string[]>([]);
  const [customPipeSizes, setCustomPipeSizes] = useState<number[]>([]);
  const [selectedColor, setSelectedColor] = useState<string>('#D4D4D4');
  const [customColor, setCustomColor] = useState<string>('#D4D4D4');
  const [mm4DataByPipeSize, setMm4DataByPipeSize] = useState<Record<string, any[]>>(() => {
    try {
      const saved = localStorage.getItem('mm4DataByPipeSize');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [mm5Data, setMm5Data] = useState<any[]>([{ id: 1, vehicleWeight: '', costPerMile: '' }]);
  const [selectedPipeSizeForMM4, setSelectedPipeSizeForMM4] = useState<string>('100');
  const [inputBuffer, setInputBuffer] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('inputBuffer');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [selectedPipeSizeId, setSelectedPipeSizeId] = useState<number>(1001);
  const [hasUserChanges, setHasUserChanges] = useState<boolean>(false);
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const [showRangeWarning, setShowRangeWarning] = useState<boolean>(false);
  const [pendingRangeValue, setPendingRangeValue] = useState<string>('');
  const [pendingRowId, setPendingRowId] = useState<number | null>(null);

  // SECTOR INDEPENDENCE: Clear selectedIds and reset states when sector or category changes
  useEffect(() => {
    console.log(`🔧 SECTOR INDEPENDENCE: Clearing selections for sector=${sector} categoryId=${categoryId}`);
    // Always start fresh to prevent cross-contamination between sectors
    setSelectedIds([]);
    setIdsWithConfig([]);
    // **CRITICAL FIX**: DO NOT clear MM4 data - preserve localStorage values
    // setMm4DataByPipeSize({}); // REMOVED - was destroying saved MM4 data
    console.log(`✅ SECTOR INDEPENDENCE: Clean state initialized for ${sector} (MM4 data preserved)`);
  }, [sector, categoryId]);

  // **SEPARATE EFFECT FOR MM1 SECTOR AUTO-HIGHLIGHTING** - Runs after page initialization
  useEffect(() => {
    // Wait longer to ensure page-level URL processing is complete
    const timeoutId = setTimeout(() => {
      const sectorToIdMapping = {
        'utilities': 'id7',
        'adoption': 'id8', 
        'highways': 'id9',
        'insurance': 'id10',
        'construction': 'id11',
        'domestic': 'id12'
      };
      
      const correspondingId = sectorToIdMapping[sector as keyof typeof sectorToIdMapping];
      if (correspondingId) {
        console.log(`🎯 AUTO-SELECT DEBUG:`, {
          autoSelectUtilities: sector === 'utilities',
          autoSelectParam: correspondingId,
          selectedId: correspondingId,
          categoryId,
          templateType: 'MMP1',
          shouldTrigger: true,
          currentURL: window.location.href,
          delayedExecution: true
        });
        
        // **FORCE SECTOR SELECTION** - This should run after page URL processing
        setSelectedIds([correspondingId]);
        setIdsWithConfig(prev => [...new Set([...prev, correspondingId])]);
        console.log(`✅ MM1 sector auto-highlighted: ${sector} → ${correspondingId}`);
      }
    }, 500); // Longer delay to ensure it runs AFTER page-level useEffects

    return () => clearTimeout(timeoutId);
  }, [sector, categoryId]);

  // Auto-save functionality
  const triggerAutoSave = useCallback(() => {
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }
    
    const timeoutId = setTimeout(async () => {
      const pipeSizeKey = `${selectedPipeSizeForMM4}-${selectedPipeSizeId}`;
      const currentMM4Data = mm4DataByPipeSize[pipeSizeKey] || [{ id: 1, blueValue: '', greenValue: '', purpleDebris: '', purpleLength: '' }];
      
      console.log('💾 MM Data being saved to backend:', [{
        selectedPipeSize: selectedPipeSizeForMM4,
        selectedPipeSizeId: selectedPipeSizeId,
        mm1Colors: selectedColor,
        mm2IdData: selectedIds,
        mm3CustomPipeSizes: customPipeSizes,
        mm4DataByPipeSize: mm4DataByPipeSize,
        mm5Data: mm5Data,
        mm4Rows: currentMM4Data,
        mm5Rows: mm5Data,
        categoryId: categoryId,
        sector: sector,
        timestamp: Date.now(),
        pipeSizeKey: pipeSizeKey
      }]);

      try {
        // Prepare MM4/MM5 data in the new mmData format
        const mmData = {
          selectedPipeSize: selectedPipeSizeForMM4,
          selectedPipeSizeId: selectedPipeSizeId,
          mm1Colors: selectedColor,
          mm2IdData: selectedIds,
          mm3CustomPipeSizes: customPipeSizes,
          mm4DataByPipeSize: mm4DataByPipeSize,
          mm5Data: mm5Data
        };



        if (editId) {
          const response = await fetch(`/api/pr2-clean/${editId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              categoryName: getCategoryDisplayName(),
              description: getCategoryDescription(),
              categoryColor: selectedColor,
              pipeSize: selectedPipeSizeForMM4,
              mmData: mmData,
              sector: sector
            })
          });
          if (!response.ok) throw new Error('Save failed');
        } else {
          const response = await fetch('/api/pr2-clean', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              categoryName: getCategoryDisplayName(),
              description: getCategoryDescription(),
              categoryColor: selectedColor,
              pipeSize: selectedPipeSizeForMM4,
              mmData: mmData,
              categoryId: categoryId,
              sector: sector
            })
          });
          if (!response.ok) throw new Error('Save failed');
        }
        
        queryClient.invalidateQueries({ queryKey: ['/api/pr2-clean'] });
        if (onSave) onSave();
      } catch (error) {
        console.error('Error saving MMP1 data:', error);
      }
    }, 500);
    
    setAutoSaveTimeout(timeoutId);
  }, [selectedPipeSizeForMM4, selectedPipeSizeId, selectedColor, selectedIds, customPipeSizes, mm4DataByPipeSize, mm5Data, editId, categoryId, sector, autoSaveTimeout, onSave]);

  // MM4 data management
  const getCurrentMM4Data = () => {
    const pipeSizeKey = `${selectedPipeSizeForMM4}-${selectedPipeSizeId}`;
    console.log(`🔍 MM4 Data for key "${pipeSizeKey}":`, mm4DataByPipeSize[pipeSizeKey] || [{ id: 1, blueValue: '', greenValue: '', purpleDebris: '', purpleLength: '' }]);
    console.log('📊 All MM4 data by pipe size:', mm4DataByPipeSize);
    return mm4DataByPipeSize[pipeSizeKey] || [{ id: 1, blueValue: '', greenValue: '', purpleDebris: '', purpleLength: '' }];
  };

  const updateMM4DataForPipeSize = (newData: any[]) => {
    const pipeSizeKey = `${selectedPipeSizeForMM4}-${selectedPipeSizeId}`;
    setMm4DataByPipeSize(prev => ({
      ...prev,
      [pipeSizeKey]: newData
    }));
  };

  const updateMM4Row = (rowId: number, field: 'blueValue' | 'greenValue' | 'purpleDebris' | 'purpleLength', value: string) => {
    const currentData = getCurrentMM4Data();
    
    // Save exactly what user types - no validation during typing
    const newData = currentData.map(row => 
      row.id === rowId ? { ...row, [field]: value } : row
    );
    
    updateMM4DataForPipeSize(newData);
    
    // IMMEDIATE: Save to localStorage for persistence without triggering backend
    const pipeSizeKey = `${selectedPipeSizeForMM4}-${selectedPipeSizeId}`;
    const updatedMM4DataByPipeSize = {
      ...mm4DataByPipeSize,
      [pipeSizeKey]: newData
    };
    localStorage.setItem('mm4DataByPipeSize', JSON.stringify(updatedMM4DataByPipeSize));
    
    // DELAYED: Trigger auto-save to backend after user stops typing
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }
    const timeoutId = setTimeout(() => {
      triggerAutoSave();
    }, 1000); // Wait 1 second before saving to backend
    setAutoSaveTimeout(timeoutId);
  };

  // Handle range warning dialog responses
  const handleRangeWarningResponse = (addDotNineNine: boolean) => {
    if (pendingRowId === null) return;
    
    const currentData = getCurrentMM4Data();
    const finalValue = addDotNineNine ? `${pendingRangeValue}.99` : pendingRangeValue;
    
    console.log(`🔄 MMP1Template: Updating row ${pendingRowId} purpleLength from "${pendingRangeValue}" to "${finalValue}"`);
    
    const newData = currentData.map(row => 
      row.id === pendingRowId ? { ...row, purpleLength: finalValue } : row
    );
    
    // CRITICAL: Update buffer to reflect new value so input field shows it immediately
    const bufferKey = `${selectedPipeSizeForMM4}-${selectedPipeSizeId}-${pendingRowId}-purpleLength`;
    setInputBuffer(prev => {
      const updated = {
        ...prev,
        [bufferKey]: finalValue
      };
      // Persist buffer to localStorage immediately
      localStorage.setItem('inputBuffer', JSON.stringify(updated));
      console.log(`🔧 MMP1Template: Updated buffer for ${bufferKey}: "${finalValue}"`);
      return updated;
    });
    
    // CRITICAL: Update React state FIRST for immediate UI reflection
    const currentPipeSizeKey = `${selectedPipeSizeForMM4}-${selectedPipeSizeId}`;
    const updatedMM4DataByPipeSize = {
      ...mm4DataByPipeSize,
      [currentPipeSizeKey]: newData
    };
    setMm4DataByPipeSize(updatedMM4DataByPipeSize);
    
    // Update MM4 data storage (this calls the same setState but ensures consistency)
    updateMM4DataForPipeSize(newData);
    
    // Also save to localStorage for persistence
    localStorage.setItem('mm4DataByPipeSize', JSON.stringify(updatedMM4DataByPipeSize));
    
    // Force a component re-render to update input field values
    setTimeout(() => {
      triggerAutoSave();
      console.log(`✅ MMP1Template: Final state update completed for row ${pendingRowId}`);
    }, 50);
    
    console.log(`✅ MMP1Template: Updated MM4 data:`, newData);
    console.log(`✅ MMP1Template: Updated storage for key ${currentPipeSizeKey}:`, updatedMM4DataByPipeSize);
    
    // Reset dialog state AFTER state update
    setTimeout(() => {
      setShowRangeWarning(false);
      setPendingRangeValue('');
      setPendingRowId(null);
    }, 100);
  };

  const addMM4Row = () => {
    const currentData = getCurrentMM4Data();
    const newData = [
      ...currentData,
      { 
        id: currentData.length + 1, 
        blueValue: '', 
        greenValue: '', 
        purpleDebris: '', 
        purpleLength: '' 
      }
    ];
    updateMM4DataForPipeSize(newData);
    setTimeout(() => triggerAutoSave(), 100);
  };

  const deleteMM4Row = (rowId: number) => {
    const currentData = getCurrentMM4Data();
    if (currentData.length > 1) {
      const newData = currentData.filter(row => row.id !== rowId);
      updateMM4DataForPipeSize(newData);
      setTimeout(() => triggerAutoSave(), 100);
    }
  };

  // MM5 data management
  const getCurrentMM5Data = () => {
    console.log('🔍 MM5 Data (independent):', mm5Data);
    return mm5Data;
  };

  const updateMM5Data = (newData: any[]) => {
    setMm5Data(newData);
  };

  const updateMM5Row = (rowId: number, field: 'vehicleWeight' | 'costPerMile', value: string) => {
    const newData = mm5Data.map(row => 
      row.id === rowId ? { ...row, [field]: value } : row
    );
    updateMM5Data(newData);
  };



  const addMM5Row = () => {
    const currentData = getCurrentMM5Data();
    const newData = [
      ...currentData,
      { 
        id: currentData.length + 1, 
        vehicleWeight: '', 
        costPerMile: '' 
      }
    ];
    updateMM5Data(newData);
    setTimeout(() => triggerAutoSave(), 100);
  };

  const deleteMM5Row = (rowId: number) => {
    const currentData = getCurrentMM5Data();
    if (currentData.length > 1) {
      const newData = currentData.filter(row => row.id !== rowId);
      updateMM5Data(newData);
      setTimeout(() => triggerAutoSave(), 100);
    }
  };

  // Auto-save wrappers
  const updateMM4RowWithAutoSave = (rowId: number, field: 'blueValue' | 'greenValue' | 'purpleDebris' | 'purpleLength', value: string) => {
    console.log(`🔍 MMP1Template updateMM4RowWithAutoSave: rowId=${rowId}, field=${field}, value="${value}"`);
    updateMM4Row(rowId, field, value);
    // Skip immediate triggerAutoSave to prevent purple value conflicts - updateMM4Row handles debounced saving
  };

  const updateMM5RowWithAutoSave = (rowId: number, field: 'vehicleWeight' | 'costPerMile', value: string) => {
    updateMM5Row(rowId, field, value);
    triggerAutoSave();
  };

  // Map MM1 IDs to database sectors for copying
  const MMP1_ID_TO_SECTOR_MAPPING = {
    'id7': 'utilities',   // Utilities
    'id8': 'adoption',   // Adoption  
    'id9': 'highways',   // Highways
    'id10': 'insurance',  // Insurance
    'id11': 'construction',  // Construction
    'id12': 'domestic'   // Domestic
  };

  // Function to copy current configuration to target sector
  const copyConfigurationToSector = async (targetSector: string) => {
    if (!editId) {
      console.log('❌ Cannot copy: No editId available');
      return false;
    }

    try {
      // Get current configuration data
      const pipeSizeKey = `${selectedPipeSizeForMM4}-${selectedPipeSizeId}`;
      const currentMM4Data = mm4DataByPipeSize[pipeSizeKey] || [{ id: 1, blueValue: '', greenValue: '', purpleDebris: '', purpleLength: '' }];
      
      const mmData = {
        selectedPipeSize: selectedPipeSizeForMM4,
        selectedPipeSizeId: selectedPipeSizeId,
        mm1Colors: selectedColor,
        mm2IdData: selectedIds,
        mm3CustomPipeSizes: customPipeSizes,
        mm4DataByPipeSize: mm4DataByPipeSize,
        mm5Data: mm5Data
      };

      // Check if configuration already exists for target sector
      const existingConfigResponse = await fetch(`/api/pr2-clean?categoryId=${categoryId}&sector=${targetSector}&pipeSize=${selectedPipeSizeForMM4}`);
      const existingConfigs = await existingConfigResponse.json();
      
      if (existingConfigs && existingConfigs.length > 0) {
        // Update existing configuration
        const existingConfig = existingConfigs[0];
        const response = await fetch(`/api/pr2-clean/${existingConfig.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            categoryName: getCategoryDisplayName(),
            description: getCategoryDescription(),
            categoryColor: selectedColor,
            pipeSize: selectedPipeSizeForMM4,
            mmData: mmData,
            sector: targetSector
          })
        });
        
        if (response.ok) {
          console.log(`✅ Updated existing configuration for sector ${targetSector}`);
          return true;
        }
      } else {
        // Create new configuration for target sector
        const response = await fetch('/api/pr2-clean', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            categoryName: getCategoryDisplayName(),
            description: getCategoryDescription(),
            categoryColor: selectedColor,
            pipeSize: selectedPipeSizeForMM4,
            mmData: mmData,
            categoryId: categoryId,
            sector: targetSector
          })
        });
        
        if (response.ok) {
          console.log(`✅ Created new configuration for sector ${targetSector}`);
          return true;
        }
      }
    } catch (error) {
      console.error(`❌ Failed to copy configuration to sector ${targetSector}:`, error);
      return false;
    }
    
    return false;
  };

  // Clean category display names matching card definitions
  const getCategoryDisplayName = () => {
    if (categoryId === 'cctv') return 'CCTV';
    if (categoryId === 'van-pack') return 'Van Pack';
    if (categoryId === 'jet-vac') return 'Jet Vac';
    if (categoryId === 'cctv-van-pack') return 'CCTV/Van Pack';
    if (categoryId === 'cctv-jet-vac') return 'CCTV/Jet Vac';
    if (categoryId === 'cctv-cleansing-root-cutting') return 'CCTV/Cleansing/Root Cutting';
    if (categoryId === 'directional-water-cutter') return 'Directional Water Cutter';
    if (categoryId === 'patching') return 'Patching';
    if (categoryId === 'ambient-lining') return 'Ambient Lining';
    if (categoryId === 'hot-cure-lining') return 'Hot Cure Lining';
    if (categoryId === 'uv-lining') return 'UV Lining';
    if (categoryId === 'f-robot-cutting') return 'Robotic Cutting';
    if (categoryId === 'excavation') return 'Excavation';
    if (categoryId === 'tankering') return 'Tankering';
    if (categoryId === 'test-card') return 'Test Card';
    return 'Configuration';
  };

  const getCategoryDescription = () => {
    // Remove descriptive text as per user request
    return '';
  };

  // Handle MMP1 ID selection changes with sector copying
  const handleMMP1IdChange = async (idKey: string, checked: boolean) => {
    console.log(`🔄 MM1 ID Change: ${idKey} = ${checked}`);
    
    if (checked) {
      // Add ID to selected list
      setSelectedIds(prev => {
        const newSelection = [...new Set([...prev, idKey])];
        console.log(`✅ Added ${idKey} to selection. New selection:`, newSelection);
        return newSelection;
      });
      setIdsWithConfig(prev => [...new Set([...prev, idKey])]);
      
      // Copy configuration to corresponding sector if we have data to copy
      const targetSector = MMP1_ID_TO_SECTOR_MAPPING[idKey as keyof typeof MMP1_ID_TO_SECTOR_MAPPING];
      if (targetSector && editId) {
        console.log(`📋 Copying configuration to sector ${targetSector} (MM1 ID: ${idKey})`);
        const copySuccess = await copyConfigurationToSector(targetSector);
        if (copySuccess) {
          console.log(`✅ Successfully copied configuration to ${targetSector}`);
          // Invalidate queries to refresh UI
          queryClient.invalidateQueries({ queryKey: ['/api/pr2-clean'] });
        }
      }
    } else {
      // Remove ID from selected list
      setSelectedIds(prev => {
        const newSelection = prev.filter(id => id !== idKey);
        console.log(`❌ Removed ${idKey} from selection. New selection:`, newSelection);
        return newSelection;
      });
      setIdsWithConfig(prev => prev.filter(id => id !== idKey));
      
      // Note: We don't delete configurations when unchecking - user may want to keep them
      // They become independent once created and changes only affect the current sector
      console.log(`ℹ️ Configuration for ${idKey} remains independent (not deleted)`);
    }
    
    setHasUserChanges(true);
    triggerAutoSave();
  };

  // Handle color change for MM2 custom color picker
  const handleColorChange = (color: string) => {
    setHasUserChanges(true);
    setSelectedColor(color);
    setCustomColor(color);
    triggerAutoSave();
  };

  // MM2 Color picker auto-save (independent from MM1 ID selection)
  const handleMM1ColorChange = async (color: string) => {
    setHasUserChanges(true);
    setSelectedColor(color);
    setCustomColor(color);
    
    // Save immediately and THEN invalidate queries for instant P003 card color update
    const pipeSizeKey = `${selectedPipeSizeForMM4}-${selectedPipeSizeId}`;
    const currentMM4Data = mm4DataByPipeSize[pipeSizeKey] || [{ id: 1, blueValue: '', greenValue: '', purpleDebris: '', purpleLength: '' }];
    
    try {
      const mmData = {
        selectedPipeSize: selectedPipeSizeForMM4,
        selectedPipeSizeId: selectedPipeSizeId,
        mm1Colors: color, // Use the new color immediately
        mm2IdData: selectedIds,
        mm3CustomPipeSizes: customPipeSizes,
        mm4DataByPipeSize: mm4DataByPipeSize,
        mm5Data: mm5Data
      };

      if (editId) {
        const response = await fetch(`/api/pr2-clean/${editId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            categoryColor: color, // Update both categoryColor and mmData
            mmData: mmData,
            sector: sector
          })
        });
        if (!response.ok) throw new Error('Color save failed');
      } else {
        // If no editId, find and update the correct P-number configuration for this sector
        const P_NUMBER_MAPPING = {
          'utilities': 'P012',
          'adoption': 'P112', 
          'highways': 'P212',
          'insurance': 'P312',
          'construction': 'P412'
        };
        
        const expectedPNumber = P_NUMBER_MAPPING[sector as keyof typeof P_NUMBER_MAPPING];
        if (expectedPNumber) {
          // Find the existing P-number config for this sector
          const existingPConfig = await fetch(`/api/pr2-clean?sector=${sector}`).then(r => r.json());
          const pNumberConfig = existingPConfig.find((config: any) => config.categoryId === expectedPNumber);
          
          if (pNumberConfig) {
            // Update the existing P-number configuration
            const response = await fetch(`/api/pr2-clean/${pNumberConfig.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                categoryColor: color,
                mmData: mmData,
                sector: sector
              })
            });
            if (!response.ok) throw new Error('P-number color save failed');
            console.log(`🎨 Updated ${expectedPNumber} (ID: ${pNumberConfig.id}) color to: ${color}`);
          }
        }
      }
      
      // ONLY invalidate after successful save
      queryClient.invalidateQueries({ queryKey: ['/api/pr2-clean'] });
      console.log(`🎨 MM2 Color updated immediately: ${color}`);
    } catch (error) {
      console.error('Error saving MM2 color:', error);
    }
  };

  // Pipe size management
  const handlePipeSizeSelect = (size: number) => {
    const newId = size * 10 + 1;
    console.log(`🔄 Switching pipe size from ${selectedPipeSizeForMM4}mm to ${size}mm`);
    console.log('📊 Current MM4 data before switch:', mm4DataByPipeSize);
    console.log('📊 Current MM5 data before switch (independent):', mm5Data);
    
    setSelectedPipeSizeForMM4(size.toString());
    setSelectedPipeSizeId(newId);
    console.log(`✅ Switched to ${size}mm with CONSISTENT ID: ${newId}`);
    console.log(`🔍 Will now load data for key: ${size}-${newId}`);
  };

  const addCustomPipeSize = () => {
    const inputElement = document.getElementById('custom-pipe-size') as HTMLInputElement;
    const newSize = parseInt(inputElement?.value || '0');
    if (newSize > 0 && !customPipeSizes.includes(newSize) && !UK_PIPE_SIZES.includes(newSize)) {
      setCustomPipeSizes(prev => [...prev, newSize].sort((a, b) => a - b));
      inputElement.value = '';
      triggerAutoSave();
    }
  };

  const removeCustomPipeSize = (size: number) => {
    setCustomPipeSizes(prev => prev.filter(s => s !== size));
    triggerAutoSave();
  };

  // Handle multi-sector selection for price copying
  const handleSectorSelectionForCopying = (sectorId: string) => {
    setSelectedSectorsForCopying(prev => {
      if (prev.includes(sectorId)) {
        return prev.filter(id => id !== sectorId);
      } else {
        return [...prev, sectorId];
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* MM1 - ID Selection Cards (P002 Pattern) */}
      <Card className="w-full bg-white">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-black flex items-center justify-between">
            <span>MM1 - Configuration Templates</span>
            {selectedSectorsForCopying.length > 0 && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                {selectedSectorsForCopying.length} sectors selected for price copying
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {MMP1_IDS.map((id) => {
              const IconComponent = id.icon;
              const isSelected = selectedIds.includes(id.id);
              const hasConfig = idsWithConfig.includes(id.id);
              const isSelectedForCopying = selectedSectorsForCopying.includes(id.name.toLowerCase());
              
              return (
                <div key={id.id} className="relative">
                  <Card 
                    className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                      isSelected 
                        ? `${id.bgColor} border-2 border-blue-300` 
                        : isSelectedForCopying
                        ? 'bg-green-50 border-2 border-green-300'
                        : 'bg-white border border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={(e) => {
                      if (e.ctrlKey || e.metaKey) {
                        // Ctrl/Cmd+Click for multi-sector selection (price copying)
                        handleSectorSelectionForCopying(id.name.toLowerCase());
                      } else {
                        // Regular click for ID selection
                        handleMMP1IdChange(id.id, !isSelected);
                      }
                    }}
                  >
                    <CardContent className="p-4 text-center relative">
                      <div className="flex flex-col items-center space-y-2">
                        <IconComponent className={`h-8 w-8 ${isSelected ? id.color : 'text-gray-400'}`} />
                        <h3 className={`font-medium ${isSelected ? 'text-gray-900' : 'text-gray-600'}`}>
                          {id.name}
                        </h3>
                        
                        {/* Dev ID */}
                        <p className="text-xs text-gray-500 mb-1">{id.devId}</p>
                        
                        <p className={`text-xs ${isSelected ? 'text-gray-700' : 'text-gray-500'}`}>
                          {id.description}
                        </p>
                      </div>
                      {hasConfig && (
                        <div className="absolute top-2 right-2">
                          <Settings className="h-4 w-4 text-orange-500" />
                        </div>
                      )}
                      {isSelected && (
                        <div className="absolute top-2 left-2">
                          <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                            Selected
                          </Badge>
                        </div>
                      )}
                      {isSelectedForCopying && !isSelected && (
                        <div className="absolute top-2 left-2">
                          <Badge variant="secondary" className="text-xs bg-green-600 text-white">
                            Copy Target
                          </Badge>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
          <div className="mt-4 text-sm text-gray-600">
            <p><strong>Click</strong> to select configuration templates • <strong>Ctrl+Click</strong> to select multiple sectors for price copying</p>
          </div>
        </CardContent>
      </Card>

      {/* MM2 - Color Picker Section */}
      <Card className="w-full bg-white">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-black">MM2 - Color Selection</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Outlook Diary Colors</Label>
              <div className="grid grid-cols-10 gap-2">
                {OUTLOOK_COLORS.map((color) => (
                  <button
                    key={color}
                    className={`w-8 h-8 rounded border-2 transition-all ${
                      selectedColor === color ? 'border-gray-800 scale-110' : 'border-gray-300 hover:border-gray-500'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => handleMM1ColorChange(color)}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <Label htmlFor="custom-color" className="text-sm font-medium text-gray-700">Custom Color</Label>
                <Input
                  id="custom-color"
                  type="color"
                  value={customColor}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="w-full h-10"
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="hex-color" className="text-sm font-medium text-gray-700">Hex Code</Label>
                <Input
                  id="hex-color"
                  type="text"
                  value={customColor}
                  onChange={(e) => handleColorChange(e.target.value)}
                  placeholder="#D4D4D4"
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* MM3 - UK Drainage Pipe Sizes */}
      <Card className="w-full bg-white">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-black">MM3 - UK Drainage Pipe Sizes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-8 gap-2">
              {UK_PIPE_SIZES.map((size) => (
                <Button
                  key={size}
                  variant={selectedPipeSizeForMM4 === size.toString() ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePipeSizeSelect(size)}
                  className="text-xs h-8"
                >
                  {size}mm
                </Button>
              ))}
            </div>
            {customPipeSizes.length > 0 && (
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Custom Sizes</Label>
                <div className="flex flex-wrap gap-2">
                  {customPipeSizes.map((size) => (
                    <Badge key={size} variant="secondary" className="text-xs">
                      {size}mm
                      <button onClick={() => removeCustomPipeSize(size)} className="ml-1 text-red-500">×</button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-2">
              <Input
                id="custom-pipe-size"
                type="number"
                placeholder="Enter custom size"
                className="flex-1"
              />
              <Button onClick={addCustomPipeSize} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* MM4 - Blue/Green/Purple Cards */}
      <div className={`grid gap-4 ${categoryId === 'cctv' ? 'grid-cols-2' : 'grid-cols-3'}`}>
        {/* Blue Card */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-800">Day Rate</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {getCurrentMM4Data().map((row) => (
              <div key={row.id} className="flex gap-2">
                <Input
                  type="text"
                  value={row.blueValue}
                  onChange={(e) => updateMM4RowWithAutoSave(row.id, 'blueValue', e.target.value)}
                  placeholder="£1850"
                  className="flex-1 text-sm h-8"
                />
                {getCurrentMM4Data().length > 1 && (
                  <Button onClick={() => deleteMM4Row(row.id)} size="sm" variant="outline" className="h-8 w-8 p-0">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
            <Button onClick={addMM4Row} size="sm" variant="outline" className="w-full h-8 text-xs">
              <Plus className="h-3 w-3 mr-1" /> Add Row
            </Button>
          </CardContent>
        </Card>

        {/* Green Card */}
        <Card className="bg-green-50 border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-800">No Per Shift</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {getCurrentMM4Data().map((row) => (
              <div key={row.id} className="flex gap-2">
                <Input
                  type="text"
                  value={row.greenValue}
                  onChange={(e) => updateMM4RowWithAutoSave(row.id, 'greenValue', e.target.value)}
                  placeholder="25"
                  className="flex-1 text-sm h-8"
                />
                {getCurrentMM4Data().length > 1 && (
                  <Button onClick={() => deleteMM4Row(row.id)} size="sm" variant="outline" className="h-8 w-8 p-0">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
            <Button onClick={addMM4Row} size="sm" variant="outline" className="w-full h-8 text-xs">
              <Plus className="h-3 w-3 mr-1" /> Add Row
            </Button>
          </CardContent>
        </Card>

        {/* Purple Card - Hidden only for pure CCTV category F612 */}
        {categoryId !== 'cctv' && (
          <Card className="bg-purple-50 border-purple-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-purple-800">Debris % / Length M</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {getCurrentMM4Data().map((row) => (
                <div key={row.id} className="space-y-1">
                  <div className="flex gap-1">
                    <Input
                      type="text"
                      value={row.purpleDebris}
                      onChange={(e) => updateMM4RowWithAutoSave(row.id, 'purpleDebris', e.target.value)}
                      placeholder="5%"
                      className="flex-1 text-xs h-7"
                    />
                    <Input
                      type="text"
                      value={row.purpleLength}
                      onChange={(e) => updateMM4RowWithAutoSave(row.id, 'purpleLength', e.target.value)}
                      placeholder="30m"
                      className="flex-1 text-xs h-7"
                    />
                    {getCurrentMM4Data().length > 1 && (
                      <Button onClick={() => deleteMM4Row(row.id)} size="sm" variant="outline" className="h-7 w-7 p-0">
                        <Trash2 className="h-2 w-2" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              <Button onClick={addMM4Row} size="sm" variant="outline" className="w-full h-7 text-xs">
                <Plus className="h-2 w-2 mr-1" /> Add Row
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* MM5 - Vehicle Weight/Cost Per Mile */}
      <Card className="w-full bg-yellow-50 border-yellow-200">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-yellow-800">MM5 - Vehicle Cost Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {getCurrentMM5Data().map((row) => (
              <div key={row.id} className="flex gap-3 items-center">
                <div className="flex-1">
                  <Label className="text-xs text-yellow-700">Vehicle Weight</Label>
                  <Input
                    type="text"
                    value={row.vehicleWeight}
                    onChange={(e) => updateMM5RowWithAutoSave(row.id, 'vehicleWeight', e.target.value)}
                    placeholder="3.5t"
                    className="text-sm h-8"
                  />
                </div>
                <div className="flex-1">
                  <Label className="text-xs text-yellow-700">Cost Per Mile</Label>
                  <Input
                    type="text"
                    value={row.costPerMile}
                    onChange={(e) => updateMM5RowWithAutoSave(row.id, 'costPerMile', e.target.value)}
                    placeholder="£2.50"
                    className="text-sm h-8"
                  />
                </div>
                {getCurrentMM5Data().length > 1 && (
                  <Button onClick={() => deleteMM5Row(row.id)} size="sm" variant="outline" className="h-8 w-8 p-0 mt-5">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
            <Button onClick={addMM5Row} size="sm" variant="outline" className="w-full h-8 text-xs">
              <Plus className="h-3 w-3 mr-1" /> Add Vehicle Type
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Range Continuity Warning Dialog */}
      <Dialog open={showRangeWarning} onOpenChange={setShowRangeWarning}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-amber-800">⚠️ Range Continuity Warning</DialogTitle>
            <DialogDescription className="text-amber-700">
              You entered "{pendingRangeValue}" for the length range. For continuous range calculations, 
              we recommend using ".99" endings (e.g., "{pendingRangeValue}.99").
              <br /><br />
              This creates seamless ranges like:
              <ul className="mt-2 ml-4 text-sm">
                <li>• Range 1: 0 - {pendingRangeValue}.99m</li>
                <li>• Range 2: {pendingRangeValue}.99 - 60.99m</li>
              </ul>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:flex-row">
            <Button 
              variant="outline" 
              onClick={() => handleRangeWarningResponse(false)}
              className="text-gray-600"
            >
              Keep "{pendingRangeValue}"
            </Button>
            <Button 
              onClick={() => handleRangeWarningResponse(true)}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              Use "{pendingRangeValue}.99"
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}