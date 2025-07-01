import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Edit, Plus, Settings } from "lucide-react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";

interface SectorStandard {
  id: number;
  sector: string;
  standardName: string;
  bellyThreshold: number;
  description: string;
  authority: string;
  referenceDocument: string;
  createdAt: string;
  updatedAt: string;
}

export function StandardsConfig() {
  const [location] = useLocation();
  const { toast } = useToast();
  const [standards, setStandards] = useState<SectorStandard[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingStandard, setEditingStandard] = useState<SectorStandard | null>(null);
  const [showForm, setShowForm] = useState(false);
  
  // Extract sector from URL parameter
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const selectedSector = urlParams.get('sector') || '';
  
  const [formData, setFormData] = useState({
    sector: selectedSector,
    standardName: '',
    bellyThreshold: 20,
    description: '',
    authority: '',
    referenceDocument: ''
  });

  const sectorDisplayNames = {
    utilities: 'Utilities',
    adoption: 'Adoption',
    highways: 'Highways',
    insurance: 'Insurance',
    construction: 'Construction',
    domestic: 'Domestic'
  };

  useEffect(() => {
    fetchStandards();
  }, []);

  useEffect(() => {
    // Auto-select sector from URL
    if (selectedSector) {
      setFormData(prev => ({ ...prev, sector: selectedSector }));
    }
  }, [selectedSector]);

  const fetchStandards = async () => {
    try {
      const response = await apiRequest('GET', '/api/sector-standards') as unknown;
      // Ensure response is an array
      const standardsData = Array.isArray(response) ? response as SectorStandard[] : [];
      setStandards(standardsData);
    } catch (error) {
      console.error('Error fetching standards:', error);
      setStandards([]); // Set empty array on error
      toast({
        title: "Error",
        description: "Failed to fetch standards",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingStandard) {
        await apiRequest('PUT', `/api/sector-standards/${editingStandard.id}`, formData);
        toast({
          title: "Success",
          description: "Standard updated successfully",
        });
      } else {
        await apiRequest('POST', '/api/sector-standards', formData);
        toast({
          title: "Success", 
          description: "Standard created successfully",
        });
      }
      
      fetchStandards();
      resetForm();
    } catch (error) {
      console.error('Error saving standard:', error);
      toast({
        title: "Error",
        description: "Failed to save standard",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this standard?')) return;
    
    try {
      await apiRequest('DELETE', `/api/sector-standards/${id}`);
      toast({
        title: "Success",
        description: "Standard deleted successfully",
      });
      fetchStandards();
    } catch (error) {
      console.error('Error deleting standard:', error);
      toast({
        title: "Error",
        description: "Failed to delete standard",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      sector: selectedSector,
      standardName: '',
      bellyThreshold: 20,
      description: '',
      authority: '',
      referenceDocument: ''
    });
    setEditingStandard(null);
    setShowForm(false);
  };

  const startEdit = (standard: SectorStandard) => {
    setEditingStandard(standard);
    setFormData({
      sector: standard.sector,
      standardName: standard.standardName,
      bellyThreshold: standard.bellyThreshold,
      description: standard.description,
      authority: standard.authority,
      referenceDocument: standard.referenceDocument
    });
    setShowForm(true);
  };

  if (loading) {
    return <div className="p-8">Loading standards...</div>;
  }

  const filteredStandards = selectedSector 
    ? (Array.isArray(standards) ? standards.filter(s => s.sector === selectedSector) : [])
    : (Array.isArray(standards) ? standards : []);

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="h-6 w-6 text-blue-600" />
        <h1 className="text-3xl font-bold">
          Standards Configuration
          {selectedSector && ` - ${sectorDisplayNames[selectedSector as keyof typeof sectorDisplayNames]}`}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Standards List */}
        <Card>
          <CardHeader>
            <CardTitle>Current Standards</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredStandards.map((standard) => (
                <div key={standard.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{standard.standardName}</h3>
                      <p className="text-sm text-gray-600 capitalize">{standard.sector} Sector</p>
                      <p className="text-sm mt-1">Belly Threshold: {standard.bellyThreshold}%</p>
                      <p className="text-sm text-gray-700 mt-2">{standard.description}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        Authority: {standard.authority} | {standard.referenceDocument}
                      </p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startEdit(standard)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(standard.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredStandards.length === 0 && (
                <p className="text-gray-500 text-center py-8">
                  No standards configured for this sector yet.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Add/Edit Form */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>
                {editingStandard ? 'Edit Standard' : 'Add New Standard'}
              </CardTitle>
              {!showForm && (
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Standard
                </Button>
              )}
            </div>
          </CardHeader>
          
          {showForm && (
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="sector">Sector</Label>
                  <select
                    id="sector"
                    value={formData.sector}
                    onChange={(e) => setFormData(prev => ({ ...prev, sector: e.target.value }))}
                    className="w-full p-2 border rounded-md"
                    required
                  >
                    <option value="">Select Sector</option>
                    <option value="utilities">Utilities</option>
                    <option value="adoption">Adoption</option>
                    <option value="highways">Highways</option>
                    <option value="insurance">Insurance</option>
                    <option value="construction">Construction</option>
                    <option value="domestic">Domestic</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="standardName">Standard Name</Label>
                  <Input
                    id="standardName"
                    value={formData.standardName}
                    onChange={(e) => setFormData(prev => ({ ...prev, standardName: e.target.value }))}
                    placeholder="e.g., BS EN 1610:2015"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="bellyThreshold">Belly Detection Threshold (%)</Label>
                  <Input
                    id="bellyThreshold"
                    type="number"
                    min="1"
                    max="100"
                    value={formData.bellyThreshold}
                    onChange={(e) => setFormData(prev => ({ ...prev, bellyThreshold: parseInt(e.target.value) }))}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="authority">Authority</Label>
                  <Input
                    id="authority"
                    value={formData.authority}
                    onChange={(e) => setFormData(prev => ({ ...prev, authority: e.target.value }))}
                    placeholder="e.g., BSI, Water UK, WRc"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="referenceDocument">Reference Document</Label>
                  <Input
                    id="referenceDocument"
                    value={formData.referenceDocument}
                    onChange={(e) => setFormData(prev => ({ ...prev, referenceDocument: e.target.value }))}
                    placeholder="e.g., BS EN 1610:2015 - Construction and testing of drains and sewers"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the standard and its application..."
                    required
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1">
                    {editingStandard ? 'Update Standard' : 'Add Standard'}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}

export default StandardsConfig;