import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Building, Building2, Car, ShieldCheck, HardHat, Users, Settings, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';

// MMP2 Template - EXACT COPY of MMP1 Template for Structural Defects
// This will be customized for MM4 card only after copying MMP1 structure

interface MMP2TemplateProps {
  categoryId: string;
  sector: string;
  editId?: number;
  onSave?: () => void;
}

// MMP2 ID definitions (same as MMP1 - ID1-ID6 following P002 pattern)
const MMP2_IDS = [
  { id: 'id1', name: 'Utilities', label: 'Utilities', description: 'Water, gas, electricity and telecommunications infrastructure', icon: Building, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  { id: 'id2', name: 'Adoption', label: 'Adoption', description: 'New development infrastructure adoption processes', icon: Building2, color: 'text-teal-600', bgColor: 'bg-teal-50' },
  { id: 'id3', name: 'Highways', label: 'Highways', description: 'Road infrastructure and highway drainage systems', icon: Car, color: 'text-orange-600', bgColor: 'bg-orange-50' },
  { id: 'id4', name: 'Insurance', label: 'Insurance', description: 'Insurance claim assessment and documentation', icon: ShieldCheck, color: 'text-red-600', bgColor: 'bg-red-50' },
  { id: 'id5', name: 'Construction', label: 'Construction', description: 'Construction project infrastructure services', icon: HardHat, color: 'text-cyan-600', bgColor: 'bg-cyan-50' },
  { id: 'id6', name: 'Domestic', label: 'Domestic', description: 'Residential and domestic property services', icon: Users, color: 'text-amber-600', bgColor: 'bg-amber-50' }
];

// Same colors as MMP1
const OUTLOOK_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  '#F8C471', '#82E0AA', '#F1948A', '#FFB347', '#D2B4DE', '#A9DFBF', '#F9E79F', '#AED6F1', '#D7BDE2', '#A3E4D7'
];

// Same pipe sizes as MMP1
const UK_PIPE_SIZES = [
  100, 125, 150, 175, 200, 225, 250, 275, 300, 350, 375, 400, 450, 500, 525, 600, 675, 750, 825, 900, 975, 1050, 1200, 1350, 1500, 1800, 2100, 2400
];

