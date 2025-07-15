import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

import { ChevronLeft, Calculator, Coins, Package, Gauge, Zap, Ruler, ArrowUpDown, Edit2, Trash2, ArrowUp, ArrowDown, BarChart3, Building, Building2, Car, ShieldCheck, HardHat, Users, Settings, ChevronDown, Save } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';

interface PricingOption {
  id: string;
  label: string;
  enabled: boolean;
  value: string;
}

interface RangeOption {
  id: string;
  label: string;
  enabled: boolean;
  rangeStart: string;
  rangeEnd: string;
}

interface CleanFormData {
  categoryName: string;
  description: string;
  
  // Blue Window - Pricing Options
  pricingOptions: PricingOption[];
  
  // Green Window - Quantity Options
  quantityOptions: PricingOption[];
  
  // Orange Window - Min Quantity Options
  minQuantityOptions: PricingOption[];
  
  // Purple Window - Range Options
  rangeOptions: RangeOption[];
  
  // Math Operations
  mathOperators: string[];
  
  // Stack Order
  pricingStackOrder: string[];
  quantityStackOrder: string[];
  minQuantityStackOrder: string[];
  rangeStackOrder: string[];
  
  sector: string;
}

// Sector definitions
const SECTORS = [
  { id: 'utilities', name: 'Utilities', icon: Building, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  { id: 'adoption', name: 'Adoption', icon: Building2, color: 'text-teal-600', bgColor: 'bg-teal-50' },
  { id: 'highways', name: 'Highways', icon: Car, color: 'text-orange-600', bgColor: 'bg-orange-50' },
  { id: 'insurance', name: 'Insurance', icon: ShieldCheck, color: 'text-red-600', bgColor: 'bg-red-50' },
  { id: 'construction', name: 'Construction', icon: HardHat, color: 'text-cyan-600', bgColor: 'bg-cyan-50' },
  { id: 'domestic', name: 'Domestic', icon: Users, color: 'text-amber-600', bgColor: 'bg-amber-50' }
];

export default function PR2ConfigClean() {
  const [location, setLocation] = useLocation();

  
  // Get URL parameters safely using window.location.search
  const searchParams = window.location.search;
  const urlParams = new URLSearchParams(searchParams);
  
  // Debug the URLSearchParams parsing
  console.log('🔍 URLSearchParams debug:', {
    searchParams,
    urlParamsSize: urlParams.size,
    allParams: Object.fromEntries(urlParams.entries())
  });
  
  const sector = urlParams.get('sector') || 'utilities';
  const categoryId = urlParams.get('categoryId');
  const editId = urlParams.get('edit') || urlParams.get('editId');
  const pipeSize = urlParams.get('pipeSize') || urlParams.get('pipe_size');
  const configName = urlParams.get('configName');
  const sourceItemNo = urlParams.get('itemNo');
  const selectedOptionId = urlParams.get('selectedOption'); // Track which option is selected for editing
  const isEditing = !!editId;
  
  // Debug URL parameters
  console.log('🔍 PR2ConfigClean URL params:', {
    location,
    fullURL: window.location.href,
    search: window.location.search,
    sector,
    categoryId,
    editId,
    pipeSize,
    configName,
    isEditing
  });
  
  // Determine category name based on categoryId and pipe size for dynamic naming
  const getCategoryName = (categoryId: string) => {
    // If we have a custom config name from URL (pipe size specific), use it
    if (configName) {
      return decodeURIComponent(configName);
    }
    
    // Only show pipe size if coming from dashboard (has both pipeSize and sourceItemNo)
    if (pipeSize && sourceItemNo) {
      const formattedSize = pipeSize.endsWith('mm') ? pipeSize : `${pipeSize}mm`;
      const categoryMap: { [key: string]: string } = {
        'cctv': `${formattedSize} CCTV Configuration`,
        'van-pack': `${formattedSize} Van Pack Configuration`,
        'jet-vac': `${formattedSize} Jet Vac Configuration`,
        'cctv-van-pack': `${formattedSize} CCTV Van Pack Configuration`,
        'cctv-jet-vac': `${formattedSize} CCTV Jet Vac Configuration`,
        'directional-water-cutter': `${formattedSize} Directional Water Cutter Configuration`,
        'ambient-lining': `${formattedSize} Ambient Lining Configuration`,
        'hot-cure-lining': `${formattedSize} Hot Cure Lining Configuration`,
        'uv-lining': `${formattedSize} UV Lining Configuration`,
        'ims-cutting': `${formattedSize} IMS Cutting Configuration`,
        'excavation': `${formattedSize} Excavation Configuration`,
        'patching': `${formattedSize} Patching Configuration`,
        'tankering': `${formattedSize} Tankering Configuration`
      };
      return categoryMap[categoryId] || `${formattedSize} Configuration`;
    }
    
    // Standard names without pipe size (until set up from dashboard)
    const categoryMap: { [key: string]: string } = {
      'cctv': 'CCTV Configuration',
      'van-pack': 'Van Pack Configuration',
      'jet-vac': 'Jet Vac Configuration',
      'cctv-van-pack': 'CCTV Van Pack Configuration',
      'cctv-jet-vac': 'CCTV Jet Vac Configuration',
      'directional-water-cutter': 'Directional Water Cutter Configuration',
      'ambient-lining': 'Ambient Lining Configuration',
      'hot-cure-lining': 'Hot Cure Lining Configuration',
      'uv-lining': 'UV Lining Configuration',
      'ims-cutting': 'IMS Cutting Configuration',
      'excavation': 'Excavation Configuration',
      'patching': 'Patching Configuration',
      'tankering': 'Tankering Configuration'
    };
    return categoryMap[categoryId] || 'Configuration';
  };

  // Generate dynamic dropdown title based on pipe size
  const getDropdownTitle = () => {
    if (pipeSize) {
      // Format pipe size - ensure it has 'mm' suffix
      const formattedSize = pipeSize.endsWith('mm') ? pipeSize : `${pipeSize}mm`;
      return `${formattedSize} Pipe Configuration Options`;
    }
    return 'Configuration Options';
  };

  // Helper function to check if option should be highlighted green (selected for editing)
  const isOptionSelected = (optionId: string, optionType: string) => {
    if (!selectedOptionId) return false;
    return selectedOptionId === `${optionType}-${optionId}`;
  };

  // Helper function to check if option should be disabled (not selected when multiple exist)
  const isOptionDisabled = (optionId: string, optionType: string) => {
    if (!selectedOptionId) return false; // No selection = all enabled
    
    // Get relevant options array based on type
    let optionsArray;
    switch (optionType) {
      case 'pricing':
        optionsArray = formData.pricingOptions;
        break;
      case 'quantity':
        optionsArray = formData.quantityOptions;
        break;
      case 'minQuantity':
        optionsArray = formData.minQuantityOptions;
        break;
      case 'range':
        optionsArray = formData.rangeOptions;
        break;
      default:
        return false;
    }
    
    // If multiple options exist in this category, disable non-selected ones
    if (optionsArray.length > 1) {
      return !isOptionSelected(optionId, optionType);
    }
    
    return false;
  };

  // Clean form state with default options initialized
  const [formData, setFormData] = useState<CleanFormData>({
    categoryName: categoryId ? getCategoryName(categoryId) : '',
    description: '',
    pricingOptions: [
      { id: 'price_dayrate', label: 'Day Rate', enabled: true, value: '' }
    ],
    quantityOptions: [
      { id: 'quantity_runs', label: 'Runs per Shift', enabled: true, value: '' }
    ],
    minQuantityOptions: [
      { id: 'minquantity_runs', label: 'Min Runs per Shift', enabled: true, value: '' }
    ],
    rangeOptions: [
      { id: 'range_percentage', label: 'Percentage', enabled: true, rangeStart: '', rangeEnd: '' },
      { id: 'range_length', label: 'Length', enabled: true, rangeStart: '', rangeEnd: '' }
    ],
    mathOperators: ['N/A'],
    pricingStackOrder: ['price_dayrate'],
    quantityStackOrder: ['quantity_runs'],
    minQuantityStackOrder: ['minquantity_runs'],
    rangeStackOrder: ['range_percentage', 'range_length'],
    sector
  });

  // Handle value changes for input fields
  const handleValueChange = (optionType: string, optionId: string, value: string) => {
    console.log(`🔧 handleValueChange called: ${optionType}, ${optionId}, ${value}`);
    
    setFormData(prev => {
      const newFormData = { ...prev };
      
      switch (optionType) {
        case 'pricingOptions':
          newFormData.pricingOptions = prev.pricingOptions.map(opt =>
            opt.id === optionId ? { ...opt, value } : opt
          );
          break;
        case 'quantityOptions':
          newFormData.quantityOptions = prev.quantityOptions.map(opt =>
            opt.id === optionId ? { ...opt, value } : opt
          );
          break;
        case 'minQuantityOptions':
          newFormData.minQuantityOptions = prev.minQuantityOptions.map(opt =>
            opt.id === optionId ? { ...opt, value } : opt
          );
          break;
        default:
          break;
      }
      
      console.log(`🔧 Updated ${optionType} with ${optionId} = ${value}`);
      return newFormData;
    });
  }

  // Handle range value changes for purple window
  const handleRangeValueChange = (optionId: string, field: 'rangeStart' | 'rangeEnd', value: string) => {
    console.log(`🔧 handleRangeValueChange called: ${optionId}, ${field}, ${value}`);
    
    setFormData(prev => ({
      ...prev,
      rangeOptions: prev.rangeOptions.map(opt =>
        opt.id === optionId ? { ...opt, [field]: value } : opt
      )
    }));
  };

  // Force form inputs to update when formData changes
  useEffect(() => {
    console.log(`🔄 DOM manipulation useEffect triggered for Config ${editId}`);
    console.log(`🔄 Quantity options:`, formData.quantityOptions);
    console.log(`🔄 Range options:`, formData.rangeOptions);
    
    const timer = setTimeout(() => {
      // Force update all quantity inputs
      formData.quantityOptions.forEach(option => {
        if (option.enabled) {
          const inputElement = document.querySelector(`input[data-option-id="${option.id}"]`) as HTMLInputElement;
          console.log(`🔄 Looking for input with data-option-id="${option.id}", found:`, inputElement);
          if (inputElement) {
            console.log(`🔄 Current input value: "${inputElement.value}", expected: "${option.value}"`);
            if (inputElement.value !== option.value) {
              inputElement.value = option.value;
              console.log(`🔄 Force updated input ${option.id} to: ${option.value}`);
            }
          }
        }
      });

      // Force update all range inputs
      formData.rangeOptions.forEach(option => {
        if (option.enabled) {
          const startInput = document.querySelector(`input[data-range-id="${option.id}-start"]`) as HTMLInputElement;
          const endInput = document.querySelector(`input[data-range-id="${option.id}-end"]`) as HTMLInputElement;
          console.log(`🔄 Looking for range inputs for ${option.id}, found start:`, startInput, 'end:', endInput);
          if (startInput) {
            console.log(`🔄 Current start value: "${startInput.value}", expected: "${option.rangeStart}"`);
            if (startInput.value !== option.rangeStart) {
              startInput.value = option.rangeStart;
              console.log(`🔄 Force updated range start ${option.id} to: ${option.rangeStart}`);
            }
          }
          if (endInput) {
            console.log(`🔄 Current end value: "${endInput.value}", expected: "${option.rangeEnd}"`);
            if (endInput.value !== option.rangeEnd) {
              endInput.value = option.rangeEnd;
              console.log(`🔄 Force updated range end ${option.id} to: ${option.rangeEnd}`);
            }
          }
        }
      });
    }, 200); // Increased delay to ensure DOM is fully updated

    return () => clearTimeout(timer);
  }, [formData.quantityOptions, formData.rangeOptions, editId]);

  // Dialog states
  const [addPricingDialogOpen, setAddPricingDialogOpen] = useState(false);
  const [editPricingDialogOpen, setEditPricingDialogOpen] = useState(false);
  const [stackOrderDialogOpen, setStackOrderDialogOpen] = useState(false);
  const [addQuantityDialogOpen, setAddQuantityDialogOpen] = useState(false);
  const [editQuantityDialogOpen, setEditQuantityDialogOpen] = useState(false);
  const [addMinQuantityDialogOpen, setAddMinQuantityDialogOpen] = useState(false);
  const [editMinQuantityDialogOpen, setEditMinQuantityDialogOpen] = useState(false);
  const [addRangeDialogOpen, setAddRangeDialogOpen] = useState(false);
  const [editRangeDialogOpen, setEditRangeDialogOpen] = useState(false);
  const [newPricingLabel, setNewPricingLabel] = useState('');
  const [newQuantityLabel, setNewQuantityLabel] = useState('');
  const [newMinQuantityLabel, setNewMinQuantityLabel] = useState('');
  const [newRangeLabel, setNewRangeLabel] = useState('');
  const [editingPricing, setEditingPricing] = useState<PricingOption | null>(null);
  const [editingQuantity, setEditingQuantity] = useState<PricingOption | null>(null);
  const [editingMinQuantity, setEditingMinQuantity] = useState<PricingOption | null>(null);
  const [editingRange, setEditingRange] = useState<RangeOption | null>(null);
  
  // Sector selection state
  const [selectedSectors, setSelectedSectors] = useState<string[]>([sector]);
  const [showRemoveWarning, setShowRemoveWarning] = useState(false);
  const [sectorToRemove, setSectorToRemove] = useState<string>('');

  // Load existing configuration for editing
  const { data: existingConfig } = useQuery({
    queryKey: ['/api/pr2-clean', editId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/pr2-clean/${editId}`);
      return response.json();
    },
    enabled: isEditing && !!editId,
  });

  // Load configurations by category and sector to find the right one for editing
  const { data: sectorConfigs } = useQuery({
    queryKey: ['/api/pr2-clean', 'sector-category', sector, categoryId, pipeSize],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/pr2-clean?categoryId=${categoryId}&sector=${sector}`);
      const configs = await response.json();
      console.log(`🔍 Found ${configs.length} configs for categoryId ${categoryId} in sector ${sector}:`, configs);
      
      // If we have pipe size, look for pipe size-specific configuration first
      if (pipeSize) {
        const pipeSizeConfig = configs.find(config => 
          config.categoryName && config.categoryName.includes(`${pipeSize}mm`) &&
          config.sector === sector
        );
        
        if (pipeSizeConfig) {
          console.log(`✅ Found pipe size-specific configuration for ${pipeSize}mm:`, pipeSizeConfig);
          return pipeSizeConfig;
        } else {
          console.log(`⚠️ No pipe size-specific configuration found for ${pipeSize}mm, will create new one`);
          return null; // Return null to indicate we need to create a new config
        }
      }
      
      // Fallback to general configuration for the current sector
      const sectorConfig = configs.find(config => config.sector === sector);
      
      if (sectorConfig) {
        console.log(`✅ Found configuration for sector ${sector}:`, sectorConfig);
        return sectorConfig;
      } else {
        console.log(`⚠️ No configuration found for sector ${sector}, returning null`);
        return null; // Always return null instead of undefined
      }
    },
    enabled: !isEditing && !!categoryId && !editId, // Only when not editing with specific ID
  });

  // Load all configurations for this category to show in "Saved Configurations"
  const { data: allConfigs } = useQuery({
    queryKey: ['/api/pr2-clean', 'category', categoryId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/pr2-clean?categoryId=${categoryId}`);
      return response.json();
    },
    enabled: !!categoryId,
  });

  // State to track which sectors have this configuration (loaded once when editing starts)
  const [sectorsWithConfig, setSectorsWithConfig] = useState<string[]>([]);

  // Handle sector checkbox changes
  const handleSectorChange = async (sectorId: string, checked: boolean) => {
    console.log(`🔄 Sector change: ${sectorId}, checked: ${checked}`);
    console.log(`📋 Current sectorsWithConfig:`, sectorsWithConfig);
    console.log(`📋 Current selectedSectors:`, selectedSectors);
    console.log(`🔍 Is editing:`, isEditing);
    
    if (checked) {
      // Add sector to selected list
      setSelectedSectors(prev => [...new Set([...prev, sectorId])]);
      
      // If we're in editing mode and adding a new sector, create a copy immediately
      if (isEditing && editId && !sectorsWithConfig.includes(sectorId)) {
        console.log(`📋 Creating independent copy for sector: ${sectorId}`);
        await createSectorCopy(sectorId);
      }
    } else {
      // Show warning if removing an existing sector with data
      const hasExistingConfig = sectorsWithConfig.includes(sectorId);
      console.log(`⚠️ Has existing config for ${sectorId}:`, hasExistingConfig);
      
      if (hasExistingConfig && isEditing) {
        console.log(`🚨 Showing removal warning for ${sectorId}`);
        setSectorToRemove(sectorId);
        setShowRemoveWarning(true);
      } else {
        console.log(`✅ Directly removing ${sectorId} from selected sectors`);
        // Remove sector from selected list
        setSelectedSectors(prev => prev.filter(s => s !== sectorId));
      }
    }
  }

  // Create an independent copy of the current configuration for a new sector
  const createSectorCopy = async (targetSectorId: string) => {
    try {
      console.log(`📋 Creating copy for sector: ${targetSectorId}`);
      
      const payload = {
        categoryName: formData.categoryName,
        description: formData.description,
        sector: targetSectorId, // Each copy gets its own sector
        categoryId: categoryId,
        pricingOptions: formData.pricingOptions,
        quantityOptions: formData.quantityOptions,
        minQuantityOptions: formData.minQuantityOptions,
        rangeOptions: formData.rangeOptions,
        mathOperators: formData.mathOperators,
        pricingStackOrder: formData.pricingStackOrder,
        quantityStackOrder: formData.quantityStackOrder,
        minQuantityStackOrder: formData.minQuantityStackOrder,
        rangeStackOrder: formData.rangeStackOrder
      };

      const response = await fetch('/api/pr2-clean', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const newConfig = await response.json();
        console.log(`✅ Created independent copy for ${targetSectorId} with ID: ${newConfig.id}`);
        
        // Update sectorsWithConfig to include this new sector
        setSectorsWithConfig(prev => [...new Set([...prev, targetSectorId])]);
        
        // Invalidate queries to refresh the UI
        queryClient.invalidateQueries({ queryKey: ['/api/pr2-clean'] });
      } else {
        console.error(`❌ Failed to create copy for ${targetSectorId}`);
      }
    } catch (error) {
      console.error(`❌ Error creating sector copy:`, error);
    }
  };

  // Main save function that creates independent copies for each selected sector
  const handleSave = async () => {
    try {
      console.log(`💾 Saving configuration to sectors:`, selectedSectors);
      console.log(`🔍 Current formData:`, formData);
      console.log(`🔍 Pricing options before save:`, formData.pricingOptions);
      console.log(`🔍 Quantity options before save:`, formData.quantityOptions);
      
      // First, update the current configuration (or create it if it's new)
      const payload = {
        categoryName: formData.categoryName,
        description: formData.description,
        sector: sector, // Current sector
        categoryId: categoryId,
        pricingOptions: formData.pricingOptions,
        quantityOptions: formData.quantityOptions,
        minQuantityOptions: formData.minQuantityOptions,
        rangeOptions: formData.rangeOptions,
        mathOperators: formData.mathOperators,
        pricingStackOrder: formData.pricingStackOrder,
        quantityStackOrder: formData.quantityStackOrder,
        minQuantityStackOrder: formData.minQuantityStackOrder,
        rangeStackOrder: formData.rangeStackOrder
      };
      
      console.log(`🔍 Payload being sent to server:`, payload);

      if (isEditing && editId) {
        // Update existing configuration
        await fetch(`/api/pr2-clean/${editId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        console.log(`✅ Updated configuration ${editId} for sector ${sector}`);
      } else {
        // Create new configuration for current sector
        const response = await fetch('/api/pr2-clean', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        if (response.ok) {
          const newConfig = await response.json();
          console.log(`✅ Created new configuration ${newConfig.id} for sector ${sector}`);
        }
      }

      // Create independent copies for other selected sectors (excluding current sector)
      const otherSectors = selectedSectors.filter(s => s !== sector);
      for (const targetSector of otherSectors) {
        if (!sectorsWithConfig.includes(targetSector)) {
          console.log(`📋 Creating independent copy for sector: ${targetSector}`);
          await createSectorCopy(targetSector);
        } else {
          console.log(`⚠️ Sector ${targetSector} already has configuration, skipping copy`);
        }
      }

      // Invalidate all queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['/api/pr2-clean'] });
      
      console.log(`✅ Save complete! Configuration available in sectors: ${selectedSectors.join(', ')}`);
      
    } catch (error) {
      console.error(`❌ Save failed:`, error);
    }
  };

  // Confirm sector removal
  const confirmSectorRemoval = () => {
    setSelectedSectors(prev => prev.filter(s => s !== sectorToRemove));
    setSectorsWithConfig(prev => prev.filter(s => s !== sectorToRemove));
    setShowRemoveWarning(false);
    setSectorToRemove('');
  };

  // Single useEffect to handle all configuration loading
  useEffect(() => {
    // Use sectorConfigs for navigation without editId, existingConfig for direct editId access
    const configToUse = editId ? existingConfig : sectorConfigs;
    console.log(`🔍 useEffect triggered - isEditing: ${isEditing}, editId: ${editId}, configToUse:`, configToUse);
    
    if (isEditing && configToUse) {
      // Get the actual config object (might be wrapped in array)
      const config = Array.isArray(configToUse) ? configToUse[0] : configToUse;
      console.log(`🔍 Processing config:`, config);
      
      if (config) {
        console.log(`🔧 Loading configuration data:`, config);
        
        // Handle array vs object format for quantityOptions and minQuantityOptions
        const existingQuantityOptions = Array.isArray(config.quantityOptions) ? config.quantityOptions : [];
        const existingMinQuantityOptions = Array.isArray(config.minQuantityOptions) ? config.minQuantityOptions : [];
        const existingRangeOptions = Array.isArray(config.rangeOptions) ? config.rangeOptions : [];
        const existingPricingOptions = Array.isArray(config.pricingOptions) ? config.pricingOptions : [];
        
        // Initialize single-option defaults for each window (matching your requirement)
        const defaultPricingOptions = [
          { id: 'price_dayrate', label: 'Day Rate', enabled: true, value: '' }
        ];
        
        const defaultQuantityOptions = [
          { id: 'quantity_runs', label: 'Runs per Shift', enabled: true, value: '' }
        ];
        
        const defaultMinQuantityOptions = [
          { id: 'minquantity_runs', label: 'Min Runs per Shift', enabled: true, value: '' }
        ];
        
        const defaultRangeOptions = [
          { id: 'range_percentage', label: 'Percentage', enabled: true, rangeStart: '', rangeEnd: '' },
          { id: 'range_length', label: 'Length', enabled: true, rangeStart: '', rangeEnd: '' }
        ];
        
        // Use existing options if they exist, otherwise use defaults
        const pricingOptions = existingPricingOptions.length > 0 ? existingPricingOptions : defaultPricingOptions;
        const quantityOptions = existingQuantityOptions.length > 0 ? existingQuantityOptions : defaultQuantityOptions;
        const minQuantityOptions = existingMinQuantityOptions.length > 0 ? existingMinQuantityOptions : defaultMinQuantityOptions;
        const rangeOptions = existingRangeOptions.length > 0 ? existingRangeOptions : defaultRangeOptions;
        
        const newFormData = {
          categoryName: config.categoryName || 'CCTV Price Configuration',
          description: config.description || '',
          pricingOptions: pricingOptions,
          quantityOptions: quantityOptions,
          minQuantityOptions: minQuantityOptions,
          rangeOptions: rangeOptions,
          mathOperators: config.mathOperators || ['N/A'],
          pricingStackOrder: pricingOptions.map((opt: any) => opt.id),
          quantityStackOrder: quantityOptions.map((opt: any) => opt.id),
          minQuantityStackOrder: minQuantityOptions.map((opt: any) => opt.id),
          rangeStackOrder: rangeOptions.map((opt: any) => opt.id),
          sector
        };
        
        console.log(`🔧 Initialized form data with options:`, {
          pricingCount: pricingOptions.length,
          quantityCount: quantityOptions.length,
          minQuantityCount: minQuantityOptions.length,
          rangeCount: rangeOptions.length
        });

        console.log(`🔧 Setting form data for config ${config.id}:`, {
          quantityValue: newFormData.quantityOptions?.[0]?.value,
          rangeLength: newFormData.rangeOptions?.find(r => r.label === 'Length')?.rangeEnd
        });

        // Set the form data directly without reset (fixes display issue)
        setFormData(newFormData);
        
        // Set single sector information
        const configSector = config.sector || sector;
        
        console.log(`🔍 Detected existing config in sector: ${configSector}`);
        console.log(`🔍 Setting sectorsWithConfig to: [${configSector}]`);
        console.log(`🔍 Setting selectedSectors to: [${configSector}]`);
        
        setSectorsWithConfig([configSector]);
        setSelectedSectors([configSector]);
      }
    } else if (!isEditing) {
      // Start with the current sector for new configurations
      console.log(`🔍 Starting new config with sector: ${sector}`);
      setSelectedSectors([sector]);
      setSectorsWithConfig([]);
      
      // If we have pipe size but no existing config, create new pipe size-specific config
      if (pipeSize && categoryId && !sectorConfigs) {
        console.log(`🆕 Creating new pipe size-specific configuration for ${pipeSize}mm`);
        
        // Use the configName from URL if available, otherwise generate it
        const pipeSizeConfigName = configName || getCategoryName(categoryId);
        console.log(`🆕 Setting category name to: ${pipeSizeConfigName}`);
        
        // Initialize with single specific options for each window
        const defaultPricingOptions = [
          { id: 'price_dayrate', label: 'Day Rate', enabled: true, value: '' }
        ];
        
        const defaultQuantityOptions = [
          { id: 'quantity_runs', label: 'Runs per Shift', enabled: true, value: '' }
        ];
        
        const defaultMinQuantityOptions = [
          { id: 'minquantity_runs', label: 'Min Runs per Shift', enabled: true, value: '' }
        ];
        
        const defaultRangeOptions = [
          { id: 'range_percentage', label: 'Percentage', enabled: true, rangeStart: '', rangeEnd: '' },
          { id: 'range_length', label: 'Length', enabled: true, rangeStart: '', rangeEnd: '' }
        ];
        
        setFormData(prev => ({
          ...prev,
          categoryName: pipeSizeConfigName,
          description: `Configuration for ${pipeSize}mm ${getCategoryName(categoryId).toLowerCase()}`,
          pricingOptions: defaultPricingOptions,
          quantityOptions: defaultQuantityOptions,
          minQuantityOptions: defaultMinQuantityOptions,
          rangeOptions: defaultRangeOptions,
          pricingStackOrder: defaultPricingOptions.map(opt => opt.id),
          quantityStackOrder: defaultQuantityOptions.map(opt => opt.id),
          minQuantityStackOrder: defaultMinQuantityOptions.map(opt => opt.id),
          rangeStackOrder: defaultRangeOptions.map(opt => opt.id)
        }));
      }
    }
  }, [isEditing, existingConfig, sectorConfigs, sector, editId, pipeSize, categoryId]);









  // Pricing option management
  const addPricingOption = () => {
    if (!newPricingLabel.trim()) return;
    
    const newOption: PricingOption = {
      id: `pricing_${Date.now()}`,
      label: newPricingLabel.trim(),
      enabled: false,
      value: ''
    };
    
    setFormData(prev => ({
      ...prev,
      pricingOptions: [...prev.pricingOptions, newOption],
      pricingStackOrder: [...prev.pricingStackOrder, newOption.id]
    }));
    
    setNewPricingLabel('');
    setAddPricingDialogOpen(false);
  };

  const editPricingOption = (option: PricingOption) => {
    setEditingPricing(option);
    setNewPricingLabel(option.label);
    setEditPricingDialogOpen(true);
  };

  const savePricingEdit = () => {
    if (!editingPricing || !newPricingLabel.trim()) return;
    
    setFormData(prev => ({
      ...prev,
      pricingOptions: prev.pricingOptions.map(opt => 
        opt.id === editingPricing.id 
          ? { ...opt, label: newPricingLabel.trim() }
          : opt
      )
    }));
    
    setEditingPricing(null);
    setNewPricingLabel('');
    setEditPricingDialogOpen(false);
  };

  const deletePricingOption = (optionId: string) => {
    const option = formData.pricingOptions.find(opt => opt.id === optionId);
    if (!option) return;
    
    setFormData(prev => ({
      ...prev,
      pricingOptions: prev.pricingOptions.filter(opt => opt.id !== optionId),
      pricingStackOrder: prev.pricingStackOrder.filter(id => id !== optionId)
    }));
  };

  const updatePricingOption = (optionId: string, field: 'enabled' | 'value', value: any) => {
    setFormData(prev => ({
      ...prev,
      pricingOptions: prev.pricingOptions.map(opt =>
        opt.id === optionId ? { ...opt, [field]: value } : opt
      )
    }));
  };

  const moveOptionInStack = (optionId: string, direction: 'up' | 'down') => {
    setFormData(prev => {
      const currentOrder = [...prev.pricingStackOrder];
      const currentIndex = currentOrder.indexOf(optionId);
      
      if (currentIndex === -1) return prev;
      if (direction === 'up' && currentIndex === 0) return prev;
      if (direction === 'down' && currentIndex === currentOrder.length - 1) return prev;
      
      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      [currentOrder[currentIndex], currentOrder[newIndex]] = [currentOrder[newIndex], currentOrder[currentIndex]];
      
      return { ...prev, pricingStackOrder: currentOrder };
    });
  };

  // Quantity option management
  const addQuantityOption = () => {
    if (!newQuantityLabel.trim()) return;
    
    const newOption: PricingOption = {
      id: `quantity_${Date.now()}`,
      label: newQuantityLabel.trim(),
      enabled: false,
      value: ''
    };
    
    setFormData(prev => ({
      ...prev,
      quantityOptions: [...prev.quantityOptions, newOption],
      quantityStackOrder: [...prev.quantityStackOrder, newOption.id]
    }));
    
    setNewQuantityLabel('');
    setAddQuantityDialogOpen(false);
  };

  const deleteQuantityOption = (optionId: string) => {
    setFormData(prev => ({
      ...prev,
      quantityOptions: prev.quantityOptions.filter(opt => opt.id !== optionId),
      quantityStackOrder: prev.quantityStackOrder.filter(id => id !== optionId)
    }));
  };

  const updateQuantityOption = (optionId: string, field: 'enabled' | 'value', value: any) => {
    setFormData(prev => ({
      ...prev,
      quantityOptions: prev.quantityOptions.map(opt =>
        opt.id === optionId ? { ...opt, [field]: value } : opt
      )
    }));
  };

  const editQuantityOption = (option: PricingOption) => {
    setEditingQuantity(option);
    setNewQuantityLabel(option.label);
    setEditQuantityDialogOpen(true);
  };

  const saveQuantityEdit = () => {
    if (!editingQuantity || !newQuantityLabel.trim()) return;
    
    setFormData(prev => ({
      ...prev,
      quantityOptions: prev.quantityOptions.map(opt => 
        opt.id === editingQuantity.id 
          ? { ...opt, label: newQuantityLabel.trim() }
          : opt
      )
    }));
    
    setEditingQuantity(null);
    setNewQuantityLabel('');
    setEditQuantityDialogOpen(false);
  };

  // Min Quantity option management
  const addMinQuantityOption = () => {
    if (!newMinQuantityLabel.trim()) return;
    
    const newOption: PricingOption = {
      id: `minquantity_${Date.now()}`,
      label: newMinQuantityLabel.trim(),
      enabled: false,
      value: ''
    };
    
    setFormData(prev => ({
      ...prev,
      minQuantityOptions: [...prev.minQuantityOptions, newOption],
      minQuantityStackOrder: [...prev.minQuantityStackOrder, newOption.id]
    }));
    
    setNewMinQuantityLabel('');
    setAddMinQuantityDialogOpen(false);
  };

  const deleteMinQuantityOption = (optionId: string) => {
    setFormData(prev => ({
      ...prev,
      minQuantityOptions: prev.minQuantityOptions.filter(opt => opt.id !== optionId),
      minQuantityStackOrder: prev.minQuantityStackOrder.filter(id => id !== optionId)
    }));
  };

  const updateMinQuantityOption = (optionId: string, field: 'enabled' | 'value', value: any) => {
    setFormData(prev => ({
      ...prev,
      minQuantityOptions: prev.minQuantityOptions.map(opt =>
        opt.id === optionId ? { ...opt, [field]: value } : opt
      )
    }));
  };

  const editMinQuantityOption = (option: PricingOption) => {
    setEditingMinQuantity(option);
    setNewMinQuantityLabel(option.label);
    setEditMinQuantityDialogOpen(true);
  };

  const saveMinQuantityEdit = () => {
    if (!editingMinQuantity || !newMinQuantityLabel.trim()) return;
    
    setFormData(prev => ({
      ...prev,
      minQuantityOptions: prev.minQuantityOptions.map(opt => 
        opt.id === editingMinQuantity.id 
          ? { ...opt, label: newMinQuantityLabel.trim() }
          : opt
      )
    }));
    
    setEditingMinQuantity(null);
    setNewMinQuantityLabel('');
    setEditMinQuantityDialogOpen(false);
  };

  // Range option management
  const addRangeOption = () => {
    if (!newRangeLabel.trim()) return;
    
    const newOption: RangeOption = {
      id: `range_${Date.now()}`,
      label: newRangeLabel.trim(),
      enabled: false,
      rangeStart: '',
      rangeEnd: ''
    };
    
    setFormData(prev => ({
      ...prev,
      rangeOptions: [...prev.rangeOptions, newOption],
      rangeStackOrder: [...prev.rangeStackOrder, newOption.id]
    }));
    
    setNewRangeLabel('');
    setAddRangeDialogOpen(false);
  };

  const deleteRangeOption = (optionId: string) => {
    setFormData(prev => ({
      ...prev,
      rangeOptions: prev.rangeOptions.filter(opt => opt.id !== optionId),
      rangeStackOrder: prev.rangeStackOrder.filter(id => id !== optionId)
    }));
  };

  // Auto-calculate sequential ranges
  const calculateSequentialRanges = (rangeOptions: RangeOption[], updatedOptionId: string, newEndValue: string) => {
    const activeOptions = rangeOptions
      .filter(opt => opt.rangeStart !== '' || opt.rangeEnd !== '')
      .sort((a, b) => {
        // Sort by the order they were created
        const aIndex = rangeOptions.findIndex(opt => opt.id === a.id);
        const bIndex = rangeOptions.findIndex(opt => opt.id === b.id);
        return aIndex - bIndex;
      });

    return rangeOptions.map(option => {
      const optionIndex = activeOptions.findIndex(opt => opt.id === option.id);
      if (optionIndex === -1) return option;
      
      if (option.id === updatedOptionId) {
        // For the option being updated, calculate the start based on previous ranges
        const rangeStart = optionIndex === 0 ? '0' : (parseInt(activeOptions[optionIndex - 1].rangeEnd) + 1).toString();
        return { ...option, rangeStart, rangeEnd: newEndValue };
      } else if (optionIndex > activeOptions.findIndex(opt => opt.id === updatedOptionId)) {
        // For options after the updated one, recalculate their ranges
        const rangeStart = optionIndex === 0 ? '0' : (parseInt(activeOptions[optionIndex - 1].rangeEnd) + 1).toString();
        return { ...option, rangeStart };
      } else if (optionIndex === 0) {
        // First option always starts at 0
        return { ...option, rangeStart: '0' };
      }
      
      return option;
    });
  };

  // Validate range values
  const validateRangeValue = (value: string, optionId: string, field: 'rangeStart' | 'rangeEnd') => {
    const numValue = parseInt(value);
    if (isNaN(numValue) || numValue < 0) {
      return { isValid: false, message: "Please enter a valid positive number" };
    }
    
    if (field === 'rangeEnd') {
      // Check if this creates a valid sequence
      const enabledOptions = formData.rangeOptions.filter(opt => opt.enabled);
      const currentIndex = enabledOptions.findIndex(opt => opt.id === optionId);
      
      if (currentIndex > 0) {
        const prevOption = enabledOptions[currentIndex - 1];
        const expectedStart = parseInt(prevOption.rangeEnd) + 1;
        if (numValue <= parseInt(prevOption.rangeEnd)) {
          return { 
            isValid: false, 
            message: `Value must be greater than ${prevOption.rangeEnd} (previous range end)` 
          };
        }
      }
    }
    
    return { isValid: true, message: "" };
  };

  const updateRangeOption = (optionId: string, field: 'enabled' | 'rangeStart' | 'rangeEnd', value: any) => {
    if (field === 'enabled') {
      setFormData(prev => {
        const updated = prev.rangeOptions.map(opt =>
          opt.id === optionId ? { ...opt, [field]: value } : opt
        );
        
        if (value) {
          // When enabling, auto-calculate the start position
          const enabledCount = updated.filter(opt => opt.enabled).length;
          const optionIndex = enabledCount - 1;
          
          if (optionIndex === 0) {
            // First option: 0 to empty (user will fill end)
            return {
              ...prev,
              rangeOptions: updated.map(opt =>
                opt.id === optionId ? { ...opt, rangeStart: '0', rangeEnd: '' } : opt
              )
            };
          } else {
            // Subsequent options: calculate start based on previous
            const enabledOptions = updated.filter(opt => opt.enabled && opt.id !== optionId);
            const lastOption = enabledOptions[enabledOptions.length - 1];
            const newStart = lastOption?.rangeEnd ? (parseInt(lastOption.rangeEnd) + 1).toString() : '0';
            
            return {
              ...prev,
              rangeOptions: updated.map(opt =>
                opt.id === optionId ? { ...opt, rangeStart: newStart, rangeEnd: '' } : opt
              )
            };
          }
        }
        
        return { ...prev, rangeOptions: updated };
      });
    } else if (field === 'rangeEnd') {
      // Validate and auto-calculate sequential ranges
      const validation = validateRangeValue(value, optionId, field);
      if (!validation.isValid) {
        // Show warning but still update (user feedback)
        console.warn(`Range validation warning: ${validation.message}`);
      }
      
      setFormData(prev => ({
        ...prev,
        rangeOptions: calculateSequentialRanges(prev.rangeOptions, optionId, value)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        rangeOptions: prev.rangeOptions.map(opt =>
          opt.id === optionId ? { ...opt, [field]: value } : opt
        )
      }));
    }
  };

  const editRangeOption = (option: RangeOption) => {
    setEditingRange(option);
    setNewRangeLabel(option.label);
    setEditRangeDialogOpen(true);
  };

  const saveRangeEdit = () => {
    if (!editingRange || !newRangeLabel.trim()) return;
    
    setFormData(prev => ({
      ...prev,
      rangeOptions: prev.rangeOptions.map(opt => 
        opt.id === editingRange.id 
          ? { ...opt, label: newRangeLabel.trim() }
          : opt
      )
    }));
    
    setEditingRange(null);
    setNewRangeLabel('');
    setEditRangeDialogOpen(false);
  };

  // Get ordered options for display
  const getOrderedPricingOptions = () => {
    if (formData.pricingStackOrder.length === 0) {
      return formData.pricingOptions;
    }
    
    const ordered = formData.pricingStackOrder
      .map(id => formData.pricingOptions.find(opt => opt.id === id))
      .filter(Boolean) as PricingOption[];
    
    // Add any new options not in stack order yet
    const missingOptions = formData.pricingOptions.filter(
      opt => !formData.pricingStackOrder.includes(opt.id)
    );
    
    return [...ordered, ...missingOptions];
  };

  const getOrderedQuantityOptions = () => {
    if (formData.quantityStackOrder.length === 0) {
      return formData.quantityOptions;
    }
    
    const ordered = formData.quantityStackOrder
      .map(id => formData.quantityOptions.find(opt => opt.id === id))
      .filter(Boolean) as PricingOption[];
    
    const missingOptions = formData.quantityOptions.filter(
      opt => !formData.quantityStackOrder.includes(opt.id)
    );
    
    return [...ordered, ...missingOptions];
  };

  const getOrderedMinQuantityOptions = () => {
    if (formData.minQuantityStackOrder.length === 0) {
      return formData.minQuantityOptions;
    }
    
    const ordered = formData.minQuantityStackOrder
      .map(id => formData.minQuantityOptions.find(opt => opt.id === id))
      .filter(Boolean) as PricingOption[];
    
    const missingOptions = formData.minQuantityOptions.filter(
      opt => !formData.minQuantityStackOrder.includes(opt.id)
    );
    
    return [...ordered, ...missingOptions];
  };

  const getOrderedRangeOptions = () => {
    if (formData.rangeStackOrder.length === 0) {
      return formData.rangeOptions;
    }
    
    const ordered = formData.rangeStackOrder
      .map(id => formData.rangeOptions.find(opt => opt.id === id))
      .filter(Boolean) as RangeOption[];
    
    const missingOptions = formData.rangeOptions.filter(
      opt => !formData.rangeStackOrder.includes(opt.id)
    );
    
    return [...ordered, ...missingOptions];
  };

  const updateMathOperator = (index: number, value: string) => {
    setFormData(prev => {
      const newOperators = [...prev.mathOperators];
      newOperators[index] = value;
      return { ...prev, mathOperators: newOperators };
    });
  };

  // Auto-generate description based on enabled options with values
  const generateAutoDescription = () => {
    const parts = [];
    
    // Add pricing options with values
    formData.pricingOptions.forEach(opt => {
      if (opt.value && opt.value.trim() !== '') {
        const value = `£${opt.value}`;
        parts.push(`${opt.label} = ${value}`);
      }
    });
    
    // Add math operator
    if (formData.mathOperators && formData.mathOperators.length > 0 && formData.mathOperators[0] !== 'N/A') {
      parts.push(`${formData.mathOperators[0]}`);
    }
    
    // Add quantity options with values
    formData.quantityOptions.forEach(opt => {
      if (opt.value && opt.value.trim() !== '') {
        parts.push(`${opt.label} = ${opt.value}`);
      }
    });
    
    // Add min quantity options with values
    formData.minQuantityOptions.forEach(opt => {
      if (opt.value && opt.value.trim() !== '') {
        parts.push(`${opt.label} = ${opt.value}`);
      }
    });
    
    // Add range options with values
    formData.rangeOptions.forEach(opt => {
      if ((opt.rangeStart && opt.rangeStart.trim() !== '') || (opt.rangeEnd && opt.rangeEnd.trim() !== '')) {
        const rangeStart = opt.rangeStart || 'R1';
        const rangeEnd = opt.rangeEnd || 'R2';
        parts.push(`${opt.label} = ${rangeStart} to ${rangeEnd}`);
      }
    });
    
    if (parts.length === 0) {
      return 'CCTV price configuration';
    }
    
    return parts.join('. ');
  };

  // Update description when options change
  React.useEffect(() => {
    const autoDesc = generateAutoDescription();
    setFormData(prev => ({ ...prev, description: autoDesc }));
  }, [formData.pricingOptions, formData.quantityOptions, formData.minQuantityOptions, formData.rangeOptions, formData.mathOperators]);

  // Manual save functionality
  const handleSaveConfiguration = async () => {
    // All options are enabled, no filtering needed
    const enabledPricingOptions = formData.pricingOptions;
    
    const enabledQuantityOptions = formData.quantityOptions;
    const enabledMinQuantityOptions = formData.minQuantityOptions;
    const enabledRangeOptions = formData.rangeOptions;

    // Always save if category name exists (no need to check enabled status)
    if (!formData.categoryName) {
      console.log('⚠️ No category name to save');
      return;
    }

    try {
      console.log('💾 Saving configuration...');
      console.log('📊 FormData before save:', formData);
      console.log('📊 Options to save:', {
        pricing: enabledPricingOptions,
        quantity: enabledQuantityOptions,
        minQuantity: enabledMinQuantityOptions,
        range: enabledRangeOptions
      });
      
      const payload = {
        categoryName: formData.categoryName,
        description: formData.description,
        sector: sector, // Save to current sector only
        categoryId: categoryId,
        pricingOptions: enabledPricingOptions,
        quantityOptions: enabledQuantityOptions,
        minQuantityOptions: enabledMinQuantityOptions,
        rangeOptions: enabledRangeOptions,
        mathOperators: formData.mathOperators,
        pricingStackOrder: formData.pricingStackOrder,
        quantityStackOrder: formData.quantityStackOrder,
        minQuantityStackOrder: formData.minQuantityStackOrder,
        rangeStackOrder: formData.rangeStackOrder
      };

      let response;
      if (isEditing && editId) {
        // Update existing configuration
        response = await fetch(`/api/pr2-clean/${editId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        console.log('✅ Configuration updated successfully');
      } else {
        // Create new configuration
        response = await fetch('/api/pr2-clean', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        console.log('✅ Configuration created successfully');
      }

      if (response.ok) {
        const result = await response.json();
        console.log('📁 Saved configuration:', result);
        
        // Invalidate cache to refresh data
        queryClient.invalidateQueries({ queryKey: ['/api/pr2-clean'] });
        
        // Show success message
        console.log('✅ Configuration saved with ID:', result.id);
      } else {
        console.error('❌ Save failed:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('❌ Save failed:', error);
    }
  };

  // Auto-save functionality
  const handleAutoSaveAndNavigate = (destination: string) => {
    return async () => {
      // Check if there are any enabled options to save
      const hasEnabledOptions = formData.pricingOptions.some(opt => opt.enabled) ||
                               formData.quantityOptions.some(opt => opt.enabled) ||
                               formData.minQuantityOptions.some(opt => opt.enabled) ||
                               formData.rangeOptions.some(opt => opt.enabled);

      if (hasEnabledOptions && formData.categoryName) {
        try {
          console.log('🔄 Auto-saving configuration before navigation...');
          
          const payload = {
            categoryName: formData.categoryName,
            description: formData.description,
            sector: sector, // Save to current sector only
            categoryId: categoryId,
            pricingOptions: formData.pricingOptions,
            quantityOptions: formData.quantityOptions,
            minQuantityOptions: formData.minQuantityOptions,
            rangeOptions: formData.rangeOptions,
            mathOperators: formData.mathOperators,
            pricingStackOrder: formData.pricingStackOrder,
            quantityStackOrder: formData.quantityStackOrder,
            minQuantityStackOrder: formData.minQuantityStackOrder,
            rangeStackOrder: formData.rangeStackOrder
          };

          if (isEditing && editId) {
            // Update existing configuration
            await fetch(`/api/pr2-clean/${editId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });
            console.log('✅ Configuration updated successfully');
          } else {
            // Create new configuration
            await fetch('/api/pr2-clean', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });
            console.log('✅ Configuration saved successfully');
          }
        } catch (error) {
          console.error('❌ Auto-save failed:', error);
          // Continue with navigation even if save fails
        }
      }

      // Navigate to destination with sector context
      if (destination === '/pr2-pricing') {
        setLocation(`${destination}?sector=${sector}`);
      } else {
        setLocation(destination);
      }
    };
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {isEditing ? 'Edit' : 'Create'} {formData.categoryName || 'Configuration'}
              </h1>
              <p className="text-gray-600 mt-1">
                Sector: <span className="font-medium text-blue-600">{sector}</span>
              </p>
            </div>
            
            {/* Navigation Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleSaveConfiguration}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <Save className="h-5 w-5" />
                Save Configuration
              </Button>
              
              <Button
                onClick={handleAutoSaveAndNavigate('/pr2-pricing')}
                variant="outline"
                className="bg-white hover:bg-gray-50 border-gray-200 text-black font-bold px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <ChevronLeft className="h-5 w-5 text-blue-600" />
                Back to Pricing
              </Button>
              
              <Button
                onClick={handleAutoSaveAndNavigate('/dashboard')}
                variant="outline"
                className="bg-white hover:bg-gray-50 border-gray-200 text-black font-bold px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <BarChart3 className="h-5 w-5 text-green-600" />
                Dashboard
              </Button>
            </div>
          </div>

        {/* Sector Selection Checkboxes */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-gray-900 flex items-center gap-2">
              <Building className="w-5 h-5" />
              Apply Configuration to Sectors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {SECTORS.map((sect) => {
                const Icon = sect.icon;
                const isSelected = selectedSectors.includes(sect.id);
                const hasExistingConfig = sectorsWithConfig.includes(sect.id);
                
                return (
                  <div key={sect.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`sector-${sect.id}`}
                      checked={isSelected}
                      onCheckedChange={(checked) => handleSectorChange(sect.id, checked as boolean)}
                      className="border-gray-300"
                    />
                    <Label 
                      htmlFor={`sector-${sect.id}`} 
                      className={`flex items-center gap-2 cursor-pointer ${sect.color} font-medium`}
                    >
                      <Icon className="w-4 h-4" />
                      {sect.name}
                      {hasExistingConfig && (
                        <span className="text-xs text-gray-500">(existing)</span>
                      )}
                    </Label>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                <p>✓ Checked sectors will receive this pricing configuration</p>
                <p>✗ Unchecking existing configurations will remove them with confirmation</p>
              </div>
              <Button
                onClick={handleSave}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2 rounded-lg flex items-center gap-2"
              >
                💾 Save Configuration
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Configuration Title */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">{formData.categoryName || 'Price Configuration'}</h2>
        </div>

        {/* Collapsible Configuration Panel */}
        <Collapsible>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full mb-4 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                150mm Configuration Options
              </span>
              <ChevronDown className="w-4 h-4" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mb-6">
            {/* Five-Window Configuration Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 p-4 border rounded-lg bg-gray-50">
              
              {/* Blue Window: Day Rate */}
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-blue-700 text-sm flex items-center gap-2">
                    <Coins className="w-4 h-4" />
                    Price/Cost Options
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="price_dayrate" className="text-sm font-medium text-blue-700">
                      Day Rate
                    </Label>
                    <Input
                      id="price_dayrate"
                      placeholder="Enter £ value"
                      value={formData.pricingOptions.find(opt => opt.id === 'price_dayrate')?.value || '1850'}
                      onChange={(e) => handleValueChange('pricingOptions', 'price_dayrate', e.target.value)}
                      className="bg-white border-blue-300"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Math Window */}
              <Card className="bg-gray-50 border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-gray-700 text-sm flex items-center gap-2">
                    <Calculator className="w-4 h-4" />
                    Math
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="math_operator" className="text-sm font-medium text-gray-700">
                      Operator
                    </Label>
                    <Select>
                      <SelectTrigger className="bg-white border-gray-300">
                        <SelectValue placeholder="Select operator" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="divide">÷ (Divide)</SelectItem>
                        <SelectItem value="multiply">× (Multiply)</SelectItem>
                        <SelectItem value="add">+ (Add)</SelectItem>
                        <SelectItem value="subtract">- (Subtract)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Green Window: Runs per Shift */}
              <Card className="bg-green-50 border-green-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-green-700 text-sm flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Quantity Options
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="quantity_runs" className="text-sm font-medium text-green-700">
                      Runs per Shift
                    </Label>
                    <Input
                      id="quantity_runs"
                      placeholder="Enter quantity"
                      value={formData.quantityOptions.find(opt => opt.id === 'quantity_runs')?.value || '30'}
                      onChange={(e) => handleValueChange('quantityOptions', 'quantity_runs', e.target.value)}
                      className="bg-white border-green-300"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Orange Window: Min Runs per Shift */}
              <Card className="bg-orange-50 border-orange-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-orange-700 text-sm flex items-center gap-2">
                    <Gauge className="w-4 h-4" />
                    Min Quantity Options
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="minquantity_runs" className="text-sm font-medium text-orange-700">
                      Min Runs per Shift
                    </Label>
                    <Input
                      id="minquantity_runs"
                      placeholder="Enter minimum"
                      value={formData.minQuantityOptions.find(opt => opt.id === 'minquantity_runs')?.value || '20'}
                      onChange={(e) => handleValueChange('minQuantityOptions', 'minquantity_runs', e.target.value)}
                      className="bg-white border-orange-300"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Purple Window: Percentage and Length */}
              <Card className="bg-purple-50 border-purple-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-purple-700 text-sm flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Range Options
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="percentage_value" className="text-sm font-medium text-purple-700">
                        Percentage
                      </Label>
                      <Input
                        id="percentage_value"
                        placeholder="Enter %"
                        value={formData.rangeOptions.find(opt => opt.id === 'range_percentage')?.rangeStart || '15'}
                        onChange={(e) => handleRangeValueChange('range_percentage', 'rangeStart', e.target.value)}
                        className="bg-white border-purple-300"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="length_value" className="text-sm font-medium text-purple-700">
                        Length
                      </Label>
                      <Input
                        id="length_value"
                        placeholder="Enter meters"
                        value={formData.rangeOptions.find(opt => opt.id === 'range_length')?.rangeStart || '50'}
                        onChange={(e) => handleRangeValueChange('range_length', 'rangeStart', e.target.value)}
                        className="bg-white border-purple-300"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
}
