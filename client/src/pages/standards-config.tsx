import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Settings, Plus, Edit2, Trash2, Save, ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';
import { apiRequest } from '@/lib/queryClient';

interface SectorStandard {
  id: number;
  sector: string;
  standardName: string;
  bellyThreshold: number;
  description: string;
  authority: string;
  referenceDocument: string;
  lastUpdated: string;
}

interface DefectThreshold {
  id: number;
  defectCode: string;
  defectName: string;
  sector: string;
  gradeThreshold: number;
  adoptionFail: boolean;
  description: string;
}

export default function StandardsConfig() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location] = useLocation();
  const [selectedSector, setSelectedSector] = useState('utilities');
  const [isAddingStandard, setIsAddingStandard] = useState(false);
  const [editingStandard, setEditingStandard] = useState<SectorStandard | null>(null);

  // Auto-select sector from URL parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(location.split('?')[1]);
    const sectorParam = urlParams.get('sector');
    if (sectorParam) {
      setSelectedSector(sectorParam);
    }
  }, [location]);

  // Query sector standards
  const { data: standards = [], isLoading } = useQuery({
    queryKey: ['/api/sector-standards'],
  });

  // Query defect thresholds
  const { data: defectThresholds = [] } = useQuery({
    queryKey: ['/api/defect-thresholds'],
  });

  // Mutations
  const addStandardMutation = useMutation({
    mutationFn: (data: Partial<SectorStandard>) => 
      apiRequest('POST', '/api/sector-standards', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sector-standards'] });
      setIsAddingStandard(false);
      toast({ title: 'Standard added successfully' });
    },
  });

  const updateStandardMutation = useMutation({
    mutationFn: ({ id, ...data }: Partial<SectorStandard> & { id: number }) =>
      apiRequest('PUT', `/api/sector-standards/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sector-standards'] });
      setEditingStandard(null);
      toast({ title: 'Standard updated successfully' });
    },
  });

  const deleteStandardMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/sector-standards/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sector-standards'] });
      toast({ title: 'Standard deleted successfully' });
    },
  });

  const sectors = [
    { id: 'utilities', name: 'Utilities', color: 'bg-blue-100 text-blue-800' },
    { id: 'adoption', name: 'Adoption', color: 'bg-green-100 text-green-800' },
    { id: 'highways', name: 'Highways', color: 'bg-orange-100 text-orange-800' },
    { id: 'insurance', name: 'Insurance', color: 'bg-red-100 text-red-800' },
    { id: 'construction', name: 'Construction', color: 'bg-purple-100 text-purple-800' },
    { id: 'domestic', name: 'Domestic', color: 'bg-yellow-100 text-yellow-800' },
  ];

  const filteredStandards = standards.filter((s: SectorStandard) => s.sector === selectedSector);
  const filteredDefectThresholds = defectThresholds.filter((d: DefectThreshold) => d.sector === selectedSector);

  const AddStandardForm = ({ onSubmit, initialData = null }: { onSubmit: (data: any) => void, initialData?: SectorStandard | null }) => {
    const [formData, setFormData] = useState({
      sector: initialData?.sector || selectedSector,
      standardName: initialData?.standardName || '',
      bellyThreshold: initialData?.bellyThreshold || 20,
      description: initialData?.description || '',
      authority: initialData?.authority || '',
      referenceDocument: initialData?.referenceDocument || '',
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSubmit(formData);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="sector">Sector</Label>
            <Select value={formData.sector} onValueChange={(value) => setFormData({ ...formData, sector: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sectors.map((sector) => (
                  <SelectItem key={sector.id} value={sector.id}>
                    {sector.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="standardName">Standard Name</Label>
            <Input
              id="standardName"
              value={formData.standardName}
              onChange={(e) => setFormData({ ...formData, standardName: e.target.value })}
              placeholder="e.g., OS20x adoption"
              required
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="bellyThreshold">Belly Threshold (%)</Label>
            <Input
              id="bellyThreshold"
              type="number"
              min="1"
              max="50"
              value={formData.bellyThreshold}
              onChange={(e) => setFormData({ ...formData, bellyThreshold: parseInt(e.target.value) })}
              required
            />
          </div>
          <div>
            <Label htmlFor="authority">Authority</Label>
            <Input
              id="authority"
              value={formData.authority}
              onChange={(e) => setFormData({ ...formData, authority: e.target.value })}
              placeholder="e.g., WRc, Water UK"
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="referenceDocument">Reference Document</Label>
          <Input
            id="referenceDocument"
            value={formData.referenceDocument}
            onChange={(e) => setFormData({ ...formData, referenceDocument: e.target.value })}
            placeholder="e.g., BS EN 1610:2015"
            required
          />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe when this standard applies and its requirements"
            rows={3}
            required
          />
        </div>

        <div className="flex gap-2 pt-4">
          <Button type="submit" disabled={addStandardMutation.isPending || updateStandardMutation.isPending}>
            <Save className="w-4 h-4 mr-2" />
            {initialData ? 'Update Standard' : 'Add Standard'}
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => {
              setIsAddingStandard(false);
              setEditingStandard(null);
            }}
          >
            Cancel
          </Button>
        </div>
      </form>
    );
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading standards...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Standards Configuration</h1>
            <p className="text-gray-600">Manage sector-specific belly detection thresholds and defect standards</p>
          </div>
        </div>
        <Settings className="w-8 h-8 text-gray-400" />
      </div>

      {/* Sector Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Sector</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {sectors.map((sector) => (
              <Button
                key={sector.id}
                variant={selectedSector === sector.id ? "default" : "outline"}
                onClick={() => setSelectedSector(sector.id)}
                className="mb-2"
              >
                {sector.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="belly-thresholds" className="space-y-4">
        <TabsList>
          <TabsTrigger value="belly-thresholds">Belly Detection Thresholds</TabsTrigger>
          <TabsTrigger value="defect-standards">Defect Standards</TabsTrigger>
        </TabsList>

        <TabsContent value="belly-thresholds">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>
                Belly Detection Standards - {sectors.find(s => s.id === selectedSector)?.name}
              </CardTitle>
              <Dialog open={isAddingStandard} onOpenChange={setIsAddingStandard}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Standard
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add New Standard</DialogTitle>
                  </DialogHeader>
                  <AddStandardForm 
                    onSubmit={(data) => addStandardMutation.mutate(data)}
                  />
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {filteredStandards.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No standards configured for this sector. Add one to get started.
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredStandards.map((standard: SectorStandard) => (
                    <div key={standard.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{standard.standardName}</h3>
                            <Badge className={sectors.find(s => s.id === standard.sector)?.color}>
                              {standard.sector}
                            </Badge>
                            <Badge variant="secondary">
                              {standard.bellyThreshold}% threshold
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{standard.description}</p>
                          <div className="text-xs text-gray-500">
                            <span className="font-medium">Authority:</span> {standard.authority} | 
                            <span className="font-medium ml-2">Reference:</span> {standard.referenceDocument}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Dialog open={editingStandard?.id === standard.id} onOpenChange={(open) => {
                            if (!open) setEditingStandard(null);
                          }}>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingStandard(standard)}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Edit Standard</DialogTitle>
                              </DialogHeader>
                              <AddStandardForm
                                initialData={standard}
                                onSubmit={(data) => updateStandardMutation.mutate({ ...data, id: standard.id })}
                              />
                            </DialogContent>
                          </Dialog>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this standard?')) {
                                deleteStandardMutation.mutate(standard.id);
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="defect-standards">
          <Card>
            <CardHeader>
              <CardTitle>Defect Standards - {sectors.find(s => s.id === selectedSector)?.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                Defect standards configuration coming soon...
                <br />
                This will allow configuration of grade thresholds for specific defect codes by sector.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}