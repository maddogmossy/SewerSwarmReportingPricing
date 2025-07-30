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
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';

interface MMP2TemplateProps {
  categoryId: string;
  sector: string;
  editId?: number;
  onSave?: () => void;
}

// MMP2 ID definitions (ID1-ID6 following P002 pattern - matching six sectors)
const MMP2_IDS = [
  { id: 'id1', name: 'Utilities', label: 'Utilities', description: 'Water, gas, electricity and telecommunications infrastructure', icon: Building, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  { id: 'id2', name: 'Adoption', label: 'Adoption', description: 'New development infrastructure adoption processes', icon: Building2, color: 'text-teal-600', bgColor: 'bg-teal-50' },
  { id: 'id3', name: 'Highways', label: 'Highways', description: 'Road infrastructure and highway drainage systems', icon: Car, color: 'text-orange-600', bgColor: 'bg-orange-50' },
  { id: 'id4', name: 'Insurance', label: 'Insurance', description: 'Insurance claim assessment and documentation', icon: ShieldCheck, color: 'text-red-600', bgColor: 'bg-red-50' },
  { id: 'id5', name: 'Construction', label: 'Construction', description: 'Construction project infrastructure services', icon: HardHat, color: 'text-cyan-600', bgColor: 'bg-cyan-50' },
  { id: 'id6', name: 'Domestic', label: 'Domestic', description: 'Residential and domestic property services', icon: Users, color: 'text-amber-600', bgColor: 'bg-amber-50' }
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

export function MMP2Template({ categoryId, sector, editId, onSave }: MMP2TemplateProps) {
  // State management
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [idsWithConfig, setIdsWithConfig] = useState<string[]>([]);
  const [customPipeSizes, setCustomPipeSizes] = useState<number[]>([]);
  const [selectedColor, setSelectedColor] = useState<string>('#D4D4D4');
  const [customColor, setCustomColor] = useState<string>('#D4D4D4');
  const [mm4DataByPipeSize, setMm4DataByPipeSize] = useState<Record<string, any[]>>({});
  const [mm5Data, setMm5Data] = useState<any[]>([{ id: 1, vehicleWeight: '', costPerMile: '' }]);
  const [selectedPipeSizeForMM4, setSelectedPipeSizeForMM4] = useState<string>('100');
  const [selectedPipeSizeId, setSelectedPipeSizeId] = useState<number>(1001);
  const [hasUserChanges, setHasUserChanges] = useState<boolean>(false);
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);

  // Auto-save functionality
  const triggerAutoSave = useCallback(() => {
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }
    
    const timeoutId = setTimeout(async () => {
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

      try {
        if (editId) {
          await apiRequest('PUT', `/api/pr2-clean/${editId}`, {
            mmData: mmData,
            sector: sector
          });
        } else {
          await apiRequest('POST', '/api/pr2-clean', {
            categoryId: categoryId,
            categoryName: `MMP2 Template Configuration`,
            description: `MMP2 template for ${categoryId}`,
            sector: sector,
            mmData: mmData
          });
        }
        
        queryClient.invalidateQueries({ queryKey: ['/api/pr2-clean'] });
        if (onSave) onSave();
      } catch (error) {
        console.error('MMP2 Auto-save failed:', error);
      }
    }, 500);
    
    setAutoSaveTimeout(timeoutId);
  }, [selectedPipeSizeForMM4, selectedPipeSizeId, selectedColor, selectedIds, customPipeSizes, mm4DataByPipeSize, mm5Data, categoryId, sector, editId, onSave, autoSaveTimeout]);

  // Load existing configuration data
  const { data: existingConfig } = useQuery({
    queryKey: ['/api/pr2-clean', editId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/pr2-clean/${editId}`);
      return await response.json();
    },
    enabled: !!editId,
  });

  // Initialize state from existing configuration
  useEffect(() => {
    if (existingConfig?.mmData) {
      const mmData = existingConfig.mmData;
      setSelectedPipeSizeForMM4(mmData.selectedPipeSize || '100');
      setSelectedPipeSizeId(mmData.selectedPipeSizeId || 1001);
      setSelectedColor(mmData.mm1Colors || '#D4D4D4');
      setSelectedIds(mmData.mm2IdData || []);
      setCustomPipeSizes(mmData.mm3CustomPipeSizes || []);
      setMm4DataByPipeSize(mmData.mm4DataByPipeSize || {});
      setMm5Data(mmData.mm5Data || [{ id: 1, vehicleWeight: '', costPerMile: '' }]);
    }
  }, [existingConfig]);

  // MMP2 ID Management
  const handleMMP2IdChange = (idKey: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, idKey]);
    } else {
      setSelectedIds(prev => prev.filter(id => id !== idKey));
    }
    setHasUserChanges(true);
    triggerAutoSave();
  };

  // Color management
  const handleColorChange = (color: string) => {
    setSelectedColor(color);
    setCustomColor(color);
    setHasUserChanges(true);
    triggerAutoSave();
  };

  // MM4 Data management
  const handleMM4DataChange = (index: number, field: string, value: string) => {
    const pipeSizeKey = `${selectedPipeSizeForMM4}-${selectedPipeSizeId}`;
    const currentData = mm4DataByPipeSize[pipeSizeKey] || [{ id: 1, blueValue: '', greenValue: '', purpleDebris: '', purpleLength: '' }];
    
    const updatedData = currentData.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    );
    
    setMm4DataByPipeSize(prev => ({
      ...prev,
      [pipeSizeKey]: updatedData
    }));
    setHasUserChanges(true);
    triggerAutoSave();
  };

  const addMM4Row = () => {
    const pipeSizeKey = `${selectedPipeSizeForMM4}-${selectedPipeSizeId}`;
    const currentData = mm4DataByPipeSize[pipeSizeKey] || [];
    const newId = Math.max(...currentData.map(item => item.id), 0) + 1;
    
    const updatedData = [
      ...currentData,
      { id: newId, blueValue: '', greenValue: '', purpleDebris: '', purpleLength: '' }
    ];
    
    setMm4DataByPipeSize(prev => ({
      ...prev,
      [pipeSizeKey]: updatedData
    }));
    setHasUserChanges(true);
    triggerAutoSave();
  };

  const deleteMM4Row = (index: number) => {
    const pipeSizeKey = `${selectedPipeSizeForMM4}-${selectedPipeSizeId}`;
    const currentData = mm4DataByPipeSize[pipeSizeKey] || [];
    
    if (currentData.length > 1) {
      const updatedData = currentData.filter((_, i) => i !== index);
      setMm4DataByPipeSize(prev => ({
        ...prev,
        [pipeSizeKey]: updatedData
      }));
      setHasUserChanges(true);
      triggerAutoSave();
    }
  };

  // MM5 Data management
  const handleMM5DataChange = (index: number, field: string, value: string) => {
    const updatedData = mm5Data.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    );
    setMm5Data(updatedData);
    setHasUserChanges(true);
    triggerAutoSave();
  };

  const addMM5Row = () => {
    const newId = Math.max(...mm5Data.map(item => item.id), 0) + 1;
    setMm5Data(prev => [...prev, { id: newId, vehicleWeight: '', costPerMile: '' }]);
    setHasUserChanges(true);
    triggerAutoSave();
  };

  const deleteMM5Row = (index: number) => {
    if (mm5Data.length > 1) {
      setMm5Data(prev => prev.filter((_, i) => i !== index));
      setHasUserChanges(true);
      triggerAutoSave();
    }
  };

  const currentMM4Data = mm4DataByPipeSize[`${selectedPipeSizeForMM4}-${selectedPipeSizeId}`] || [{ id: 1, blueValue: '', greenValue: '', purpleDebris: '', purpleLength: '' }];

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-6">
      {/* MMP2 Template Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">MMP2 Template Configuration</h1>
        <p className="text-gray-600">Advanced template configuration for {categoryId}</p>
      </div>

      {/* MM1: Sector Selection Cards */}
      <Card className="w-full">
        <CardHeader className="bg-white text-black">
          <CardTitle className="text-black">MM1: Sector Selection</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-3 gap-4">
            {MMP2_IDS.map((sector) => {
              const IconComponent = sector.icon;
              const isSelected = selectedIds.includes(sector.id);
              const hasConfig = idsWithConfig.includes(sector.id);
              
              return (
                <div
                  key={sector.id}
                  className={`relative cursor-pointer rounded-lg border-2 p-4 text-center transition-colors ${
                    isSelected
                      ? `${sector.bgColor} border-gray-400`
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleMMP2IdChange(sector.id, !isSelected)}
                >
                  <div className="flex flex-col items-center space-y-2">
                    <IconComponent className={`h-8 w-8 ${sector.color}`} />
                    <h3 className="font-semibold text-gray-900">{sector.name}</h3>
                    <p className="text-sm text-gray-600">{sector.description}</p>
                  </div>
                  
                  {hasConfig && (
                    <div className="absolute top-2 right-2">
                      <Settings className="h-4 w-4 text-orange-500" />
                    </div>
                  )}
                  
                  {isSelected && (
                    <Badge className="absolute top-2 left-2 bg-green-100 text-green-800 text-xs">
                      Selected
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* MM2: Enhanced Color Picker */}
      <Card className="w-full">
        <CardHeader className="bg-white text-black">
          <CardTitle className="text-black">MM2: Color Selection</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="grid grid-cols-10 gap-2">
              {OUTLOOK_COLORS.map((color, index) => (
                <button
                  key={index}
                  className={`w-8 h-8 rounded border-2 ${
                    selectedColor === color ? 'border-gray-800' : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => handleColorChange(color)}
                />
              ))}
            </div>
            
            <div className="flex items-center space-x-4">
              <Label htmlFor="custom-color">Custom Color:</Label>
              <input
                id="custom-color"
                type="color"
                value={customColor}
                onChange={(e) => handleColorChange(e.target.value)}
                className="w-12 h-8 border border-gray-300 rounded"
              />
              <Input
                type="text"
                value={customColor}
                onChange={(e) => handleColorChange(e.target.value)}
                placeholder="#D4D4D4"
                className="w-24"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* MM3: UK Drainage Pipe Sizes */}
      <Card className="w-full">
        <CardHeader className="bg-white text-black">
          <CardTitle className="text-black">MM3: UK Drainage Pipe Sizes (MSCC5 Compliant)</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-8 gap-2 mb-4">
            {UK_PIPE_SIZES.map((size) => (
              <Button
                key={size}
                variant={customPipeSizes.includes(size) ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  if (customPipeSizes.includes(size)) {
                    setCustomPipeSizes(prev => prev.filter(s => s !== size));
                  } else {
                    setCustomPipeSizes(prev => [...prev, size].sort((a, b) => a - b));
                  }
                  setHasUserChanges(true);
                  triggerAutoSave();
                }}
              >
                {size}mm
              </Button>
            ))}
          </div>
          <p className="text-sm text-gray-600">
            Selected pipe sizes: {customPipeSizes.length === 0 ? 'None' : customPipeSizes.join('mm, ') + 'mm'}
          </p>
        </CardContent>
      </Card>

      {/* MM4: Advanced Configuration Data */}
      <Card className="w-full">
        <CardHeader className="bg-white text-black">
          <CardTitle className="text-black">MM4: Advanced Configuration Data</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Pipe Size</Label>
                <Select value={selectedPipeSizeForMM4} onValueChange={setSelectedPipeSizeForMM4}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UK_PIPE_SIZES.map((size) => (
                      <SelectItem key={size} value={size.toString()}>{size}mm</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Configuration ID</Label>
                <Input
                  type="number"
                  value={selectedPipeSizeId}
                  onChange={(e) => setSelectedPipeSizeId(parseInt(e.target.value) || 1001)}
                />
              </div>
            </div>

            <div className="space-y-2">
              {currentMM4Data.map((row, index) => (
                <div key={row.id} className="grid grid-cols-5 gap-2 items-center">
                  <Input
                    placeholder="Blue Value"
                    value={row.blueValue || ''}
                    onChange={(e) => handleMM4DataChange(index, 'blueValue', e.target.value)}
                  />
                  <Input
                    placeholder="Green Value"
                    value={row.greenValue || ''}
                    onChange={(e) => handleMM4DataChange(index, 'greenValue', e.target.value)}
                  />
                  <Input
                    placeholder="Purple Debris"
                    value={row.purpleDebris || ''}
                    onChange={(e) => handleMM4DataChange(index, 'purpleDebris', e.target.value)}
                  />
                  <Input
                    placeholder="Purple Length"
                    value={row.purpleLength || ''}
                    onChange={(e) => handleMM4DataChange(index, 'purpleLength', e.target.value)}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteMM4Row(index)}
                    disabled={currentMM4Data.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              
              <Button onClick={addMM4Row} className="mt-2">
                <Plus className="h-4 w-4 mr-2" />
                Add Row
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* MM5: Cost Analysis */}
      <Card className="w-full">
        <CardHeader className="bg-white text-black">
          <CardTitle className="text-black">MM5: Cost Analysis</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-2">
            {mm5Data.map((row, index) => (
              <div key={row.id} className="grid grid-cols-3 gap-2 items-center">
                <Input
                  placeholder="Vehicle Weight"
                  value={row.vehicleWeight || ''}
                  onChange={(e) => handleMM5DataChange(index, 'vehicleWeight', e.target.value)}
                />
                <Input
                  placeholder="Cost Per Mile"
                  value={row.costPerMile || ''}
                  onChange={(e) => handleMM5DataChange(index, 'costPerMile', e.target.value)}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteMM5Row(index)}
                  disabled={mm5Data.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            
            <Button onClick={addMM5Row} className="mt-2">
              <Plus className="h-4 w-4 mr-2" />
              Add Row
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}