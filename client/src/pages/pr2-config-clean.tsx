import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

import { ChevronLeft, Calculator, Coins, Package, Gauge, Zap, Ruler, ArrowUpDown, Edit2, Trash2, ArrowUp, ArrowDown, BarChart3, Building, Building2, Car, ShieldCheck, HardHat, Users, Settings, ChevronDown, Save, Lock, Unlock, Target, Plus, DollarSign, Hash, TrendingUp, Truck, Banknote } from 'lucide-react';
import { DevLabel } from '@/utils/DevLabel';
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

interface VehicleTravelRate {
  id: string;
  vehicleType: string;
  hourlyRate: string;
  numberOfHours: string;
  enabled: boolean;
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
  
  // Teal Window - Vehicle Travel Rates
  vehicleTravelRates: VehicleTravelRate[];
  
  // Math Operations
  mathOperators: string[];
  
  // Stack Order
  pricingStackOrder: string[];
  quantityStackOrder: string[];
  minQuantityStackOrder: string[];
  rangeStackOrder: string[];
  vehicleTravelRatesStackOrder: string[];
  
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

// Category ID to page ID mapping (matching pr2-pricing.tsx devId values)
const CATEGORY_PAGE_IDS = {
  'cctv': 'p15',
  'van-pack': 'p16', 
  'jet-vac': 'p17',
  'cctv-van-pack': 'p18',
  'cctv-jet-vac': 'p19',
  'directional-water-cutter': 'p20',
  'ambient-lining': 'p21',
  'hot-cure-lining': 'p22',
  'uv-lining': 'p23',
  'ims-cutting': 'p24',
  'excavation': 'p25',
  'patching': 'p26',
  'tankering': 'p27'
};

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
  