export function MMP2Template({ categoryId, sector, editId, onSave }: MMP2TemplateProps) {
  // Same state management as MMP1 - EXACT COPY
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [idsWithConfig, setIdsWithConfig] = useState<string[]>([]);
  const [customPipeSizes, setCustomPipeSizes] = useState<number[]>([]);
  const [selectedColor, setSelectedColor] = useState<string>('#F97316'); // Orange for structural defects
  const [customColor, setCustomColor] = useState<string>('#F97316');
  const [mm4DataByPipeSize, setMm4DataByPipeSize] = useState<Record<string, any[]>>({});
  const [mm5Data, setMm5Data] = useState<any[]>([{ id: 1, vehicleWeight: '', costPerMile: '' }]);
  const [selectedPipeSizeForMM4, setSelectedPipeSizeForMM4] = useState<string>('100');
  const [selectedPipeSizeId, setSelectedPipeSizeId] = useState<number>(1001);
  const [hasUserChanges, setHasUserChanges] = useState<boolean>(false);
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const [showRangeWarning, setShowRangeWarning] = useState<boolean>(false);
  const [pendingRangeValue, setPendingRangeValue] = useState<string>('');
  const [pendingRowId, setPendingRowId] = useState<number | null>(null);

  // Same auto-save functionality as MMP1 - EXACT COPY
  const triggerAutoSave = useCallback(() => {
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }
    
    const timeoutId = setTimeout(async () => {
      const pipeSizeKey = `${selectedPipeSizeForMM4}-${selectedPipeSizeId}`;
      const currentMM4Data = mm4DataByPipeSize[pipeSizeKey] || [{ id: 1, blueValue: '', greenValue: '', purpleDebris: '', purpleLength: '' }];
      
      console.log('💾 MMP2 Data being saved to backend:', [{
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
        // Same mmData format as MMP1
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
              categoryName: 'MMP2 Template',
              description: 'Structural defects template configuration',
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
              categoryName: 'MMP2 Template', 
              description: 'Structural defects template configuration',
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
        console.error('Error saving MMP2 data:', error);
      }
    }, 500);
    
    setAutoSaveTimeout(timeoutId);
  }, [selectedPipeSizeForMM4, selectedPipeSizeId, selectedColor, selectedIds, customPipeSizes, mm4DataByPipeSize, mm5Data, editId, categoryId, sector, autoSaveTimeout, onSave]);

  // Same MM4 data management as MMP1 - EXACT COPY
  const getCurrentMM4Data = () => {
    const pipeSizeKey = `${selectedPipeSizeForMM4}-${selectedPipeSizeId}`;
    console.log(`🔍 MMP2 MM4 Data for key "${pipeSizeKey}":`, mm4DataByPipeSize[pipeSizeKey] || [{ id: 1, blueValue: '', greenValue: '', purpleDebris: '', purpleLength: '' }]);
    console.log('📊 MMP2 All MM4 data by pipe size:', mm4DataByPipeSize);
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
    triggerAutoSave();
  };

  // Range warning handler (same as MMP1)
  const handleRangeWarningResponse = (addDotNineNine: boolean) => {
    if (pendingRowId === null) return;
    
    const currentData = getCurrentMM4Data();
    const finalValue = addDotNineNine ? `${pendingRangeValue}.99` : pendingRangeValue;
    
    console.log(`🔄 MMP2Template: Updating row ${pendingRowId} purpleLength from "${pendingRangeValue}" to "${finalValue}"`);
    
    const newData = currentData.map(row => 
      row.id === pendingRowId ? { ...row, purpleLength: finalValue } : row
    );
    
    const currentPipeSizeKey = `${selectedPipeSizeForMM4}-${selectedPipeSizeId}`;
    const updatedMM4DataByPipeSize = {
      ...mm4DataByPipeSize,
      [currentPipeSizeKey]: newData
    };
    setMm4DataByPipeSize(updatedMM4DataByPipeSize);
    
    updateMM4DataForPipeSize(newData);
    localStorage.setItem('mmp2-mm4DataByPipeSize', JSON.stringify(updatedMM4DataByPipeSize));
    
    setTimeout(() => {
      triggerAutoSave();
      console.log(`✅ MMP2Template: Final state update completed for row ${pendingRowId}`);
    }, 50);
    
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
    triggerAutoSave();
  };

  const deleteMM4Row = (rowId: number) => {
    const currentData = getCurrentMM4Data();
    if (currentData.length <= 1) return;
    
    const newData = currentData.filter(row => row.id !== rowId);
    updateMM4DataForPipeSize(newData);
    triggerAutoSave();
  };

  // Same render structure as MMP1 but with orange theme
  return (
    <div className="space-y-6">
      {/* MM1 - ID1-ID6 Selection (Same as MMP1) */}
      <Card className="bg-white border-2 border-orange-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-orange-900">
            1. Select Configuration IDs (Structural Defects)
          </CardTitle>
          <p className="text-sm text-orange-600">
            Select ID1-ID6 templates for structural defect repairs
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {MMP2_IDS.map((idOption) => {
              const isSelected = selectedIds.includes(idOption.id);
              
              return (
                <Card 
                  key={idOption.id}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md border-2 ${
                    isSelected 
                      ? `border-orange-800 ${idOption.bgColor} ring-2 ring-orange-300` 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onClick={() => {
                    const newSelectedIds = isSelected 
                      ? selectedIds.filter(id => id !== idOption.id)
                      : [...selectedIds, idOption.id];
                    setSelectedIds(newSelectedIds);
                    triggerAutoSave();
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
                    <h3 className="font-medium text-sm text-gray-900 mb-1">{idOption.name}</h3>
                    <p className="text-xs text-gray-600 leading-tight">{idOption.description}</p>
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-2 h-2 bg-orange-500 rounded-full"></div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* MM2 - Custom Pipe Sizes (Same as MMP1) */}
      <Card className="bg-white border-2 border-orange-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-orange-900">
            2. Custom Pipe Sizes
          </CardTitle>
          <p className="text-sm text-orange-600">
            Add custom pipe sizes for structural defect calculations
          </p>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">Standard UK pipe sizes available</p>
          <div className="grid grid-cols-8 gap-2">
            {UK_PIPE_SIZES.map(size => (
              <Badge key={size} variant="outline" className="text-xs p-1">
                {size}mm
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* MM3 - Color Selection (Same as MMP1 but orange theme) */}
      <Card className="bg-white border-2 border-orange-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-orange-900">
            3. Theme Color Selection
          </CardTitle>
          <p className="text-sm text-orange-600">
            Choose color theme for structural defect configurations
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-10 gap-2 mb-4">
            {OUTLOOK_COLORS.map((color, index) => (
              <div
                key={index}
                className={`w-8 h-8 rounded cursor-pointer border-2 ${
                  selectedColor === color ? 'border-gray-800 ring-2 ring-gray-300' : 'border-gray-200'
                }`}
                style={{ backgroundColor: color }}
                onClick={() => {
                  setSelectedColor(color);
                  triggerAutoSave();
                }}
              />
            ))}
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm">Selected:</span>
              <div 
                className="w-6 h-6 rounded border-2 border-gray-300"
                style={{ backgroundColor: selectedColor }}
              />
              <span className="text-sm font-mono">{selectedColor}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* MM4 - Cost Configuration (THIS WILL BE CUSTOMIZED FOR STRUCTURAL DEFECTS) */}
      <Card className="bg-white border-2 border-orange-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-orange-900">
            4. Structural Repair Cost Configuration
          </CardTitle>
          <p className="text-sm text-orange-600">
            Configure costs for structural defect repairs (CUSTOMIZED FOR MMP2)
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Pipe Size Selection */}
            <div className="flex items-center gap-4">
              <Label className="text-sm font-medium">Pipe Size:</Label>
              <Select 
                value={selectedPipeSizeForMM4} 
                onValueChange={(value) => {
                  setSelectedPipeSizeForMM4(value);
                  setSelectedPipeSizeId(parseInt(value + '01'));
                  triggerAutoSave();
                }}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UK_PIPE_SIZES.map(size => (
                    <SelectItem key={size} value={size.toString()}>
                      {size}mm
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* MM4 Data Rows - CUSTOMIZED FOR STRUCTURAL DEFECTS */}
            <div className="space-y-3">
              {getCurrentMM4Data().map((row) => (
                <div key={row.id} className="grid grid-cols-5 gap-3 items-center p-3 bg-orange-50 rounded">
                  <div>
                    <Label className="text-xs text-orange-700">Repair Cost (£)</Label>
                    <Input
                      type="text"
                      value={row.blueValue || ''}
                      onChange={(e) => updateMM4Row(row.id, 'blueValue', e.target.value)}
                      placeholder="2500"
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-orange-700">Workers Needed</Label>
                    <Input
                      type="text"
                      value={row.greenValue || ''}
                      onChange={(e) => updateMM4Row(row.id, 'greenValue', e.target.value)}
                      placeholder="3"
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-orange-700">Severity %</Label>
                    <Input
                      type="text"
                      value={row.purpleDebris || ''}
                      onChange={(e) => updateMM4Row(row.id, 'purpleDebris', e.target.value)}
                      placeholder="75"
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-orange-700">Length M</Label>
                    <Input
                      type="text"
                      value={row.purpleLength || ''}
                      onChange={(e) => updateMM4Row(row.id, 'purpleLength', e.target.value)}
                      placeholder="30.99"
                      className="text-sm"
                    />
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteMM4Row(row.id)}
                      className="h-8 w-8 p-0"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
              
              <Button
                onClick={addMM4Row}
                variant="outline"
                size="sm"
                className="w-full border-orange-300 text-orange-700 hover:bg-orange-50"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Row
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* MM5 - Vehicle Travel Rates (Same as MMP1) */}
      <Card className="bg-white border-2 border-orange-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-orange-900">
            5. Vehicle Travel Rates
          </CardTitle>
          <p className="text-sm text-orange-600">
            Configure vehicle costs for structural defect repairs
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mm5Data.map((row) => (
              <div key={row.id} className="grid grid-cols-3 gap-3 items-center p-3 bg-orange-50 rounded">
                <div>
                  <Label className="text-xs text-orange-700">Vehicle Weight</Label>
                  <Input
                    type="text"
                    value={row.vehicleWeight || ''}
                    onChange={(e) => {
                      const newData = mm5Data.map(r => 
                        r.id === row.id ? { ...r, vehicleWeight: e.target.value } : r
                      );
                      setMm5Data(newData);
                      triggerAutoSave();
                    }}
                    placeholder="7.5t"
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs text-orange-700">Cost per Mile (£)</Label>
                  <Input
                    type="text"
                    value={row.costPerMile || ''}
                    onChange={(e) => {
                      const newData = mm5Data.map(r => 
                        r.id === row.id ? { ...r, costPerMile: e.target.value } : r
                      );
                      setMm5Data(newData);
                      triggerAutoSave();
                    }}
                    placeholder="2.50"
                    className="text-sm"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (mm5Data.length > 1) {
                        const newData = mm5Data.filter(r => r.id !== row.id);
                        setMm5Data(newData);
                        triggerAutoSave();
                      }
                    }}
                    className="h-8 w-8 p-0"
                    disabled={mm5Data.length <= 1}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
            
            <Button
              onClick={() => {
                const newData = [
                  ...mm5Data,
                  { id: mm5Data.length + 1, vehicleWeight: '', costPerMile: '' }
                ];
                setMm5Data(newData);
                triggerAutoSave();
              }}
              variant="outline"
              size="sm"
              className="w-full border-orange-300 text-orange-700 hover:bg-orange-50"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Vehicle
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Range Warning Dialog */}
      <Dialog open={showRangeWarning} onOpenChange={setShowRangeWarning}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-700">
              <AlertTriangle className="w-5 h-5" />
              Range Continuity Warning
            </DialogTitle>
            <DialogDescription>
              You entered "{pendingRangeValue}" for the length range. For continuous ranges, we recommend using "{pendingRangeValue}.99" format.
              <br /><br />
              Example: 0-30.99m, 30.99-60.99m ensures no gaps between ranges.
              <br /><br />
              Would you like to add ".99" to maintain range continuity?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => handleRangeWarningResponse(false)}>
              Keep "{pendingRangeValue}"
            </Button>
            <Button onClick={() => handleRangeWarningResponse(true)}>
              Use "{pendingRangeValue}.99"
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}