import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Wrench, Users, Clock, DollarSign, Truck } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface MMP2TemplateProps {
  configId: number;
  mmp2Data: any;
  setMmp2Data: (data: any) => void;
  selectedPipeSize: string;
}

export function MMP2Template({ configId, mmp2Data, setMmp2Data, selectedPipeSize }: MMP2TemplateProps) {
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-save function with proper state handling
  const debouncedAutoSave = () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      setMmp2Data((currentData: any) => {
        saveMMP2ConfigWithData(currentData);
        return currentData;
      });
    }, 500);
  };

  // Save function that accepts current data to avoid closure issues
  const saveMMP2ConfigWithData = async (currentData: any) => {
    try {
      const response = await apiRequest('PUT', `/api/pr2-clean/${configId}`, {
        ...currentData,
        mm_data: {
          templateType: 'MMP2',
          categoryId: 'structural-defects',
          mmp2Colors: currentData.mmp2Colors || '#F97316',
          mmp2ColorPicker: currentData.mmp2ColorPicker || '#F97316',
          mmp2CustomPipeSizes: currentData.mmp2CustomPipeSizes || [],
          mmp2DataByPipeSize: currentData.mmp2DataByPipeSize || {},
          mmp2VehicleData: currentData.mmp2VehicleData || [],
          selectedPipeSize: selectedPipeSize,
          selectedPipeSizeId: parseInt(selectedPipeSize + '01'),
          timestamp: Date.now()
        }
      });
      
      if (response.ok) {
        console.log('✅ MMP2 Auto-save successful');
      } else {
        console.error('❌ MMP2 Auto-save failed:', response.statusText);
      }
    } catch (error) {
      console.error('❌ MMP2 Auto-save error:', error);
    }
  };

  // Initialize MMP2 data structure
  useEffect(() => {
    if (!mmp2Data.mmp2DataByPipeSize) {
      const pipeSizeKey = `${selectedPipeSize}-${selectedPipeSize}01`;
      setMmp2Data(prev => ({
        ...prev,
        mmp2DataByPipeSize: {
          [pipeSizeKey]: [
            { id: 1, repairCost: '', workersNeeded: '', hoursRequired: '', materialCost: '' }
          ]
        },
        mmp2VehicleData: [
          { id: 1, vehicleType: '', dailyRate: '' }
        ]
      }));
    }
  }, [selectedPipeSize, mmp2Data.mmp2DataByPipeSize, setMmp2Data]);

  const pipeSizeKey = `${selectedPipeSize}-${selectedPipeSize}01`;
  const currentMMP2Data = mmp2Data.mmp2DataByPipeSize?.[pipeSizeKey]?.[0] || {};
  const vehicleData = mmp2Data.mmp2VehicleData?.[0] || {};

  // Update functions
  const updateRepairData = (field: string, value: string) => {
    setMmp2Data(prev => ({
      ...prev,
      mmp2DataByPipeSize: {
        ...prev.mmp2DataByPipeSize,
        [pipeSizeKey]: [{
          ...currentMMP2Data,
          [field]: value
        }]
      }
    }));
    debouncedAutoSave();
  };

  const updateVehicleData = (field: string, value: string) => {
    setMmp2Data(prev => ({
      ...prev,
      mmp2VehicleData: [{
        ...vehicleData,
        [field]: value
      }]
    }));
    debouncedAutoSave();
  };

  return (
    <div className="space-y-6">
      {/* MMP2-1: Repair Cost Configuration */}
      <Card className="relative border-orange-200 bg-orange-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-orange-800 text-lg flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            MMP2-1: Repair Cost Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="repairCost" className="text-sm font-medium text-gray-700">
                Base Repair Cost (£)
              </Label>
              <Input
                id="repairCost"
                type="text"
                value={currentMMP2Data.repairCost || ''}
                onChange={(e) => updateRepairData('repairCost', e.target.value)}
                placeholder="2500"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="materialCost" className="text-sm font-medium text-gray-700">
                Material Cost (£)
              </Label>
              <Input
                id="materialCost"
                type="text"
                value={currentMMP2Data.materialCost || ''}
                onChange={(e) => updateRepairData('materialCost', e.target.value)}
                placeholder="500"
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* MMP2-2: Workforce Configuration */}
      <Card className="relative border-orange-200 bg-orange-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-orange-800 text-lg flex items-center gap-2">
            <Users className="w-5 h-5" />
            MMP2-2: Workforce Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="workersNeeded" className="text-sm font-medium text-gray-700">
                Workers Needed
              </Label>
              <Input
                id="workersNeeded"
                type="text"
                value={currentMMP2Data.workersNeeded || ''}
                onChange={(e) => updateRepairData('workersNeeded', e.target.value)}
                placeholder="3"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="hoursRequired" className="text-sm font-medium text-gray-700">
                Hours Required
              </Label>
              <Input
                id="hoursRequired"
                type="text"
                value={currentMMP2Data.hoursRequired || ''}
                onChange={(e) => updateRepairData('hoursRequired', e.target.value)}
                placeholder="8"
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* MMP2-3: Vehicle Configuration */}
      <Card className="relative border-orange-200 bg-orange-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-orange-800 text-lg flex items-center gap-2">
            <Truck className="w-5 h-5" />
            MMP2-3: Vehicle Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="vehicleType" className="text-sm font-medium text-gray-700">
                Vehicle Type
              </Label>
              <Input
                id="vehicleType"
                type="text"
                value={vehicleData.vehicleType || ''}
                onChange={(e) => updateVehicleData('vehicleType', e.target.value)}
                placeholder="Excavator"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="dailyRate" className="text-sm font-medium text-gray-700">
                Daily Rate (£)
              </Label>
              <Input
                id="dailyRate"
                type="text"
                value={vehicleData.dailyRate || ''}
                onChange={(e) => updateVehicleData('dailyRate', e.target.value)}
                placeholder="450"
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* MMP2-4: Placeholder for Future Expansion */}
      <Card className="relative border-gray-200 bg-gray-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-gray-600 text-lg flex items-center gap-2">
            <Wrench className="w-5 h-5" />
            MMP2-4: Additional Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-sm">Reserved for future structural defects configuration options</p>
        </CardContent>
      </Card>

      {/* MMP2-5: Placeholder for Future Expansion */}
      <Card className="relative border-gray-200 bg-gray-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-gray-600 text-lg flex items-center gap-2">
            <Clock className="w-5 h-5" />
            MMP2-5: Advanced Options
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-sm">Reserved for advanced structural repair configuration</p>
        </CardContent>
      </Card>
    </div>
  );
}