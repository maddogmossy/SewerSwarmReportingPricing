import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

import { 
  ArrowLeft, 
  Plus, 
  Edit, 
  Trash2, 
  AlertTriangle, 
  CheckCircle,
  Wrench,
  BarChart3,
  Shield,
  AlertCircle
} from "lucide-react";

const PIPE_SIZES = [
  "75mm", "100mm", "110mm", "125mm", "150mm", "160mm", "200mm", 
  "225mm", "250mm", "300mm", "315mm", "355mm", "400mm", "450mm", 
  "500mm", "600mm", "750mm", "900mm", "1050mm", "1200mm"
];

const DEPTH_RANGES = [
  "0-1m", "1-2m", "2-3m", "3-4m", "4-5m", "5m+"
];

// Calculate patch thickness based on depth, pipe size, and defect type (RSM/WRc guidelines)
const calculatePatchThickness = (depthRange: string, pipeSize?: string, defects?: string): string => {
  if (!depthRange) return "double skin patch"; // Default to double layer when no depth specified
  
  const depth = depthRange.toLowerCase();
  const pipeSizeNum = pipeSize ? parseFloat(pipeSize.replace('mm', '')) : 0;
  
  // Check for deformity codes that require thicker patches
  const hasDeformity = defects && (
    defects.includes('DEF') || 
    defects.includes('Deformation') ||
    defects.includes('CR') ||
    defects.includes('Crack') ||
    defects.includes('FC') ||
    defects.includes('Fracture')
  );
  
  // Base calculation by depth:
  // 0-2m: Single skin patch (lighter load, easier access)
  // 2-4m: Standard patch (moderate load)
  // 4-5m: Double skin patch (heavy load, deep excavation requirements)
  // 5m+: Triple layer patch (extreme depth, maximum reinforcement)
  
  let baseThickness = "triple layer patch";
  if (depth.includes("0-1m") || depth.includes("1-2m")) {
    baseThickness = "single skin patch";
  } else if (depth.includes("2-3m") || depth.includes("3-4m")) {
    baseThickness = "standard patch";
  } else if (depth.includes("4-5m")) {
    baseThickness = "double skin patch";
  } else if (depth.includes("5m+")) {
    baseThickness = "triple layer patch";
  }
  
  // Upgrade thickness for large pipes (≥300mm) with structural defects
  if (hasDeformity && pipeSizeNum >= 300) {
    if (baseThickness === "single skin patch") {
      return "standard patch";
    } else if (baseThickness === "standard patch") {
      return "double skin patch";
    }
  }
  
  return baseThickness;
};

// Auto-select cost based on description content
const selectCostFromDescription = (description: string, costValues: {
  singleLayerCost: string;
  doubleLayerCost: string;
  tripleLayerCost: string;
  tripleLayerInfiltrationCost: string;
}, defects?: string): string => {
  if (!description) return "";
  
  const desc = description.toLowerCase();
  
  // Option 4: Triple layer with extra long cure time (when infiltration detected at same point)
  const hasInfiltration = defects && (
    defects.includes('INF') || 
    defects.includes('infiltration') ||
    defects.includes('IN') ||
    defects.includes('water ingress')
  );
  
  if ((desc.includes("triple layer") || desc.includes("triple")) && hasInfiltration) {
    return costValues.tripleLayerInfiltrationCost !== "N/A" ? costValues.tripleLayerInfiltrationCost : "";
  }
  
  // Option 3: Triple layer
  if (desc.includes("triple layer") || desc.includes("triple")) {
    return costValues.tripleLayerCost !== "N/A" ? costValues.tripleLayerCost : "";
  }
  
  // Option 2: Double layer
  if (desc.includes("double") || desc.includes("double skin")) {
    return costValues.doubleLayerCost !== "N/A" ? costValues.doubleLayerCost : "";
  }
  
  // Option 1: Single layer
  if (desc.includes("single") || desc.includes("single skin")) {
    return costValues.singleLayerCost !== "N/A" ? costValues.singleLayerCost : "";
  }
  
  // Default to standard patch (double layer equivalent)
  if (desc.includes("standard patch")) {
    return costValues.doubleLayerCost !== "N/A" ? costValues.doubleLayerCost : "";
  }
  
  return "";
};

const SECTORS = [
  { id: 'utilities', name: 'Utilities', color: 'blue' },
  { id: 'adoption', name: 'Adoption', color: 'green' },
  { id: 'highways', name: 'Highways', color: 'orange' },
  { id: 'insurance', name: 'Insurance', color: 'red' },
  { id: 'construction', name: 'Construction', color: 'purple' },
  { id: 'domestic', name: 'Domestic', color: 'yellow' }
];

