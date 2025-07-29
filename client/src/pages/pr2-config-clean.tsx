import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

import { ChevronLeft, Calculator, Coins, Package, Gauge, Zap, Ruler, ArrowUpDown, Edit2, Trash2, ArrowUp, ArrowDown, BarChart3, Building, Building2, Car, ShieldCheck, HardHat, Users, Settings, ChevronDown, Save, Lock, Unlock, Target, Plus, DollarSign, Hash, TrendingUp, Truck, Banknote, Scissors, AlertTriangle, RotateCcw, X, Wrench, Shield } from 'lucide-react';
import { DevLabel } from '@/utils/DevLabel';
import { TP1Template } from '@/components/TP1Template';
import { MMP1Template } from '@/components/MMP1Template';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
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
  pipeSize: string;
  
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

// Pipe sizes configuration
const PIPE_SIZES = ['100', '125', '150', '175', '200', '225', '250', '275', '300', '350', '375', '400', '450', '500', '525', '600', '675', '750', '825', '900', '975', '1050', '1200', '1350', '1500'];

// Sector definitions
const SECTORS = [
  { id: 'utilities', name: 'Utilities', label: 'Utilities', description: 'Water and utility infrastructure projects', icon: Building, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  { id: 'adoption', name: 'Adoption', label: 'Adoption', description: 'New infrastructure adoption and inspection', icon: Building2, color: 'text-teal-600', bgColor: 'bg-teal-50' },
  { id: 'highways', name: 'Highways', label: 'Highways', description: 'Road and highway drainage systems', icon: Car, color: 'text-orange-600', bgColor: 'bg-orange-50' },
  { id: 'insurance', name: 'Insurance', label: 'Insurance', description: 'Insurance claims and assessment work', icon: ShieldCheck, color: 'text-red-600', bgColor: 'bg-red-50' },
  { id: 'construction', name: 'Construction', label: 'Construction', description: 'Construction site and development projects', icon: HardHat, color: 'text-cyan-600', bgColor: 'bg-cyan-50' },
  { id: 'domestic', name: 'Domestic', label: 'Domestic', description: 'Residential and domestic drainage work', icon: Users, color: 'text-amber-600', bgColor: 'bg-amber-50' }
];

// 🔒🔒🔒 MMP1 TEMPLATE PROTECTED ZONE - DO NOT MODIFY WITHOUT USER PERMISSION 🔒🔒🔒
// ⚠️ WARNING: USER-CONTROLLED TEMPLATE - AI MODIFICATIONS PROHIBITED ⚠️
// MMP1 ID definitions (ID1-ID6 following P002 pattern)
const MMP1_IDS = [
  { id: 'id1', name: 'ID1', label: 'ID1', description: 'Configuration template 1', icon: Building, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  { id: 'id2', name: 'ID2', label: 'ID2', description: 'Configuration template 2', icon: Building2, color: 'text-green-600', bgColor: 'bg-green-50' },
  { id: 'id3', name: 'ID3', label: 'ID3', description: 'Configuration template 3', icon: Car, color: 'text-orange-600', bgColor: 'bg-orange-50' },
  { id: 'id4', name: 'ID4', label: 'ID4', description: 'Configuration template 4', icon: ShieldCheck, color: 'text-red-600', bgColor: 'bg-red-50' },
  { id: 'id5', name: 'ID5', label: 'ID5', description: 'Configuration template 5', icon: HardHat, color: 'text-purple-600', bgColor: 'bg-purple-50' },
  { id: 'id6', name: 'ID6', label: 'ID6', description: 'Configuration template 6', icon: Users, color: 'text-teal-600', bgColor: 'bg-teal-50' }
];

// P26 Upper Level Data Structure
// REMOVED - Now using database queries directly

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
  'robotic-cutting': 'p4', // TP3 Template - ID4 Robotic Cutting
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

// Define SECTOR_OPTIONS based on SECTORS array
const SECTOR_OPTIONS = SECTORS;

// Color options for P006a templates
const COLOR_OPTIONS = [
  { name: 'Blue', hex: '#3b82f6' },
  { name: 'Green', hex: '#10b981' },
  { name: 'Purple', hex: '#8b5cf6' },
  { name: 'Red', hex: '#ef4444' },
  { name: 'Orange', hex: '#f97316' },
  { name: 'Yellow', hex: '#eab308' },
  { name: 'Pink', hex: '#ec4899' },
  { name: 'Indigo', hex: '#6366f1' },
  { name: 'Teal', hex: '#14b8a6' },
  { name: 'Cyan', hex: '#06b6d4' },
  { name: 'Gray', hex: '#6b7280' },
  { name: 'Black', hex: '#1f2937' }
];

export default function PR2ConfigClean() {
  const [location, setLocation] = useLocation();

  
  // Get URL parameters safely using window.location.search
  const searchParams = window.location.search;
  const urlParams = new URLSearchParams(searchParams);
  
  const sector = urlParams.get('sector') || 'utilities';
  const categoryId = urlParams.get('categoryId');
  const editId = urlParams.get('edit') || urlParams.get('editId') || urlParams.get('id'); // Support auto-detection ID
  const pipeSize = urlParams.get('pipeSize') || urlParams.get('pipe_size');
  const configName = urlParams.get('configName');
  const sourceItemNo = urlParams.get('itemNo');
  const selectedOptionId = urlParams.get('selectedOption'); // Track which option is selected for editing
  const selectedId = urlParams.get('selectedId'); // Track MMP1 ID selection from dashboard (id1, id2, etc.)
  const isEditing = !!editId;
  
  // Determine template type based on category
  const getTemplateType = (categoryId: string): 'TP1' | 'P26' | 'P006' | 'P006a' | 'MMP1' => {
    if (categoryId === 'cart-card') {
      return 'TP1'; // Cart card uses standard TP1 template with full interface
    } else if (categoryId === 'day-rate-db11') {
      return 'P26'; // P26 - Day Rate central configuration with multiple pipe sizes
    } else if (categoryId?.startsWith('P006-')) {
      return 'P006'; // Original P006 CTF templates with 4-window structure
    } else if (categoryId === 'test-card' || categoryId === 'cctv-jet-vac') {
      return 'MMP1'; // Test Card and CCTV/Jet Vac use new MMP1 template with 5 placeholder UI cards
    } else if (categoryId?.includes('-p006a') || 
               categoryId === 'cctv' || 
               categoryId === 'van-pack' || 
               categoryId === 'jet-vac' || 
               categoryId === 'cctv-van-pack' || 
               categoryId === 'cctv-jet-vac' || // F175 - CCTV Jet Vac Configuration
               categoryId === 'cctv-cleansing-root-cutting') {
      return 'P006a'; // P006a templates use full F175-style interface with W020/C029/W007
    } else {
      return 'TP1'; // All other categories use standard TP1 template
    }
  };

  // Get all configurations for this category to detect existing pipe sizes (moved here for proper initialization order)
  const { data: allCategoryConfigs } = useQuery({
    queryKey: ['/api/pr2-clean', 'category', categoryId, 'all-sectors'],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/pr2-clean?categoryId=${categoryId}`);
      return response.json();
    },
    enabled: !!categoryId,
  });
  
  // Query all configurations for current sector (P26 removed - using DB7 Math window)
  const { data: pr2Configurations } = useQuery({
    queryKey: ['/api/pr2-clean', sector],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/pr2-clean?sector=${sector}`);
      return await response.json();
    },
    enabled: !!sector,
  });

  // P26 system removed - using DB7 Math window for minimum quantity calculations

  // P26 initialization removed - system now uses DB7 Math window

  // Load existing configuration for editing (moved up to avoid initialization error)
  const { data: existingConfig, error: configError } = useQuery({
    queryKey: ['/api/pr2-clean', editId],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', `/api/pr2-clean/${editId}`);
        const data = await response.json();
        return data;
      } catch (error: any) {
        // If configuration not found (404), redirect to create mode
        if (error.message && error.message.includes('404')) {
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
      return decodeURIComponent(configName).replace('TP1 - ', '').replace('', '');
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
        'patching-p006a': `${formattedSize} Patching Configuration`,
        'robotic-cutting': `${formattedSize} Robotic Cutting Configuration`, // TP3 Template
        'day-rate-db11': `${formattedSize} P26 Day Rate Configuration`, // P26 Template
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
      'patching-p006a': 'Patching Configuration',
      'robotic-cutting': 'Robotic Cutting Configuration', // TP3 Template
      'day-rate-db11': 'P26 - Day Rate Configuration', // P26 Template
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



  // Clean form state with default options initialized - different for TP1 vs TP3
  const getDefaultFormData = () => {
    const templateType = getTemplateType(categoryId || '');
    
    if (templateType === 'P26') {
      // P26 - Day Rate Configuration with Multiple Pipe Sizes and DB15 component
      return {
        categoryName: categoryId ? getCategoryName(categoryId) : '',
        description: '',
        categoryColor: '#ffffff', // Default white color - user must assign color
        pipeSize: pipeSize || '',
        
        // Blue Window - Central Day Rate for all pipe sizes
        pricingOptions: [
          { id: 'central_day_rate', label: 'Central Day Rate', enabled: true, value: '1650' },
          { id: 'db7_day_rate', label: 'DB7 Day Rate', enabled: true, value: '1650' }
        ],
        
        // Green Window - Multiple pipe size configurations
        quantityOptions: [
          { id: '100mm_day_rate', label: '100mm Day Rate', enabled: true, value: '' },
          { id: '150mm_day_rate', label: '150mm Day Rate', enabled: true, value: '' },
          { id: '200mm_day_rate', label: '200mm Day Rate', enabled: true, value: '' },
          { id: '225mm_day_rate', label: '225mm Day Rate', enabled: true, value: '' },
          { id: '300mm_day_rate', label: '300mm Day Rate', enabled: true, value: '' }
        ],
        
        // Orange Window - Min Quantity Options (empty for P26)
        minQuantityOptions: [],
        
        // Purple Window - Range Options (empty for P26)  
        rangeOptions: [],
        
        // DB15 Window (Teal) - Vehicle Travel Rates (like P19)
        vehicleTravelRates: [
          { id: 'vehicle_3_5t', vehicleType: '3.5t', hourlyRate: '55', numberOfHours: '2', enabled: true },
          { id: 'vehicle_26t', vehicleType: '26t', hourlyRate: '75', numberOfHours: '2', enabled: true }
        ],
        
        mathOperators: ['N/A'], // No math operations for P26
        pricingStackOrder: ['central_day_rate', 'db7_day_rate'],
        quantityStackOrder: ['100mm_day_rate', '150mm_day_rate', '200mm_day_rate', '225mm_day_rate', '300mm_day_rate'],
        minQuantityStackOrder: [],
        rangeStackOrder: [],
        vehicleTravelRatesStackOrder: ['vehicle_3_5t', 'vehicle_26t'],
        sector
      };
    } else {
      // TP1 - Standard Configuration (all windows)
      return {
        categoryName: categoryId ? getCategoryName(categoryId) : '',
        description: '',
        categoryColor: '#ffffff', // Default white color - user must assign color
        pipeSize: pipeSize || '',
        pricingOptions: [
          { id: 'price_dayrate', label: 'Day Rate', enabled: true, value: '' }
        ],
        quantityOptions: [
          { id: 'quantity_runs', label: 'No Per Shift', enabled: true, value: '' }
        ],
        minQuantityOptions: [],
        rangeOptions: [],
        vehicleTravelRates: [
          { id: 'vehicle_3_5t', vehicleType: '3.5t', hourlyRate: '', numberOfHours: '2', enabled: true },
          { id: 'vehicle_7_5t', vehicleType: '7.5t', hourlyRate: '', numberOfHours: '2', enabled: true }
        ],
        mathOperators: ['N/A'],
        pricingStackOrder: ['price_dayrate'],
        quantityStackOrder: ['quantity_runs'],
        minQuantityStackOrder: [],
        rangeStackOrder: [],
        vehicleTravelRatesStackOrder: ['vehicle_3_5t', 'vehicle_7_5t'],
        sector
      };
    }
  };



  // Auto-create pipe-size-specific configuration if needed
  const createPipeSizeConfiguration = async (categoryId: string, sector: string, pipeSize: string, configName: string): Promise<number | null> => {
    try {
      const templateType = getTemplateType(categoryId);
      const isP26 = templateType === 'P26';
      
      // Create configuration based on template type
      const newConfig = {
        categoryId,
        categoryName: configName,
        description: `${templateType} template for ${pipeSize} pipes - configure with authentic values`,
        categoryColor: '#ffffff',
        sector,
        
        // Template-specific structure
        pricingOptions: isP26 ? [
          { id: 'central_day_rate', label: 'Central Day Rate', enabled: true, value: '1650' }
        ] : [
          { id: 'price_dayrate', label: 'Day Rate', enabled: true, value: '' }
        ],
        
        quantityOptions: isP26 ? [
          { id: `${pipeSize}_day_rate`, label: `${pipeSize} Day Rate`, enabled: true, value: '' }
        ] : [
          { id: 'quantity_runs', label: 'No Per Shift', enabled: true, value: '' }
        ],
        
        minQuantityOptions: [],
        
        rangeOptions: [],
        
        vehicleTravelRates: isP26 ? [
          { id: 'vehicle_3_5t', vehicleType: '3.5t', hourlyRate: '55', numberOfHours: '2', enabled: true },
          { id: 'vehicle_26t', vehicleType: '26t', hourlyRate: '75', numberOfHours: '2', enabled: true }
        ] : [],
        
        mathOperators: isP26 ? [] : ['÷'],
        isActive: true
      };

      const response = await apiRequest('POST', '/api/pr2-clean', newConfig);

      if (response.ok) {
        const result = await response.json();
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

  // Query P26 configuration from database
  const { data: p26Config } = useQuery({
    queryKey: ['/api/pr2-clean/P26', sector],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/pr2-clean?sector=${sector}&categoryId=P26`);
      const configs = await response.json();
      return configs.length > 0 ? configs[0] : null;
    },
    enabled: !!sector,
  });

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
  
  // Color sync for patching configurations
  const syncPatchingColors = async () => {
    if (categoryId === 'patching') {
      try {
        // Get all three patching configurations
        const [config153, config156, config157] = await Promise.all([
          apiRequest('GET', '/api/pr2-clean/153').then(r => r.json()),
          apiRequest('GET', '/api/pr2-clean/156').then(r => r.json()),
          apiRequest('GET', '/api/pr2-clean/157').then(r => r.json())
        ]);
        
        // Use the color from config 153 as the master color
        const masterColor = config153.categoryColor || '#f5ec00';
        
        // Update configs 156 and 157 if they have different colors
        const updatePromises = [];
        
        if (config156.categoryColor !== masterColor) {
          updatePromises.push(
            apiRequest('PUT', '/api/pr2-clean/156', { ...config156, categoryColor: masterColor })
          );
        }
        
        if (config157.categoryColor !== masterColor) {
          updatePromises.push(
            apiRequest('PUT', '/api/pr2-clean/157', { ...config157, categoryColor: masterColor })
          );
        }
        
        if (updatePromises.length > 0) {
          await Promise.all(updatePromises);
        }
        
      } catch (error) {
        console.error('❌ Error syncing patching colors:', error);
      }
    }
  };

  // Reset form data when switching between templates
  useEffect(() => {
    if (!isEditing && !editId) {
      setFormData(getDefaultFormData());
    }
  }, [categoryId]);

  // Immediate save function for critical fields like Day Rate (db11)
  const immediateSave = async (optionType: string, optionId: string, value: string) => {
    if (!isEditing || !editId) return;
    
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
        // Success - no action needed
      } else {
        console.error(`❌ DB11 IMMEDIATE SAVE FAILED: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Immediate save error:', error);
    }
  };

  // Handle value changes for input fields
  const handleValueChange = (optionType: string, optionId: string, value: string) => {

    // Determine correct dev code based on current category
    const currentDevCode = (() => {
      if (window.location.href.includes('categoryId=patching')) return 'db6';
      if (window.location.href.includes('categoryId=robotic-cutting')) return 'db2';
      return 'db11'; // TP1 CCTV configurations
    })();
    
    // Mark that user has made changes to prevent automatic form overwrite
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
      
      return newFormData;
    });
    
    // For critical fields, save immediately to prevent data loss
    const criticalPricingFields = ['price_dayrate', 'double_layer_cost', 'single_layer_cost', 'triple_layer_cost', 'triple_layer_extra_cost'];
    const criticalMinQuantityFields = ['patch_min_qty_1', 'patch_min_qty_2', 'patch_min_qty_3', 'patch_min_qty_4'];
    
    if ((optionType === 'pricingOptions' && criticalPricingFields.includes(optionId)) ||
        (optionType === 'minQuantityOptions' && criticalMinQuantityFields.includes(optionId))) {
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

  }

  // Clean up extra green entries while preserving base entries (DB14 orange window removed)
  const removeExtraGreenOrangeEntries = () => {
    setFormData(prev => ({
      ...prev,
      quantityOptions: prev.quantityOptions.filter(opt => 
        opt.id === "quantity_runs" // Keep only "Runs per Shift"
      ),
      quantityStackOrder: ["quantity_runs"],
      minQuantityOptions: [], // DB14 orange window removed from TP1
      minQuantityStackOrder: []
    }));

  }

  // DISABLED: Auto cleanup was interfering with manual add operations
  // User needs to manually control when to clean up extra entries

  // Handle range value changes for purple window
  const handleRangeValueChange = (optionId: string, field: 'rangeStart' | 'rangeEnd', value: string) => {

    
    // Mark that user has made changes to prevent automatic form overwrite
    setHasUserChanges(true);
    
    setFormData(prev => {

      
      const updatedFormData = {
        ...prev,
        rangeOptions: prev.rangeOptions.map(opt => {
          if (opt.id === optionId) {
            // CRITICAL: No processing, just store the exact value
            const updatedOpt = { ...opt, [field]: value };

            return updatedOpt;
          }
          return opt;
        })
      };
      

      return updatedFormData;
    });
    
    // Trigger debounced save after range input change

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

      
      // If we have a pipe size, look for pipe-size-specific configuration first
      if (pipeSize) {
        const normalizedPipeSize = pipeSize.replace(/mm$/i, '');
        const pipeSizeConfig = allCategoryConfigs.find(config => 
          config.categoryId === categoryId && 
          config.sector === sector &&
          config.categoryName && config.categoryName.includes(`${normalizedPipeSize}mm`)
        );
        
        if (pipeSizeConfig) {

          setLocation(`/pr2-config-clean?categoryId=${categoryId}&sector=${sector}&edit=${pipeSizeConfig.id}`);
          return;
        } else {
          // AUTO-CREATE: No pipe-size-specific config exists, create one immediately

          const autoCreateAndRedirect = async () => {
            const normalizedPipeSize = pipeSize.replace(/mm$/i, '');
            const configName = `${normalizedPipeSize}mm ${categoryId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Configuration`;
            
            const newConfigId = await createPipeSizeConfiguration(categoryId, sector, pipeSize, configName);
            
            if (newConfigId) {

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

        // Redirect to edit the general configuration
        setLocation(`/pr2-config-clean?categoryId=${categoryId}&sector=${sector}&edit=${existingConfig.id}`);
      } else {

      }
    }
  }, [allCategoryConfigs, isEditing, categoryId, sector, pipeSize, setLocation]);

  // DEBOUNCED SAVE: Save input values after user stops typing
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const debouncedSave = () => {
    if (!isEditing || !editId) return;
    
    // CRITICAL: Skip auto-save for main TP1 template form (P007 has its own auto-save)
    const isTP1Template = ['cctv-jet-vac', 'jetting', 'cleansing'].includes(categoryId || '');
    if (isTP1Template) {
      return;
    }
    
    // Always save when user makes changes - including clearing fields
    
    // Clear previous timeout
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    
    // Set new timeout to save after 500ms of no changes
    const timeoutId = setTimeout(async () => {
      try {
        // For TP1 templates (cctv-jet-vac), don't override range options since TP1 templates manage their own
        const payload = {
          categoryName: formData.categoryName,
          description: formData.description,
          categoryColor: formData.categoryColor,
          sector: sector,
          categoryId: categoryId,
          pricingOptions: formData.pricingOptions,
          quantityOptions: formData.quantityOptions,
          minQuantityOptions: formData.minQuantityOptions,
          rangeOptions: categoryId === 'cctv-jet-vac' ? 
            [{ id: 'range_length', label: 'Length', enabled: true, rangeStart: '', rangeEnd: '' }] : 
            formData.rangeOptions,
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

          
          // CRITICAL: Sync P26 vehicle data across configurations
          if (categoryId === 'patching' && payload.vehicleTravelRates?.length > 0) {
            
            try {
              // Get all patching configurations for this user
              const allConfigsResponse = await fetch(`/api/pr2-clean?sector=${sector}&categoryId=patching`);
              if (allConfigsResponse.ok) {
                const patchingConfigs = await allConfigsResponse.json();
                
                // Sync vehicle data to all other patching configs
                for (const config of patchingConfigs) {
                  if (config.id !== editId) { // Don't update the current config again
                    const syncPayload = {
                      ...config,
                      vehicleTravelRates: payload.vehicleTravelRates,
                      vehicleTravelRatesStackOrder: payload.vehicleTravelRatesStackOrder
                    };
                    
                    await fetch(`/api/pr2-clean/${config.id}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(syncPayload)
                    });
                    

                  }
                }
              }
            } catch (syncError) {
              console.error('❌ P26 SYNC ERROR:', syncError);
            }
          }
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
  
  // Pipe Size Selection State - Dynamic based on editId
  const [editingRange, setEditingRange] = useState<RangeOption | null>(null);
  
  // Vehicle Travel Rate dialog states
  const [addVehicleDialogOpen, setAddVehicleDialogOpen] = useState(false);
  const [editVehicleDialogOpen, setEditVehicleDialogOpen] = useState(false);
  const [newVehicleType, setNewVehicleType] = useState('');
  const [newHourlyRate, setNewHourlyRate] = useState('');
  const [editingVehicle, setEditingVehicle] = useState<VehicleTravelRate | null>(null);
  
  // Sector selection state
  const [selectedSectors, setSelectedSectors] = useState<string[]>([sector]);
  
  // State for MMP1 ID selections (ID1-ID6 following P002 pattern)
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [idsWithConfig, setIdsWithConfig] = useState<string[]>([]);

  // Initialize selectedIds from URL parameter when component loads
  useEffect(() => {
    if (selectedId && getTemplateType(categoryId || '') === 'MMP1') {
      setSelectedIds([selectedId]);
    }
  }, [selectedId, categoryId]);
  const [showCustomColorPicker, setShowCustomColorPicker] = useState(false);
  const [customPipeSizes, setCustomPipeSizes] = useState<string[]>([]);
  const [newPipeSize, setNewPipeSize] = useState('');
  const [appliedSectors, setAppliedSectors] = useState<string[]>([]);
  const [showRemoveWarning, setShowRemoveWarning] = useState(false);
  const [sectorToRemove, setSectorToRemove] = useState<string>('');



  // Auto-save functionality state
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  


  // MM3 Pipe Size Selection State - Single selection only (default to 100mm)
  const [selectedPipeSizeForMM4, setSelectedPipeSizeForMM4] = useState<string>('100');
  
  // Fixed pipe size IDs - consistent across sessions to prevent data loss
  const PIPE_SIZE_IDS: Record<string, number> = {
    '100': 1001,
    '125': 1251,
    '150': 1501,
    '175': 1751,
    '200': 2001,
    '225': 2251,
    '250': 2501,
    '275': 2751,
    '300': 3001,
    '350': 3501,
    '375': 3751,
    '400': 4001,
    '450': 4501,
    '500': 5001,
    '525': 5251,
    '600': 6001,
    '675': 6751,
    '750': 7501,
    '825': 8251,
    '900': 9001,
    '975': 9751,
    '1050': 10501,
    '1200': 12001,
    '1350': 13501,
    '1500': 15001
  };
  
  const [selectedPipeSizeId, setSelectedPipeSizeId] = useState<number>(PIPE_SIZE_IDS['100']);
  
  // Get consistent ID for pipe size configuration
  const getPipeSizeId = (pipeSize: string) => {
    return PIPE_SIZE_IDS[pipeSize] || parseInt(pipeSize) * 10 + 1;
  };

  // Handle pipe size selection - single selection only (no toggle off)
  const handlePipeSizeSelect = (pipeSize: string) => {
    console.log(`🔄 Switching pipe size from ${selectedPipeSizeForMM4}mm to ${pipeSize}mm`);
    console.log('📊 Current MM4 data before switch:', mm4DataByPipeSize);
    console.log('📊 Current MM5 data before switch (independent):', mm5Data);
    
    // Always select the clicked pipe size (no deselection)
    const consistentId = getPipeSizeId(pipeSize);
    setSelectedPipeSizeForMM4(pipeSize);
    setSelectedPipeSizeId(consistentId);
    
    console.log(`✅ Switched to ${pipeSize}mm with CONSISTENT ID: ${consistentId}`);
    console.log(`🔍 Will now load data for key: ${pipeSize}-${consistentId}`);
  };

  // MM4/MM5 Data Storage - MM4 scoped by pipe size, MM5 independent
  const [mm4DataByPipeSize, setMm4DataByPipeSize] = useState<Record<string, any[]>>({});
  const [mm5Data, setMm5Data] = useState<any[]>([{ id: 1, vehicleWeight: '', costPerMile: '' }]);

  // Get current MM4/MM5 data for selected pipe size
  const getCurrentMM4Data = () => {
    const key = `${selectedPipeSizeForMM4}-${selectedPipeSizeId}`;
    const data = mm4DataByPipeSize[key] || [{ id: 1, blueValue: '', greenValue: '', purpleDebris: '', purpleLength: '' }];
    console.log(`🔍 MM4 Data for key "${key}":`, data);
    console.log('📊 All MM4 data by pipe size:', mm4DataByPipeSize);
    return data;
  };

  const getCurrentMM5Data = () => {
    console.log('🔍 MM5 Data (independent):', mm5Data);
    return mm5Data;
  };

  // Get current data as computed values
  const mm4Rows = getCurrentMM4Data();
  const mm5Rows = getCurrentMM5Data();

  // Update MM4/MM5 data for specific pipe size
  const updateMM4DataForPipeSize = (newData: any[]) => {
    const key = `${selectedPipeSizeForMM4}-${selectedPipeSizeId}`;
    setMm4DataByPipeSize(prev => ({ ...prev, [key]: newData }));
  };

  const updateMM5Data = (newData: any[]) => {
    setMm5Data(newData);
  };

  // 🔒 MMP1 PROTECTED FUNCTIONS - USER ONLY 🔒  
  // MM4 Row Management Functions - Now scoped to pipe size
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
    // Trigger auto-save when adding rows
    setTimeout(() => triggerAutoSave(), 100);
  };

  const deleteMM4Row = (rowId: number) => {
    const currentData = getCurrentMM4Data();
    if (currentData.length > 1) { // Keep at least one row
      const newData = currentData.filter(row => row.id !== rowId);
      updateMM4DataForPipeSize(newData);
      // Trigger auto-save when deleting rows
      setTimeout(() => triggerAutoSave(), 100);
    }
  };

  const updateMM4Row = (rowId: number, field: 'blueValue' | 'greenValue' | 'purpleDebris' | 'purpleLength', value: string) => {
    const currentData = getCurrentMM4Data();
    console.log('🔧 MM4 Row Update:');
    console.log('  - rowId:', rowId);
    console.log('  - field:', field);
    console.log('  - value:', value);
    console.log('  - current data before update:', currentData);
    
    const newData = currentData.map(row => 
      row.id === rowId ? { ...row, [field]: value } : row
    );
    
    console.log('  - new data after update:', newData);
    const key = `${selectedPipeSizeForMM4}-${selectedPipeSizeId}`;
    console.log('  - storing under key:', key);
    
    updateMM4DataForPipeSize(newData);
    
    // Verify storage after update
    setTimeout(() => {
      console.log('  - MM4 storage after update:', mm4DataByPipeSize);
    }, 100);
  };

  // 🔒 MMP1 PROTECTED FUNCTIONS - USER ONLY 🔒
  // MM5 Row Management Functions - Independent storage
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
    // Trigger auto-save when adding rows
    setTimeout(() => triggerAutoSave(), 100);
  };

  const deleteMM5Row = (rowId: number) => {
    const currentData = getCurrentMM5Data();
    if (currentData.length > 1) { // Keep at least one row
      const newData = currentData.filter(row => row.id !== rowId);
      updateMM5Data(newData);
      // Trigger auto-save when deleting rows
      setTimeout(() => triggerAutoSave(), 100);
    }
  };

  const updateMM5Row = (rowId: number, field: 'vehicleWeight' | 'costPerMile', value: string) => {
    const currentData = getCurrentMM5Data();
    const newData = currentData.map(row => 
      row.id === rowId ? { ...row, [field]: value } : row
    );
    updateMM5Data(newData);
  };

  // Configuration loading moved above getCategoryName function

  // Pipe Size Selection State - Upper Level Configuration
  const [selectedPipeSize, setSelectedPipeSize] = useState<string>(pipeSize || '150');
  const [availablePipeSizes, setAvailablePipeSizes] = useState<string[]>([
    '100', '150', '225', '300', '375', '450', '525', '600', '675', '750', 
    '825', '900', '975', '1050', '1200', '1350', '1500'
  ]);

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

  // Auto-save functionality for MM sections (declared after all state variables)
  const triggerAutoSave = useCallback(() => {
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }
    
    const timeoutId = setTimeout(async () => {
      try {
        // Create pipe-size-specific key for current selection
        const pipeSizeKey = `${selectedPipeSizeForMM4}-${selectedPipeSizeId}`;
        
        // Gather MM section data with pipe-size isolation
        const currentMM4Data = getCurrentMM4Data();
        console.log('💾 Auto-save MM4 Data Analysis:');
        console.log('  - pipeSizeKey:', pipeSizeKey);
        console.log('  - current MM4 data:', currentMM4Data);
        console.log('  - all MM4 storage:', mm4DataByPipeSize);
        
        const mmData = {
          selectedPipeSize: selectedPipeSizeForMM4,
          selectedPipeSizeId: selectedPipeSizeId,
          mm1Colors: formData.categoryColor,
          mm2IdData: selectedIds,
          mm3CustomPipeSizes: customPipeSizes,
          // Store MM4 data with pipe-size keys for isolation, MM5 independent
          mm4DataByPipeSize: { [pipeSizeKey]: currentMM4Data },
          mm5Data: getCurrentMM5Data(), // MM5 independent of pipe size
          // Keep legacy format for backward compatibility
          mm4Rows: currentMM4Data,
          mm5Rows: getCurrentMM5Data(),
          categoryId: categoryId,
          sector: sector,
          timestamp: Date.now(),
          pipeSizeKey: pipeSizeKey // Add key for debugging
        };
        
        console.log('💾 MM Data being saved to backend:', mmData);

        // Auto-save to backend - only update existing configurations, don't create new ones
        if (editId) {
          await apiRequest('PUT', `/api/pr2-clean/${editId}`, {
            ...formData,
            mmData: mmData
          });
        }
        // Don't create new configurations during auto-save - only update existing ones
        
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['/api/pr2-clean'] });
        
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }, 1000); // 1 second delay
    
    setAutoSaveTimeout(timeoutId);
  }, [selectedPipeSizeForMM4, selectedPipeSizeId, formData, selectedIds, customPipeSizes, mm4DataByPipeSize, mm5Data, editId, categoryId, sector, autoSaveTimeout]);

  // 🔒 MMP1 PROTECTED FUNCTION - USER ONLY 🔒
  // MM2 Color picker auto-save (independent from MM1 ID selection)
  const handleMM1ColorChange = (color: string) => {
    setHasUserChanges(true); // Mark that user has made changes to prevent auto-reload
    
    setFormData(prev => {
      const updatedFormData = { ...prev, categoryColor: color };
      
      // Immediate save with correct color value
      if (editId) {
        setTimeout(async () => {
          try {
            const mmData = {
              selectedPipeSize: selectedPipeSizeForMM4,
              selectedPipeSizeId: selectedPipeSizeId,
              mm1Colors: color, // Use the NEW color directly
              mm2IdData: selectedIds,
              mm3CustomPipeSizes: customPipeSizes,
              mm4Rows: mm4Rows,
              mm5Rows: mm5Rows,
              categoryId: categoryId,
              sector: sector,
              timestamp: Date.now()
            };
            
            await apiRequest('PUT', `/api/pr2-clean/${editId}`, {
              ...updatedFormData,
              mmData: mmData
            });
            
            // Invalidate queries to update category card display
            queryClient.invalidateQueries({ queryKey: ['/api/pr2-clean'] });
            
          } catch (error) {
            console.error('MM2 immediate save failed:', error);
          }
        }, 100); // Very short delay for immediate save
      }
      
      return updatedFormData;
    });
  };



  // 🔒 MMP1 PROTECTED FUNCTIONS - USER ONLY 🔒
  // MM4/MM5 Auto-save wrappers
  const updateMM4RowWithAutoSave = (rowId: number, field: 'blueValue' | 'greenValue' | 'purpleDebris' | 'purpleLength', value: string) => {
    updateMM4Row(rowId, field, value);
    triggerAutoSave();
  };

  const updateMM5RowWithAutoSave = (rowId: number, field: 'vehicleWeight' | 'costPerMile', value: string) => {
    updateMM5Row(rowId, field, value);
    triggerAutoSave();
  };

  const handlePipeSizeSelectWithAutoSave = (pipeSize: string) => {
    handlePipeSizeSelect(pipeSize);
    triggerAutoSave();
  };

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

      
      // If we have pipe size, look for pipe size-specific configuration first
      if (pipeSize) {
        const pipeSizeConfig = configs.find(config => 
          config.description && config.description.includes(`${pipeSize}mm`) &&
          config.sector === sector
        );
        
        if (pipeSizeConfig) {

          return pipeSizeConfig;
        } else {
          return null; // Return null to indicate we need to create a new config
        }
      }
      
      // Fallback to general configuration for the current sector
      const sectorConfig = configs.find(config => config.sector === sector);
      
      if (sectorConfig) {

        return sectorConfig;
      } else {
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

  // Validation errors - computed from formData
  const validationErrors: Record<string, string> = {};

  // Navigate back to dashboard
  const handleGoBack = () => {
    setLocation('/');
  };

  // Handle sector toggle for P006a templates
  const handleSectorToggle = (sectorId: string) => {
    setSelectedSectors(prev => {
      if (prev.includes(sectorId)) {
        return prev.filter(id => id !== sectorId);
      } else {
        return [...prev, sectorId];
      }
    });
  };

  // 🔒 MMP1 PROTECTED FUNCTION - USER ONLY 🔒
  // Handle color change for MM2 custom color picker
  const handleColorChange = (color: string) => {
    setHasUserChanges(true); // Prevent config reload
    
    setFormData(prev => {
      const updatedFormData = { ...prev, categoryColor: color };
      
      // Immediate save with correct color value
      if (editId) {
        setTimeout(async () => {
          try {
            const mmData = {
              selectedPipeSize: selectedPipeSizeForMM4,
              selectedPipeSizeId: selectedPipeSizeId,
              mm1Colors: color, // Use the NEW color directly
              mm2IdData: selectedIds,
              mm3CustomPipeSizes: customPipeSizes,
              mm4Rows: mm4Rows,
              mm5Rows: mm5Rows,
              categoryId: categoryId,
              sector: sector,
              timestamp: Date.now()
            };
            
            await apiRequest('PUT', `/api/pr2-clean/${editId}`, {
              ...updatedFormData,
              mmData: mmData
            });
            
            // Invalidate queries to update category card display
            queryClient.invalidateQueries({ queryKey: ['/api/pr2-clean'] });
            
          } catch (error) {
            console.error('MM2 custom save failed:', error);
          }
        }, 100);
      }
      
      return updatedFormData;
    });
  };

  // Mutation for saving sectors
  const mutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('PUT', `/api/pr2-clean/${editId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pr2-clean'] });
    }
  });

  // Handle sector checkbox changes
  const handleSectorChange = async (sectorId: string, checked: boolean) => {

    
    if (checked) {
      // Add sector to selected list
      setSelectedSectors(prev => [...new Set([...prev, sectorId])]);
      
      // CRITICAL FIX: Only create copies when editing ID 48 specifically
      // Do NOT create copies for other IDs (94, 95, etc.) as they are just examples
      if (isEditing && editId && parseInt(editId) === 48 && !sectorsWithConfig.includes(sectorId)) {
        await createSectorCopy(sectorId);
        
        // Update sectorsWithConfig to include this sector
        setSectorsWithConfig(prev => [...new Set([...prev, sectorId])]);
      } else if (parseInt(editId || '0') !== 48) {
      }
    } else {
      // Auto-remove: Delete configuration from this sector immediately
      const hasExistingConfig = sectorsWithConfig.includes(sectorId);
      
      if (hasExistingConfig && isEditing) {
        
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
            
            if (configToDelete && configToDelete.id) {
              await fetch(`/api/pr2-clean/${configToDelete.id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
              });
              
              // Update local state
              setSelectedSectors(prev => prev.filter(s => s !== sectorId));
              setSectorsWithConfig(prev => prev.filter(s => s !== sectorId));
              
              // Refresh data
              queryClient.invalidateQueries({ queryKey: ['/api/pr2-clean'] });
              

            }
          }
        } catch (error) {
          console.error(`❌ Failed to remove configuration from ${sectorId}:`, error);
        }
      } else {

        // Remove sector from selected list
        setSelectedSectors(prev => prev.filter(s => s !== sectorId));
      }
    }
  }

  // 🔒 MMP1 PROTECTED FUNCTION - USER ONLY 🔒
  // Handle MMP1 ID selection changes (following P002 pattern)
  const handleMMP1IdChange = async (idKey: string, checked: boolean) => {
    if (checked) {
      // Add ID to selected list
      setSelectedIds(prev => [...new Set([...prev, idKey])]);
      
      // Create configuration copy for this ID
      if (isEditing && editId) {
        await createIdCopy(idKey);
        setIdsWithConfig(prev => [...new Set([...prev, idKey])]);
      }
    } else {
      // Remove configuration for this ID
      const hasExistingConfig = idsWithConfig.includes(idKey);
      
      if (hasExistingConfig && isEditing) {
        // Find and delete the configuration for this ID
        try {
          const response = await fetch(`/api/pr2-clean`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
          });
          
          if (response.ok) {
            const allConfigs = await response.json();
            const configToDelete = allConfigs.find((config: any) => 
              config.sector === idKey && config.categoryId === categoryId
            );
            
            if (configToDelete && configToDelete.id) {
              await fetch(`/api/pr2-clean/${configToDelete.id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
              });
              
              // Update local state
              setSelectedIds(prev => prev.filter(s => s !== idKey));
              setIdsWithConfig(prev => prev.filter(s => s !== idKey));
              
              // Refresh data
              queryClient.invalidateQueries({ queryKey: ['/api/pr2-clean'] });
            }
          }
        } catch (error) {
          console.error(`❌ Failed to remove configuration from ${idKey}:`, error);
        }
      } else {
        // Remove ID from selected list
        setSelectedIds(prev => prev.filter(s => s !== idKey));
      }
    }
  }

  // Create an independent copy of the current configuration for a new sector
  const createSectorCopy = async (targetSectorId: string) => {
    try {
      
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

  // Create an independent copy of the current configuration for a new MMP1 ID
  const createIdCopy = async (targetIdKey: string) => {
    try {
      const payload = {
        categoryName: formData.categoryName,
        description: `${formData.description} - ${targetIdKey.toUpperCase()}`,
        categoryColor: formData.categoryColor,
        sector: targetIdKey, // Use ID as sector for storage
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
        setIdsWithConfig(prev => [...new Set([...prev, targetIdKey])]);
        queryClient.invalidateQueries({ queryKey: ['/api/pr2-clean'] });
      } else {
        console.error(`❌ Failed to create copy for ${targetIdKey}`);
      }
    } catch (error) {
      console.error(`❌ Error copying configuration to ${targetIdKey}:`, error);
    }
  };

  // Main save function that creates independent copies for each selected sector
  const handleSave = async () => {
    try {

      
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
      


      if (isEditing && editId) {
        // Update existing configuration
        await fetch(`/api/pr2-clean/${editId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

      } else {
        // Create new configuration for current sector
        const response = await fetch('/api/pr2-clean', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        if (response.ok) {
          const newConfig = await response.json();

        }
      }

      // Create independent copies for other selected sectors (excluding current sector)
      const otherSectors = selectedSectors.filter(s => s !== sector);
      for (const targetSector of otherSectors) {
        if (!sectorsWithConfig.includes(targetSector)) {
          await createSectorCopy(targetSector);
        } else {
        }
      }

      // Invalidate all queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['/api/pr2-clean'] });
      
      // CRITICAL: Also invalidate dashboard queries so costs update immediately
      queryClient.invalidateQueries({ queryKey: ['/api/uploads'] });
      queryClient.invalidateQueries({ predicate: (query) => {
        return query.queryKey[0]?.toString().includes('/api/uploads/') && 
               (query.queryKey[0]?.toString().includes('/sections') || 
                query.queryKey[0]?.toString().includes('/defects'));
      }});

      

      
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
  const [mm2ColorLocked, setMm2ColorLocked] = useState(false); // Removed persistent locking
  
  // Removed hasInitialLoad - simplified logic to never overwrite user changes
  
  // Clear processedConfigId when editId changes to allow new configuration loading
  useEffect(() => {
    setProcessedConfigId(null);
    // Reset flags when switching to different config
    setHasUserChanges(false);
    setMm2ColorLocked(false); // Reset MM2 color lock when switching configurations
    
    // CLEAR PR1 CACHE CONTAMINATION for robotic-cutting configurations
    if (categoryId === 'robotic-cutting') {
      // Clear any localStorage that might contain old PR1 data
      try {
        localStorage.removeItem('pr1-config-cache');
        localStorage.removeItem('config-form-data');
        localStorage.removeItem('category-config-cache');
      } catch (e) {
      }
    }
    
    // Force invalidate the specific configuration query to trigger fresh fetch
    if (editId) {
      queryClient.invalidateQueries({ queryKey: ['/api/pr2-clean', editId] });
    }
  }, [editId, categoryId]);
  
  // Single useEffect to handle all configuration loading
  useEffect(() => {
    // Use sectorConfigs for navigation without editId, existingConfig for direct editId access
    const configToUse = editId ? existingConfig : sectorConfigs;


    
    // FIXED: Force reload when editId changes, but NEVER if user has made changes

    
    if (isEditing && configToUse && configToUse.id && !hasUserChanges) {
      const configId = parseInt(editId || '0');

      
      // Always process when editId is present, but NEVER overwrite user changes
      if (configId > 0) {
        // Get the actual config object (might be wrapped in array)
        const config = Array.isArray(configToUse) ? configToUse[0] : configToUse;

      
      if (config) {

        
        // Handle array vs object format for quantityOptions and minQuantityOptions
        const existingQuantityOptions = Array.isArray(config.quantityOptions) ? config.quantityOptions : [];
        const existingMinQuantityOptions = Array.isArray(config.minQuantityOptions) ? config.minQuantityOptions : [];
        const existingRangeOptions = Array.isArray(config.rangeOptions) ? config.rangeOptions : [];
        const existingPricingOptions = Array.isArray(config.pricingOptions) ? config.pricingOptions : [];
        
        // REMOVED: Some configurations use central configuration instead
        
        // Initialize single-option defaults for each window (matching your requirement)
        const defaultPricingOptions = [
          { id: 'price_dayrate', label: 'Day Rate', enabled: true, value: '' }
        ];
        
        const defaultQuantityOptions = [
          { id: 'quantity_runs', label: 'Runs per Shift', enabled: true, value: '' }
        ];
        
        const defaultMinQuantityOptions = [];
        
        const defaultRangeOptions = [
          { id: 'range_combined', label: 'Debris % / Length M', enabled: true, rangeStart: '', rangeEnd: '' }
        ];
        
        // Use existing options if they exist, otherwise use defaults
        const pricingOptions = existingPricingOptions.length > 0 ? existingPricingOptions : defaultPricingOptions;
        const quantityOptions = existingQuantityOptions.length > 0 ? existingQuantityOptions : defaultQuantityOptions;
        const minQuantityOptions = existingMinQuantityOptions.length > 0 ? existingMinQuantityOptions : defaultMinQuantityOptions;
        const rangeOptions = existingRangeOptions.length > 0 ? existingRangeOptions : defaultRangeOptions;
        
        // FORCE TP3 template name override to prevent PR1 cache contamination
        const correctCategoryName = (() => {
          if (categoryId === 'robotic-cutting') {

            return 'TP3 - Robotic Cutting Configuration';
          }
          return config.categoryName || 'CCTV Price Configuration';
        })();
        

        
        const newFormData = {
          categoryName: correctCategoryName,
          description: config.description || '',
          categoryColor: config.categoryColor || '#93c5fd',
          pipeSize: pipeSize || '',
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
        


        // Set the form data directly without reset (fixes display issue)
        setFormData(newFormData);
        
        // Load MM4/MM5 data from backend if it exists
        if (config.mmData) {
          console.log('🔄 Loading MM4/MM5 data from backend:', config.mmData);
          console.log('🔍 MM4 Backend Data Analysis:');
          console.log('  - mm4DataByPipeSize exists:', !!config.mmData.mm4DataByPipeSize);
          console.log('  - mm4Rows exists:', !!config.mmData.mm4Rows);
          console.log('  - selectedPipeSizeForMM4:', selectedPipeSizeForMM4);
          console.log('  - selectedPipeSizeId:', selectedPipeSizeId);
          
          // Load MM4/MM5 data from pipe-size-specific storage or legacy format
          if (config.mmData.mm4DataByPipeSize) {
            console.log('📥 Setting MM4 pipe-size data:', config.mmData.mm4DataByPipeSize);
            setMm4DataByPipeSize(config.mmData.mm4DataByPipeSize);
            console.log('✅ MM4 data should now be loaded in storage');
          } else if (config.mmData.mm4Rows) {
            // Legacy format - store under current pipe size key
            const currentKey = `${selectedPipeSizeForMM4}-${selectedPipeSizeId}`;
            console.log('📥 Converting MM4 legacy data to pipe-size format');
            console.log('  - Legacy data:', config.mmData.mm4Rows);
            console.log('  - Will store under key:', currentKey);
            setMm4DataByPipeSize({ [currentKey]: config.mmData.mm4Rows });
            console.log('✅ MM4 legacy data converted and stored');
          } else {
            console.log('❌ No MM4 data found in backend config');
          }
          
          // MM5 is now independent of pipe size
          if (config.mmData.mm5Data) {
            setMm5Data(config.mmData.mm5Data);
            console.log('✅ Loaded MM5 independent data:', config.mmData.mm5Data);
          } else if (config.mmData.mm5Rows) {
            // Legacy format - use as independent data
            setMm5Data(config.mmData.mm5Rows);
            console.log('✅ Loaded MM5 legacy data as independent:', config.mmData.mm5Rows);
          } else if (config.mmData.mm5DataByPipeSize) {
            // Old pipe-size-specific format - extract first available data as independent
            const firstKey = Object.keys(config.mmData.mm5DataByPipeSize)[0];
            if (firstKey) {
              setMm5Data(config.mmData.mm5DataByPipeSize[firstKey]);
              console.log('✅ Migrated MM5 pipe-size data to independent:', config.mmData.mm5DataByPipeSize[firstKey]);
            }
          }
          
          // Load other MM data
          if (config.mmData.mm3CustomPipeSizes) {
            setCustomPipeSizes(config.mmData.mm3CustomPipeSizes);
          }
          if (config.mmData.mm2IdData) {
            setSelectedIds(config.mmData.mm2IdData);
          }
        }
        
        // Set single sector information
        const configSector = config.sector || sector;
        
        
        setSectorsWithConfig([configSector]);
        setSelectedSectors([configSector]);
        
        // Mark this config as processed to prevent double loading
        setProcessedConfigId(config.id);
      } else if (configToUse && configToUse.id && processedConfigId === configToUse.id) {
      }
      } // Close the if (configId > 0) block
    } else if (!isEditing) {
      // Start with the current sector for new configurations
      setSelectedSectors([sector]);
      setSectorsWithConfig([]);
      
      // If we have pipe size but no existing config, create new pipe size-specific config
      if (pipeSize && categoryId && !sectorConfigs) {
        
        // Use the configName from URL if available, otherwise generate it
        const pipeSizeConfigName = configName || getCategoryName(categoryId);
        
        // Initialize with single specific options for each window
        const defaultPricingOptions = [
          { id: 'price_dayrate', label: 'Day Rate', enabled: true, value: '' }
        ];
        
        const defaultQuantityOptions = [
          { id: 'quantity_runs', label: 'Runs per Shift', enabled: true, value: '' }
        ];
        
        const defaultMinQuantityOptions = [];
        
        const defaultRangeOptions = [
          { id: 'range_combined', label: 'Debris % / Length M', enabled: true, rangeStart: '', rangeEnd: '' }
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

  const updatePricingOption = (index: number | string, field: 'enabled' | 'value', value: any) => {
    if (typeof index === 'number') {
      // Array index approach for P006a templates
      setFormData(prev => ({
        ...prev,
        pricingOptions: prev.pricingOptions.map((opt, i) =>
          i === index ? { ...opt, [field]: value } : opt
        )
      }));
    } else {
      // Option ID approach for other templates
      setFormData(prev => ({
        ...prev,
        pricingOptions: prev.pricingOptions.map(opt =>
          opt.id === index ? { ...opt, [field]: value } : opt
        )
      }));
    }
    debouncedSave();
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
    
  };

  // P006a template update functions
  const updateQuantityOption = (index: number, field: 'enabled' | 'value', value: any) => {
    setFormData(prev => ({
      ...prev,
      quantityOptions: prev.quantityOptions.map((opt, i) =>
        i === index ? { ...opt, [field]: value } : opt
      )
    }));
    debouncedSave();
  };

  const updateRangeOption = (index: number, field: 'rangeStart' | 'rangeEnd', value: any) => {
    setFormData(prev => ({
      ...prev,
      rangeOptions: prev.rangeOptions.map((opt, i) =>
        i === index ? { ...opt, [field]: value } : opt
      )
    }));
    debouncedSave();
  };

  const updateVehicleOption = (index: number, field: 'enabled' | 'hourlyRate' | 'numberOfHours', value: any) => {
    setFormData(prev => ({
      ...prev,
      vehicleTravelRates: prev.vehicleTravelRates.map((vehicle, i) =>
        i === index ? { ...vehicle, [field]: value } : vehicle
      )
    }));
    debouncedSave();
  };

  const handleSaveConfiguration = async () => {
    if (!editId) return;
    
    try {
      await mutation.mutateAsync(formData);
    } catch (error) {
      console.error('❌ Failed to save P006a configuration:', error);
    }
  };

  // Master add function that adds inputs to all three windows (green, orange, purple)
  const addNewInputsToAllWindows = () => {
    const timestamp = Date.now();
    
    
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
    
    // FIXED: Use pairIndex directly to target the same row number in green and orange windows
    // Row 0 = first items, Row 1 = second items (what user wants to delete), etc.
    const quantityIdToDelete = formData.quantityOptions[pairIndex]?.id;
    const minQuantityIdToDelete = formData.minQuantityOptions[pairIndex]?.id;
    
    
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
    const newOption: RangeOption = {
      id: `range_${Date.now()}`,
      label: `Range ${formData.rangeOptions.length + 1}`,
      enabled: true,
      rangeStart: '',
      rangeEnd: ''
    };
    
    setFormData(prev => ({
      ...prev,
      rangeOptions: [...prev.rangeOptions, newOption],
      rangeStackOrder: [...prev.rangeStackOrder, newOption.id]
    }));
    
    // Auto-save the new range option
    debouncedSave();
  };

  const deleteRangeOption = (index: number) => {
    setFormData(prev => ({
      ...prev,
      rangeOptions: prev.rangeOptions.filter((_, i) => i !== index)
    }));
    // Auto-save after deletion
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
    setFormData(prev => {
      const updated = {
        ...prev,
        vehicleTravelRates: prev.vehicleTravelRates.map(vehicle => 
          vehicle.id === updatedVehicle.id ? updatedVehicle : vehicle
        )
      };
      return updated;
    });
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
    
    // Add range options with values - CRITICAL DEBUG
    formData.rangeOptions.forEach((opt, index) => {
      
      if ((opt.rangeStart && opt.rangeStart.trim() !== '') || (opt.rangeEnd && opt.rangeEnd.trim() !== '')) {
        const rangeStart = opt.rangeStart || 'R1';
        const rangeEnd = opt.rangeEnd || 'R2';
        const rangePart = `${opt.label} = ${rangeStart} to ${rangeEnd}`;
        parts.push(rangePart);
      }
    });
    
    if (parts.length === 0) {
      return 'CCTV price configuration';
    }
    
    const finalDescription = parts.join('. ');
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
      }
    } catch (error) {
      console.error(`❌ Failed to create copy for sector ${targetSector}:`, error);
    }
  };

  // Handle saving sectors
  const handleSaveSectors = async () => {
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
      return existingConfig.id;
    }
    
    // No pipe-size-specific config exists, create one using existing function
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
    } else if (categoryId === 'cctv-jet-vac') {
      // CCTV Jet Vac - exclude from pipe size configurations dropdown
      // ID 161 should not appear in any dropdown interface
      return [];
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
      await apiRequest('DELETE', `/api/pr2-clean/${configId}`);
      
      // Invalidate cache to refresh the PR2 configurations list
      queryClient.invalidateQueries({ queryKey: ['/api/pr2-clean'] });
      
      // Close any open delete dialogs
      setShow100mmDeleteDialog(false);
      
      // Navigate back to pricing page after successful deletion
      setLocation(`/pr2-pricing?sector=${sector || 'utilities'}`);
      
    } catch (error) {
      console.error(`❌ Error deleting ${pipeSize} configuration:`, error);
    }
  };

  // FIXED DASH BUTTON SAVE: Save configuration changes before navigation
  const handleAutoSaveAndNavigate = (destination: string) => {
    return async () => {
      
      // CRITICAL FIX: Actually save the changes when dash button clicked
      if (isEditing && editId) {
        try {
          
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
            rangeStackOrder: formData.rangeStackOrder,
            vehicleTravelRates: formData.vehicleTravelRates,
            vehicleTravelRatesStackOrder: formData.vehicleTravelRatesStackOrder
          };

          // Update existing configuration with delete changes
          const response = await fetch(`/api/pr2-clean/${editId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          
        } catch (error) {
          console.error('❌ Dash button save failed:', error);
          // Don't throw the error - allow navigation to continue
        }
      }
      
      // Navigate to destination
      window.location.href = destination;
    };
  };

  // Handle delete configuration
  const handleDelete = async () => {
    if (!editId) return;
    
    try {
      setIsSaving(true);
      await apiRequest('DELETE', `/api/pr2-clean/${editId}`);
      
      // Invalidate cache
      queryClient.invalidateQueries({ queryKey: ['/api/pr2-clean'] });
      
      // Navigate back to pricing page
      setLocation(`/pr2-pricing?sector=${sector}`);
    } catch (error) {
      console.error('❌ Delete failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle range change function
  const handleRangeChange = (optionId: string, field: 'rangeStart' | 'rangeEnd', value: string) => {
    setFormData(prev => ({
      ...prev,
      rangeOptions: prev.rangeOptions.map(opt => 
        opt.id === optionId 
          ? { ...opt, [field]: value }
          : opt
      )
    }));
    
    // Auto-save the changes
    debouncedSave();
  };

  // Get dynamic page ID based on category
  const dynamicPageId = categoryId ? CATEGORY_PAGE_IDS[categoryId as keyof typeof CATEGORY_PAGE_IDS] || `p-${categoryId}` : 'p-config';

  // Show loading state during auto-creation to eliminate "Create" page appearance
  const isAutoCreating = !isEditing && pipeSize && categoryId && allCategoryConfigs;
  
  // Show loading screen during auto-creation process
  if (isAutoCreating) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 relative flex items-center justify-center">
        <DevLabel id="P005" position="top-right" />
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
      <DevLabel id="MMP1" position="top-right" />
      <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              {/* MMP1 Large Identifier for Test Card */}
              {categoryId === 'test-card' && getTemplateType(categoryId || '') === 'MMP1' && (
                <div className="mb-4">
                  <h1 className="text-6xl font-bold text-green-600 mb-2" style={{ fontSize: '4rem', lineHeight: '1' }}>
                    MMP1
                  </h1>
                  <p className="text-xl text-gray-700 font-semibold">
                    New Template with 5 Placeholder UI Cards
                  </p>
                </div>
              )}
              
              <h1 
                className="text-2xl font-bold text-gray-900"
                data-component="page-title"
              >
                Edit {formData.categoryName || 'TP1 - Configuration'}
              </h1>
              
              {/* Template Information Display */}
              <div className="mt-2 flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Template:</span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded">
                    {(() => {
                      const templateType = getTemplateType(categoryId || '');
                      if (templateType === 'P006') {
                        return `P006 Template (F${editId || 'Unknown'})`;
                      } else if (templateType === 'P006a') {
                        return `P006a Template (F${editId || 'Unknown'})`;
                      } else if (templateType === 'P26') {
                        return `P26 Template (F${editId || 'Unknown'})`;
                      } else if (templateType === 'MMP1') {
                        return `MMP1 Template (F${editId || 'Unknown'})`;
                      } else {
                        return `TP1 Template (F${editId || 'Unknown'})`;
                      }
                    })()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Category ID:</span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-800 text-sm font-mono rounded">
                    {categoryId || 'Unknown'}
                  </span>
                </div>
              </div>
              
              <p className="text-gray-600 mt-2">
                {formData.description || 'Configure pricing options for this category'}
              </p>
            </div>
          
          {/* Right side - Navigation buttons */}
          <div className="flex items-center gap-3">
            <Button 
              onClick={handleGoBack}
              className="bg-white hover:bg-gray-50 text-black font-bold py-2 px-4 rounded-lg border border-gray-300 transition-colors"
            >
              <BarChart3 className="w-4 h-4 mr-2 text-green-600" />
              Dashboard
            </Button>
            
            <Button 
              onClick={() => window.location.href = `/pr2-pricing?sector=${sector}`}
              className="bg-white hover:bg-gray-50 text-black font-bold py-2 px-4 rounded-lg border border-gray-300 transition-colors"
            >
              <Settings className="w-4 h-4 mr-2 text-orange-600" />
              Pricing
            </Button>
          </div>
        </div>

          {/* Validation Warning */}
          {(() => {
            const hasInvalidValues = Object.keys(validationErrors).length > 0;
            return hasInvalidValues ? (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <h3 className="text-red-800 font-semibold mb-2">⚠️ Configuration Validation</h3>
                <p className="text-red-700 text-sm">
                  Some values don't end with .99 as required. Please review and update the following fields.
                </p>
              </div>
            ) : null;
          })()}

          {/* Success message for saved configurations (excluding MMP1 templates) */}
          {processedConfigId && getTemplateType(categoryId || '') !== 'MMP1' && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="text-green-800 font-semibold mb-2">✅ Configuration Saved</h3>
              <p className="text-green-700 text-sm">
                Your pricing configuration has been successfully saved.
              </p>
            </div>
          )}

        {/* MMP1 Template - Protected Component (Temporarily Disabled for Layout Fix) */}
        {false && getTemplateType(categoryId || '') === 'MMP1' && (
          <MMP1Template 
            categoryId={categoryId || ''} 
            sector={sector} 
            editId={editId ? parseInt(editId) : undefined}
            onSave={() => {
              queryClient.invalidateQueries({ queryKey: ['/api/pr2-clean'] });
            }}
          />
        )}

        {/* MMP1 Template - Original Implementation (Re-enabled for correct layout) */}
        {getTemplateType(categoryId || '') === 'MMP1' && (
          <div className="space-y-6">
            {/* MM1 - ID1-ID6 Selection (P002 Pattern) */}
            <div className="relative">
              <DevLabel id="MM1" position="top-right" />
              <Card className="bg-white border-2 border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    1. Select Configuration IDs (P002 Pattern)
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    Select ID1-ID6 templates that will save prices to sectors when selected
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-3">
                    {MMP1_IDS.map((idOption) => {
                      const isSelected = selectedIds.includes(idOption.id);
                      const hasConfiguration = idsWithConfig.includes(idOption.id);
                      
                      return (
                        <Card 
                          key={idOption.id}
                          className={`cursor-pointer transition-all duration-200 hover:shadow-md border-2 ${
                            isSelected 
                              ? `border-gray-800 ${idOption.bgColor} ring-2 ring-gray-300` 
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                          onClick={() => {
                            console.log('🎯 MM1 ID CARD CLICKED:', { id: idOption.id, willSelect: !isSelected });
                            handleMMP1IdChange(idOption.id, !isSelected);
                          }}
                        >
                          <CardContent className="p-4 text-center relative">
                            <div className={`mx-auto w-8 h-8 mb-3 flex items-center justify-center rounded-lg ${
                              isSelected ? 'bg-white' : 'bg-gray-100'
                            }`}>
                              <idOption.icon className={`w-5 h-5 ${
                                isSelected ? idOption.color : 'text-gray-600'
                              }`} />
                            </div>
                            <h3 className={`font-semibold text-sm mb-1 ${
                              isSelected ? 'text-gray-900' : 'text-gray-900'
                            }`}>
                              {idOption.name}
                            </h3>
                            <p className="text-xs text-gray-600">
                              {idOption.description}
                            </p>
                            {isSelected && (
                              <div className="absolute top-2 right-2">
                                <Settings className="w-4 h-4 text-gray-600" />
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                  

                </CardContent>
              </Card>
            </div>

            {/* Color Picker Section - Enhanced with 20 colors and custom picker */}
            <div className="relative">
              <DevLabel id="MM2" position="top-right" />
              <Card className="bg-white border-2 border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    2. Color Picker Section
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    Choose from 20 Outlook diary-style colors or use custom color picker
                  </p>
                </CardHeader>
                <CardContent>
                  {/* 20 Outlook Diary Style Colors */}
                  <div className="grid grid-cols-10 gap-2 mb-4">
                    {[
                      { name: 'Light Blue', value: '#8DC3E8' },
                      { name: 'Light Green', value: '#A4D4B4' },
                      { name: 'Light Yellow', value: '#F5E6A3' },
                      { name: 'Light Orange', value: '#F5C99B' },
                      { name: 'Light Red', value: '#F5A3A3' },
                      { name: 'Light Purple', value: '#D4A4D4' },
                      { name: 'Light Pink', value: '#F5C2E7' },
                      { name: 'Light Teal', value: '#A3D5D5' },
                      { name: 'Light Gray', value: '#D4D4D4' },
                      { name: 'Light Brown', value: '#D4B899' },
                      { name: 'Medium Blue', value: '#5B9BD5' },
                      { name: 'Medium Green', value: '#70AD47' },
                      { name: 'Medium Yellow', value: '#FFC000' },
                      { name: 'Medium Orange', value: '#ED7D31' },
                      { name: 'Medium Red', value: '#C55A5A' },
                      { name: 'Medium Purple', value: '#9F4F96' },
                      { name: 'Medium Pink', value: '#E083C2' },
                      { name: 'Medium Teal', value: '#4BACC6' },
                      { name: 'Medium Gray', value: '#A5A5A5' },
                      { name: 'Medium Brown', value: '#B7956D' }
                    ].map((color) => (
                      <button
                        key={color.name}
                        className={`w-8 h-8 rounded-lg border-2 cursor-pointer hover:scale-110 transition-transform ${
                          formData.categoryColor === color.value ? 'border-gray-800 ring-2 ring-gray-300' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: color.value }}
                        onClick={() => handleMM1ColorChange(color.value)}
                        title={color.name}
                      >
                        {formData.categoryColor === color.value && (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-white text-sm font-bold">✓</span>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Custom Color Picker and Selected Color Display */}
                  <div className="border-t pt-4">
                    <div className="flex items-center gap-4 mb-2">
                      {/* Custom Color Picker Button */}
                      <div className="relative flex-1">
                        <button
                          type="button"
                          onClick={() => setShowCustomColorPicker(!showCustomColorPicker)}
                          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        >
                          <div 
                            className="w-4 h-4 rounded border border-gray-300"
                            style={{ backgroundColor: formData.categoryColor }}
                          ></div>
                          Custom Color Picker
                          <ChevronDown className={`w-4 h-4 transition-transform ${showCustomColorPicker ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Dropdown Window */}
                        {showCustomColorPicker && (
                          <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-white border border-gray-300 rounded-lg shadow-lg z-10">
                            <div className="space-y-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-900 mb-1">
                                  Visual Color Picker
                                </label>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="color"
                                    value={formData.categoryColor}
                                    onChange={(e) => handleMM1ColorChange(e.target.value)}
                                    className="w-12 h-8 rounded border border-gray-300 cursor-pointer bg-transparent"
                                    title="Choose custom color"
                                  />
                                  <div className="flex-1">
                                    <div 
                                      className="w-full h-8 rounded border border-gray-300"
                                      style={{ backgroundColor: formData.categoryColor }}
                                    ></div>
                                  </div>
                                </div>
                              </div>
                              
                              <div>
                                <label className="block text-xs font-medium text-gray-900 mb-1">
                                  Hex Color Code
                                </label>
                                <input
                                  type="text"
                                  value={formData.categoryColor}
                                  onChange={(e) => handleColorChange(e.target.value)}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                                  placeholder="#000000"
                                  pattern="^#[0-9A-Fa-f]{6}$"
                                  title="Enter hex color code (e.g., #FF5733)"
                                />
                              </div>

                              <div className="flex justify-end pt-2 border-t">
                                <button
                                  type="button"
                                  onClick={() => setShowCustomColorPicker(false)}
                                  className="px-2 py-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                                >
                                  Done
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Compact Selected Color Display */}
                      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                        <div 
                          className="w-5 h-5 rounded border border-gray-300 shadow-sm"
                          style={{ backgroundColor: formData.categoryColor }}
                        ></div>
                        <div>
                          <p className="text-xs font-medium text-gray-900">Selected</p>
                          <p className="text-xs text-gray-600 font-mono">{formData.categoryColor}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* MM3 - UK Drainage Pipe Sizes (MSCC5) */}
            <div className="relative">
              <DevLabel id="MM3" position="top-right" />
              <Card className="bg-white border-2 border-gray-200">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg font-semibold text-gray-900">
                        3. UK Drainage Pipe Sizes (MSCC5)
                      </CardTitle>
                      <p className="text-sm text-gray-600">
                        Standard UK drainage pipe sizes with custom size management
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={newPipeSize}
                        onChange={(e) => setNewPipeSize(e.target.value)}
                        placeholder="Add size (mm)"
                        className="px-2 py-1 text-sm border border-gray-300 rounded w-28 font-mono"
                        min="50"
                        max="3000"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newPipeSize && !customPipeSizes.includes(newPipeSize)) {
                            setCustomPipeSizes(prev => [...prev, newPipeSize].sort((a, b) => parseInt(a) - parseInt(b)));
                            setNewPipeSize('');
                            triggerAutoSave();
                          }
                        }}
                        className="px-2 py-1 text-sm bg-white text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                        disabled={!newPipeSize || customPipeSizes.includes(newPipeSize)}
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Orange UI Card containing all pipe size buttons */}
                  <Card className="bg-orange-50 border-2 border-orange-200">
                    <CardContent className="p-4">
                      <div className="grid grid-cols-6 gap-2">
                        {/* Combine and sort all pipe sizes */}
                        {[
                          ...['100', '150', '225', '300', '375', '450', '525', '600', '675', '750', '900', '1050', '1200', '1350', '1500', '1800', '2100', '2400'],
                          ...customPipeSizes
                        ]
                          .sort((a, b) => parseInt(a) - parseInt(b))
                          .map((size) => {
                            const isCustom = customPipeSizes.includes(size);
                            const isSelected = selectedPipeSizeForMM4 === size;
                            
                            return (
                              <Card
                                key={size}
                                className={`relative group cursor-pointer transition-all border-2 ${
                                  isSelected 
                                    ? 'border-green-400 bg-green-100 shadow-md' 
                                    : 'border-gray-300 bg-white hover:border-orange-300 hover:bg-orange-50'
                                }`}
                                onClick={() => handlePipeSizeSelectWithAutoSave(size)}
                              >
                                <CardContent className="p-3 text-center">
                                  <div className="text-sm font-mono font-semibold text-gray-900">
                                    {size}mm
                                  </div>
                                  {isSelected && (
                                    <div className="absolute top-1 right-1">
                                      <Settings className="w-3 h-3 text-green-600" />
                                    </div>
                                  )}
                                </CardContent>
                                {isCustom && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setCustomPipeSizes(prev => prev.filter(s => s !== size));
                                      // If removing the currently selected size, default back to 100mm
                                      if (selectedPipeSizeForMM4 === size) {
                                        setSelectedPipeSizeForMM4('100');
                                        setSelectedPipeSizeId(getPipeSizeId('100'));
                                      }
                                      triggerAutoSave();
                                    }}
                                    className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-700 z-10"
                                    title={`Remove ${size}mm custom size`}
                                  >
                                    <Trash2 className="w-2 h-2" />
                                  </button>
                                )}
                              </Card>
                            );
                          })}
                      </div>
                    </CardContent>
                  </Card>


                </CardContent>
              </Card>
            </div>

            {/* MM4 and MM5 - Same Row Layout */}
            <div className="grid grid-cols-3 gap-6">
              {/* MM4 - Section Calculator (Left - spans 2 columns) */}
              <div className="col-span-2 relative">
                {selectedPipeSizeForMM4 ? (
                  // Show selected pipe size in DevLabel
                  <DevLabel id={`MM4-${selectedPipeSizeForMM4}`} position="top-right" />
                ) : (
                  <DevLabel id="MM4" position="top-right" />
                )}
                <Card className="bg-white border-2 border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      {selectedPipeSizeForMM4 ? (
                        // Show selected pipe size and ID in title
                        `4. Section Calculator - ${selectedPipeSizeForMM4}mm (ID: ${selectedPipeSizeId})`
                      ) : (
                        "4. Section Calculator"
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedPipeSizeForMM4 ? (
                      // Show MM4 interface when pipe size is selected
                      <div className="grid grid-cols-4 gap-4">
                        {/* Blue - Day Rate (1 column) */}
                        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                          <h4 className="font-medium text-blue-800 mb-2">
                            Day Rate
                            <span className="ml-2 text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded font-mono">
                              {selectedPipeSizeForMM4}mm
                            </span>
                          </h4>
                          <div>
                            <label className="text-xs text-blue-700">Day Rate</label>
                            <Input
                              type="text"
                              placeholder="Enter day rate"
                              className="border-blue-300"
                              value={mm4Rows[0]?.blueValue || ''}
                              onChange={(e) => updateMM4RowWithAutoSave(mm4Rows[0]?.id || 1, 'blueValue', e.target.value)}
                            />
                          </div>
                        </div>

                        {/* Green - No Per Shift (1 column) - Dynamic Rows */}
                        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                          <h4 className="font-medium text-green-800 mb-2">
                            No Per Shift
                            <span className="ml-2 text-xs bg-green-200 text-green-800 px-2 py-1 rounded font-mono">
                              {selectedPipeSizeForMM4}mm
                            </span>
                          </h4>
                          <div className="space-y-2">
                            {mm4Rows.map((row, index) => (
                              <div key={row.id}>
                                <label className="text-xs text-green-700">Qty Per Shift</label>
                                <Input
                                  type="text"
                                  placeholder="Enter quantity"
                                  className="border-green-300"
                                  value={row.greenValue}
                                  onChange={(e) => updateMM4RowWithAutoSave(row.id, 'greenValue', e.target.value)}
                                />
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Purple - Range Configuration (2 columns - wider for two inputs) - Dynamic Rows */}
                        <div className="col-span-2 bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
                          <h4 className="font-medium text-purple-800 mb-2">
                            Range Configuration
                            <span className="ml-2 text-xs bg-purple-200 text-purple-800 px-2 py-1 rounded font-mono">
                              {selectedPipeSizeForMM4}mm
                            </span>
                          </h4>
                          <div className="space-y-2">
                            {mm4Rows.map((row, index) => (
                              <div key={row.id} className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="text-xs text-purple-700">Debris %</label>
                                  <Input
                                    type="text"
                                    placeholder="0-15"
                                    className="border-purple-300"
                                    value={row.purpleDebris}
                                    onChange={(e) => updateMM4RowWithAutoSave(row.id, 'purpleDebris', e.target.value)}
                                  />
                                </div>
                                <div>
                                  <label className="text-xs text-purple-700">Length</label>
                                  <div className="flex items-center gap-2">
                                    <Input
                                      type="text"
                                      placeholder="0-35"
                                      className="border-purple-300 flex-1"
                                      value={row.purpleLength}
                                      onChange={(e) => updateMM4RowWithAutoSave(row.id, 'purpleLength', e.target.value)}
                                    />
                                    {index === 0 && (
                                      <Button 
                                        size="sm" 
                                        className="bg-purple-600 hover:bg-purple-700 text-white h-8 w-8 p-0 flex-shrink-0"
                                        onClick={addMM4Row}
                                      >
                                        +
                                      </Button>
                                    )}
                                    {index > 0 && (
                                      <Button 
                                        size="sm" 
                                        variant="destructive"
                                        className="h-8 w-8 p-0 flex-shrink-0"
                                        onClick={() => deleteMM4Row(row.id)}
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Show placeholder when no pipe size selected
                      <div className="text-center py-8 text-gray-500">
                        <p>Select a pipe size from MM3 to configure Section Calculator</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* MM5 - Vehicle Travel Rates (Right) */}
              <div className="relative">
                <DevLabel id="MM5" position="top-right" />
                <Card className="bg-white border-2 border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      5. Vehicle Travel Rates
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-teal-50 border-2 border-teal-200 rounded-lg p-4">
                      <h4 className="font-medium text-teal-800 mb-2">Vehicle Travel</h4>
                      <div className="space-y-2">
                        {mm5Rows.map((row, index) => (
                          <div key={row.id} className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-xs text-teal-700">Vehicle Weight</label>
                              <Input
                                type="text"
                                placeholder="3.5t"
                                className="border-teal-300"
                                value={row.vehicleWeight}
                                onChange={(e) => updateMM5RowWithAutoSave(row.id, 'vehicleWeight', e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="text-xs text-teal-700">Cost per Mile</label>
                              <div className="flex items-center gap-2">
                                <Input
                                  type="text"
                                  placeholder="£45"
                                  className="border-teal-300 flex-1"
                                  value={row.costPerMile}
                                  onChange={(e) => updateMM5RowWithAutoSave(row.id, 'costPerMile', e.target.value)}
                                />
                                {index === 0 && (
                                  <Button 
                                    size="sm" 
                                    className="bg-teal-600 hover:bg-teal-700 text-white h-8 w-8 p-0 flex-shrink-0"
                                    onClick={addMM5Row}
                                  >
                                    +
                                  </Button>
                                )}
                                {index > 0 && (
                                  <Button 
                                    size="sm" 
                                    variant="destructive"
                                    className="h-8 w-8 p-0 flex-shrink-0"
                                    onClick={() => deleteMM5Row(row.id)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>


          </div>
        )}

        {/* Apply to Sectors Section - P002 Style Cards - For P006a templates */}
        {getTemplateType(categoryId || '') === 'P006a' && (
        <div className="mb-6 relative">
          <DevLabel id="C029" position="top-right" />
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Apply Configuration to Sectors</h3>
            <p className="text-sm text-gray-600">Select additional sectors where this configuration should be applied</p>
          </div>
          
          <div className="grid grid-cols-3 gap-3 mb-4">
            {SECTORS.map((sector) => {
              const isSelected = selectedSectors.includes(sector.id);
              return (
                <Card 
                  key={sector.id}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md relative ${
                    isSelected 
                      ? `border-${sector.color.replace('text-', '').replace('-600', '-300')} bg-${sector.color.replace('text-', '').replace('-600', '-50')}` 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onClick={() => handleSectorToggle(sector.id)}
                >
                  <CardContent className="p-4 text-center relative">
                    {/* Icon */}
                    <div className={`mx-auto w-8 h-8 mb-3 flex items-center justify-center rounded-lg ${
                      isSelected ? sector.bgColor : 'bg-gray-100'
                    }`}>
                      <sector.icon className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-gray-600'}`} />
                    </div>
                    
                    {/* Title */}
                    <h3 className={`font-semibold text-sm mb-1 ${
                      isSelected ? sector.color : 'text-gray-900'
                    }`}>
                      {sector.name}
                    </h3>
                    
                    {/* Description */}
                    <p className="text-xs text-gray-600 mb-3">
                      {sector.description}
                    </p>
                    
                    {/* Status Indicator */}
                    {isSelected && (
                      <div className="absolute top-2 right-2">
                        <Settings className="w-4 h-4 text-gray-600" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
          
          {/* Save Sectors Button */}
          <div className="flex justify-start">
            <Button 
              onClick={handleSaveSectors}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? 'Saving...' : 'Save Sectors'}
            </Button>
          </div>
        </div>
        )}



        {/* Upper Level Pipe Size Configuration - For P006a and P006 templates */}
        {(getTemplateType(categoryId || '') === 'P006a' || getTemplateType(categoryId || '') === 'P006') && (
          <Card className="mb-6 relative">
            <DevLabel id="W020" position="top-right" />
            <CardHeader className="pb-3">
              <CardTitle className="text-black text-lg flex items-center gap-2">
                <Wrench className="w-5 h-5" />
                Pipe Size Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-6 md:grid-cols-8 gap-2">
                {PIPE_SIZES.map((size) => (
                  <Button
                    key={size}
                    variant={selectedPipeSize === size ? 'default' : 'outline'}
                    className={`h-10 text-xs font-medium ${
                      selectedPipeSize === size ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedPipeSize(size)}
                  >
                    {size}mm
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* P007 Pattern - TP1 Template Component */}
        {(() => {
          const templateType = getTemplateType(categoryId || '');
          return templateType === 'P006a' || templateType === 'P006';
        })() && (
          <>
            <TP1Template 
              configId={editId ? parseInt(editId) : 0}
              tp1Data={formData}
              setTp1Data={setFormData}
              selectedPipeSize={formData.pipeSize || '150'}
            />

            {/* W003 Component - Vehicle Travel Rates */}
            <Card className="relative">
              <DevLabel id="W003" position="top-right" />
              <CardHeader className="pb-3">
                <CardTitle className="text-black text-lg flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  Vehicle Travel Rates
                </CardTitle>
              </CardHeader>
              <CardContent className="bg-teal-100 border border-teal-300 rounded-lg">
                <div className="space-y-4">
                  {formData.vehicleTravelRates.map((vehicle, index) => (
                    <div key={vehicle.id} className="space-y-3">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={vehicle.enabled}
                          onChange={(e) => updateVehicleOption(index, 'enabled', e.target.checked)}
                          className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                        />
                        <span className="font-medium text-gray-900">{vehicle.vehicleType} Vehicle</span>
                      </div>
                      {vehicle.enabled && (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="block text-sm font-medium text-gray-700 mb-1">Hourly Rate (£)</span>
                            <Input
                              type="text"
                              value={vehicle.hourlyRate}
                              onChange={(e) => updateVehicleOption(index, 'hourlyRate', e.target.value)}
                              placeholder="Rate"
                            />
                          </div>
                          <div>
                            <span className="block text-sm font-medium text-gray-700 mb-1">Number of Hours</span>
                            <Input
                              type="text"
                              value={vehicle.numberOfHours}
                              onChange={(e) => updateVehicleOption(index, 'numberOfHours', e.target.value)}
                              placeholder="2"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Save Configuration Button */}
            <div className="flex justify-start">
              <Button 
                onClick={handleSaveConfiguration}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? 'Saving...' : 'Save Configuration'}
              </Button>
            </div>
          </>
        )}



      </div>
    </div>
  );
}
