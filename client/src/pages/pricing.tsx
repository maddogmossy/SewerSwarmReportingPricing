import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, RotateCcw, Save, Wrench, Building, Car, Shield, Banknote, House, Home } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";

interface CostBand {
  id?: number;
  grade: number;
  costBand: string;
  sector: string;
  isActive?: boolean;
}

const sectors = [
  { id: 'utilities', name: 'Utilities', icon: Wrench, color: 'text-blue-600' },
  { id: 'adoption', name: 'Adoption', icon: Building, color: 'text-green-600' },
  { id: 'highways', name: 'Highways', icon: Car, color: 'text-orange-600' },
  { id: 'insurance', name: 'Insurance', icon: Shield, color: 'text-red-600' },
  { id: 'construction', name: 'Construction', icon: Banknote, color: 'text-purple-600' },
  { id: 'domestic', name: 'Domestic', icon: House, color: 'text-amber-600' }
];

const gradeDescriptions = {
  0: 'No defects - No action required',
  1: 'Minor defects - Monitoring recommended',
  2: 'Moderate defects - Minor repairs needed',
  3: 'Significant defects - Major repairs required',
  4: 'Severe defects - Urgent intervention needed',
  5: 'Critical defects - Immediate replacement required'
};

export default function Pricing() {
  const [selectedSector, setSelectedSector] = useState('utilities');
  const [editingCostBands, setEditingCostBands] = useState<{ [key: number]: string }>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: costBands = [], isLoading } = useQuery<CostBand[]>({
    queryKey: [`/api/cost-bands/${selectedSector}`],
    enabled: !!selectedSector
  });

  const updateCostBandMutation = useMutation({
    mutationFn: async ({ id, costBand }: { id: number; costBand: string }) => {
      return await apiRequest(`/api/cost-bands/${id}`, 'PUT', { costBand });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/cost-bands/${selectedSector}`] });
      toast({
        title: "Cost band updated",
        description: "Your pricing customization has been saved."
      });
      setEditingCostBands({});
    },
    onError: () => {
      toast({
        title: "Update failed",
        description: "Unable to save cost band changes.",
        variant: "destructive"
      });
    }
  });

  const resetCostBandsMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/cost-bands/${selectedSector}/reset`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/cost-bands/${selectedSector}`] });
      toast({
        title: "Cost bands reset",
        description: "Pricing has been restored to default values."
      });
      setEditingCostBands({});
    },
    onError: () => {
      toast({
        title: "Reset failed",
        description: "Unable to reset cost bands.",
        variant: "destructive"
      });
    }
  });

  const handleCostBandChange = (grade: number, value: string) => {
    setEditingCostBands(prev => ({
      ...prev,
      [grade]: value
    }));
  };

  const saveCostBand = async (grade: number) => {
    const newValue = editingCostBands[grade];
    if (!newValue) return;

    const existingBand = costBands.find((band) => band.grade === grade);
    if (existingBand?.id) {
      updateCostBandMutation.mutate({ id: existingBand.id, costBand: newValue });
    }
  };

  const resetToDefaults = () => {
    resetCostBandsMutation.mutate();
  };

  const selectedSectorData = sectors.find(s => s.id === selectedSector);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">Loading pricing settings...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Navigation */}
        <div className="flex justify-start">
          <Link href="/">
            <Button variant="outline" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
        
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Settings className="h-8 w-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">
              Pricing Customization
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Customize repair cost estimates for each sector based on your local market rates and experience. 
            These values will be used in all future report analysis.
          </p>
        </div>

        {/* Sector Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Sector</CardTitle>
            <CardDescription>
              Choose the sector to customize pricing for different defect severity grades
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedSector} onValueChange={setSelectedSector}>
              <TabsList className="grid w-full grid-cols-6">
                {sectors.map(sector => {
                  const Icon = sector.icon;
                  return (
                    <TabsTrigger key={sector.id} value={sector.id} className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${sector.color}`} />
                      <span className="hidden sm:inline">{sector.name}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {sectors.map(sector => (
                <TabsContent key={sector.id} value={sector.id}>
                  <div className="space-y-6 mt-6">
                    {/* Current Sector Info */}
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                      <sector.icon className={`h-6 w-6 ${sector.color}`} />
                      <div>
                        <h3 className="font-semibold text-lg">{sector.name} Sector</h3>
                        <p className="text-sm text-gray-600">
                          Customize repair cost estimates for {sector.name.toLowerCase()} sector analysis
                        </p>
                      </div>
                    </div>

                    {/* Cost Bands Grid */}
                    <div className="grid gap-4">
                      <div className="flex justify-between items-center">
                        <h4 className="text-lg font-semibold">Cost Bands by Defect Grade</h4>
                        <Button
                          variant="outline"
                          onClick={resetToDefaults}
                          disabled={resetCostBandsMutation.isPending}
                          className="flex items-center gap-2"
                        >
                          <RotateCcw className="h-4 w-4" />
                          Reset to Defaults
                        </Button>
                      </div>

                      <div className="grid gap-4">
                        {costBands.map((band) => {
                          const isEditing = editingCostBands.hasOwnProperty(band.grade);
                          const currentValue = isEditing ? editingCostBands[band.grade] : band.costBand;

                          return (
                            <Card key={band.grade} className="p-4">
                              <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-4 flex-1">
                                  <Badge variant="outline" className="text-lg font-semibold min-w-16">
                                    Grade {band.grade}
                                  </Badge>
                                  <div className="flex-1">
                                    <p className="font-medium text-gray-900">
                                      {gradeDescriptions[band.grade as keyof typeof gradeDescriptions]}
                                    </p>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-3">
                                  <div className="w-48">
                                    <Label htmlFor={`grade-${band.grade}`} className="text-sm font-medium">
                                      Cost Range
                                    </Label>
                                    <Input
                                      id={`grade-${band.grade}`}
                                      value={currentValue}
                                      onChange={(e) => handleCostBandChange(band.grade, e.target.value)}
                                      placeholder="e.g., £500-2,000"
                                      className="mt-1"
                                    />
                                  </div>
                                  
                                  {isEditing && (
                                    <Button
                                      size="sm"
                                      onClick={() => saveCostBand(band.grade)}
                                      disabled={updateCostBandMutation.isPending}
                                      className="flex items-center gap-2"
                                    >
                                      <Save className="h-4 w-4" />
                                      Save
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </Card>
                          );
                        })}
                      </div>
                    </div>

                    {/* Usage Information */}
                    <Card className="bg-blue-50 border-blue-200">
                      <CardContent className="p-4">
                        <h5 className="font-semibold text-blue-900 mb-2">How This Works</h5>
                        <ul className="text-sm text-blue-800 space-y-1">
                          <li>• Cost bands are applied automatically during report analysis</li>
                          <li>• Each defect is assigned a grade (0-5) based on MSCC5 standards</li>
                          <li>• Your custom cost ranges help estimate repair expenses</li>
                          <li>• These settings are saved to your account and persist across sessions</li>
                          <li>• You can reset to default values at any time</li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}