export default function RepairPricing() {
  const { sector } = useParams<{ sector: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [deleteScope, setDeleteScope] = useState<'current' | 'all'>('current');
  const [sectorWarningOpen, setSectorWarningOpen] = useState(false);
  const [pendingSectorChange, setPendingSectorChange] = useState<{sectorId: string, checked: boolean} | null>(null);
  const [isComplianceWarningOpen, setIsComplianceWarningOpen] = useState(false);
  const [pendingEditItem, setPendingEditItem] = useState<any>(null);
  const [isDescriptionEditOpen, setIsDescriptionEditOpen] = useState(false);
  const [tempDescription, setTempDescription] = useState("");
  const [isDescriptionEditable, setIsDescriptionEditable] = useState(false);
  const [formData, setFormData] = useState({
    workCategoryId: "",
    pipeSize: "",
    depth: "",
    description: "",
    option1Cost: "N/A",
    option2Cost: "",
    option3Cost: "",
    option4Cost: "",
    option1PerShift: "",
    option2PerShift: "",
    option3PerShift: "",
    option4PerShift: "",
    selectedOption: "",
    rule: "",
    lengthOfRepair: "1000mm",
    minInstallationPerDay: "",
    dayRate: "",
    travelTimeAllowance: "2.0"
  });

  const [applySectors, setApplySectors] = useState<string[]>([]);
  const [originalApplySectors, setOriginalApplySectors] = useState<string[]>([]);
  const [location] = useLocation();

  const currentSector = SECTORS.find(s => s.id === sector) || SECTORS[0];

  // Fetch repair methods
  const { data: workCategories = [] } = useQuery({
    queryKey: ['/api/work-categories'],
  });

  // Fetch existing pricing for this sector
  const { data: pricingData = [], refetch } = useQuery({
    queryKey: [`/api/repair-pricing/${sector}`],
    enabled: !!sector,
  });

  // Auto-focus functionality for navigation from repair options
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const autoFocus = urlParams.get('autoFocus');
    const pipeSize = urlParams.get('pipeSize');
    const pipeDepth = urlParams.get('pipeDepth');
    const meterage = urlParams.get('meterage');
    const itemNo = urlParams.get('itemNo');
    const defects = urlParams.get('defects');
    const recommendations = urlParams.get('recommendations');
    const pipeMaterial = urlParams.get('pipeMaterial');
    
    console.log('URL Parameters received:', {
      autoFocus,
      pipeSize,
      pipeDepth,
      meterage,
      itemNo,
      defects,
      recommendations,
      pipeMaterial
    });
    
    // Auto-open dialog immediately if autoFocus is present
    if (autoFocus) {
      console.log('Auto-focus detected, opening dialog in 1 second...');
      setTimeout(() => {
        setIsAddDialogOpen(true);
      }, 1000);
    }
  }, [location]);

  // Separate useEffect for auto-selection when data is loaded
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const autoFocus = urlParams.get('autoFocus');
    const pipeSize = urlParams.get('pipeSize');
    const pipeDepth = urlParams.get('pipeDepth');
    const meterage = urlParams.get('meterage');
    const itemNo = urlParams.get('itemNo');
    const defects = urlParams.get('defects');
    const recommendations = urlParams.get('recommendations');
    const pipeMaterial = urlParams.get('pipeMaterial');
    
    console.log('Auto-selection check:', { 
      autoFocus, 
      hasWorkCategories: workCategories && workCategories.length > 0,
      workCategories,
      pricingDataLoaded: pricingData !== undefined 
    });
    
    console.log('Full condition check:', {
      autoFocus,
      workCategoriesExists: !!workCategories,
      workCategoriesLength: workCategories?.length,
      pricingDataUndefined: pricingData !== undefined,
      fullCondition: autoFocus && workCategories && workCategories.length > 0 && pricingData !== undefined
    });
    
    if (autoFocus && workCategories && Array.isArray(workCategories) && workCategories.length > 0) {
      console.log('Auto-selection triggered for:', autoFocus);
      
      // Find matching work category
      const matchingCategory = workCategories.find((cat: any) => 
        cat.name.toLowerCase().includes('patch') && autoFocus.toLowerCase().includes('patch')
      ) || workCategories.find((cat: any) => 
        cat.name.toLowerCase().includes(autoFocus.toLowerCase())
      );
      
      if (matchingCategory) {
        console.log('Found matching category:', matchingCategory.name);
        
        // Calculate depth range from dashboard MH depths or use pipeDepth parameter
        const depthRange = pipeDepth || ""; // Use depth from dashboard if available
        const patchThickness = calculatePatchThickness(depthRange, pipeSize, defects);
        
        // Create description with patch thickness and length based on depth
        const patchLength = "1000mm"; // Default patch length (will be updated based on Length of Repair field)
        const description = depthRange 
          ? `To install a ${patchLength} x ${pipeSize}mm ${patchThickness} at ${meterage?.replace('m', '')}mtrs (depth: ${depthRange}) for ${defects}`
          : `To install a ${patchLength} x ${pipeSize}mm ${patchThickness} at ${meterage?.replace('m', '')}mtrs for ${defects}`;
        
        // Set rule - removed depth warning
        const rule = "";
        
        // Set form data and open dialog
        setTimeout(() => {
          setFormData(prev => ({
            ...prev,
            workCategoryId: matchingCategory.id.toString(),
            pipeSize: pipeSize ? `${pipeSize}mm` : prev.pipeSize,
            depth: depthRange, // Auto-populate depth from dashboard
            description: description,
            lengthOfRepair: "1000mm",
            minInstallationPerDay: "",
            dayRate: "800.00",
            travelTimeAllowance: "2.0",
            option1PerShift: "",
            option2PerShift: "",
            option3PerShift: "",
            option4PerShift: "",
            rule: rule
          }));
          setIsDescriptionEditable(false); // Ensure description is locked when auto-populated
          setIsAddDialogOpen(true);
        }, 500);
      }
    }
  }, [location, workCategories, pricingData]);

  // Internal automatic cost selection function based on description analysis
  const selectCostFromDescription = (description: string, defectsData: string = "") => {
    if (!description) return "";
    
    const desc = description.toLowerCase();
    
    // Rule 1: Single layer (defaults to not applicable)
    if (desc.includes("single layer") || desc.includes("single skin")) {
      return ""; // Not applicable for most cases
    }
    
    // Rule 4: Triple layer + extra long cure time (only for infiltration at same point)
    if ((desc.includes("triple layer") || desc.includes("triple skin")) && 
        defectsData.toLowerCase().includes("infiltration") &&
        desc.includes("extra long cure")) {
      // This would use the highest cost option when infiltration is detected
      return "750"; // Example cost for triple layer with extra cure time
    }
    
    // Rule 3: Triple layer (for deep repairs 5m+)
    if (desc.includes("triple layer") || desc.includes("triple skin") || 
        desc.includes("5m") || desc.includes("deep repair")) {
      return "600"; // Example cost for triple layer
    }
    
    // Rule 2: Double layer (standard for 2-4m depth)
    if (desc.includes("double layer") || desc.includes("double skin") ||
        desc.includes("standard") || desc.includes("2m") || desc.includes("3m") || desc.includes("4m")) {
      return "450"; // Example cost for double layer
    }
    
    // Default to double layer for most standard patches
    return "450";
  };

  // Auto-update selected option when description changes
  useEffect(() => {
    if (formData.description) {
      const urlParams = new URLSearchParams(window.location.search);
      const defects = urlParams.get('defects');
      
      const selectedCost = selectCostFromDescription(formData.description, defects || "");
      let optionText = "";
      
      if (selectedCost === "750") {
        optionText = "Option 4 (Triple Layer + Extra Long Cure Time)";
      } else if (selectedCost === "600") {
        optionText = "Option 3 (Triple Layer)";
      } else if (selectedCost === "450") {
        optionText = "Option 2 (Double Layer)";
      } else {
        optionText = "Auto-selected based on description";
      }
      
      setFormData(prev => ({ ...prev, selectedOption: optionText }));
    }
  }, [formData.description]);

  // Update description when Length of Repair changes
  useEffect(() => {
    if (formData.description && formData.lengthOfRepair && isDescriptionEditable) {
      // Extract current description parts to rebuild with new length
      const regex = /To install a (\d+mm) x (\d+mm) (.+?) at (.+?) for (.+)/;
      const match = formData.description.match(regex);
      
      if (match) {
        const [, , pipeSize, patchType, meterage, defects] = match;
        const updatedDescription = `To install a ${formData.lengthOfRepair} x ${pipeSize} ${patchType} at ${meterage} for ${defects}`;
        
        setFormData(prev => ({
          ...prev,
          description: updatedDescription
        }));
      }
    }
  }, [formData.lengthOfRepair, isDescriptionEditable]);

  // Fetch pricing data from all sectors for cross-sector comparison
  const { data: utilitiesPricing = [] } = useQuery({
    queryKey: ['/api/repair-pricing/utilities'],
    enabled: !!sector,
  });
  const { data: adoptionPricing = [] } = useQuery({
    queryKey: ['/api/repair-pricing/adoption'],
    enabled: !!sector,
  });
  const { data: highwaysPricing = [] } = useQuery({
    queryKey: ['/api/repair-pricing/highways'],
    enabled: !!sector,
  });
  const { data: insurancePricing = [] } = useQuery({
    queryKey: ['/api/repair-pricing/insurance'],
    enabled: !!sector,
  });
  const { data: constructionPricing = [] } = useQuery({
    queryKey: ['/api/repair-pricing/construction'],
    enabled: !!sector,
  });
  const { data: domesticPricing = [] } = useQuery({
    queryKey: ['/api/repair-pricing/domestic'],
    enabled: !!sector,
  });

  const allSectorPricing = {
    utilities: utilitiesPricing,
    adoption: adoptionPricing,
    highways: highwaysPricing,
    insurance: insurancePricing,
    construction: constructionPricing,
    domestic: domesticPricing,
  };

  // Create pricing mutation
  const createPricing = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/repair-pricing', data),
    onSuccess: () => {
      // Invalidate all pricing-related queries to ensure dashboard updates
      queryClient.invalidateQueries({ queryKey: [`/api/repair-pricing/${sector}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/user-pricing'] });
      queryClient.invalidateQueries({ queryKey: [`/api/pricing/check/${sector}`] });
      toast({ title: "Pricing added successfully" });
      resetForm();
      setIsAddDialogOpen(false);
      
      // Clear URL parameters to prevent auto-focus from triggering again
      const currentUrl = new URL(window.location.href);
      currentUrl.search = ''; // Clear all search parameters
      window.history.replaceState({}, '', currentUrl.toString());
    },
    onError: (error: any) => {
      toast({ 
        title: "Error adding pricing", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Update pricing mutation
  const updatePricing = useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest('PUT', `/api/repair-pricing/${id}`, data),
    onSuccess: () => {
      // Invalidate all pricing-related queries to ensure dashboard updates
      queryClient.invalidateQueries({ queryKey: [`/api/repair-pricing/${sector}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/user-pricing'] });
      queryClient.invalidateQueries({ queryKey: [`/api/pricing/check/${sector}`] });
      toast({ title: "Pricing updated successfully" });
      resetForm();
      setEditingItem(null);
      setIsAddDialogOpen(false);
      // No automatic navigation - let user stay on pricing page
    },
    onError: (error: any) => {
      toast({ 
        title: "Error updating pricing", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Delete pricing mutation
  const deletePricing = useMutation({
    mutationFn: ({ id, scope }: { id: number; scope: 'current' | 'all' }) => 
      apiRequest('DELETE', `/api/repair-pricing/${id}?scope=${scope}&currentSector=${sector}`),
    onSuccess: (_, variables) => {
      if (variables.scope === 'all') {
        // Invalidate all sector queries when deleting from all sectors
        SECTORS.forEach(s => {
          queryClient.invalidateQueries({ queryKey: [`/api/repair-pricing/${s.id}`] });
        });
        toast({ title: "Pricing deleted from all sectors successfully" });
      } else {
        queryClient.invalidateQueries({ queryKey: [`/api/repair-pricing/${sector}`] });
        toast({ title: "Pricing deleted from current sector successfully" });
      }
    },
    onError: (error: any) => {
      toast({ 
        title: "Error deleting pricing", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const resetForm = () => {
    setFormData({
      workCategoryId: "",
      pipeSize: "",
      depth: "",
      description: "",
      option1Cost: "N/A",
      option2Cost: "",
      option3Cost: "",
      option4Cost: "",
      option1PerShift: "",
      option2PerShift: "",
      option3PerShift: "",
      option4PerShift: "",
      selectedOption: "",
      rule: "",
      lengthOfRepair: "1000mm",
      minInstallationPerDay: "",
      dayRate: "",
      travelTimeAllowance: "2.0"
    });
    setApplySectors([]);
    setOriginalApplySectors([]);
    setIsDescriptionEditable(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Determine which cost to use - find the first non-empty cost value
    let selectedCost = "0";
    if (formData.option2Cost && formData.option2Cost !== "" && formData.option2Cost !== "N/A") {
      selectedCost = formData.option2Cost;
    } else if (formData.option3Cost && formData.option3Cost !== "" && formData.option3Cost !== "N/A") {
      selectedCost = formData.option3Cost;
    } else if (formData.option4Cost && formData.option4Cost !== "" && formData.option4Cost !== "N/A") {
      selectedCost = formData.option4Cost;
    } else if (formData.option1Cost && formData.option1Cost !== "" && formData.option1Cost !== "N/A") {
      selectedCost = formData.option1Cost;
    }
    
    console.log('Form submission debug:', {
      selectedOption: formData.selectedOption,
      selectedCost: selectedCost,
      allCosts: {
        option1: formData.option1Cost,
        option2: formData.option2Cost,
        option3: formData.option3Cost,
        option4: formData.option4Cost
      },
      description: formData.description,
      pipeSize: formData.pipeSize
    });
    
    const baseData = {
      ...formData,
      cost: selectedCost, // Map selected option cost to the cost field
      selectedOption: formData.selectedOption,
      option1Cost: formData.option1Cost,
      option2Cost: formData.option2Cost,
      option3Cost: formData.option3Cost,
      option4Cost: formData.option4Cost
    };

    if (editingItem) {
      // Update existing item
      const submitData = { ...baseData, sector };
      updatePricing.mutate({ id: editingItem.id, ...submitData });
      
      // Handle sectors that were added (new selections)
      const sectorsToAdd = applySectors.filter(s => !originalApplySectors.includes(s));
      if (sectorsToAdd.length > 0) {
        sectorsToAdd.forEach(targetSector => {
          const additionalData = { ...baseData, sector: targetSector };
          createPricing.mutate(additionalData);
        });
      }

      // Handle sectors that were removed (unchecked)
      const sectorsToRemove = originalApplySectors.filter(s => !applySectors.includes(s));
      if (sectorsToRemove.length > 0) {
        sectorsToRemove.forEach(targetSector => {
          // Find and delete the matching pricing rule in that sector
          const targetSectorPricing = (allSectorPricing as any)[targetSector] || [];
          const matchingRule = targetSectorPricing.find((pricing: any) => 
            pricing.workCategoryId === editingItem.workCategoryId &&
            pricing.pipeSize === editingItem.pipeSize &&
            pricing.depth === editingItem.depth &&
            pricing.cost === editingItem.cost
          );
          
          if (matchingRule) {
            deletePricing.mutate(matchingRule.id);
          }
        });
      }
      
      // Show appropriate notification
      if (sectorsToAdd.length > 0 || sectorsToRemove.length > 0) {
        const messages = [];
        if (sectorsToAdd.length > 0) {
          messages.push(`Added to: ${sectorsToAdd.map(s => SECTORS.find(sec => sec.id === s)?.name).join(', ')}`);
        }
        if (sectorsToRemove.length > 0) {
          messages.push(`Removed from: ${sectorsToRemove.map(s => SECTORS.find(sec => sec.id === s)?.name).join(', ')}`);
        }
        
        toast({ 
          title: "Pricing updated across sectors", 
          description: messages.join(' | ')
        });
      }
      
      // Reset apply sectors after submission
      setApplySectors([]);
      setOriginalApplySectors([]);
    } else {
      // Create new pricing rule(s)
      const sectorsToApply = [sector, ...applySectors];
      
      // Create pricing for current sector first
      const submitData = { ...baseData, sector };
      createPricing.mutate(submitData);
      
      // Create pricing for additional selected sectors
      if (applySectors.length > 0) {
        applySectors.forEach(targetSector => {
          const additionalData = { ...baseData, sector: targetSector };
          createPricing.mutate(additionalData);
        });
        
        toast({ 
          title: `Pricing added to ${sectorsToApply.length} sectors`, 
          description: `Applied to: ${sectorsToApply.map(s => SECTORS.find(sec => sec.id === s)?.name).join(', ')}`
        });
      }
      
      // Reset apply sectors after submission
      setApplySectors([]);
    }
  };

  // Find sectors that have matching pricing rules
  const findMatchingSectors = (item: any) => {
    const matchingSectors: string[] = [];
    
    SECTORS.forEach(s => {
      if (s.id === sector) return; // Skip current sector
      
      const sectorPricing = (allSectorPricing as any)[s.id] || [];
      const hasMatching = sectorPricing.some((pricing: any) => 
        pricing.workCategoryId === item.workCategoryId &&
        pricing.pipeSize === item.pipeSize &&
        pricing.depth === item.depth &&
        pricing.cost === item.cost
      );
      
      if (hasMatching) {
        matchingSectors.push(s.id);
      }
    });
    
    return matchingSectors;
  };

  const handleEdit = (item: any) => {
    // Go directly to edit mode (bypassing compliance warning as requested)
    console.log("handleEdit called, going directly to edit mode");
    proceedWithEditDirectly(item);
  };

  // Direct edit function that bypasses compliance warning
  const proceedWithEditDirectly = (item: any) => {
    console.log("proceedWithEditDirectly called, setting up edit mode");
    
    setFormData({
      workCategoryId: item.workCategoryId?.toString() || "",
      pipeSize: item.pipeSize,
      depth: item.depth || "",
      description: item.description || "",
      rule: item.rule || "",
      lengthOfRepair: item.lengthOfRepair || "1000mm",
      minInstallationPerDay: item.minInstallationPerDay?.toString() || "",
      dayRate: item.dayRate?.toString() || "",
      travelTimeAllowance: item.travelTimeAllowance?.toString() || "2.0",
      option1Cost: item.option1Cost?.toString() || "N/A",
      option2Cost: item.option2Cost?.toString() || "",
      option3Cost: item.option3Cost?.toString() || "",
      option4Cost: item.option4Cost?.toString() || "",
      option1PerShift: item.option1PerShift?.toString() || "",
      option2PerShift: item.option2PerShift?.toString() || "",
      option3PerShift: item.option3PerShift?.toString() || "",
      option4PerShift: item.option4PerShift?.toString() || "",
      selectedOption: item.selectedOption || ""
    });
    
    // Pre-select sectors that already have this pricing rule
    const matchingSectors = findMatchingSectors(item);
    setApplySectors(matchingSectors);
    setOriginalApplySectors(matchingSectors); // Track original state
    
    setIsDescriptionEditable(false); // Keep description locked - user must go through compliance warning to edit
    setEditingItem(item);
    setIsAddDialogOpen(true);
  };

  // Proceed with edit after compliance warning
  const proceedWithEdit = () => {
    const item = pendingEditItem;
    if (!item) return;

    console.log("proceedWithEdit called, setting up edit mode after compliance warning");
    
    setFormData({
      workCategoryId: item.workCategoryId?.toString() || "",
      pipeSize: item.pipeSize,
      depth: item.depth || "",
      description: item.description || "",
      rule: item.rule || "",
      lengthOfRepair: item.lengthOfRepair || "1000mm",
      minInstallationPerDay: item.minInstallationPerDay?.toString() || "",
      dayRate: item.dayRate?.toString() || "",
      travelTimeAllowance: item.travelTimeAllowance?.toString() || "2.0",
      option1Cost: item.option1Cost?.toString() || "N/A",
      option2Cost: item.option2Cost?.toString() || "",
      option3Cost: item.option3Cost?.toString() || "",
      option4Cost: item.option4Cost?.toString() || "",
      option1PerShift: item.option1PerShift?.toString() || "",
      option2PerShift: item.option2PerShift?.toString() || "",
      option3PerShift: item.option3PerShift?.toString() || "",
      option4PerShift: item.option4PerShift?.toString() || "",
      selectedOption: item.selectedOption || ""
    });
    
    // Pre-select sectors that already have this pricing rule
    const matchingSectors = findMatchingSectors(item);
    setApplySectors(matchingSectors);
    setOriginalApplySectors(matchingSectors); // Track original state
    
    setEditingItem(item);
    setIsDescriptionEditable(true); // Enable description editing after compliance warning
    console.log("Set isDescriptionEditable to true after compliance warning");
    setIsAddDialogOpen(true);
    setIsComplianceWarningOpen(false);
    setPendingEditItem(null);
  };

  // Handle checkbox changes with warnings for removal
  const handleSectorCheckboxChange = (sectorId: string, checked: boolean) => {
    if (!checked && originalApplySectors.includes(sectorId)) {
      // User is trying to uncheck a sector that originally had this pricing
      setPendingSectorChange({ sectorId, checked });
      setSectorWarningOpen(true);
      return;
    }
    
    setApplySectors(prev => 
      checked 
        ? [...prev, sectorId]
        : prev.filter(id => id !== sectorId)
    );
  };

  const confirmSectorChange = () => {
    if (pendingSectorChange) {
      setApplySectors(prev => 
        pendingSectorChange.checked 
          ? [...prev, pendingSectorChange.sectorId]
          : prev.filter(id => id !== pendingSectorChange.sectorId)
      );
      setSectorWarningOpen(false);
      setPendingSectorChange(null);
    }
  };

  const handleDelete = (item: any) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      deletePricing.mutate({ id: itemToDelete.id, scope: deleteScope });
      setDeleteDialogOpen(false);
      setItemToDelete(null);
      setDeleteScope('current'); // Reset to default
    }
  };

  const groupedData = workCategories.reduce((acc: any, category: any) => {
    acc[category.name] = pricingData.filter((item: any) => item.workCategoryId === category.id);
    return acc;
  }, {});

  console.log('RepairPricing rendering, sector:', sector, 'currentSector:', currentSector);
  console.log('isAddDialogOpen:', isAddDialogOpen);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/sector-pricing">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Sectors
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button variant="outline" size="sm" className="text-green-600 border-green-600 hover:bg-green-50">
                <BarChart3 className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
            </Link>

          </div>
          
          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => { 
              console.log('Add Pricing button clicked');
              resetForm(); 
              setEditingItem(null); 
              setIsAddDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Pricing
          </Button>
        </div>

        {/* Sector Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-${currentSector.color}-100`}>
                <Wrench className={`h-6 w-6 text-${currentSector.color}-600`} />
              </div>
              <div>
                <CardTitle className="text-2xl">{currentSector.name} Sector Pricing</CardTitle>
                <p className="text-slate-600">Configure pricing for CCTV surveys, jetting, tankering, and directional water cutting</p>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Repair Methods Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {workCategories.map((category: any) => {
            const categoryPricing = groupedData[category.name] || [];
            
            return (
              <Card key={category.id} data-category={category.name.toLowerCase()}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Wrench className="h-5 w-5" />
                      {category.name}
                    </CardTitle>
                    <Badge variant={categoryPricing.length > 0 ? "default" : "secondary"}>
                      {categoryPricing.length} configs
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600">{category.description}</p>
                </CardHeader>
                
                <CardContent className="space-y-2">
                  {categoryPricing.length === 0 ? (
                    <div className="text-center py-4 text-slate-500">
                      <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-orange-400" />
                      <p className="text-xs">No pricing configured</p>
                      <p className="text-xs">Click "Add Pricing" to configure</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {categoryPricing.map((item: any) => (
                        <div key={item.id} className="p-2 border rounded bg-white">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {item.pipeSize}
                              </Badge>
                              {item.depth && (
                                <Badge variant="outline" className="text-xs">
                                  {item.depth}
                                </Badge>
                              )}
                            </div>
                            <span className="font-medium text-lg">
                              £{parseFloat(item.cost).toFixed(2)}
                            </span>
                          </div>
                          
                          {/* Description - Compact layout */}
                          <div className="mb-2">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 mr-3">
                                <p className="text-sm text-slate-700 leading-relaxed">
                                  {(() => {
                                    // Extract dimensions for display (e.g., "1000mm x 300mm")
                                    const description = item.description?.replace(/\s*\(Item No:\s*\d+\)\s*/g, '').trim();
                                    const dimensionMatch = description?.match(/(\d+mm\s*x\s*\d+mm)/);
                                    return dimensionMatch ? dimensionMatch[1] : description;
                                  })()}
                                </p>
                              </div>
                              <div className="flex gap-1 flex-shrink-0">
                                <button
                                  onClick={() => handleEdit(item)}
                                  className="p-2 hover:bg-slate-100 rounded text-slate-600"
                                  title="Edit pricing"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(item)}
                                  className="p-2 hover:bg-red-100 rounded text-red-600"
                                  title="Delete pricing"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                          
                          {item.rule && (
                            <div className="text-xs p-2 bg-yellow-50 border border-yellow-200 rounded">
                              <span className="font-medium">Rule:</span> {item.rule}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Add/Edit Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? 'Edit' : 'Add'} Repair Pricing
              </DialogTitle>
              <DialogDescription>
                Configure pricing for {currentSector.name.toLowerCase()} sector repair work
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="workCategoryId">Work Category</Label>
                <Select
                  value={formData.workCategoryId}
                  onValueChange={(value) => setFormData({ ...formData, workCategoryId: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    {workCategories.map((category: any) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pipeSize">Pipe Size</Label>
                  <Select
                    value={formData.pipeSize}
                    onValueChange={(value) => {
                      // Get current defects from URL parameters for patch thickness calculation
                      const urlParams = new URLSearchParams(window.location.search);
                      const defects = urlParams.get('defects') || '';
                      
                      // Recalculate patch thickness when pipe size changes
                      const newPatchThickness = calculatePatchThickness(formData.depth, value, defects);
                      const currentDesc = formData.description;
                      
                      // Update patch thickness in description if it contains patch-related terms
                      let updatedDescription = currentDesc;
                      if (currentDesc.includes('patch') || currentDesc.includes('To install')) {
                        // Update pipe size in description
                        updatedDescription = currentDesc
                          .replace(/\d+mm/g, value) // Replace pipe size
                          .replace(/single skin patch|standard patch|double skin patch|triple layer patch/g, newPatchThickness); // Update patch thickness
                      } else if (currentDesc) {
                        // If no patch terms but description exists, try to add patch info
                        updatedDescription = currentDesc + ` - ${newPatchThickness} at ${value}`;
                      } else {
                        // If no description at all, create one
                        updatedDescription = `To install a ${newPatchThickness} at ${value}`;
                      }
                      
                      setFormData({ ...formData, pipeSize: value, description: updatedDescription });
                    }}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Size" />
                    </SelectTrigger>
                    <SelectContent>
                      {PIPE_SIZES.map((size) => (
                        <SelectItem key={size} value={size}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="depth">Depth (optional)</Label>
                  <Select
                    value={formData.depth}
                    onValueChange={(value) => {
                      // Get current defects from URL parameters for patch thickness calculation
                      const urlParams = new URLSearchParams(window.location.search);
                      const defects = urlParams.get('defects') || '';
                      
                      // Update depth and recalculate description with patch thickness
                      const newPatchThickness = calculatePatchThickness(value, formData.pipeSize, defects);
                      const currentDesc = formData.description;
                      
                      // Update patch thickness in description if it contains patch-related terms
                      let updatedDescription = currentDesc;
                      if (currentDesc.includes('patch') || currentDesc.includes('To install')) {
                        // Replace any existing patch thickness terms with new calculation
                        updatedDescription = currentDesc
                          .replace(/single skin patch|standard patch|double skin patch|triple layer patch/g, newPatchThickness)
                          .replace(/\(depth: [^)]*\)/g, value ? `(depth: ${value})` : '');
                        
                        // If no depth info was in description but value is provided, add it
                        if (value && !currentDesc.includes('(depth:')) {
                          updatedDescription = updatedDescription.replace(
                            /(patch at [^)]*)/,
                            `$1 (depth: ${value})`
                          );
                        }
                      } else if (currentDesc && value) {
                        // If no patch terms but description exists, try to add patch info
                        updatedDescription = currentDesc + ` - ${newPatchThickness} (depth: ${value})`;
                      } else if (value) {
                        // If no description at all but depth is selected, create one
                        updatedDescription = `To install a ${newPatchThickness} (depth: ${value})`;
                      }
                      
                      // Update rule based on depth selection
                      const newRule = "";
                      
                      setFormData({ 
                        ...formData, 
                        depth: value,
                        description: updatedDescription,
                        rule: newRule
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Depth" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEPTH_RANGES.map((depth) => (
                        <SelectItem key={depth} value={depth}>
                          {depth}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Label htmlFor="description">Description</Label>
                  {!isDescriptionEditable && (
                    <span className="text-xs text-gray-500">(Click shield icon to edit)</span>
                  )}
                </div>
                <div className="relative">
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => {
                      console.log("Description field onChange triggered");
                      setFormData({ ...formData, description: e.target.value });
                    }}
                    placeholder="e.g., Standard structural patch repair"
                    className={`pr-8 ${!isDescriptionEditable ? 'bg-gray-100 text-gray-500' : ''}`}
                    disabled={!isDescriptionEditable}
                  />

                  {formData.description.includes('patch') && (
                    <Shield className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-600" />
                  )}
                </div>
              </div>

              {/* COSTING OPTIONS - USING CONSISTENT HTML FORM ELEMENTS */}
              <div className="border-2 border-blue-200 p-4 rounded-lg bg-blue-50">
                <label className="text-lg font-bold text-blue-800">🔹 COSTING OPTIONS 🔹</label>
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div>
                    <label className="text-sm font-medium">1. Single Layer (£)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.option1Cost}
                      onChange={(e) => setFormData({ ...formData, option1Cost: e.target.value })}
                      placeholder="0.00"
                      className="w-full mt-1 p-2 border rounded-md border-blue-300"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">2. Double Layer (£)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.option2Cost}
                      onChange={(e) => setFormData({ ...formData, option2Cost: e.target.value })}
                      placeholder="0.00"
                      className="w-full mt-1 p-2 border rounded-md border-blue-300"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">3. Triple Layer (£)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.option3Cost}
                      onChange={(e) => setFormData({ ...formData, option3Cost: e.target.value })}
                      placeholder="0.00"
                      className="w-full mt-1 p-2 border rounded-md border-blue-300"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">4. Triple Layer + Extra Long Cure Time (£)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.option4Cost}
                      onChange={(e) => setFormData({ ...formData, option4Cost: e.target.value })}
                      placeholder="0.00"
                      className="w-full mt-1 p-2 border rounded-md border-blue-300"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="selectedOption">Selected Option</Label>
                <Input
                  id="selectedOption"
                  value={formData.selectedOption || "Auto-selected based on description"}
                  readOnly
                  className="bg-gray-50"
                  />
              </div>



              <div>
                <Label>Apply to Other Sectors</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {SECTORS.filter(s => s.id !== sector).map((sectorOption) => (
                    <div key={sectorOption.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={sectorOption.id}
                        checked={applySectors.includes(sectorOption.id)}
                        onChange={(e) => handleSectorCheckboxChange(sectorOption.id, e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <Label 
                        htmlFor={sectorOption.id}
                        className={`text-sm text-${sectorOption.color}-600 cursor-pointer`}
                      >
                        {sectorOption.name}
                      </Label>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Tick boxes to copy this pricing rule to other sectors
                </p>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createPricing.isPending || updatePricing.isPending}
                >
                  {editingItem ? 'Update' : 'Add'} Pricing
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Delete Pricing Configuration
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this pricing configuration?
                {itemToDelete && (
                  <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                    <strong>{itemToDelete.description}</strong> - {itemToDelete.pipeSize} - £{itemToDelete.cost}
                  </div>
                )}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700">Delete scope:</p>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="delete-current"
                      name="delete-scope"
                      value="current"
                      checked={deleteScope === 'current'}
                      onChange={(e) => setDeleteScope(e.target.value as 'current' | 'all')}
                      className="h-4 w-4 text-blue-600"
                    />
                    <Label htmlFor="delete-current" className="text-sm">
                      Delete from <strong>{SECTORS.find(s => s.id === sector)?.name || sector}</strong> sector only
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="delete-all"
                      name="delete-scope"
                      value="all"
                      checked={deleteScope === 'all'}
                      onChange={(e) => setDeleteScope(e.target.value as 'current' | 'all')}
                      className="h-4 w-4 text-red-600"
                    />
                    <Label htmlFor="delete-all" className="text-sm">
                      Delete from <strong>all sectors</strong> (utilities, adoption, highways, insurance, construction, domestic)
                    </Label>
                  </div>
                </div>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-xs text-yellow-800">
                  {deleteScope === 'current' 
                    ? `This will only remove the pricing from the ${SECTORS.find(s => s.id === sector)?.name || sector} sector. Other sectors will keep this pricing.`
                    : 'This will remove the pricing configuration from ALL sectors where it exists. This action cannot be undone.'
                  }
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
                disabled={deletePricing.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                disabled={deletePricing.isPending}
              >
                {deletePricing.isPending ? "Deleting..." : 
                  deleteScope === 'all' ? "Delete from All Sectors" : "Delete from Current Sector"
                }
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Pricing Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? 'Edit Pricing' : 'Add New Pricing Configuration'}
              </DialogTitle>
              <DialogDescription>
                Configure pricing for {currentSector.name.toLowerCase()} sector repairs and maintenance work.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Work Category</label>
                  <select
                    value={formData.workCategoryId}
                    onChange={(e) => setFormData({...formData, workCategoryId: e.target.value})}
                    className="w-full mt-1 p-2 border rounded-md"
                    required
                  >
                    <option value="">Select category...</option>
                    {workCategories && workCategories.map((cat: any) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium">Pipe Size</label>
                  <select
                    value={formData.pipeSize}
                    onChange={(e) => setFormData({...formData, pipeSize: e.target.value})}
                    className="w-full mt-1 p-2 border rounded-md"
                    required
                  >
                    <option value="">Select size...</option>
                    {PIPE_SIZES.map(size => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Depth Range (Optional)</label>
                  <select
                    value={formData.depth}
                    onChange={(e) => setFormData({...formData, depth: e.target.value})}
                    className="w-full mt-1 p-2 border rounded-md"
                  >
                    <option value="">No depth specification</option>
                    {DEPTH_RANGES.map(depth => (
                      <option key={depth} value={depth}>{depth}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col justify-end">
                  <div className="flex items-center gap-2 mb-2">
                    <label className="text-sm font-medium text-gray-600">Edit description</label>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (editingItem) {
                        setPendingEditItem(editingItem);
                        setIsComplianceWarningOpen(true);
                      } else {
                        // If no editingItem, just enable editing directly
                        setIsDescriptionEditable(true);
                      }
                    }}
                    className="h-10 px-3 text-xs"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <label className="text-sm font-medium">Description</label>
                  <span className="text-xs text-gray-500">
                    (Editable: {isDescriptionEditable ? 'Yes' : 'No'})
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => {
                      console.log("Description onChange triggered, isDescriptionEditable:", isDescriptionEditable);
                      setFormData({...formData, description: e.target.value});
                    }}
                    className={`w-full mt-1 p-2 border rounded-md pr-8 ${
                      !isDescriptionEditable ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
                    }`}
                    placeholder="e.g., Patch repair for structural defects"
                    readOnly={!isDescriptionEditable}
                  />
                  {formData.description.includes('patch') && (
                    <Shield className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-600" />
                  )}
                </div>
              </div>



              {/* COSTING OPTIONS - SIMPLE VALUE ENTRY BOXES */}
              <div className="border-2 border-blue-200 p-4 rounded-lg bg-blue-50">
                <label className="text-lg font-bold text-blue-800">🔹 COSTING OPTIONS 🔹</label>
                <div className="space-y-4 mt-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">1. Single Layer (£)</label>
                      <div className="flex items-center gap-2 mt-1">
                        {formData.option1Cost === "N/A" ? (
                          <>
                            <div className="bg-gray-100 border rounded-md px-3 py-2 text-gray-600 font-medium flex-1">
                              N/A
                            </div>
                            <button
                              type="button"
                              onClick={() => setFormData({ ...formData, option1Cost: "" })}
                              className="px-3 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600"
                            >
                              Edit
                            </button>
                          </>
                        ) : (
                          <>
                            <input
                              type="text"
                              value={formData.option1Cost}
                              onChange={(e) => setFormData({ ...formData, option1Cost: e.target.value })}
                              placeholder="Enter price"
                              className="flex-1 p-2 border rounded-md border-blue-300"
                            />
                            <button
                              type="button"
                              onClick={() => setFormData({ ...formData, option1Cost: "N/A" })}
                              className="px-3 py-2 text-sm bg-gray-500 text-white rounded-md hover:bg-gray-600"
                            >
                              Reset
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Installed Per shift</label>
                      <input
                        type="text"
                        value={formData.option1PerShift || ""}
                        onChange={(e) => setFormData({ ...formData, option1PerShift: e.target.value })}
                        placeholder="0"
                        className={`w-full mt-1 p-2 border rounded-md ${formData.option1Cost === "N/A" ? 'bg-gray-100 text-gray-600 border-gray-300' : 'border-blue-300'}`}
                        readOnly={formData.option1Cost === "N/A"}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">2. Double Layer (£)</label>
                      <input
                        type="text"
                        value={formData.option2Cost}
                        onChange={(e) => setFormData({ ...formData, option2Cost: e.target.value })}
                        placeholder="0.00"
                        className="w-full mt-1 p-2 border rounded-md border-blue-300"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Installed Per shift</label>
                      <input
                        type="text"
                        value={formData.option2PerShift || ""}
                        onChange={(e) => setFormData({ ...formData, option2PerShift: e.target.value })}
                        placeholder="3"
                        className="w-full mt-1 p-2 border rounded-md border-blue-300"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">3. Triple Layer (£)</label>
                      <input
                        type="text"
                        value={formData.option3Cost}
                        onChange={(e) => setFormData({ ...formData, option3Cost: e.target.value })}
                        placeholder="0.00"
                        className="w-full mt-1 p-2 border rounded-md border-blue-300"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Installed Per shift</label>
                      <input
                        type="text"
                        value={formData.option3PerShift || ""}
                        onChange={(e) => setFormData({ ...formData, option3PerShift: e.target.value })}
                        placeholder="3"
                        className="w-full mt-1 p-2 border rounded-md border-blue-300"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">4. Triple Layer + Extra Long Cure Time (£)</label>
                      <input
                        type="text"
                        value={formData.option4Cost}
                        onChange={(e) => setFormData({ ...formData, option4Cost: e.target.value })}
                        placeholder="0.00"
                        className="w-full mt-1 p-2 border rounded-md border-blue-300"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Installed Per shift</label>
                      <input
                        type="text"
                        value={formData.option4PerShift || ""}
                        onChange={(e) => setFormData({ ...formData, option4PerShift: e.target.value })}
                        placeholder="2"
                        className="w-full mt-1 p-2 border rounded-md border-blue-300"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="lengthOfRepair">Length of Repair</Label>
                  <Select
                    value={formData.lengthOfRepair}
                    onValueChange={(value) => setFormData({...formData, lengthOfRepair: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select length" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="600mm">600mm</SelectItem>
                      <SelectItem value="1000mm">1000mm</SelectItem>
                    </SelectContent>
                  </Select>
                </div>


              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-sm font-medium">Day Rate (£)</label>
                  <input
                    type="text"
                    value={formData.dayRate}
                    onChange={(e) => setFormData({...formData, dayRate: e.target.value})}
                    className="w-full mt-1 p-2 border rounded-md"
                    placeholder="800.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Travel Time Allowance (hours)</label>
                  <input
                    type="text"
                    value={formData.travelTimeAllowance}
                    onChange={(e) => setFormData({...formData, travelTimeAllowance: e.target.value})}
                    className="w-full mt-1 p-2 border rounded-md"
                    placeholder="2.0"
                  />
                </div>


              </div>



              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createPricing.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {createPricing.isPending ? "Saving..." : (editingItem ? "Update Pricing" : "Add Pricing")}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Sector Removal Warning Dialog */}
        <Dialog open={sectorWarningOpen} onOpenChange={setSectorWarningOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                Remove Sector Pricing
              </DialogTitle>
              <DialogDescription>
                {pendingSectorChange && (
                  <>
                    This will remove pricing from the <strong>{SECTORS.find(s => s.id === pendingSectorChange.sectorId)?.name}</strong> sector. 
                    <br />
                    Are you sure you want to continue?
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setSectorWarningOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmSectorChange}
              >
                Remove Sector
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Standards Compliance Warning Dialog */}
        <Dialog open={isComplianceWarningOpen} onOpenChange={setIsComplianceWarningOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-600" />
                Standards Compliance Warning
              </DialogTitle>
              <DialogDescription className="space-y-3">
                <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded">
                  <Shield className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-800">This pricing follows {
                    sector === 'utilities' ? 'WRc/MSCC5' : 
                    sector === 'adoption' ? 'OS20x Adoption' :
                    sector === 'highways' ? 'HADDMS' :
                    sector === 'construction' ? 'BS EN 1610:2015' :
                    sector === 'insurance' ? 'ABI Guidelines' : 'Trading Standards'
                  } standards</span>
                </div>
                
                <p>
                  Editing this pricing may affect compliance with industry standards. 
                  The description and costs are locked to ensure standards compliance.
                </p>
                
                <p className="text-sm text-slate-600">
                  Are you sure you want to edit this standards-compliant pricing configuration?
                </p>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsComplianceWarningOpen(false);
                  setPendingEditItem(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="default"
                onClick={proceedWithEdit}
                className="bg-amber-600 hover:bg-amber-700"
              >
                Proceed with Edit
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Description Edit Dialog */}
        <Dialog open={isDescriptionEditOpen} onOpenChange={setIsDescriptionEditOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5" />
                Edit Description
              </DialogTitle>
              <DialogDescription>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded">
                    <Shield className="h-4 w-4 text-amber-600" />
                    <span className="font-medium text-amber-800">Standards Compliance Warning</span>
                  </div>
                  
                  <p>
                    This description is auto-generated based on industry standards. 
                    Manual edits may affect compliance with {
                      sector === 'utilities' ? 'WRc/MSCC5' : 
                      sector === 'adoption' ? 'OS20x Adoption' :
                      sector === 'highways' ? 'HADDMS' :
                      sector === 'construction' ? 'BS EN 1610:2015' :
                      sector === 'insurance' ? 'ABI Guidelines' : 'Trading Standards'
                    } standards.
                  </p>
                </div>
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="tempDescription">Description</Label>
                <Textarea
                  id="tempDescription"
                  value={tempDescription}
                  onChange={(e) => setTempDescription(e.target.value)}
                  placeholder="Enter detailed repair description..."
                  rows={4}
                  className="mt-1"
                />
              </div>
              
              <div className="text-sm text-slate-600">
                <p className="font-medium mb-2">Description should include:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Pipe size and material specifications</li>
                  <li>Repair method and patch type</li>
                  <li>Installation depth and location</li>
                  <li>Defect type being addressed</li>
                </ul>
              </div>
            </div>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsDescriptionEditOpen(false);
                  setTempDescription("");
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setFormData({ ...formData, description: tempDescription });
                  setIsDescriptionEditOpen(false);
                  setTempDescription("");
                }}
                className="bg-amber-600 hover:bg-amber-700"
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}