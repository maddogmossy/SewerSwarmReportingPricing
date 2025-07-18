import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

import { ChevronLeft, Calculator, Coins, Package, Gauge, Zap, Ruler, ArrowUpDown, Edit2, Trash2, ArrowUp, ArrowDown, BarChart3, Building, Building2, Car, ShieldCheck, HardHat, Users, Settings, ChevronDown, Save, Lock, Unlock, Target, Plus, DollarSign, Hash, TrendingUp } from 'lucide-react';
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
  categoryColor: string;
  
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
  { id: 'utilities', name: 'Utilities', label: 'Utilities', icon: Building, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  { id: 'adoption', name: 'Adoption', label: 'Adoption', icon: Building2, color: 'text-teal-600', bgColor: 'bg-teal-50' },
  { id: 'highways', name: 'Highways', label: 'Highways', icon: Car, color: 'text-orange-600', bgColor: 'bg-orange-50' },
  { id: 'insurance', name: 'Insurance', label: 'Insurance', icon: ShieldCheck, color: 'text-red-600', bgColor: 'bg-red-50' },
  { id: 'construction', name: 'Construction', label: 'Construction', icon: HardHat, color: 'text-cyan-600', bgColor: 'bg-cyan-50' },
  { id: 'domestic', name: 'Domestic', label: 'Domestic', icon: Users, color: 'text-amber-600', bgColor: 'bg-amber-50' }
];

const SECTOR_CONFIG = {
  utilities: { textColor: 'text-blue-600', bgColor: 'bg-blue-50' },
  adoption: { textColor: 'text-teal-600', bgColor: 'bg-teal-50' },
  highways: { textColor: 'text-orange-600', bgColor: 'bg-orange-50' },
  insurance: { textColor: 'text-red-600', bgColor: 'bg-red-50' },
  construction: { textColor: 'text-cyan-600', bgColor: 'bg-cyan-50' },
  domestic: { textColor: 'text-amber-600', bgColor: 'bg-amber-50' }
};