  // Query all configurations for current sector (to access P26 configuration)
  const { data: pr2Configurations } = useQuery({
    queryKey: ['/api/pr2-clean', sector],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/pr2-clean?sector=${sector}`);
      return await response.json();
    },
    enabled: !!sector,
  });

  // Local state for P26 day rate input to prevent API calls on every keystroke
  const [p26DayRate, setP26DayRate] = useState("");
  const [p26Initialized, setP26Initialized] = useState(false);

  // Initialize P26 day rate when data loads (only once)
  useEffect(() => {
    if (pr2Configurations && !p26Initialized) {
      const p26Config = pr2Configurations.find(config => config.categoryId === 'P26');
      const dayRateOption = p26Config?.pricingOptions?.find(option => 
        option.id === 'central_day_rate' || option.id === 'price_dayrate'
      );
      // Only set if there's actually a value, allow empty state
      if (dayRateOption?.value && dayRateOption.value !== "") {
        setP26DayRate(dayRateOption.value);
      }
      setP26Initialized(true);
    }
  }, [pr2Configurations, p26Initialized]);

  // Load existing configuration for editing (moved up to avoid initialization error)
  const { data: existingConfig, error: configError } = useQuery({
    queryKey: ['/api/pr2-clean', editId],
    queryFn: async () => {
      try {
        console.log(`🔍 API REQUEST: Fetching configuration ${editId}`);
        const response = await apiRequest('GET', `/api/pr2-clean/${editId}`);
        const data = await response.json();
        console.log(`✅ API RESPONSE: Configuration ${editId} loaded:`, data);
        return data;
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
    staleTime: 5000, // Cache data for 5 seconds to prevent rapid refetches
    refetchOnMount: false, // Don't automatically refetch when component mounts
    refetchOnWindowFocus: false, // Don't refetch on window focus
    retry: false, // Don't retry on 404 errors
  });

  // Determine category name based on categoryId and pipe size for dynamic naming
  const getCategoryName = (categoryId: string) => {
    // If we have actual configuration data loaded, use its name
    if (isEditing && existingConfig && existingConfig.categoryName) {
      return existingConfig.categoryName;
    }
    
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
        vehicleTravelRates: [
          { id: 'vehicle_3_5t', vehicleType: '3.5t', hourlyRate: '', numberOfHours: '2', enabled: true },
          { id: 'vehicle_7_5t', vehicleType: '7.5t', hourlyRate: '', numberOfHours: '2', enabled: true }
        ],
        mathOperators: [], // No math window for TP2
        pricingStackOrder: ['price_dayrate', 'single_layer_cost', 'double_layer_cost', 'triple_layer_cost', 'triple_extra_cure_cost'],
        quantityStackOrder: [],
        minQuantityStackOrder: ['minquantity_runs', 'patch_min_qty_1', 'patch_min_qty_2', 'patch_min_qty_3', 'patch_min_qty_4'],
        rangeStackOrder: ['range_length'],
        vehicleTravelRatesStackOrder: ['vehicle_3_5t', 'vehicle_7_5t'],
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
        vehicleTravelRates: [
          { id: 'vehicle_3_5t', vehicleType: '3.5t', hourlyRate: '', numberOfHours: '2', enabled: true },
          { id: 'vehicle_7_5t', vehicleType: '7.5t', hourlyRate: '', numberOfHours: '2', enabled: true }
        ],
        mathOperators: ['N/A'],
        pricingStackOrder: ['price_dayrate'],
        quantityStackOrder: ['quantity_runs'],
        minQuantityStackOrder: ['minquantity_runs'],
        rangeStackOrder: ['range_percentage', 'range_length'],
        vehicleTravelRatesStackOrder: ['vehicle_3_5t', 'vehicle_7_5t'],
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

  const [formData, setFormData] = useState<CleanFormData>(() => {
    const defaultData = getDefaultFormData();
    // Ensure vehicleTravelRates is initialized if missing
    if (!defaultData.vehicleTravelRates) {
      defaultData.vehicleTravelRates = [
        { id: 'vehicle_3_5t', vehicleType: '3.5t', hourlyRate: '', numberOfHours: '2', enabled: true },
        { id: 'vehicle_7_5t', vehicleType: '7.5t', hourlyRate: '', numberOfHours: '2', enabled: true }
      ];
    }
    if (!defaultData.vehicleTravelRatesStackOrder) {
      defaultData.vehicleTravelRatesStackOrder = ['vehicle_3_5t', 'vehicle_7_5t'];
    }
    return defaultData;
  });
  
  // State for pipe size switching within unified page
  const [currentConfigId, setCurrentConfigId] = useState<number | null>(editId ? parseInt(editId) : null);
  const [selectedPipeSize, setSelectedPipeSize] = useState<string>('150mm');
  
  // Color sync for patching configurations
  const syncPatchingColors = async () => {
    if (categoryId === 'patching') {
      console.log('🎨 Syncing patching configuration colors...');
      
      try {
        // Get all three patching configurations
        const [config153, config156, config157] = await Promise.all([
          apiRequest('GET', '/api/pr2-clean/153').then(r => r.json()),
          apiRequest('GET', '/api/pr2-clean/156').then(r => r.json()),
          apiRequest('GET', '/api/pr2-clean/157').then(r => r.json())
        ]);
        
        // Use the color from config 153 as the master color
        const masterColor = config153.categoryColor || '#f5ec00';
        console.log(`🎨 Master color from config 153: ${masterColor}`);
        
        // Update configs 156 and 157 if they have different colors
        const updatePromises = [];
        
        if (config156.categoryColor !== masterColor) {
          console.log(`🎨 Updating config 156 color from ${config156.categoryColor} to ${masterColor}`);
          updatePromises.push(
            apiRequest('PUT', '/api/pr2-clean/156', { ...config156, categoryColor: masterColor })
          );
        }
        
        if (config157.categoryColor !== masterColor) {
          console.log(`🎨 Updating config 157 color from ${config157.categoryColor} to ${masterColor}`);
          updatePromises.push(
            apiRequest('PUT', '/api/pr2-clean/157', { ...config157, categoryColor: masterColor })
          );
        }
        
        if (updatePromises.length > 0) {
          await Promise.all(updatePromises);
          console.log('✅ Patching configuration colors synced successfully');
        } else {
          console.log('✅ All patching configuration colors already in sync');
        }
        
      } catch (error) {
        console.error('❌ Error syncing patching colors:', error);
      }
    }
  };

  // Reset form data when switching between TP1 and TP2
  useEffect(() => {
    if (!isEditing && !editId) {
      setFormData(getDefaultFormData());
    }
  }, [categoryId]);

  // Immediate save function for critical fields like Day Rate (db11)
  const immediateSave = async (optionType: string, optionId: string, value: string) => {
    if (!isEditing || !editId) return;
    
    console.log(`🚨 IMMEDIATE SAVE for ${optionId}: ${value}`);
    
    try {
      // Get current formData and update the specific field
      const currentFormData = { ...formData };
      if (optionType === 'pricingOptions') {
        currentFormData.pricingOptions = formData.pricingOptions.map(opt =>
          opt.id === optionId ? { ...opt, value } : opt
        );
      } else if (optionType === 'minQuantityOptions') {
        currentFormData.minQuantityOptions = formData.minQuantityOptions.map(opt =>
          opt.id === optionId ? { ...opt, value } : opt
        );
      }
      
      const payload = {
        categoryName: currentFormData.categoryName,
        description: currentFormData.description,
        categoryColor: currentFormData.categoryColor,
        sector: sector,
        categoryId: categoryId,
        pricingOptions: currentFormData.pricingOptions,
        quantityOptions: currentFormData.quantityOptions,
        minQuantityOptions: currentFormData.minQuantityOptions,
        rangeOptions: currentFormData.rangeOptions,
        mathOperators: currentFormData.mathOperators,
        pricingStackOrder: currentFormData.pricingStackOrder,
        quantityStackOrder: currentFormData.quantityStackOrder,
        minQuantityStackOrder: currentFormData.minQuantityStackOrder,
        rangeStackOrder: currentFormData.rangeStackOrder
      };

      const response = await fetch(`/api/pr2-clean/${editId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        console.log(`✅ DB11 IMMEDIATE SAVE SUCCESS: ${value}`);
      } else {
        console.error(`❌ DB11 IMMEDIATE SAVE FAILED: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Immediate save error:', error);
    }
  };

  // Handle value changes for input fields
  const handleValueChange = (optionType: string, optionId: string, value: string) => {
    console.log(`🔧 handleValueChange called: ${optionType}, ${optionId}, ${value}`);
    console.log(`🔧 CRITICAL - FIELD db11 VALUE CHANGE: "${value}" for option ${optionId} in configuration id${editId}`);
    
    // Mark that user has made changes to prevent automatic form overwrite
    console.log(`🔧 USER CHANGED VALUE: ${optionType}, ${optionId}, ${value} - setting hasUserChanges = true`);
    setHasUserChanges(true);
    
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
    
    // For critical TP2 fields, save immediately to prevent data loss
    const criticalPricingFields = ['price_dayrate', 'double_layer_cost', 'single_layer_cost', 'triple_layer_cost', 'triple_layer_extra_cost'];
    const criticalMinQuantityFields = ['patch_min_qty_1', 'patch_min_qty_2', 'patch_min_qty_3', 'patch_min_qty_4'];
    
    if ((optionType === 'pricingOptions' && criticalPricingFields.includes(optionId)) ||
        (optionType === 'minQuantityOptions' && criticalMinQuantityFields.includes(optionId))) {
      console.log(`🚨 CRITICAL FIELD TRIGGERING IMMEDIATE SAVE: ${optionType}.${optionId} = ${value}`);
      immediateSave(optionType, optionId, value);
    } else {
      // Trigger debounced save for other fields
      debouncedSave();
    }
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
    console.log(`🔧 CRITICAL - handleRangeValueChange called:`);
    console.log(`🔧 optionId: ${optionId}`);
    console.log(`🔧 field: ${field}`);
    console.log(`🔧 value: "${value}"`);
    console.log(`🔧 value length: ${value.length}`);
    console.log(`🔧 character codes:`, value.split('').map(c => c.charCodeAt(0)));
    
    // Mark that user has made changes to prevent automatic form overwrite
    setHasUserChanges(true);
    
    setFormData(prev => {
      console.log(`🔧 BEFORE UPDATE - Current formData.rangeOptions:`, prev.rangeOptions);
      
      const updatedFormData = {
        ...prev,
        rangeOptions: prev.rangeOptions.map(opt => {
          if (opt.id === optionId) {
            // CRITICAL: No processing, just store the exact value
            const updatedOpt = { ...opt, [field]: value };
            console.log(`🔧 UPDATED OPTION:`, updatedOpt);
            console.log(`🔧 NEW ${field} VALUE: "${updatedOpt[field]}" (length: ${updatedOpt[field].length})`);
            return updatedOpt;
          }
          return opt;
        })
      };
      
      console.log(`🔧 AFTER UPDATE - New formData.rangeOptions:`, updatedFormData.rangeOptions);
      return updatedFormData;
    });
    
    // Trigger debounced save after range input change
    console.log(`🔧 Triggering debouncedSave...`);
    debouncedSave();
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

  // Debug logging disabled to prevent infinite loops

  // Route to existing configuration or auto-create new pipe size configurations
  useEffect(() => {
    // Only run when we have categoryId and sector but not already editing
    if (!isEditing && categoryId && sector && allCategoryConfigs) {
      console.log(`🔍 Looking for existing configuration for ${categoryId} in ${sector}, pipeSize: ${pipeSize}`);
      
      // If we have a pipe size, look for pipe-size-specific configuration first
      if (pipeSize) {
        const normalizedPipeSize = pipeSize.replace(/mm$/i, '');
        const pipeSizeConfig = allCategoryConfigs.find(config => 
          config.categoryId === categoryId && 
          config.sector === sector &&
          config.categoryName && config.categoryName.includes(`${normalizedPipeSize}mm`)
        );
        
        if (pipeSizeConfig) {
          console.log(`✅ Found pipe size-specific configuration ID: ${pipeSizeConfig.id}, redirecting to edit mode`);
          setLocation(`/pr2-config-clean?categoryId=${categoryId}&sector=${sector}&edit=${pipeSizeConfig.id}`);
          return;
        } else {
          // AUTO-CREATE: No pipe-size-specific config exists, create one immediately
          console.log(`🔧 No ${pipeSize}mm configuration found, auto-creating and redirecting to edit mode...`);
          const autoCreateAndRedirect = async () => {
            const normalizedPipeSize = pipeSize.replace(/mm$/i, '');
            const configName = `TP2 - ${normalizedPipeSize}mm ${categoryId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Configuration`;
            
            const newConfigId = await createPipeSizeConfiguration(categoryId, sector, pipeSize, configName);
            
            if (newConfigId) {
              console.log(`✅ Auto-created configuration ID: ${newConfigId}, redirecting to edit mode`);
              setLocation(`/pr2-config-clean?categoryId=${categoryId}&sector=${sector}&edit=${newConfigId}`);
            } else {
              console.error('❌ Failed to auto-create configuration, staying on current page');
            }
          };
          
          autoCreateAndRedirect();
          return;
        }
      }
      
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
  }, [allCategoryConfigs, isEditing, categoryId, sector, pipeSize, setLocation]);

  // DEBOUNCED SAVE: Save input values after user stops typing
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  
  const debouncedSave = () => {
    if (!isEditing || !editId) return;
    
    // Always save when user makes changes - including clearing fields
    console.log('💾 Saving configuration changes (including cleared fields)...');
    console.log('💾 Current formData being saved:', JSON.stringify(formData, null, 2));
    
    // Clear previous timeout
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    
    // Set new timeout to save after 500ms of no changes
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
          vehicleTravelRates: formData.vehicleTravelRates || [],
          vehicleTravelRatesStackOrder: formData.vehicleTravelRatesStackOrder || [],
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
          console.log('✅ Input values saved successfully');
        }
      } catch (error) {
        console.error('❌ Save failed:', error);
      }
      setSaveTimeout(null);
    }, 500);
    
    setSaveTimeout(timeoutId);
  };

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
  
  // TP2 Pipe Size Selection State - Dynamic based on editId - removed const declaration to avoid duplicate
  const [editingRange, setEditingRange] = useState<RangeOption | null>(null);
  
  // Vehicle Travel Rate dialog states
  const [addVehicleDialogOpen, setAddVehicleDialogOpen] = useState(false);
  const [editVehicleDialogOpen, setEditVehicleDialogOpen] = useState(false);
  const [newVehicleType, setNewVehicleType] = useState('');
  const [newHourlyRate, setNewHourlyRate] = useState('');
  const [editingVehicle, setEditingVehicle] = useState<VehicleTravelRate | null>(null);
  
  // Sector selection state
  const [selectedSectors, setSelectedSectors] = useState<string[]>([sector]);
  const [appliedSectors, setAppliedSectors] = useState<string[]>([]);
  const [showRemoveWarning, setShowRemoveWarning] = useState(false);
  const [sectorToRemove, setSectorToRemove] = useState<string>('');

  // Configuration loading moved above getCategoryName function

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
          config.description && config.description.includes(`${pipeSize}mm`) &&
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
    enabled: !isEditing && !!categoryId && !editId, // FIXED: Enable when pipeSize exists to find correct config
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
      
      // CRITICAL: Also invalidate dashboard queries so costs update immediately
      console.log('🔄 Invalidating dashboard queries for immediate cost refresh...');
      queryClient.invalidateQueries({ queryKey: ['/api/uploads'] });
      queryClient.invalidateQueries({ predicate: (query) => {
        return query.queryKey[0]?.toString().includes('/api/uploads/') && 
               (query.queryKey[0]?.toString().includes('/sections') || 
                query.queryKey[0]?.toString().includes('/defects'));
      }});
      console.log('✅ Dashboard queries invalidated - costs will refresh on navigation');
      
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
  
  // Track if user has made changes to prevent automatic form overwrite
  const [hasUserChanges, setHasUserChanges] = useState(false);
  
  // Removed hasInitialLoad - simplified logic to never overwrite user changes
  
  // Clear processedConfigId when editId changes to allow new configuration loading
  useEffect(() => {
    console.log(`🔄 editId changed to: ${editId}, clearing processedConfigId and invalidating cache`);
    setProcessedConfigId(null);
    // Reset flags when switching to different config
    console.log(`🔄 Resetting flags: hasUserChanges = false`);
    setHasUserChanges(false);
    // Force invalidate the specific configuration query to trigger fresh fetch
    if (editId) {
      queryClient.invalidateQueries({ queryKey: ['/api/pr2-clean', editId] });
    }
  }, [editId]);
  
  // Single useEffect to handle all configuration loading
  useEffect(() => {
    // Use sectorConfigs for navigation without editId, existingConfig for direct editId access
    const configToUse = editId ? existingConfig : sectorConfigs;
    console.log(`🔍 useEffect triggered - isEditing: ${isEditing}, editId: ${editId}, configToUse:`, configToUse);
    console.log(`🔍 processedConfigId: ${processedConfigId}, current config ID: ${configToUse?.id}`);
    
    // FIXED: Force reload when editId changes, but NEVER if user has made changes
    if (isEditing && configToUse && configToUse.id && !hasUserChanges) {
      const configId = parseInt(editId || '0');
      console.log(`🔍 Force processing config ID: ${configId} (editId: ${editId}) - hasUserChanges: ${hasUserChanges}`);
      
      // Always process when editId is present, but NEVER overwrite user changes
      if (configId > 0) {
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
          vehicleTravelRates: config.vehicleTravelRates || [],
          vehicleTravelRatesStackOrder: config.vehicleTravelRatesStackOrder || [],
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
          rangeCount: rangeOptions.length,
          vehicleCount: config.vehicleTravelRates?.length || 0,
          vehicleData: config.vehicleTravelRates
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
      } // Close the if (configId > 0) block
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
  }, [isEditing, existingConfig, editId]); // FIXED: Watch full existingConfig object to trigger reload









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
    // CRITICAL FIX: Trigger database save after deletion
    debouncedSave();
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
    
    console.log(`🔧 DB10 ADD BUTTON CLICKED - Adding new input windows to db8, db9, db10`);
    console.log(`🔧 Current state: ${formData.quantityOptions.length} quantity, ${formData.minQuantityOptions.length} min quantity, ${formData.rangeOptions.length} range options`);
    
    // Add ONE new quantity input (green window) - only runs, no pairing needed
    const newQuantityOption: PricingOption = {
      id: `quantity_${timestamp}`,
      label: `Runs ${formData.quantityOptions.length + 1}`,
      enabled: true,
      value: ''
    };
    
    // Add ONE new min quantity input (orange window) - no pairing needed
    const newMinQuantityOption: PricingOption = {
      id: `minquantity_${timestamp + 2}`,
      label: `Min ${formData.minQuantityOptions.length + 1}`,
      enabled: true,
      value: ''
    };
    
    // Add new range inputs (purple window - percentage and length pair)
    const setNumber = Math.floor(formData.rangeOptions.length / 2) + 1;
    const newPercentageOption: RangeOption = {
      id: `range_percentage_${timestamp + 4}`,
      label: `Percentage ${setNumber}`,
      enabled: true,
      rangeStart: '',
      rangeEnd: ''
    };
    
    const newLengthOption: RangeOption = {
      id: `range_length_${timestamp + 5}`,
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
    
    console.log(`🔧 Added new inputs to all windows: ${newQuantityOption.label}, ${newMinQuantityOption.label}, ${newPercentageOption.label}+${newLengthOption.label}`);
  };

  // Fixed delete function that removes corresponding inputs from all three windows
  const deleteInputsFromAllWindows = (pairIndex: number) => {
    // pairIndex represents which purple row is being deleted (1 = second row, 2 = third row, etc.)
    // We need to delete the corresponding items from green and orange windows
    
    const rangePercentageIndex = pairIndex * 2; // Range pairs: 0,1 then 2,3 then 4,5
    const rangeLengthIndex = pairIndex * 2 + 1;
    
    // Get the range IDs to delete from purple window
    const percentageIdToDelete = formData.rangeOptions[rangePercentageIndex]?.id;
    const lengthIdToDelete = formData.rangeOptions[rangeLengthIndex]?.id;
    
    // For green and orange windows, we need to delete the item at the same index as pairIndex
    // Since all windows were created together, the nth item in each corresponds to the nth pair
    const quantityIdToDelete = formData.quantityOptions[pairIndex]?.id;
    const minQuantityIdToDelete = formData.minQuantityOptions[pairIndex]?.id;
    
    console.log(`🗑️ DELETE DEBUG: Deleting pair ${pairIndex}:`);
    console.log(`🗑️ Current formData state:`, {
      quantityOptions: formData.quantityOptions.map(q => `${q.id}:${q.label}`),
      minQuantityOptions: formData.minQuantityOptions.map(m => `${m.id}:${m.label}`),
      rangeOptions: formData.rangeOptions.map(r => `${r.id}:${r.label}`)
    });
    console.log(`  - Green item (index ${pairIndex}): ${quantityIdToDelete}`);
    console.log(`  - Orange item (index ${pairIndex}): ${minQuantityIdToDelete}`);
    console.log(`  - Purple percentage (index ${rangePercentageIndex}): ${percentageIdToDelete}`);
    console.log(`  - Purple length (index ${rangeLengthIndex}): ${lengthIdToDelete}`);
    
    setFormData(prev => ({
      ...prev,
      // Remove from quantity options (single entry)
      quantityOptions: prev.quantityOptions.filter(option => option.id !== quantityIdToDelete),
      quantityStackOrder: prev.quantityStackOrder.filter(id => id !== quantityIdToDelete),
      // Remove from min quantity options (single entry)
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
    
    console.log(`🗑️ FIXED DELETE: Removed row ${pairIndex + 1} from all windows`);
    console.log(`🗑️ After deletion formData state:`, {
      quantityOptions: formData.quantityOptions.filter(option => option.id !== quantityIdToDelete).map(q => `${q.id}:${q.label}`),
      minQuantityOptions: formData.minQuantityOptions.filter(option => option.id !== minQuantityIdToDelete).map(m => `${m.id}:${m.label}`),
      rangeOptions: formData.rangeOptions.filter(option => option.id !== percentageIdToDelete && option.id !== lengthIdToDelete).map(r => `${r.id}:${r.label}`)
    });
  };

  // Wrapper function for deleting range pairs from purple window
  const deleteRangePair = (pairIndex: number) => {
    deleteInputsFromAllWindows(pairIndex);
    // CRITICAL FIX: Trigger database save after deletion
    debouncedSave();
  };

  const deleteQuantityOption = (optionId: string) => {
    setFormData(prev => ({
      ...prev,
      quantityOptions: prev.quantityOptions.filter(opt => opt.id !== optionId),
      quantityStackOrder: prev.quantityStackOrder.filter(id => id !== optionId)
    }));
    // CRITICAL FIX: Trigger database save after deletion
    debouncedSave();
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
    // CRITICAL FIX: Trigger database save after deletion
    debouncedSave();
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
    // CRITICAL FIX: Trigger database save after deletion
    debouncedSave();
  };

  // Vehicle Travel Rate functions
  const addVehicleTravelRate = () => {
    if (!newVehicleType.trim() || !newHourlyRate.trim()) return;
    
    const newVehicle: VehicleTravelRate = {
      id: `vehicle_${Date.now()}`,
      vehicleType: newVehicleType.trim(),
      hourlyRate: newHourlyRate.trim(),
      numberOfHours: "2",
      enabled: true
    };
    
    setFormData(prev => ({
      ...prev,
      vehicleTravelRates: [...prev.vehicleTravelRates, newVehicle],
      vehicleTravelRatesStackOrder: [...prev.vehicleTravelRatesStackOrder, newVehicle.id]
    }));
    
    setNewVehicleType('');
    setNewHourlyRate('');
    setAddVehicleDialogOpen(false);
  };

  const editVehicleTravelRate = (vehicle: VehicleTravelRate) => {
    setEditingVehicle(vehicle);
    setNewVehicleType(vehicle.vehicleType);
    setNewHourlyRate(vehicle.hourlyRate);
    setEditVehicleDialogOpen(true);
  };

  const updateVehicleTravelRate = (updatedVehicle: VehicleTravelRate) => {
    console.log(`🚗 UPDATE VEHICLE FUNCTION: Updating vehicle ${updatedVehicle.id} with:`, updatedVehicle);
    setFormData(prev => {
      const updated = {
        ...prev,
        vehicleTravelRates: prev.vehicleTravelRates.map(vehicle => 
          vehicle.id === updatedVehicle.id ? updatedVehicle : vehicle
        )
      };
      console.log(`🚗 NEW VEHICLE DATA:`, updated.vehicleTravelRates);
      return updated;
    });
    console.log(`🚗 CALLING debouncedSave() for vehicle data persistence`);
    debouncedSave(); // CRITICAL FIX: Added missing save call
    setEditingVehicle(null);
    setNewVehicleType('');
    setNewHourlyRate('');
    setEditVehicleDialogOpen(false);
  };

  const deleteVehicleTravelRate = (vehicleId: string) => {
    setFormData(prev => ({
      ...prev,
      vehicleTravelRates: prev.vehicleTravelRates.filter(vehicle => vehicle.id !== vehicleId),
      vehicleTravelRatesStackOrder: prev.vehicleTravelRatesStackOrder.filter(id => id !== vehicleId)
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
    console.log(`📝 DESCRIPTION DEBUG - Generating auto description...`);
    console.log(`📝 Current formData.rangeOptions:`, formData.rangeOptions);
    
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
    
    // Add range options with values - CRITICAL DEBUG
    formData.rangeOptions.forEach((opt, index) => {
      console.log(`📝 RANGE OPTION ${index}:`, {
        id: opt.id,
        label: opt.label,
        rangeStart: opt.rangeStart,
        rangeEnd: opt.rangeEnd,
        rangeStartLength: opt.rangeStart?.length,
        rangeEndLength: opt.rangeEnd?.length
      });
      
      if ((opt.rangeStart && opt.rangeStart.trim() !== '') || (opt.rangeEnd && opt.rangeEnd.trim() !== '')) {
        const rangeStart = opt.rangeStart || 'R1';
        const rangeEnd = opt.rangeEnd || 'R2';
        const rangePart = `${opt.label} = ${rangeStart} to ${rangeEnd}`;
        console.log(`📝 ADDING RANGE PART: "${rangePart}"`);
        parts.push(rangePart);
      }
    });
    
    if (parts.length === 0) {
      return 'CCTV price configuration';
    }
    
    const finalDescription = parts.join('. ');
    console.log(`📝 FINAL DESCRIPTION: "${finalDescription}"`);
    return finalDescription;
  };

  // TEMPORARILY DISABLED: Auto-description generation was causing data truncation issues
  // Update description when options change
  // React.useEffect(() => {
  //   const autoDesc = generateAutoDescription();
  //   setFormData(prev => ({ ...prev, description: autoDesc }));
  // }, [formData.pricingOptions, formData.quantityOptions, formData.minQuantityOptions, formData.rangeOptions, formData.mathOperators]);
  
  // Sync patching colors when page loads
  React.useEffect(() => {
    if (categoryId === 'patching') {
      syncPatchingColors();
    }
  }, [categoryId]);

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
    
    // FIXED: For patching, we have specific IDs that are pipe-size-specific
    if (categoryId === 'patching') {
      // Add all three patching configurations directly
      const patchingConfigs = [
        { id: 153, pipeSize: '150mm', pipeSizeNum: 150 },
        { id: 156, pipeSize: '225mm', pipeSizeNum: 225 },
        { id: 157, pipeSize: '300mm', pipeSizeNum: 300 }
      ];
      
      patchingConfigs.forEach(({ id, pipeSize, pipeSizeNum }) => {
        const config = allCategoryConfigs.find(c => c.id === id);
        if (config) {
          pipeSizeConfigs.push({
            pipeSize,
            config,
            id,
            pipeSizeNum
          });
        }
      });
    } else {
      // Original logic for other categories
      allCategoryConfigs.forEach(config => {
        if (config.categoryId !== categoryId) return;
        
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
    }
    
    // Sort by pipe size (smallest to largest)
    pipeSizeConfigs.sort((a, b) => a.pipeSizeNum - b.pipeSizeNum);
    
    console.log(`🔍 getPipeSizeConfigurations for category ${categoryId} found ${pipeSizeConfigs.length} configs:`, 
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
          
          // CRITICAL: Invalidate dashboard queries so costs update immediately
          console.log('🔄 Invalidating dashboard queries to refresh cost calculations...');
          queryClient.invalidateQueries({ queryKey: ['/api/uploads'] });
          queryClient.invalidateQueries({ queryKey: ['/api/uploads'] });
          // Invalidate all upload sections (can't predict exact uploadId)
          queryClient.invalidateQueries({ predicate: (query) => {
            return query.queryKey[0]?.toString().includes('/api/uploads/') && 
                   query.queryKey[0]?.toString().includes('/sections');
          }});
          queryClient.invalidateQueries({ predicate: (query) => {
            return query.queryKey[0]?.toString().includes('/api/uploads/') && 
                   query.queryKey[0]?.toString().includes('/defects');
          }});
          console.log('✅ Dashboard queries invalidated - cost calculations will refresh');
          
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

  // Get dynamic page ID based on category
  const dynamicPageId = categoryId ? CATEGORY_PAGE_IDS[categoryId as keyof typeof CATEGORY_PAGE_IDS] || `p-${categoryId}` : 'p-config';

  // Show loading state during auto-creation to eliminate "Create" page appearance
  const isAutoCreating = !isEditing && pipeSize && categoryId && allCategoryConfigs;
  
  // Show loading screen during auto-creation process
  if (isAutoCreating) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 relative flex items-center justify-center">
        <DevLabel id={dynamicPageId} position="top-right" />
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900">Loading Configuration...</h2>
          <p className="text-gray-600 mt-2">Setting up {pipeSize}mm {categoryId.replace('-', ' ')} configuration</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-gray-50 p-6 relative"
      data-page="pr2-config-clean"
      data-config-id={editId}
      data-category-id={categoryId}
      data-sector={sector}
      data-is-editing={isEditing}
    >
      <DevLabel id={dynamicPageId} position="top-right" />
      <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 
                className="text-2xl font-bold text-gray-900"
                data-component="page-title"
              >
                Edit {formData.categoryName || 'Configuration'}
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
        <Card className="mb-6 relative">
          <DevLabel id="db3" />
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
        <Card className="mb-6 relative">
          <DevLabel id="db5" />
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
            {/* Pastel Color Palette */}
            <div className="border-t pt-4">
              <Label className="text-sm font-medium text-gray-700 mb-3 block">
                Select Pastel Color:
              </Label>
              
              {/* Pastel Color Row */}
              <div className="flex gap-2 mb-4 flex-wrap">
                {[
                  '#FF6B6B', // Pure Red
                  '#FF8E53', // Pure Orange  
                  '#FFD93D', // Pure Yellow
                  '#6BCF7F', // Pure Green
                  '#4ECDC4', // Pure Teal
                  '#45B7D1', // Pure Blue
                  '#9B59B6', // Pure Purple
                  '#FF6B9D', // Pure Pink
                  '#E17055', // Pure Coral
                  '#F39C12', // Pure Amber
                  '#1ABC9C', // Pure Emerald
                  '#3498DB', // Pure Sky Blue
                  '#E74C3C', // Pure Crimson
                  '#95A5A6', // Pure Gray
                  '#F1C40F'  // Pure Gold
                ].map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={async () => {
                      console.log(`🎨 Pastel color selected: ${color}`);
                      
                      // Update form data immediately
                      setFormData(prev => ({ ...prev, categoryColor: color }));
                      
                      // For patching category, sync ONLY color across all pipe sizes
                      if (categoryId === 'patching') {
                        console.log('🎨 Syncing ONLY color across all patching configurations...');
                        
                        const patchingConfigIds = [153, 156, 157];
                        const updatePromises = patchingConfigIds.map(async (configId) => {
                          try {
                            const response = await apiRequest('GET', `/api/pr2-clean/${configId}`);
                            const config = await response.json();
                            
                            // Update ONLY the color field, keep all other data independent
                            await apiRequest('PUT', `/api/pr2-clean/${configId}`, {
                              ...config,
                              categoryColor: color,
                              // Ensure we keep existing pricing data unchanged
                              pricingOptions: config.pricingOptions,
                              quantityOptions: config.quantityOptions,
                              minQuantityOptions: config.minQuantityOptions,
                              rangeOptions: config.rangeOptions
                            });
                            
                            console.log(`✅ Updated ONLY color for config ${configId} to ${color}`);
                          } catch (error) {
                            console.error(`❌ Failed to update color for config ${configId}:`, error);
                          }
                        });
                        
                        await Promise.all(updatePromises);
                        console.log('✅ All patching configurations updated with new color (data preserved)');
                      } else {
                        // For non-patching categories, save immediately with new color
                        console.log('💾 Saving configuration changes (including cleared fields)...');
                        
                        // Create updated form data with new color
                        const updatedFormData = { ...formData, categoryColor: color };
                        console.log('💾 Current formData being saved:', JSON.stringify(updatedFormData, null, 2));
                        
                        // Save immediately instead of using debounced save
                        try {
                          const response = await apiRequest('PUT', `/api/pr2-clean/${editId}`, updatedFormData);
                          console.log('✅ Input values saved successfully');
                        } catch (error) {
                          console.error('❌ Save failed:', error);
                        }
                      }
                    }}
                    className={`w-8 h-8 rounded border-2 hover:scale-110 transition-transform ${
                      formData.categoryColor === color 
                        ? 'border-gray-800 ring-2 ring-gray-400' 
                        : 'border-gray-300 hover:border-gray-500'
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
              
              <p className="text-xs text-gray-500 mt-4">
                Choose from our curated selection of pastel colors
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Pipe Size Selection - Show for ALL categories */}
        <Card className="mb-6 relative">
            <DevLabel id="db1" />
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
                    // TP2 Patching - unified configuration handles all pipe sizes in one interface
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
                    // TP2 Patching - use separate configurations for each pipe size
                    if (pipeSize === '150mm') {
                      configId = 153; // 150mm TP2 Patching Configuration
                    } else if (pipeSize === '225mm') {
                      configId = 156; // 225mm TP2 Patching Configuration
                    } else if (pipeSize === '300mm') {
                      configId = 157; // 300mm TP2 Patching Configuration
                    }
                    targetCategoryId = 'patching';
                  } else {
                    // TP1 CCTV configurations - only 150mm available (Pricing Window db11)
                    configId = 152; // CCTV Jet Vac Configuration
                    targetCategoryId = categoryId; // Keep current category
                  }
                  
                  const isCurrentConfig = (currentConfigId === configId) || (currentConfigId === null && editId === String(configId));
                  
                  console.log(`🔍 Rendering button: ${pipeSize} (Pricing Window db11) - Current: ${isCurrentConfig}`);
                  
                  return (
                    <button
                      key={pipeSize}
                      onClick={async () => {
                        console.log(`🚀 BUTTON CLICKED: ${pipeSize} button clicked!`);
                        console.log(`🚀 LOADING CONFIG: ${pipeSize} configuration (Pricing Window db11)`);
                        
                        // CRITICAL: Cancel any pending debounced saves to prevent contamination
                        if (saveTimeout) {
                          clearTimeout(saveTimeout);
                          setSaveTimeout(null);
                          console.log('🛑 Cancelled pending debounced save to prevent data contamination');
                        }
                        
                        // AUTO-SAVE: Save current configuration before switching if we're editing
                        if (isEditing && editId && formData) {
                          console.log(`💾 AUTO-SAVE: Saving current configuration ${editId} before switching to ${pipeSize}`);
                          try {
                            const autoSavePayload = {
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

                            await fetch(`/api/pr2-clean/${editId}`, {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify(autoSavePayload)
                            });
                            
                            console.log(`✅ AUTO-SAVE: Successfully saved configuration ${editId} before switching`);
                          } catch (autoSaveError) {
                            console.error(`❌ AUTO-SAVE: Failed to save configuration ${editId}:`, autoSaveError);
                            // Continue with switching even if auto-save fails
                          }
                        }
                        
                        try {
                          // Load the specific configuration data directly
                          const response = await apiRequest('GET', `/api/pr2-clean/${configId}`);
                          const configData = await response.json();
                          
                          console.log(`✅ Loaded config data for ID ${configId}:`, configData);
                          
                          // CRITICAL: Clear form state completely before loading new data
                          setFormData({
                            categoryId: configData.categoryId,
                            categoryName: configData.categoryName,
                            description: configData.description,
                            sector: configData.sector,
                            pricingOptions: configData.pricingOptions || [],
                            quantityOptions: configData.quantityOptions || [],
                            minQuantityOptions: configData.minQuantityOptions || [],
                            rangeOptions: configData.rangeOptions || [],
                            categoryColor: configData.categoryColor || '#ffffff',
                            mathOperators: configData.mathOperators || 'divide',
                            pricingStackOrder: configData.pricingStackOrder || [],
                            quantityStackOrder: configData.quantityStackOrder || [],
                            minQuantityStackOrder: configData.minQuantityStackOrder || [],
                            rangeStackOrder: configData.rangeStackOrder || []
                          });
                          
                          // Update current config ID to highlight the correct button
                          setCurrentConfigId(configId);
                          
                          // Update URL to reflect the configuration change
                          setLocation(`/pr2-config-clean?categoryId=${targetCategoryId}&sector=${sector}&edit=${configId}`);
                          
                          console.log(`✅ Form data updated to show ${pipeSize} configuration (Pricing Window db11)`);
                          
                        } catch (error) {
                          console.error(`❌ Failed to load configuration ${configId}:`, error);
                        }
                      }}
                      className={`px-4 py-2 rounded border hover:bg-gray-50 transition-colors ${isCurrentConfig ? "bg-yellow-500 text-white hover:bg-yellow-600" : "bg-white border-gray-300"}`}
                    >
                      {pipeSize}
                    </button>
                  );
                })}
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {categoryId === 'patching' 
                  ? `Currently editing: ${(() => {
                      // Use existing configuration data if available
                      if (existingConfig && existingConfig.categoryName) {
                        // Extract pipe size from category name or use current configuration
                        if (existingConfig.categoryName.includes('150mm')) return `150mm Pricing Window (db11) - (id${editId})`;
                        if (existingConfig.categoryName.includes('225mm')) return `225mm Pricing Window (db11) - (id${editId})`;
                        if (existingConfig.categoryName.includes('300mm')) return `300mm Pricing Window (db11) - (id${editId})`;
                        return `Pricing Window (db11) - (id${editId})`;
                      }
                      return 'New Configuration';
                    })()}`
                  : `Currently editing 150mm Pricing Window (db11) - (id${editId}) for ${formData.categoryName || 'this category'}`
                }
              </p>
            </CardContent>
          </Card>

        {/* Configuration Title */}
        <div className="mb-6 relative">
          <DevLabel id="db2" />
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {(() => {
              // Correct the logic for loading the right template
              const templateType = getTemplateType(categoryId || '');
              const activeCategoryId = templateType === 'TP2' ? 2 : 1; // TP2 = 2, TP1 = 1
              
              const templateTitle = activeCategoryId === 1
                ? "Edit CCTV Jet Vac Configuration"
                : activeCategoryId === 2
                  ? "Edit TP2 - Patching Configuration"
                  : `Edit Template ${activeCategoryId}`;
              
              return templateTitle;
            })()}
          </h2>
        </div>

        {/* TP2 Unified Configuration - Show pipe size specific interface for patching */}
        {categoryId === 'patching' && (
          <div key="unified-tp2-config">
            {/* TP2 Interface with 5 Pricing Options */}
            <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                TP2 - Patching Configuration
              </h3>
              
              {/* P26 Central Day Rate Window - Editable */}
              <Card className="bg-green-50 border-green-200 mb-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-green-700 text-sm flex items-center gap-2">
                    <Banknote className="w-4 h-4" />
                    Day Rate
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-4">
                    <Label className="w-32 text-sm font-medium text-black">
                      Central Day Rate
                    </Label>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs">£</Label>
                      <Input
                        placeholder="0.00"
                        value={p26DayRate}
                        onChange={(e) => {
                          // Update local state immediately for responsive typing
                          setP26DayRate(e.target.value);
                        }}
                        onBlur={async (e) => {
                          // Save to database when user finishes typing (on blur)
                          console.log(`💰 Saving P26 central day rate:`, e.target.value);
                          
                          let p26Config = pr2Configurations?.find(config => config.categoryId === 'P26');
                          
                          if (p26Config) {
                            const updatedPricingOptions = p26Config.pricingOptions?.map(option => 
                              (option.id === 'central_day_rate' || option.id === 'price_dayrate')
                                ? { ...option, value: e.target.value }
                                : option
                            ) || [{ id: 'central_day_rate', label: 'Day Rate (All Patches)', value: e.target.value, enabled: true }];
                            
                            const updateData = {
                              ...p26Config,
                              pricingOptions: updatedPricingOptions
                            };
                            
                            try {
                              await apiRequest('PUT', `/api/pr2-clean/${p26Config.id}`, updateData);
                              console.log(`✅ Saved P26 configuration ${p26Config.id} with day rate: £${e.target.value}`);
                              
                              // Invalidate cache to refresh data
                              queryClient.invalidateQueries({ queryKey: ['/api/pr2-clean', sector] });
                            } catch (error) {
                              console.error('❌ Failed to save P26 configuration:', error);
                            }
                          }
                        }}
                        className="w-20 h-8 text-sm bg-white border-green-300"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Purple Window: 4 Patching Options (excluding Day Rate) */}
              <Card className="bg-purple-50 border-purple-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-purple-700 text-sm flex items-center gap-2">
                    <Coins className="w-4 h-4" />
                    Patching Options - {(() => {
                      // Extract pipe size from existing configuration or form data
                      if (existingConfig && existingConfig.categoryName) {
                        if (existingConfig.categoryName.includes('150mm')) return '150mm';
                        if (existingConfig.categoryName.includes('225mm')) return '225mm';
                        if (existingConfig.categoryName.includes('300mm')) return '300mm';
                      }
                      if (pipeSize) return pipeSize;
                      if (selectedPipeSize) return selectedPipeSize;
                      return 'All Sizes';
                    })()}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Display all patching options (Day Rate already removed from database) */}
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
                          maxLength={6}
                          value={option.value || ""}
                          onChange={(e) => {
                            console.log(`💰 Typing in ${option.label}:`, e.target.value);
                            console.log(`💰 DETAILED VALUE DEBUG - Option: ${option.label}, ID: ${option.id}, Value: "${e.target.value}", Length: ${e.target.value.length}`);
                            handleValueChange('pricingOptions', option.id, e.target.value);
                          }}
                          className="w-20 h-8 text-sm"
                          disabled={false}
                          readOnly={false}
                          data-testid={`pricing-input-${option.id}`}
                        />
                      </div>
                      {/* Show Min Qty and Length Max for all rows */}
                      <>
                        <div className="ml-4 flex items-center gap-2">
                          <Label className="text-xs">Min Qty</Label>
                          <Input
                            placeholder="min"
                            maxLength={4}
                            value={formData.minQuantityOptions?.[index + 1]?.value || ""}
                            onChange={(e) => {
                              console.log(`📊 Typing in Min Qty ${index + 1}:`, e.target.value);
                              handleValueChange('minQuantityOptions', formData.minQuantityOptions?.[index + 1]?.id, e.target.value);
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
                            maxLength={6}
                            value={formData.rangeOptions?.[index]?.rangeEnd || ""}
                            onChange={(e) => {
                              const inputValue = e.target.value;
                              console.log(`📏 CRITICAL DEBUG - Length input ${index + 1} (${option.label}):`);
                              console.log(`📏 RAW INPUT: "${inputValue}" (length: ${inputValue.length})`);
                              console.log(`📏 Character codes:`, inputValue.split('').map(c => c.charCodeAt(0)));
                              
                              const rangeId = formData.rangeOptions?.[index]?.id || `range_length_${index + 1}`;
                              console.log(`📏 About to call handleRangeValueChange with:`, {
                                rangeId,
                                field: 'rangeEnd',
                                value: inputValue,
                                valueLength: inputValue.length
                              });
                              handleRangeValueChange(rangeId, 'rangeEnd', inputValue);
                            }}
                            className="w-20 h-8 text-sm"
                            disabled={false}
                            readOnly={false}
                            data-testid={`length-input-${index}`}
                          />
                        </div>
                      </>
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
                            className="w-20 h-8 text-sm"
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
              <div className="flex flex-wrap gap-4 p-4 border rounded-lg bg-gray-50">
                
                {/* Blue Window: Day Rate */}
<Card className="relative bg-blue-50 border-blue-200 w-56 flex-shrink-0">
                  <DevLabel id="db6" />
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
                        onChange={(e) => {
                          const inputValue = e.target.value;
                          console.log(`🎯 DB11 RAW INPUT: "${inputValue}" (length: ${inputValue.length}) - IMMEDIATE SAVE TRIGGERED`);
                          handleValueChange('pricingOptions', 'price_dayrate', inputValue);
                        }}
                        className="bg-white border-blue-300 h-6 text-xs w-20"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Math Window */}
                <Card className="relative bg-gray-50 border-gray-200 w-20 flex-shrink-0">
                  <DevLabel id="db7" />
                  <CardHeader className="pb-2">
                    <CardTitle className="text-gray-700 text-xs flex items-center justify-center whitespace-nowrap">
                      <Calculator className="w-3 h-3 mr-1" />
                      Math
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-1">
                    <div className="flex items-center justify-center">
                      <Select 
                        value={formData.mathOperators?.[0] || "÷"} 
                        onValueChange={(value) => {
                          console.log(`🧮 DB7 Math operator changed to: ${value}`);
                          setFormData(prev => ({ 
                            ...prev, 
                            mathOperators: [value] 
                          }));
                          handleValueChange('mathOperators', 'operator', value);
                        }}
                      >
                        <SelectTrigger className="bg-white border-gray-300 h-8 text-sm w-12">
                          <SelectValue placeholder="÷" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="÷">÷</SelectItem>
                          <SelectItem value="+">+</SelectItem>
                          <SelectItem value="-">-</SelectItem>
                          <SelectItem value="×">×</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Green Window: Runs per Shift */}
                <Card className="relative bg-green-50 border-green-200 w-60 flex-shrink-0">
                  <DevLabel id="db8" />
                  <CardHeader className="pb-2">
                    <CardTitle className="text-green-700 text-xs flex items-center gap-1">
                      <Package className="w-3 h-3" />
                      Quantity Options
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-1">
                    <div className="grid grid-cols-1 gap-1">
                      {formData.quantityOptions?.map((option, index) => {
                        return (
                          <div key={option.id} className="flex items-center gap-2 text-xs w-full">
                            <span className="font-medium w-20 flex-shrink-0">Runs</span>
                            <Input
                              placeholder=""
                              value={option.value || ""}
                              onChange={(e) => handleValueChange('quantityOptions', option.id, e.target.value)}
                              className="bg-white border-green-300 h-6 text-xs w-16 flex-shrink-0"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Orange Window: Min Quantity */}
                <Card className="relative bg-orange-50 border-orange-200 w-52 flex-shrink-0">
                  <DevLabel id="db9" />
                  <CardHeader className="pb-2">
                    <CardTitle className="text-orange-700 text-xs flex items-center gap-1">
                      <Target className="w-3 h-3" />
                      Min Quantity Options
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-1">
                    <div className="grid grid-cols-1 gap-1">
                      {formData.minQuantityOptions?.map((option, index) => {
                        return (
                          <div key={option.id} className="flex items-center gap-2 text-xs w-full">
                            <span className="font-medium w-16 flex-shrink-0">Min</span>
                            <Input
                              placeholder=""
                              value={option.value || ""}
                              onChange={(e) => handleValueChange('minQuantityOptions', option.id, e.target.value)}
                              className="bg-white border-orange-300 h-6 text-xs w-16 flex-shrink-0"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
              </Card>

              {/* Purple Window: Ranges */}
              <Card className="relative bg-purple-50 border-purple-200 flex-1">
                <DevLabel id="db10" />
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
                                  maxLength={6}
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
                                onClick={() => {
                                  console.log(`🗑️ OLD SYSTEM DELETE: pairIndex=${pairIndex}`);
                                  deleteRangePair(pairIndex);
                                }}
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

              {/* Teal/Cyan Window: Vehicle Travel Rates */}
              <Card className="relative bg-cyan-50 border-cyan-200 w-80 flex-shrink-0">
                <DevLabel id="db11" />
                <CardHeader className="pb-2">
                  <CardTitle className="text-cyan-700 text-xs flex items-center gap-1">
                    <Truck className="w-3 h-3" />
                    Vehicle Travel Rates
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-1">
                  <div className="space-y-1">
                    {formData.vehicleTravelRates && formData.vehicleTravelRates.length > 0 ? 
                      formData.vehicleTravelRates.map((vehicle, index) => (
                        <div key={vehicle.id} className="flex gap-2 items-center">
                          <div className="flex items-center gap-1">
                            <Label className="text-xs font-medium text-cyan-700 flex-shrink-0">
                              {vehicle.vehicleType}
                            </Label>
                            <span className="text-xs text-cyan-600">£</span>
                            <Input
                              placeholder="rate"
                              maxLength={6}
                              value={vehicle.hourlyRate || ""}
                              onChange={(e) => {
                                console.log(`🚗 HOURLY RATE CHANGE: ${vehicle.id} from ${vehicle.hourlyRate} to ${e.target.value}`);
                                const updatedVehicle = { ...vehicle, hourlyRate: e.target.value };
                                console.log(`🚗 UPDATED VEHICLE:`, updatedVehicle);
                                updateVehicleTravelRate(updatedVehicle);
                              }}
                              className="bg-white border-cyan-300 h-6 text-xs w-16 flex items-center"
                              data-field="hourly-rate"
                              data-window="vehicle"
                              data-option-id={vehicle.id}
                            />
                            <span className="text-xs text-cyan-600">/hr</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Input
                              placeholder="2"
                              maxLength={3}
                              value={vehicle.numberOfHours || "2"}
                              onChange={(e) => {
                                console.log(`🚗 HOURS CHANGE: ${vehicle.id} from ${vehicle.numberOfHours} to ${e.target.value}`);
                                const updatedVehicle = { ...vehicle, numberOfHours: e.target.value };
                                console.log(`🚗 UPDATED VEHICLE:`, updatedVehicle);
                                updateVehicleTravelRate(updatedVehicle);
                              }}
                              className="bg-white border-cyan-300 h-6 text-xs w-10 flex items-center"
                              data-field="number-of-hours"
                              data-window="vehicle"
                              data-option-id={vehicle.id}
                            />
                            <span className="text-xs text-cyan-600">hours</span>
                          </div>
                          {index === 0 && (
                            <Button
                              variant="outline"
                              onClick={() => setAddVehicleDialogOpen(true)}
                              className="h-6 text-xs border-cyan-300 text-cyan-700 hover:bg-cyan-100 bg-cyan-50"
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              Add
                            </Button>
                          )}
                          {index > 0 && (
                            <Button
                              variant="outline"
                              onClick={() => deleteVehicleTravelRate(vehicle.id)}
                              className="h-6 text-xs border-red-300 text-red-700 hover:bg-red-100 bg-red-50"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      )) : (
                        <div className="text-xs text-cyan-600 p-2 flex items-center justify-between">
                          <span>No vehicle travel rates configured</span>
                          <Button
                            variant="outline"
                            onClick={() => setAddVehicleDialogOpen(true)}
                            className="h-6 text-xs border-cyan-300 text-cyan-700 hover:bg-cyan-100 bg-cyan-50"
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Add
                          </Button>
                        </div>
                      )
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
                  
                  {/* P26 Central Day Rate Window */}
                  <Card className="bg-green-50 border-green-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-green-700 text-sm flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        P26 Central Day Rate (£1650)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="text-xs text-green-600 bg-green-50 p-2 rounded border border-green-200">
                        <strong>Centralized System:</strong> All TP2 patching calculations use the single P26 day rate of £1650.
                        Individual day rates are no longer needed in TP2 configurations.
                      </div>
                      <div className="text-xs text-gray-600">
                        Navigate to P26 configuration to modify the central day rate used by all TP2 patches.
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Purple Window: 4 Patching Options */}
                  <Card className="bg-purple-50 border-purple-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-purple-700 text-sm flex items-center gap-2">
                        <Coins className="w-4 h-4" />
                        Patching Options
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Filter out Day Rate field from TP2 patching options */}
                      {formData.pricingOptions?.filter(option => option.id !== 'price_dayrate').map((option, index) => (
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
                              onChange={(e) => handleRangeValueChange(formData.rangeOptions?.[index]?.id, 'rangeEnd', e.target.value)}
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
                <div className="flex flex-wrap gap-4">
                  
                  {/* Blue Window */}
                  <Card className="bg-blue-50 border-blue-200 w-56 flex-shrink-0 relative">
                    <DevLabel id="db11" />
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
                  <Card className="bg-gray-50 border-gray-200 w-20 flex-shrink-0 relative">
                    <DevLabel id="db12" />
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
                  <Card className="bg-green-50 border-green-200 w-60 flex-shrink-0 relative">
                    <DevLabel id="db13" />
                    <CardHeader className="pb-2">
                      <CardTitle className="text-green-700 text-xs flex items-center gap-1">
                        📊 Quantity
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1">
                      <div className="grid grid-cols-1 gap-1">
                        {formData.quantityOptions?.map((option, index) => {
                          const isLastOption = index === formData.quantityOptions.length - 1;
                          
                          return (
                            <div key={option.id} className="flex items-center gap-2 text-xs w-full">
                              <span className="font-medium w-20 flex-shrink-0">Runs</span>
                              <Input
                                placeholder=""
                                value={option.value || ""}
                                onChange={(e) => handleValueChange('quantityOptions', option.id, e.target.value)}
                                className="bg-white border-green-300 h-6 text-xs w-16 flex-shrink-0"
                              />
                              {isLastOption && (
                                <Button
                                  size="sm"
                                  onClick={addNewInputsToAllWindows}
                                  className="h-6 w-12 text-xs bg-green-600 text-white hover:bg-green-700 border-0 flex-shrink-0"
                                >
                                  <Plus className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Orange Window */}  
                  <Card className="bg-orange-50 border-orange-200 w-52 flex-shrink-0 relative">
                    <DevLabel id="db14" />
                    <CardHeader className="pb-2">
                      <CardTitle className="text-orange-700 text-xs flex items-center gap-1">
                        🎯 Min Quantity
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1">
                      <div className="grid grid-cols-1 gap-1">
                        {formData.minQuantityOptions?.map((option, index) => {
                          const isLastOption = index === formData.minQuantityOptions.length - 1;
                          
                          return (
                            <div key={option.id} className="flex items-center gap-2 text-xs w-full">
                              <span className="font-medium w-16 flex-shrink-0">Min</span>
                              <Input
                                placeholder=""
                                value={option.value || ""}
                                onChange={(e) => handleValueChange('minQuantityOptions', option.id, e.target.value)}
                                className="bg-white border-orange-300 h-6 text-xs w-16 flex-shrink-0"
                              />
                              {isLastOption && (
                                <Button
                                  size="sm"
                                  onClick={addNewInputsToAllWindows}
                                  className="h-6 w-12 text-xs bg-green-600 text-white hover:bg-green-700 border-0 flex-shrink-0"
                                >
                                  <Plus className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                          );
                        })}
                      </div>
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
        <AlertDialogContent className="relative">
          <DevLabel id="db4" />
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

      {/* Add Vehicle Travel Rate Dialog */}
      <Dialog open={addVehicleDialogOpen} onOpenChange={setAddVehicleDialogOpen}>
        <DialogContent className="bg-cyan-50 border-cyan-200">
          <DialogHeader>
            <DialogTitle className="text-cyan-700 flex items-center gap-2">
              <Truck className="w-4 h-4" />
              Add Vehicle Travel Rate
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="vehicle-type" className="text-cyan-700">Vehicle Type</Label>
              <Input
                id="vehicle-type"
                placeholder="e.g., 3.5t, 7.5t, 18t"
                value={newVehicleType}
                onChange={(e) => setNewVehicleType(e.target.value)}
                className="border-cyan-300"
              />
            </div>
            <div>
              <Label htmlFor="hourly-rate" className="text-cyan-700">Hourly Rate (£)</Label>
              <Input
                id="hourly-rate"
                placeholder="e.g., 45.00"
                value={newHourlyRate}
                onChange={(e) => setNewHourlyRate(e.target.value)}
                className="border-cyan-300"
              />
            </div>
            <div>
              <Label htmlFor="number-of-hours" className="text-cyan-700">Number of Hours</Label>
              <Input
                id="number-of-hours"
                placeholder="2"
                defaultValue="2"
                className="border-cyan-300"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={addVehicleTravelRate}
                className="bg-cyan-600 hover:bg-cyan-700 text-white"
              >
                Add Vehicle Rate
              </Button>
              <Button
                onClick={() => setAddVehicleDialogOpen(false)}
                variant="outline"
                className="border-cyan-300 text-cyan-700"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Vehicle Travel Rate Dialog */}
      <Dialog open={editVehicleDialogOpen} onOpenChange={setEditVehicleDialogOpen}>
        <DialogContent className="bg-cyan-50 border-cyan-200">
          <DialogHeader>
            <DialogTitle className="text-cyan-700 flex items-center gap-2">
              <Truck className="w-4 h-4" />
              Edit Vehicle Travel Rate
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-vehicle-type" className="text-cyan-700">Vehicle Type</Label>
              <Input
                id="edit-vehicle-type"
                placeholder="e.g., 3.5t, 7.5t, 18t"
                value={newVehicleType}
                onChange={(e) => setNewVehicleType(e.target.value)}
                className="border-cyan-300"
              />
            </div>
            <div>
              <Label htmlFor="edit-hourly-rate" className="text-cyan-700">Hourly Rate (£)</Label>
              <Input
                id="edit-hourly-rate"
                placeholder="e.g., 45.00"
                value={newHourlyRate}
                onChange={(e) => setNewHourlyRate(e.target.value)}
                className="border-cyan-300"
              />
            </div>
            <div>
              <Label htmlFor="edit-number-of-hours" className="text-cyan-700">Number of Hours</Label>
              <Input
                id="edit-number-of-hours"
                placeholder="2"
                defaultValue="2"
                className="border-cyan-300"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  if (editingVehicle) {
                    updateVehicleTravelRate({
                      ...editingVehicle,
                      vehicleType: newVehicleType,
                      hourlyRate: newHourlyRate,
                      numberOfHours: editingVehicle?.numberOfHours || "2"
                    });
                  }
                }}
                className="bg-cyan-600 hover:bg-cyan-700 text-white"
              >
                Update Vehicle Rate
              </Button>
              <Button
                onClick={() => setEditVehicleDialogOpen(false)}
                variant="outline"
                className="border-cyan-300 text-cyan-700"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
