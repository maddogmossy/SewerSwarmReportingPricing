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

// 🔒🔒🔒 MMP1 TEMPLATE PROTECTED COMPONENT - DO NOT MODIFY WITHOUT USER PERMISSION 🔒🔒🔒
// ⚠️ WARNING: USER-CONTROLLED TEMPLATE - AI MODIFICATIONS PROHIBITED ⚠️

interface MMP1TemplateProps {
  categoryId: string;
  sector: string;
  editId?: number;
  onSave?: () => void;
}

// MMP1 ID definitions (ID1-ID6 following P002 pattern - matching six sectors)
const MMP1_IDS = [
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

export function MMP1Template({ categoryId, sector, editId, onSave }: MMP1TemplateProps) {
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
              categoryName: 'MMP1 Template',
              description: 'Master template configuration',
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
              categoryName: 'MMP1 Template',
              description: 'Master template configuration',
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
    const newData = currentData.map(row => 
      row.id === rowId ? { ...row, [field]: value } : row
    );
    updateMM4DataForPipeSize(newData);
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
    updateMM4Row(rowId, field, value);
    triggerAutoSave();
  };

  const updateMM5RowWithAutoSave = (rowId: number, field: 'vehicleWeight' | 'costPerMile', value: string) => {
    updateMM5Row(rowId, field, value);
    triggerAutoSave();
  };

  // Handle MMP1 ID selection changes
  const handleMMP1IdChange = async (idKey: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...new Set([...prev, idKey])]);
      setIdsWithConfig(prev => [...new Set([...prev, idKey])]);
    } else {
      setSelectedIds(prev => prev.filter(id => id !== idKey));
      setIdsWithConfig(prev => prev.filter(id => id !== idKey));
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
  const handleMM1ColorChange = (color: string) => {
    setHasUserChanges(true);
    setSelectedColor(color);
    setCustomColor(color);
    queryClient.invalidateQueries({ queryKey: ['/api/pr2-clean'] });
    triggerAutoSave();
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

  return (
    <div className="space-y-6">
      {/* MM1 - ID Selection Cards (P002 Pattern) */}
      <Card className="w-full bg-white">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-black">MM1 - Configuration Templates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {MMP1_IDS.map((id) => {
              const IconComponent = id.icon;
              const isSelected = selectedIds.includes(id.id);
              const hasConfig = idsWithConfig.includes(id.id);
              
              return (
                <div key={id.id} className="relative">
                  <Card 
                    className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                      isSelected 
                        ? `${id.bgColor} border-2 border-blue-300` 
                        : 'bg-white border border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleMMP1IdChange(id.id, !isSelected)}
                  >
                    <CardContent className="p-4 text-center relative">
                      <div className="flex flex-col items-center space-y-2">
                        <IconComponent className={`h-8 w-8 ${isSelected ? id.color : 'text-gray-400'}`} />
                        <h3 className={`font-medium ${isSelected ? 'text-gray-900' : 'text-gray-600'}`}>
                          {id.name}
                        </h3>
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
                    </CardContent>
                  </Card>
                </div>
              );
            })}
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
      <div className="grid grid-cols-3 gap-4">
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

        {/* Purple Card */}
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
    </div>
  );
}