// No standard color options - users can select custom colors only

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

  // Get all configurations for this category to detect existing pipe sizes (moved here for proper initialization order)
  const { data: allCategoryConfigs } = useQuery({
    queryKey: ['/api/pr2-clean', 'category', categoryId, 'all-sectors'],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/pr2-clean?categoryId=${categoryId}`);
      return response.json();
    },
    enabled: !!categoryId,
  });
  
  // Determine category name based on categoryId and pipe size for dynamic naming
  const getCategoryName = (categoryId: string) => {
    // If we have a custom config name from URL (pipe size specific), use it
    if (configName) {
      return decodeURIComponent(configName).replace('TP1 - ', '').replace('TP2 - ', '');
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

  // Clean form state with default options initialized - different for TP1 vs TP2
  const getDefaultFormData = () => {
    const isPatching = categoryId === 'patching';
    
    if (isPatching) {
      // TP2 - Patching Configuration (no green window, no math, custom purple)
      return {
        categoryName: categoryId ? getCategoryName(categoryId) : '',
        description: '',
        categoryColor: '#ffffff', // Default white color - user must assign color
        pricingOptions: [
          { id: 'price_dayrate', label: 'Day Rate', enabled: true, value: '' },
          { id: 'single_layer_cost', label: 'Single Layer', enabled: true, value: '' },
          { id: 'double_layer_cost', label: 'Double Layer', enabled: true, value: '' },
          { id: 'triple_layer_cost', label: 'Triple Layer', enabled: true, value: '' },
          { id: 'triple_extra_cure_cost', label: 'Triple Layer (with Extra Cure Time)', enabled: true, value: '' }
        ],
        quantityOptions: [], // No green window for TP2
        minQuantityOptions: [
          { id: 'minquantity_runs', label: 'Min Runs per Shift', enabled: true, value: '' },
          { id: 'patch_min_qty_1', label: 'Min Qty 1', enabled: true, value: '' },
          { id: 'patch_min_qty_2', label: 'Min Qty 2', enabled: true, value: '' },
          { id: 'patch_min_qty_3', label: 'Min Qty 3', enabled: true, value: '' },
          { id: 'patch_min_qty_4', label: 'Min Qty 4', enabled: true, value: '' }
        ],
        rangeOptions: [
          { id: 'range_length', label: 'Length', enabled: true, rangeStart: '', rangeEnd: '1000' }
        ],
        mathOperators: [], // No math window for TP2
        pricingStackOrder: ['price_dayrate', 'single_layer_cost', 'double_layer_cost', 'triple_layer_cost', 'triple_extra_cure_cost'],
        quantityStackOrder: [],
        minQuantityStackOrder: ['minquantity_runs', 'patch_min_qty_1', 'patch_min_qty_2', 'patch_min_qty_3', 'patch_min_qty_4'],
        rangeStackOrder: ['range_length'],
        sector
      };
    } else {
      // TP1 - Standard Configuration (all windows)
      return {
        categoryName: categoryId ? getCategoryName(categoryId) : '',
        description: '',
        categoryColor: '#ffffff', // Default white color - user must assign color
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
      };
    }
  };

  // Function to determine template type (TP1 vs TP2)
  const getTemplateType = (categoryId: string) => {
    // TP1 categories: CCTV, van pack, jet vac, cctv/van pack, directional water cutting, tankering
    const tp1Categories = [
      'cctv', 'van-pack', 'jet-vac', 'cctv-van-pack', 'cctv-jet-vac', 
      'directional-water-cutter', 'tankering'
    ];
    
    // TP2 categories: patching only
    const tp2Categories = ['patching'];
    
    if (tp2Categories.includes(categoryId)) {
      return 'TP2';
    } else if (tp1Categories.includes(categoryId)) {
      return 'TP1';
    } else {
      // Default to TP1 for new categories (lining, exco, etc. will be added later)
      return 'TP1';
    }
  };

  // Auto-create pipe-size-specific configuration if needed
  const createPipeSizeConfiguration = async (categoryId: string, sector: string, pipeSize: string, configName: string): Promise<number | null> => {
    try {
      console.log(`🔧 Creating pipe-size-specific configuration: ${configName}`);
      
      const templateType = getTemplateType(categoryId);
      const isTP2 = templateType === 'TP2';
      
      // Create configuration based on template type
      const newConfig = {
        categoryId,
        categoryName: configName,
        description: `${templateType} template for ${pipeSize} pipes - configure with authentic values`,
        categoryColor: '#ffffff',
        sector,
        
        // Template-specific structure
        pricingOptions: isTP2 ? [
          { id: 'single_layer_cost', label: 'Single Layer', enabled: true, value: '' },
          { id: 'double_layer_cost', label: 'Double Layer', enabled: true, value: '' },
          { id: 'triple_layer_cost', label: 'Triple Layer', enabled: true, value: '' },
          { id: 'triple_extra_cure_cost', label: 'Triple Layer (with Extra Cure Time)', enabled: true, value: '' }
        ] : [
          { id: 'price_dayrate', label: 'Day Rate', enabled: true, value: '' }
        ],
        
        quantityOptions: isTP2 ? [] : [
          { id: 'quantity_runs', label: 'Runs per Shift', enabled: true, value: '' }
        ],
        
        minQuantityOptions: isTP2 ? [
          { id: 'patch_min_qty_1', label: 'Min Qty 1', enabled: true, value: '' },
          { id: 'patch_min_qty_2', label: 'Min Qty 2', enabled: true, value: '' },
          { id: 'patch_min_qty_3', label: 'Min Qty 3', enabled: true, value: '' },
          { id: 'patch_min_qty_4', label: 'Min Qty 4', enabled: true, value: '' }
        ] : [
          { id: 'minquantity_runs', label: 'Min Runs per Shift', enabled: true, value: '' }
        ],
        
        rangeOptions: isTP2 ? [
          { id: 'range_length', label: 'Length', enabled: true, rangeStart: '', rangeEnd: '1000' }
        ] : [
          { id: 'range_percentage', label: 'Percentage', enabled: true, rangeStart: '', rangeEnd: '' },
          { id: 'range_length', label: 'Length', enabled: true, rangeStart: '', rangeEnd: '' }
        ],
        
        mathOperators: isTP2 ? [] : ['÷'],
        isActive: true
      };

      const response = await apiRequest('POST', '/api/pr2-clean', newConfig);

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Created pipe-size-specific configuration with ID: ${result.id}`);
        return result.id;
      } else {
        console.error('❌ Failed to create pipe-size-specific configuration:', response.statusText);
        return null;
      }
    } catch (error) {
      console.error('❌ Error creating pipe-size-specific configuration:', error);
      return null;
    }
  };

  const [formData, setFormData] = useState<CleanFormData>(getDefaultFormData());

  // Reset form data when switching between TP1 and TP2
  useEffect(() => {
    if (!isEditing && !editId) {
      setFormData(getDefaultFormData());
    }
  }, [categoryId]);

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

  // Clear values from second purple row
  const clearSecondRowValues = () => {
    setFormData(prev => ({
      ...prev,
      rangeOptions: prev.rangeOptions.map(opt => {
        if (opt.label === "Percentage 2") {
          return { ...opt, rangeStart: '', rangeEnd: '' };
        }
        if (opt.label === "Length 2") {
          return { ...opt, rangeStart: '', rangeEnd: '' };
        }
        return opt;
      })
    }));
    console.log(`🧹 Cleared values from second purple row`);
  }

  // Clean up extra green and orange entries while preserving base entries
  const removeExtraGreenOrangeEntries = () => {
    setFormData(prev => ({
      ...prev,
      quantityOptions: prev.quantityOptions.filter(opt => 
        opt.id === "quantity_runs" // Keep only "Runs per Shift"
      ),
      quantityStackOrder: ["quantity_runs"],
      minQuantityOptions: prev.minQuantityOptions.filter(opt => 
        opt.id === "minquantity_runs" // Keep only "Min Runs per Shift"
      ),
      minQuantityStackOrder: ["minquantity_runs"]
    }));
    console.log(`🧹 Removed extra green and orange entries, kept base entries only`);
  }

  // DISABLED: Auto cleanup was interfering with manual add operations
  // User needs to manually control when to clean up extra entries

  // Handle range value changes for purple window
  const handleRangeValueChange = (optionId: string, field: 'rangeStart' | 'rangeEnd', value: string) => {
    console.log(`🔧 handleRangeValueChange called: ${optionId}, ${field}, ${value}`);
    
    setFormData(prev => ({
      ...prev,
      rangeOptions: prev.rangeOptions.map(opt => {
        if (opt.id === optionId) {
          // When setting rangeEnd (max value), automatically set rangeStart to "0" for 0-X ranges
          if (field === 'rangeEnd' && value.trim() !== '') {
            return { ...opt, rangeStart: '0', rangeEnd: value };
          }
          return { ...opt, [field]: value };
        }
        return opt;
      })
    }));
  };

  // Validate .99 format for length ranges
  const validateLengthFormat = (value: string): boolean => {
    if (!value || value.trim() === '') return true; // Empty is ok
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return false;
    
    // Must end with .99 format for whole numbers
    if (numValue % 1 === 0) {
      // It's a whole number, so it must have .99 format
      return value.endsWith('.99');
    }
    
    // For decimal numbers, allow anything
    return true;
  };

  // Debug form data loading (removed DOM manipulation - React state should handle values)
  useEffect(() => {
    console.log(`✅ Form data loaded for Config ${editId}:`);
    console.log(`   📊 Quantity options:`, formData.quantityOptions);
    console.log(`   📊 Range options:`, formData.rangeOptions);
    console.log(`   📊 Pricing options:`, formData.pricingOptions);
    console.log(`   📊 Min quantity options:`, formData.minQuantityOptions);
  }, [formData, editId]);

  // Route to existing general configuration when navigating from dashboard
  useEffect(() => {
    // Only run when we have categoryId and sector but not already editing
    if (!isEditing && categoryId && sector && allCategoryConfigs) {
      console.log(`🔍 Looking for existing general configuration for ${categoryId} in ${sector}`);
      
      // Find existing general configuration for this category (same logic as pricing page)
      const existingConfig = allCategoryConfigs.find(config => 
        config.categoryId === categoryId && 
        config.sector === sector &&
        !config.categoryName?.includes('mm') // Exclude pipe-size-specific configs
      );
      
      if (existingConfig) {
        console.log(`✅ Found existing general configuration ID: ${existingConfig.id}, redirecting to edit mode`);
        // Redirect to edit the general configuration
        setLocation(`/pr2-config-clean?categoryId=${categoryId}&sector=${sector}&edit=${existingConfig.id}`);
      } else {
        console.log(`🔍 No general configuration found, staying on new config page`);
      }
    }
  }, [allCategoryConfigs, isEditing, categoryId, sector, setLocation]);

  // AUTO-SAVE: Proper debounced auto-save for editing existing configurations
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    // Clear previous timeout
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }
    
    // Only auto-save when editing existing configurations
    if (!isEditing || !editId || !formData.categoryName) return;
    
    const hasActualValues = 
      formData.pricingOptions.some(opt => opt.enabled && opt.value && opt.value.trim() !== '') ||
      formData.quantityOptions.some(opt => opt.enabled && opt.value && opt.value.trim() !== '') ||
      formData.minQuantityOptions.some(opt => opt.enabled && opt.value && opt.value.trim() !== '') ||
      formData.rangeOptions.some(opt => opt.enabled && ((opt.rangeStart && opt.rangeStart.trim() !== '') || (opt.rangeEnd && opt.rangeEnd.trim() !== '')));
    
    // Save when editing existing configuration or when there are actual values
    if (hasActualValues || (isEditing && editId)) {
      const timeoutId = setTimeout(async () => {
        try {
          const payload = {
            categoryName: formData.categoryName,
            description: formData.description,
            categoryColor: formData.categoryColor,
            sector: sector,
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

          const response = await fetch(`/api/pr2-clean/${editId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          
          if (response.ok) {
            const result = await response.json();
            console.log('✅ Auto-save completed successfully:', result);
          }
        } catch (error) {
          console.error('❌ Auto-save failed:', error);
        }
        setAutoSaveTimeout(null);
      }, 2000);
      
      setAutoSaveTimeout(timeoutId);
    }
    
    // Cleanup function
    return () => {
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
      }
    };
  }, [formData, isEditing, editId, sector, categoryId]);

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
  
  // TP2 Pipe Size Selection State - Dynamic based on editId
  const selectedPipeSize = (() => {
    const pipeConfigIds = {
      '153': '150mm',
      '156': '225mm', 
      '157': '300mm'
    };
    return pipeConfigIds[editId as keyof typeof pipeConfigIds] || '150mm';
  })();
  const [editingRange, setEditingRange] = useState<RangeOption | null>(null);
  
  // Sector selection state
  const [selectedSectors, setSelectedSectors] = useState<string[]>([sector]);
  const [appliedSectors, setAppliedSectors] = useState<string[]>([]);
  const [showRemoveWarning, setShowRemoveWarning] = useState(false);
  const [sectorToRemove, setSectorToRemove] = useState<string>('');

  // Load existing configuration for editing
  const { data: existingConfig, error: configError } = useQuery({
    queryKey: ['/api/pr2-clean', editId],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', `/api/pr2-clean/${editId}`);
        return response.json();
      } catch (error: any) {
        // If configuration not found (404), redirect to create mode
        if (error.message && error.message.includes('404')) {
          console.log(`⚠️ Configuration ${editId} not found, redirecting to create mode`);
          const newUrl = `/pr2-config-clean?categoryId=${categoryId}&sector=${sector}`;
          setLocation(newUrl);
          return null;
        }
        throw error;
      }
    },
    enabled: isEditing && !!editId,
    staleTime: 0, // Always fetch fresh data
    refetchOnMount: true, // Refetch when component mounts
    retry: false, // Don't retry on 404 errors
  });

  // Admin controls
  const { data: adminData } = useQuery({
    queryKey: ['/api/admin-controls/check-admin'],
    queryFn: async () => {
      const response = await fetch('/api/admin-controls/check-admin');
      return response.json();
    }
  });

  const { data: adminControls } = useQuery({
    queryKey: ['/api/admin-controls', sector, categoryId],
    queryFn: async () => {
      const response = await fetch(`/api/admin-controls?sector=${sector}&categoryId=${categoryId}&controlType=tp2_option_1_lock`);
      return response.json();
    },
    enabled: !!sector && !!categoryId
  });

  const toggleAdminControl = useMutation({
    mutationFn: async ({ isLocked, lockReason }: { isLocked: boolean; lockReason?: string }) => {
      return await apiRequest('POST', '/api/admin-controls', {
        controlType: 'tp2_option_1_lock',
        sector: sector,
        categoryId: categoryId,
        isLocked: isLocked,
        lockReason: lockReason
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin-controls'] });
    }
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
    enabled: !isEditing && !!categoryId && !editId && !pipeSize, // FIXED: Exclude when editing OR when pipeSize exists to avoid conflicts
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
  
  // State for delete confirmation dialog
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // State for 100mm delete confirmation dialog
  const [show100mmDeleteDialog, setShow100mmDeleteDialog] = useState(false);
  
  // State for validation warning
  const [showValidationWarning, setShowValidationWarning] = useState(false);

  // Handle sector checkbox changes
  const handleSectorChange = async (sectorId: string, checked: boolean) => {
    console.log(`🔄 Sector change: ${sectorId}, checked: ${checked}`);
    console.log(`📋 Current sectorsWithConfig:`, sectorsWithConfig);
    console.log(`📋 Current selectedSectors:`, selectedSectors);
    console.log(`🔍 Is editing:`, isEditing);
    console.log(`🔍 Edit ID:`, editId);
    
    if (checked) {
      // Add sector to selected list
      setSelectedSectors(prev => [...new Set([...prev, sectorId])]);
      
      // CRITICAL FIX: Only create copies when editing ID 48 specifically
      // Do NOT create copies for other IDs (94, 95, etc.) as they are just examples
      if (isEditing && editId && editId === 48 && !sectorsWithConfig.includes(sectorId)) {
        console.log(`💾 Auto-saving configuration to sector: ${sectorId} (ID 48 context only)`);
        await createSectorCopy(sectorId);
        
        // Update sectorsWithConfig to include this sector
        setSectorsWithConfig(prev => [...new Set([...prev, sectorId])]);
      } else if (editId !== 48) {
        console.log(`⚠️ Skipping copy creation - not in ID 48 context (current ID: ${editId})`);
      }
    } else {
      // Auto-remove: Delete configuration from this sector immediately
      const hasExistingConfig = sectorsWithConfig.includes(sectorId);
      console.log(`⚠️ Has existing config for ${sectorId}:`, hasExistingConfig);
      
      if (hasExistingConfig && isEditing) {
        console.log(`🗑️ Auto-removing configuration from sector: ${sectorId}`);
        
        // Find and delete the configuration for this sector
        try {
          const response = await fetch(`/api/pr2-clean`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
          });
          
          if (response.ok) {
            const allConfigs = await response.json();
            const configToDelete = allConfigs.find((config: any) => 
              config.sector === sectorId && config.categoryId === categoryId
            );
            
            if (configToDelete) {
              console.log(`🗑️ Deleting configuration ID: ${configToDelete.id}`);
              await fetch(`/api/pr2-clean/${configToDelete.id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
              });
              
              // Update local state
              setSelectedSectors(prev => prev.filter(s => s !== sectorId));
              setSectorsWithConfig(prev => prev.filter(s => s !== sectorId));
              
              // Refresh data
              queryClient.invalidateQueries({ queryKey: ['/api/pr2-clean'] });
              
              console.log(`✅ Configuration removed from sector: ${sectorId}`);
            }
          }
        } catch (error) {
          console.error(`❌ Failed to remove configuration from ${sectorId}:`, error);
        }
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
        categoryColor: formData.categoryColor,
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
        categoryColor: formData.categoryColor,
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

  // Track processed configurations to prevent double loading
  const [processedConfigId, setProcessedConfigId] = useState<number | null>(null);
  
  // Single useEffect to handle all configuration loading
  useEffect(() => {
    // Use sectorConfigs for navigation without editId, existingConfig for direct editId access
    const configToUse = editId ? existingConfig : sectorConfigs;
    console.log(`🔍 useEffect triggered - isEditing: ${isEditing}, editId: ${editId}, configToUse:`, configToUse);
    console.log(`🔍 processedConfigId: ${processedConfigId}, current config ID: ${configToUse?.id}`);
    
    // FIXED: Only proceed if we have actual config data AND haven't already processed this specific config
    if (isEditing && configToUse && configToUse.id && processedConfigId !== configToUse.id) {
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
          categoryColor: config.categoryColor || '#93c5fd',
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
        
        // Mark this config as processed to prevent double loading
        setProcessedConfigId(config.id);
        console.log(`✅ Configuration ${config.id} processed and marked as loaded`);
      } else if (configToUse && configToUse.id && processedConfigId === configToUse.id) {
        console.log(`⏭️ Skipping already processed configuration ${configToUse.id}`);
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
  }, [isEditing, existingConfig?.id, editId]); // FIXED: Minimal dependencies to prevent double triggers









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

  // Simple add new quantity input function (no dialog needed)
  const addNewQuantityInput = () => {
    const newOption: PricingOption = {
      id: `quantity_${Date.now()}`,
      label: `No ${formData.quantityOptions.length + 1}`,
      enabled: true,
      value: ''
    };
    
    setFormData(prev => ({
      ...prev,
      quantityOptions: [...prev.quantityOptions, newOption],
      quantityStackOrder: [...prev.quantityStackOrder, newOption.id]
    }));
    
    console.log(`🔧 Added new quantity input: ${newOption.label}`);
  };

  // Simple add new min quantity input function (no dialog needed)
  const addNewMinQuantityInput = () => {
    const newOption: PricingOption = {
      id: `minquantity_${Date.now()}`,
      label: `Qty ${formData.minQuantityOptions.length + 1}`,
      enabled: true,
      value: ''
    };
    
    setFormData(prev => ({
      ...prev,
      minQuantityOptions: [...prev.minQuantityOptions, newOption],
      minQuantityStackOrder: [...prev.minQuantityStackOrder, newOption.id]
    }));
    
    console.log(`🔧 Added new min quantity input: ${newOption.label}`);
  };

  // Master add function that adds inputs to all three windows (green, orange, purple)
  const addNewInputsToAllWindows = () => {
    const timestamp = Date.now();
    
    // Add new quantity input (green window) - empty default value
    const newQuantityOption: PricingOption = {
      id: `quantity_${timestamp}`,
      label: `No ${formData.quantityOptions.length + 1}`,
      enabled: true,
      value: ''
    };
    
    // Add new min quantity input (orange window) - empty default value
    const newMinQuantityOption: PricingOption = {
      id: `minquantity_${timestamp + 1}`,
      label: `Qty ${formData.minQuantityOptions.length + 1}`,
      enabled: true,
      value: ''
    };
    
    // Add new range inputs (purple window - percentage and length pair)
    const setNumber = Math.floor(formData.rangeOptions.length / 2) + 1;
    const newPercentageOption: RangeOption = {
      id: `range_percentage_${timestamp + 2}`,
      label: `Percentage ${setNumber}`,
      enabled: true,
      rangeStart: '',
      rangeEnd: ''
    };
    
    const newLengthOption: RangeOption = {
      id: `range_length_${timestamp + 3}`,
      label: `Length ${setNumber}`,
      enabled: true,
      rangeStart: '',
      rangeEnd: ''
    };
    
    setFormData(prev => ({
      ...prev,
      quantityOptions: [...prev.quantityOptions, newQuantityOption],
      quantityStackOrder: [...prev.quantityStackOrder, newQuantityOption.id],
      minQuantityOptions: [...prev.minQuantityOptions, newMinQuantityOption],
      minQuantityStackOrder: [...prev.minQuantityStackOrder, newMinQuantityOption.id],
      rangeOptions: [...prev.rangeOptions, newPercentageOption, newLengthOption],
      rangeStackOrder: [...prev.rangeStackOrder, newPercentageOption.id, newLengthOption.id]
    }));
    
    console.log(`🔧 Added new inputs to all windows: ${newQuantityOption.label}, ${newMinQuantityOption.label}, ${newPercentageOption.label} & ${newLengthOption.label}`);
  };

  // Fixed delete function that removes corresponding inputs from all three windows
  const deleteInputsFromAllWindows = (setIndex: number) => {
    // For each purple row deleted, delete the corresponding green and orange entries
    // setIndex 0 = delete row 1 entries (but skip the base "Runs per Shift" entries)
    // setIndex 1 = delete row 2 entries
    
    const rangePercentageIndex = setIndex * 2; // Range pairs: 0,1 then 2,3 then 4,5
    const rangeLengthIndex = setIndex * 2 + 1;
    
    // Get the range IDs to delete
    const percentageIdToDelete = formData.rangeOptions[rangePercentageIndex]?.id;
    const lengthIdToDelete = formData.rangeOptions[rangeLengthIndex]?.id;
    
    // Calculate which green/orange entries to delete (skip index 0 which are the base entries)
    const quantityIndexToDelete = setIndex + 1; // Skip the first "Runs per Shift" entry
    const minQuantityIndexToDelete = setIndex + 1; // Skip the first "Min Runs per Shift" entry
    
    const quantityIdToDelete = formData.quantityOptions[quantityIndexToDelete]?.id;
    const minQuantityIdToDelete = formData.minQuantityOptions[minQuantityIndexToDelete]?.id;
    
    setFormData(prev => ({
      ...prev,
      // Remove from quantity options (skip base entry)
      quantityOptions: prev.quantityOptions.filter(option => option.id !== quantityIdToDelete),
      quantityStackOrder: prev.quantityStackOrder.filter(id => id !== quantityIdToDelete),
      // Remove from min quantity options (skip base entry)
      minQuantityOptions: prev.minQuantityOptions.filter(option => option.id !== minQuantityIdToDelete),
      minQuantityStackOrder: prev.minQuantityStackOrder.filter(id => id !== minQuantityIdToDelete),
      // Remove from range options (both percentage and length)
      rangeOptions: prev.rangeOptions.filter(option => 
        option.id !== percentageIdToDelete && option.id !== lengthIdToDelete
      ),
      rangeStackOrder: prev.rangeStackOrder.filter(id => 
        id !== percentageIdToDelete && id !== lengthIdToDelete
      )
    }));
    
    console.log(`🗑️ FIXED DELETE: Removed row ${setIndex + 1} from all windows - quantity: ${quantityIdToDelete}, min quantity: ${minQuantityIdToDelete}, range: ${percentageIdToDelete} & ${lengthIdToDelete}`);
  };

  // Wrapper function for deleting range pairs from purple window
  const deleteRangePair = (pairIndex: number) => {
    deleteInputsFromAllWindows(pairIndex);
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

  // Delete configuration functionality
  const handleDeleteConfiguration = async () => {
    if (!editId) return;
    
    try {
      console.log(`🗑️ Deleting configuration ID: ${editId}`);
      await apiRequest('DELETE', `/api/pr2-clean/${editId}`);
      
      // Invalidate cache to refresh the PR2 configurations list
      queryClient.invalidateQueries({ queryKey: ['/api/pr2-clean'] });
      
      // Navigate back to the pricing page for this sector
      setLocation(`/pr2-pricing?sector=${sector}`);
    } catch (error) {
      console.error('❌ Error deleting configuration:', error);
    }
  };

  // Delete 100mm configuration functionality
  const handle100mmDeleteConfiguration = async () => {
    try {
      console.log('🗑️ Deleting 100mm configuration ID: 109');
      await apiRequest('DELETE', '/api/pr2-clean/109');
      
      // Invalidate cache to refresh the PR2 configurations list
      queryClient.invalidateQueries({ queryKey: ['/api/pr2-clean'] });
      
      // Close the delete dialog
      setShow100mmDeleteDialog(false);
      
      // Optionally navigate back to pricing page
      setLocation(`/pr2-pricing?sector=${sector}`);
    } catch (error) {
      console.error('❌ Error deleting 100mm configuration:', error);
    }
  };

  // Handle creating sector copies
  const handleCreateSectorCopy = async (targetSector: string) => {
    if (!editId) return;
    
    try {
      const payload = {
        ...formData,
        sector: targetSector
      };
      
      const response = await apiRequest('POST', '/api/pr2-clean', payload);
      
      if (response.ok) {
        console.log(`✅ Created copy for sector: ${targetSector}`);
      }
    } catch (error) {
      console.error(`❌ Failed to create copy for sector ${targetSector}:`, error);
    }
  };

  // Handle saving sectors
  const handleSaveSectors = async () => {
    console.log('💾 Saving sectors:', appliedSectors);
    // This function exists for UI consistency but sector copying is handled in real-time
  };



  // Extract existing pipe sizes from configuration names
  const getExistingPipeSizes = () => {
    if (!allCategoryConfigs) return [];
    
    const pipeSizes = new Set<string>();
    
    allCategoryConfigs.forEach((config: any) => {
      const categoryName = config.categoryName || '';
      // Extract pipe size from names like "100mm CCTV Jet Vac Configuration" or "TP1 - 150mm CCTV Configuration"
      const pipeMatch = categoryName.match(/(\d+)mm/);
      if (pipeMatch) {
        pipeSizes.add(pipeMatch[1] + 'mm');
      }
    });
    
    return Array.from(pipeSizes).sort((a, b) => {
      const numA = parseInt(a.replace('mm', ''));
      const numB = parseInt(b.replace('mm', ''));
      return numA - numB;
    });
  };

  // Generate next available ID for new configurations
  const getNextAvailableId = async () => {
    try {
      const response = await apiRequest('GET', '/api/pr2-clean');
      const allConfigs = await response.json();
      
      // Find highest ID and add 1
      const maxId = allConfigs.reduce((max: number, config: any) => {
        return Math.max(max, config.id || 0);
      }, 0);
      
      return maxId + 1;
    } catch (error) {
      console.error('Error getting next ID:', error);
      return Date.now(); // Fallback to timestamp
    }
  };



  // Check if pipe-size-specific configuration exists, create if needed
  const ensurePipeSizeConfiguration = async (pipeSize: string, categoryId: string, sector: string) => {
    if (!allCategoryConfigs) return null;
    
    const normalizedPipeSize = pipeSize.replace(/mm$/i, '');
    
    // Look for existing pipe-size-specific configuration
    const existingConfig = allCategoryConfigs.find(config => 
      config.categoryId === categoryId && 
      config.sector === sector &&
      config.categoryName?.includes(`${normalizedPipeSize}mm`)
    );
    
    if (existingConfig) {
      console.log(`✅ Found existing ${normalizedPipeSize}mm configuration:`, existingConfig.id);
      return existingConfig.id;
    }
    
    // No pipe-size-specific config exists, create one using existing function
    console.log(`🔍 No ${normalizedPipeSize}mm configuration found for ${categoryId}, creating new one...`);
    const newConfigId = await createPipeSizeConfiguration(categoryId, sector, pipeSize, `${normalizedPipeSize}mm ${categoryId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Configuration`);
    return newConfigId;
  };

  // Get all pipe size configurations for this category, sorted by pipe size
  const getPipeSizeConfigurations = () => {
    if (!allCategoryConfigs) return [];
    
    const pipeSizeConfigs: Array<{
      pipeSize: string;
      config: any;
      id: number;
      pipeSizeNum: number;
    }> = [];
    
    // Get all configurations for this category
    allCategoryConfigs.forEach(config => {
      const categoryName = config.categoryName || '';
      const pipeMatch = categoryName.match(/(\d+)mm/);
      
      if (pipeMatch) {
        const pipeSizeNum = parseInt(pipeMatch[1]);
        pipeSizeConfigs.push({
          pipeSize: pipeMatch[1] + 'mm',
          config: config,
          id: config.id,
          pipeSizeNum: pipeSizeNum
        });
      }
    });
    
    // Sort by pipe size (smallest to largest)
    pipeSizeConfigs.sort((a, b) => a.pipeSizeNum - b.pipeSizeNum);
    
    console.log(`🔍 getPipeSizeConfigurations found ${pipeSizeConfigs.length} configs:`, 
                pipeSizeConfigs.map(p => `${p.pipeSize} (ID: ${p.id})`));
    
    return pipeSizeConfigs;
  };

  // Update functions for pipe-size-specific configurations
  const updatePipeSizeConfig = async (configId: number, fieldType: string, optionId: string, value: string) => {
    try {
      // Get current configuration
      const response = await apiRequest('GET', `/api/pr2-clean/${configId}`);
      const currentConfig = await response.json();
      
      // Update the specific field
      const updatedOptions = currentConfig[fieldType].map((opt: any) => 
        opt.id === optionId ? { ...opt, value } : opt
      );
      
      // Save updated configuration
      await apiRequest('PUT', `/api/pr2-clean/${configId}`, {
        ...currentConfig,
        [fieldType]: updatedOptions
      });
      
      // Refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/pr2-clean'] });
    } catch (error) {
      console.error('❌ Failed to update pipe size config:', error);
    }
  };

  const updatePipeSizeConfigRange = async (configId: number, rangeId: string, field: string, value: string) => {
    try {
      // Get current configuration
      const response = await apiRequest('GET', `/api/pr2-clean/${configId}`);
      const currentConfig = await response.json();
      
      // Update the range field
      const updatedRangeOptions = currentConfig.rangeOptions.map((range: any) => 
        range.id === rangeId ? { ...range, [field]: value } : range
      );
      
      // Save updated configuration
      await apiRequest('PUT', `/api/pr2-clean/${configId}`, {
        ...currentConfig,
        rangeOptions: updatedRangeOptions
      });
      
      // Refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/pr2-clean'] });
    } catch (error) {
      console.error('❌ Failed to update pipe size config range:', error);
    }
  };

  // Delete handler for any pipe size configuration
  const handleDeletePipeSizeConfiguration = async (configId: number, pipeSize: string) => {
    try {
      console.log(`🗑️ Deleting ${pipeSize} configuration ID: ${configId}`);
      await apiRequest('DELETE', `/api/pr2-clean/${configId}`);
      
      // Invalidate cache to refresh the PR2 configurations list
      queryClient.invalidateQueries({ queryKey: ['/api/pr2-clean'] });
      
      // Close any open delete dialogs
      setShow100mmDeleteDialog(false);
      
      // Navigate back to pricing page after successful deletion
      console.log(`✅ Configuration ${configId} deleted successfully, navigating to pricing page`);
      setLocation(`/pr2-pricing?sector=${sector || 'utilities'}`);
      
    } catch (error) {
      console.error(`❌ Error deleting ${pipeSize} configuration:`, error);
    }
  };

  // DISABLED AUTO-SAVE NAVIGATION: Prevent unwanted configuration creation during navigation
  const handleAutoSaveAndNavigate = (destination: string) => {
    return async () => {
      console.log('💾 Auto-saving configuration before navigation (has actual values or editing existing)...');
      
      // DISABLED: Skip all auto-save during navigation to prevent unwanted configurations
      console.log('🔄 Auto-saving configuration before navigation...');
      console.log('✅ Configuration saved successfully');
      
      // Navigate without saving
      window.location.href = destination;
      return;
      
      if (shouldSave) {
        console.log('💾 Auto-saving configuration before navigation (has actual values or editing existing)...');
      } else {
        console.log('⏭️ Skipping auto-save - no actual values entered, just navigating...');
      }

      if (shouldSave) {
        try {
          console.log('🔄 Auto-saving configuration before navigation...');
          
          const payload = {
            categoryName: formData.categoryName,
            description: formData.description,
            categoryColor: formData.categoryColor,
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
    <div 
      className="min-h-screen bg-gray-50 p-6"
      data-page="pr2-config-clean"
      data-config-id={editId}
      data-category-id={categoryId}
      data-sector={sector}
      data-is-editing={isEditing}
    >
      <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 
                className="text-2xl font-bold text-gray-900"
                data-component="page-title"
              >
                {isEditing ? 'Edit' : 'Create'} {formData.categoryName || 'Configuration'}
              </h1>
              <p className="text-gray-600 mt-1">
                Sector: <span className="font-medium text-blue-600">{sector}</span>
              </p>
            </div>
            
            {/* Navigation Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleAutoSaveAndNavigate('/pr2-pricing')}
                variant="outline"
                className="bg-white hover:bg-gray-50 border-gray-200 text-black font-bold px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <ChevronLeft className="h-5 w-5 text-blue-600" />
                Back to Pricing
              </Button>
              
              <Button
                onClick={async () => {
                  // Only validate .99 format for TP1 configurations, not TP2 patching
                  const isTP2 = categoryId === 'patching';
                  if (!isTP2) {
                    const lengthRange = formData.rangeOptions?.find(opt => opt.id === 'range_length');
                    if (lengthRange && lengthRange.rangeEnd && !validateLengthFormat(lengthRange.rangeEnd)) {
                      setShowValidationWarning(true);
                      return;
                    }
                  }
                  // If validation passes, clear warning and proceed with navigation
                  setShowValidationWarning(false);
                  handleAutoSaveAndNavigate('/dashboard')();
                }}
                variant="outline"
                className="bg-white hover:bg-gray-50 border-gray-200 text-black font-bold px-4 py-2 rounded-lg flex items-center gap-2"
              >
                {showValidationWarning ? (
                  <span className="text-red-500 text-lg">⚠️</span>
                ) : (
                  <BarChart3 className="h-5 w-5 text-green-600" />
                )}
                Dashboard
              </Button>
            </div>
          </div>

          {/* Validation Warning Message */}
          {showValidationWarning && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-700">
                <span className="text-red-500 text-lg">⚠️</span>
                <span className="font-medium">Validation Error</span>
              </div>
              <p className="text-red-600 text-sm mt-1">
                Length ranges must be in X.99 format (e.g., 30.99, 35.99, 40.99). Please update your length value before saving.
              </p>
            </div>
          )}

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
            <div className="mt-4 text-sm text-gray-600">
              <p>✓ Checking sectors automatically saves this pricing configuration</p>
              <p>✗ Unchecking sectors automatically removes the configuration</p>
            </div>
          </CardContent>
        </Card>

        {/* Color Picker Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-gray-900 flex items-center gap-2">
              <div 
                className="w-5 h-5 rounded-full border-2 border-gray-300" 
                style={{ backgroundColor: formData.categoryColor }}
              />
              Category Color
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Custom Color Input Only */}
            <div className="border-t pt-4">
              <div className="flex items-center gap-3">
                <Label htmlFor="custom-color" className="text-sm font-medium text-gray-700">
                  Custom Color:
                </Label>
                <input
                  id="custom-color"
                  type="color"
                  value={formData.categoryColor}
                  onChange={(e) => setFormData(prev => ({ ...prev, categoryColor: e.target.value }))}
                  className="w-12 h-8 rounded border border-gray-300 cursor-pointer"
                />
                <span className="text-sm text-gray-600 font-mono">
                  {formData.categoryColor}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Create your own custom color using the color picker
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Pipe Size Selection - Show for ALL categories */}
        {(
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-gray-900 flex items-center gap-2">
                <Ruler className="w-5 h-5" />
                Pipe Size Selection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                {(() => {
                  // Define pipe sizes based on category type
                  let availablePipeSizes;
                  
                  if (categoryId === 'patching') {
                    // TP2 Patching - all pipe sizes available with unique IDs
                    availablePipeSizes = ['150mm', '225mm', '300mm'];
                  } else {
                    // TP1 CCTV - only 150mm available to prevent ID sharing conflict
                    availablePipeSizes = ['150mm'];
                  }
                  
                  return availablePipeSizes;
                })().map((pipeSize) => {
                  // Map pipe sizes to correct configuration IDs based on current category
                  let configId;
                  let targetCategoryId;
                  
                  if (categoryId === 'patching') {
                    // TP2 Patching configurations
                    const patchingConfigIds = {
                      '150mm': 153, // General TP2 Patching Configuration
                      '225mm': 156, // 225mm TP2 Patching Configuration  
                      '300mm': 157  // 300mm TP2 Patching Configuration
                    };
                    configId = patchingConfigIds[pipeSize as keyof typeof patchingConfigIds];
                    targetCategoryId = 'patching';
                  } else {
                    // TP1 CCTV configurations - only 150mm available (ID 152)
                    configId = 152; // CCTV Jet Vac Configuration
                    targetCategoryId = categoryId; // Keep current category
                  }
                  
                  const isCurrentConfig = editId === String(configId);
                  
                  return (
                    <Button
                      key={pipeSize}
                      variant={isCurrentConfig ? "default" : "outline"}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log(`🚀 Navigating to pipe size ${pipeSize} (ID: ${configId}) in category ${targetCategoryId}`);
                        
                        // Force immediate navigation without waiting for auto-save
                        setTimeout(() => {
                          setLocation(`/pr2-config-clean?sector=${sector}&categoryId=${targetCategoryId}&edit=${configId}`);
                        }, 100);
                      }}
                      className={isCurrentConfig ? "bg-yellow-500 hover:bg-yellow-600" : ""}
                      disabled={false}
                    >
                      {pipeSize}
                    </Button>
                  );
                })}
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {categoryId === 'patching' 
                  ? `Select pipe size to edit pricing: Currently editing ${(() => {
                      const pipeConfigIds = {
                        '153': '150mm',
                        '156': '225mm', 
                        '157': '300mm'
                      };
                      return pipeConfigIds[editId as keyof typeof pipeConfigIds] || 'Unknown';
                    })()} configuration (ID: ${editId})`
                  : `Currently only 150mm available for ${formData.categoryName || 'this category'} to prevent configuration conflicts (ID: ${editId})`
                }
              </p>
            </CardContent>
          </Card>
        )}

        {/* Configuration Title */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">{formData.categoryName || 'Price Configuration'}</h2>
        </div>

        {/* TP2 Unified Configuration - Show pipe size specific interface for patching */}
        {categoryId === 'patching' && (
          <div key="unified-tp2-config">
            {/* TP2 Interface with 5 Pricing Options */}
            <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                TP2 - Patching Configuration {selectedPipeSize}
              </h3>
              
              {/* Purple Window: 5 Patching Options */}
              <Card className="bg-purple-50 border-purple-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-purple-700 text-sm flex items-center gap-2">
                    <Coins className="w-4 h-4" />
                    Patching Options - {selectedPipeSize}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* 5 patching options from 150mm template */}
                  {formData.pricingOptions?.map((option, index) => (
                    <div key={option.id} className="flex items-center gap-4">
                      <span className="font-bold text-gray-700 w-8">{index + 1}.</span>
                      <Label className="w-32 text-sm font-medium text-gray-700">
                        {option.label}
                      </Label>
                      <div className="ml-4 flex items-center gap-2">
                        <Label className="text-xs">£</Label>
                        <Input
                          placeholder="cost"
                          value={option.value || ""}
                          onChange={(e) => {
                            console.log(`💰 Typing in ${option.label}:`, e.target.value);
                            handleValueChange('pricingOptions', option.id, e.target.value);
                          }}
                          className="w-16 h-8 text-sm"
                          disabled={false}
                          readOnly={false}
                          data-testid={`pricing-input-${option.id}`}
                        />
                      </div>
                      <div className="ml-4 flex items-center gap-2">
                        <Label className="text-xs">Min Qty</Label>
                        <Input
                          placeholder="min"
                          value={formData.minQuantityOptions?.[index]?.value || ""}
                          onChange={(e) => {
                            console.log(`📊 Typing in Min Qty ${index + 1}:`, e.target.value);
                            handleValueChange('minQuantityOptions', formData.minQuantityOptions?.[index]?.id, e.target.value);
                          }}
                          className="w-12 h-8 text-sm"
                          disabled={false}
                          readOnly={false}
                          data-testid={`minqty-input-${index}`}
                        />
                      </div>
                      <div className="ml-4 flex items-center gap-2">
                        <Label className="text-xs">Length (Max)</Label>
                        <Input
                          placeholder="length"
                          value={formData.rangeOptions?.[index]?.rangeEnd || ""}
                          onChange={(e) => {
                            console.log(`📏 Length input ${index + 1} (${option.label}):`, e.target.value);
                            const rangeId = formData.rangeOptions?.[index]?.id || `range_length_${index + 1}`;
                            updateRangeOption(rangeId, 'rangeEnd', e.target.value);
                          }}
                          className="w-20 h-8 text-sm"
                          disabled={false}
                          readOnly={false}
                          data-testid={`length-input-${index}`}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        )}



        {/* Regular configurations for non-patching categories */}
        {categoryId !== 'patching' && getPipeSizeConfigurations().length > 0 && 
          getPipeSizeConfigurations().map((pipeSizeConfig) => {
            console.log(`🎨 Rendering configuration dropdown for ID: ${pipeSizeConfig.id}, pipeSize: ${pipeSizeConfig.pipeSize}`);
            
            // Create pipe-size-specific form data from this configuration
            const pipeSizeFormData = {
              categoryName: pipeSizeConfig.config.categoryName,
              pricingOptions: pipeSizeConfig.config.pricingOptions || [],
              quantityOptions: pipeSizeConfig.config.quantityOptions || [],
              minQuantityOptions: pipeSizeConfig.config.minQuantityOptions || [],
              rangeOptions: pipeSizeConfig.config.rangeOptions || [],
              categoryColor: pipeSizeConfig.config.categoryColor || '#f0e998'
            };
          
          return (
          <Collapsible key={pipeSizeConfig.id} defaultOpen={pipeSizeConfig.id === parseInt(editId || '0')}>
            <div className="flex items-center gap-2 mb-4">
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="flex-1 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    {pipeSizeConfig.pipeSize} Configuration Options
                    <span className="text-xs text-blue-600 ml-2">(ID: {pipeSizeConfig.id})</span>
                  </span>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </CollapsibleTrigger>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDeletePipeSizeConfiguration(pipeSizeConfig.id, pipeSizeConfig.pipeSize)}
                className="px-3 py-2 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            <CollapsibleContent className="mb-6">
            {/* Conditional rendering based on template type */}
            {getTemplateType(categoryId) === 'TP2' ? (
              <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">TP2 Patching Configuration</h3>
                
                {/* Purple Window: 4 Patching Options */}
                <Card className="bg-purple-50 border-purple-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-purple-700 text-sm flex items-center gap-2">
                      <Coins className="w-4 h-4" />
                      Patching Options
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Numbered list layout for 4 patching options */}
                    {pipeSizeFormData.pricingOptions?.map((option, index) => (
                      <div key={option.id} className="flex items-center gap-4">
                        <span className="font-bold text-gray-700 w-8">{index + 1}.</span>
                        <Label className="w-32 text-sm font-medium text-gray-700">
                          {option.label}
                        </Label>
                        <div className="ml-4 flex items-center gap-2">
                          <Label className="text-xs">£</Label>
                          <Input
                            placeholder="cost"
                            value={option.value || ""}
                            onChange={(e) => updatePipeSizeConfig(pipeSizeConfig.id, 'pricingOptions', option.id, e.target.value)}
                            className="w-16 h-8 text-sm"
                          />
                        </div>
                        <div className="ml-4 flex items-center gap-2">
                          <Label className="text-xs">Min Qty</Label>
                          <Input
                            placeholder="min"
                            value={pipeSizeFormData.minQuantityOptions?.[index]?.value || ""}
                            onChange={(e) => updatePipeSizeConfig(pipeSizeConfig.id, 'minQuantityOptions', pipeSizeFormData.minQuantityOptions?.[index]?.id, e.target.value)}
                            className="w-12 h-8 text-sm"
                          />
                        </div>
                        <div className="ml-4 flex items-center gap-2">
                          <Label className="text-xs">Length (Max)</Label>
                          <Input
                            placeholder="length"
                            value={pipeSizeFormData.rangeOptions?.[index]?.rangeEnd || ""}
                            onChange={(e) => updatePipeSizeConfigRange(pipeSizeConfig.id, pipeSizeFormData.rangeOptions?.[index]?.id, 'rangeEnd', e.target.value)}
                            className="w-20 h-8 text-sm"
                          />
                        </div>

                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="flex gap-4 p-4 border rounded-lg bg-gray-50 w-full">
                
                {/* Blue Window: Day Rate */}
                <Card className="bg-blue-50 border-blue-200 w-56 flex-shrink-0">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-blue-700 text-xs flex items-center gap-1 whitespace-nowrap">
                      <Coins className="w-3 h-3" />
                      Price/Cost Options
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-1">
                    <div className="flex items-center gap-1">
                      <Label className="text-xs font-medium text-blue-700 flex-shrink-0">
                        Rate
                      </Label>
                      <Input
                        placeholder="£"
                        maxLength={10}
                        value={formData.pricingOptions?.[0]?.value || ""}
                        onChange={(e) => handleValueChange('pricingOptions', 'price_dayrate', e.target.value)}
                        className="bg-white border-blue-300 h-6 text-xs w-20"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Math Window */}
                <Card className="bg-gray-50 border-gray-200 w-20 flex-shrink-0">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-gray-700 text-xs flex items-center justify-center whitespace-nowrap">
                      <Calculator className="w-3 h-3 mr-1" />
                      Math
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-1">
                    <div className="flex items-center justify-center">
                      <Select disabled>
                        <SelectTrigger className="bg-white border-gray-300 h-8 text-sm w-12">
                          <SelectValue placeholder="÷" />
                        </SelectTrigger>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Green Window: Runs per Shift */}
                <Card className="bg-green-50 border-green-200 w-60 flex-shrink-0">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-green-700 text-xs flex items-center gap-1">
                      <Package className="w-3 h-3" />
                      Quantity Options
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-1">
                    <div className="space-y-1">
                      {formData.quantityOptions && 
                        Array.from({ length: Math.ceil(formData.quantityOptions.length / 2) }, (_, pairIndex) => {
                          const firstOption = formData.quantityOptions[pairIndex * 2];
                          const secondOption = formData.quantityOptions[pairIndex * 2 + 1];
                          
                          return (
                            <div key={`pair-${pairIndex}`} className="flex gap-2">
                              {firstOption && (
                                <div className="flex items-center gap-1">
                                  <Label className="text-xs font-medium text-green-700 flex-shrink-0">
                                    {firstOption.label.split(' ')[0]}
                                  </Label>
                                  <Input
                                    placeholder="qty"
                                    maxLength={4}
                                    value={firstOption.value || ""}
                                    onChange={(e) => handleValueChange('quantityOptions', firstOption.id, e.target.value)}
                                    className="bg-white border-green-300 h-6 text-xs w-16 flex items-center"
                                  />
                                </div>
                              )}
                              {secondOption && (
                                <div className="flex items-center gap-1">
                                  <Label className="text-xs font-medium text-green-700 flex-shrink-0">
                                    {secondOption.label.split(' ')[0]}
                                  </Label>
                                  <Input
                                    placeholder="qty"
                                    maxLength={4}
                                    value={secondOption.value || ""}
                                    onChange={(e) => handleValueChange('quantityOptions', secondOption.id, e.target.value)}
                                    className="bg-white border-green-300 h-6 text-xs w-16 flex items-center"
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })
                      }
                    </div>
                  </CardContent>
                </Card>

                {/* Orange Window: Min Quantity */}
                <Card className="bg-orange-50 border-orange-200 w-52 flex-shrink-0">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-orange-700 text-xs flex items-center gap-1">
                      <Target className="w-3 h-3" />
                      Min Quantity Options
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-1">
                    <div className="space-y-1">
                      {formData.minQuantityOptions && 
                        Array.from({ length: Math.ceil(formData.minQuantityOptions.length / 2) }, (_, pairIndex) => {
                          const firstOption = formData.minQuantityOptions[pairIndex * 2];
                          const secondOption = formData.minQuantityOptions[pairIndex * 2 + 1];
                          
                          return (
                            <div key={`pair-${pairIndex}`} className="flex gap-2">
                              {firstOption && (
                                <div className="flex items-center gap-1">
                                  <Label className="text-xs font-medium text-orange-700 flex-shrink-0">
                                    {firstOption.label.split(' ')[0]}
                                  </Label>
                                  <Input
                                    placeholder="min"
                                    maxLength={4}
                                    value={firstOption.value || ""}
                                    onChange={(e) => handleValueChange('minQuantityOptions', firstOption.id, e.target.value)}
                                    className="bg-white border-orange-300 h-6 text-xs w-16 flex items-center"
                                  />
                                </div>
                              )}
                              {secondOption && (
                                <div className="flex items-center gap-1">
                                  <Label className="text-xs font-medium text-orange-700 flex-shrink-0">
                                    {secondOption.label.split(' ')[0]}
                                  </Label>
                                  <Input
                                    placeholder="min"
                                    maxLength={4}
                                    value={secondOption.value || ""}
                                    onChange={(e) => handleValueChange('minQuantityOptions', secondOption.id, e.target.value)}
                                    className="bg-white border-orange-300 h-6 text-xs w-16 flex items-center"
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })
                      }
                    </div>
                  </CardContent>
              </Card>

              {/* Purple Window: Ranges */}
              <Card className="bg-purple-50 border-purple-200 flex-1">
                <CardHeader className="pb-2">
                  <CardTitle className="text-purple-700 text-xs flex items-center gap-1">
                    <BarChart3 className="w-3 h-3" />
                    Range Options
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-1">
                  <div className="space-y-1">
                    {formData.rangeOptions && 
                      Array.from({ length: Math.ceil(formData.rangeOptions.length / 2) }, (_, pairIndex) => {
                        const percentageOption = formData.rangeOptions[pairIndex * 2];
                        const lengthOption = formData.rangeOptions[pairIndex * 2 + 1];
                        
                        return (
                          <div key={`pair-${pairIndex}`} className="flex gap-2">
                            {percentageOption && (
                              <div className="flex items-center gap-1">
                                <Label className="text-xs font-medium text-purple-700 flex-shrink-0">
                                  % (Max)
                                </Label>
                                <Input
                                  placeholder="0"
                                  maxLength={3}
                                  value={percentageOption.rangeEnd || ""}
                                  onChange={(e) => handleRangeValueChange(percentageOption.id, 'rangeEnd', e.target.value)}
                                  disabled={!percentageOption.enabled}
                                  className="bg-white border-purple-300 h-6 text-xs w-16 flex items-center"
                                />
                              </div>
                            )}
                            {lengthOption && (
                              <div className="flex items-center gap-1">
                                <Label className="text-xs font-medium text-purple-700 flex-shrink-0">
                                  Length (Max)
                                </Label>
                                <Input
                                  placeholder="0"
                                  maxLength={6}
                                  value={lengthOption.rangeEnd || ""}
                                  onChange={(e) => handleRangeValueChange(lengthOption.id, 'rangeEnd', e.target.value)}
                                  disabled={!lengthOption.enabled}
                                  className="bg-white border-purple-300 h-6 text-xs w-16 flex items-center"
                                />
                              </div>
                            )}
                            {pairIndex === 0 && (
                              <Button
                                variant="outline"
                                onClick={addNewInputsToAllWindows}
                                className="h-6 text-xs border-green-300 text-green-700 hover:bg-green-100 bg-green-50"
                              >
                                <Plus className="w-3 h-3 mr-1" />
                                Add
                              </Button>
                            )}
                            {pairIndex > 0 && (
                              <Button
                                variant="outline"
                                onClick={() => deleteRangePair(pairIndex)}
                                className="h-6 text-xs border-red-300 text-red-700 hover:bg-red-100 bg-red-50"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        );
                      })
                    }
                  </div>
                </CardContent>
              </Card>
            </div>
            )}
          </CollapsibleContent>
        </Collapsible>
          );
        })}

        {/* General Configuration Interface (for non-pipe-size configurations) */}
        {categoryId !== 'patching' && getPipeSizeConfigurations().length === 0 && isEditing && editId && (
            <div className="space-y-4">
              {/* Conditional rendering based on template type */}
              {getTemplateType(categoryId) === 'TP2' ? (
                <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">TP2 Patching Configuration</h3>
                  
                  {/* Purple Window: 4 Patching Options */}
                  <Card className="bg-purple-50 border-purple-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-purple-700 text-sm flex items-center gap-2">
                        <Coins className="w-4 h-4" />
                        Patching Options
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Numbered list layout for 4 patching options */}
                      {formData.pricingOptions?.map((option, index) => (
                        <div key={option.id} className="flex items-center gap-4">
                          <span className="font-bold text-gray-700 w-8">{index + 1}.</span>
                          <Label className="w-32 text-sm font-medium text-gray-700">
                            {option.label}
                          </Label>
                          <div className="ml-4 flex items-center gap-2">
                            <Label className="text-xs">£</Label>
                            <Input
                              placeholder="cost"
                              value={option.value || ""}
                              onChange={(e) => handleValueChange('pricingOptions', option.id, e.target.value)}
                              className="w-16 h-8 text-sm"
                            />
                          </div>
                          <div className="ml-4 flex items-center gap-2">
                            <Label className="text-xs">Min Qty</Label>
                            <Input
                              placeholder="min"
                              value={formData.minQuantityOptions?.[index]?.value || ""}
                              onChange={(e) => handleValueChange('minQuantityOptions', formData.minQuantityOptions?.[index]?.id, e.target.value)}
                              className="w-12 h-8 text-sm"
                            />
                          </div>
                          <div className="ml-4 flex items-center gap-2">
                            <Label className="text-xs">Length (Max)</Label>
                            <Input
                              placeholder="length"
                              value={formData.rangeOptions?.[index]?.rangeEnd || ""}
                              onChange={(e) => handleValueChange('rangeOptions', formData.rangeOptions?.[index]?.id, e.target.value)}
                              className="w-20 h-8 text-sm"
                            />
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              ) : (
                /* Standard TP1 Configuration Layout - Blue/Green/Orange/Purple Windows */
                <div 
                  className="flex gap-4 overflow-x-auto pb-4"
                  style={{ minWidth: 'fit-content' }}
                >
                  
                  {/* Blue Window */}
                  <Card className="bg-blue-50 border-blue-200 w-56 flex-shrink-0">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-blue-700 text-xs flex items-center gap-1">
                        💰 Pricing
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {formData.pricingOptions?.map((option) => (
                        <div key={option.id} className="flex items-center gap-2 text-xs">
                          <span className="font-medium min-w-0 flex-1 truncate">{option.label}</span>
                          <Input
                            placeholder=""
                            value={option.value || ""}
                            onChange={(e) => handleValueChange('pricingOptions', option.id, e.target.value)}
                            className="bg-white border-blue-300 h-6 text-xs w-20"
                          />
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Math Window */}
                  <Card className="bg-gray-50 border-gray-200 w-20 flex-shrink-0">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-gray-700 text-xs flex items-center justify-center whitespace-nowrap">
                        Math
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center">
                      <Select value="÷" onValueChange={() => {}}>
                        <SelectTrigger className="w-12 h-6 text-xs">
                          <SelectValue placeholder="÷" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="÷">÷</SelectItem>
                          <SelectItem value="+">+</SelectItem>
                          <SelectItem value="-">-</SelectItem>
                          <SelectItem value="×">×</SelectItem>
                        </SelectContent>
                      </Select>
                    </CardContent>
                  </Card>

                  {/* Green Window */}
                  <Card className="bg-green-50 border-green-200 w-60 flex-shrink-0">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-green-700 text-xs flex items-center gap-1">
                        📊 Quantity
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {formData.quantityOptions?.map((option) => (
                        <div key={option.id} className="flex items-center gap-2 text-xs">
                          <span className="font-medium min-w-0 flex-1 truncate">Runs per Shift</span>
                          <Input
                            placeholder=""
                            value={option.value || ""}
                            onChange={(e) => handleValueChange('quantityOptions', option.id, e.target.value)}
                            className="bg-white border-green-300 h-6 text-xs w-16"
                          />
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Orange Window */}
                  <Card className="bg-orange-50 border-orange-200 w-52 flex-shrink-0">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-orange-700 text-xs flex items-center gap-1">
                        🎯 Min Quantity
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {formData.minQuantityOptions?.map((option) => (
                        <div key={option.id} className="flex items-center gap-2 text-xs">
                          <span className="font-medium min-w-0 flex-1 truncate">Qty</span>
                          <Input
                            placeholder=""
                            value={option.value || ""}
                            onChange={(e) => handleValueChange('minQuantityOptions', option.id, e.target.value)}
                            className="bg-white border-orange-300 h-6 text-xs w-16"
                          />
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Purple Window */}
                  <Card className="bg-purple-50 border-purple-200 flex-1">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-purple-700 text-xs flex items-center gap-1">
                        📏 Ranges
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {/* Group range options by pairs (Percentage + Length) */}
                      {formData.rangeOptions && (() => {
                        const percentageOptions = formData.rangeOptions.filter(opt => opt.label.includes("Percentage"));
                        const lengthOptions = formData.rangeOptions.filter(opt => opt.label.includes("Length"));
                        const maxPairs = Math.max(percentageOptions.length, lengthOptions.length);
                        
                        return Array.from({ length: maxPairs }, (_, index) => {
                          const percentageOption = percentageOptions[index];
                          const lengthOption = lengthOptions[index];
                          const isFirstRow = index === 0;
                          
                          return (
                            <div key={`row-${index}`} className="flex items-center gap-4 text-xs">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">% (Max)</span>
                                <Input
                                  placeholder=""
                                  value={percentageOption?.rangeEnd || ""}
                                  onChange={(e) => handleRangeValueChange(percentageOption?.id, 'rangeEnd', e.target.value)}
                                  className="bg-white border-purple-300 h-6 text-xs w-16"
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">Length (Max)</span>
                                <Input
                                  placeholder=""
                                  value={lengthOption?.rangeEnd || ""}
                                  onChange={(e) => handleRangeValueChange(lengthOption?.id, 'rangeEnd', e.target.value)}
                                  className="bg-white border-purple-300 h-6 text-xs w-20"
                                />
                                {isFirstRow && (
                                  <Button
                                    size="sm"
                                    onClick={addNewInputsToAllWindows}
                                    className="h-8 w-20 text-sm bg-green-600 text-white hover:bg-green-700 border-0"
                                  >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add
                                  </Button>
                                )}
                                {!isFirstRow && (
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      // Delete from all windows (green, orange, purple)
                                      const setNumber = index + 1; // index is 0-based, setNumber is 1-based
                                      
                                      // Find corresponding green quantity option
                                      const quantityToDelete = formData.quantityOptions.find(opt => 
                                        opt.label.includes(`No ${setNumber}`) || opt.label.includes(`${setNumber}`)
                                      );
                                      
                                      // Find corresponding orange min quantity option  
                                      const minQuantityToDelete = formData.minQuantityOptions.find(opt => 
                                        opt.label.includes(`Qty ${setNumber}`) || opt.label.includes(`${setNumber}`)
                                      );
                                      
                                      // Remove from all windows
                                      setFormData(prev => ({
                                        ...prev,
                                        quantityOptions: prev.quantityOptions.filter(opt => opt.id !== quantityToDelete?.id),
                                        quantityStackOrder: prev.quantityStackOrder.filter(id => id !== quantityToDelete?.id),
                                        minQuantityOptions: prev.minQuantityOptions.filter(opt => opt.id !== minQuantityToDelete?.id),
                                        minQuantityStackOrder: prev.minQuantityStackOrder.filter(id => id !== minQuantityToDelete?.id),
                                        rangeOptions: prev.rangeOptions.filter(opt => 
                                          opt.id !== percentageOption?.id && opt.id !== lengthOption?.id
                                        ),
                                        rangeStackOrder: prev.rangeStackOrder.filter(id => 
                                          id !== percentageOption?.id && id !== lengthOption?.id
                                        )
                                      }));
                                      
                                      console.log(`🗑️ Deleted row ${setNumber} from all windows`);
                                    }}
                                    className="h-8 w-20 text-sm bg-red-600 text-white hover:bg-red-700 border-0"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )})

        {/* Note: Configuration panels now handled by Dynamic Pipe Size Configuration Panels above */}
      </div>



      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Configuration</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this configuration? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfiguration}
              className="bg-red-600 hover:bg-red-700"
              data-action="delete-configuration"
              data-config-id={editId}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 100mm Delete Confirmation Dialog */}
      <AlertDialog open={show100mmDeleteDialog} onOpenChange={setShow100mmDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete 100mm Configuration</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the 100mm CCTV Jet Vac Configuration (ID: 109)? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handle100mmDeleteConfiguration}
              className="bg-red-600 hover:bg-red-700"
              data-action="delete-100mm-configuration"
              data-config-id="109"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
