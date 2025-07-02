import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
  BarChart3
} from "lucide-react";

const PIPE_SIZES = [
  "75mm", "100mm", "110mm", "125mm", "150mm", "160mm", "200mm", 
  "225mm", "250mm", "300mm", "315mm", "355mm", "400mm", "450mm", 
  "500mm", "600mm", "750mm", "900mm", "1050mm", "1200mm"
];

const DEPTH_RANGES = [
  "0-1m", "1-2m", "2-3m", "3-4m", "4-5m", "5m+"
];

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
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState({
    workCategoryId: "",
    pipeSize: "",
    depth: "",
    description: "",
    cost: "",
    rule: "",
    minimumQuantity: "1"
  });

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

  // Create pricing mutation
  const createPricing = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/repair-pricing', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/repair-pricing/${sector}`] });
      toast({ title: "Pricing added successfully" });
      resetForm();
      setIsAddDialogOpen(false);
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
      queryClient.invalidateQueries({ queryKey: [`/api/repair-pricing/${sector}`] });
      toast({ title: "Pricing updated successfully" });
      resetForm();
      setEditingItem(null);
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
    mutationFn: (id: number) => apiRequest('DELETE', `/api/repair-pricing/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/repair-pricing/${sector}`] });
      toast({ title: "Pricing deleted successfully" });
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
      cost: "",
      rule: "",
      minimumQuantity: "1"
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      ...formData,
      sector,
      cost: parseFloat(formData.cost),
      minimumQuantity: parseInt(formData.minimumQuantity)
    };

    if (editingItem) {
      updatePricing.mutate({ id: editingItem.id, ...submitData });
    } else {
      createPricing.mutate(submitData);
    }
  };

  const handleEdit = (item: any) => {
    setFormData({
      workCategoryId: item.workCategoryId?.toString() || "",
      pipeSize: item.pipeSize,
      depth: item.depth || "",
      description: item.description || "",
      cost: item.cost.toString(),
      rule: item.rule || "",
      minimumQuantity: item.minimumQuantity?.toString() || "1"
    });
    setEditingItem(item);
    setIsAddDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this pricing configuration?")) {
      deletePricing.mutate(id);
    }
  };

  const groupedData = workCategories.reduce((acc: any, category: any) => {
    acc[category.name] = pricingData.filter((item: any) => item.workCategoryId === category.id);
    return acc;
  }, {});

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
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setEditingItem(null); }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Pricing
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>

        {/* Sector Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-${currentSector.color}-100`}>
                <Wrench className={`h-6 w-6 text-${currentSector.color}-600`} />
              </div>
              <div>
                <CardTitle className="text-2xl">{currentSector.name} Sector - Repair Pricing</CardTitle>
                <p className="text-slate-600">Configure pricing for patch, lining, and excavation repairs</p>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Repair Methods Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {workCategories.map((category: any) => {
            const categoryPricing = groupedData[category.name] || [];
            
            return (
              <Card key={category.id}>
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
                
                <CardContent className="space-y-3">
                  {categoryPricing.length === 0 ? (
                    <div className="text-center py-6 text-slate-500">
                      <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-orange-400" />
                      <p className="text-sm">No pricing configured</p>
                      <p className="text-xs">Click "Add Pricing" to configure</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {categoryPricing.map((item: any) => (
                        <div key={item.id} className="p-3 border rounded-lg bg-white">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-xs">
                                  {item.pipeSize}
                                </Badge>
                                {item.depth && (
                                  <Badge variant="outline" className="text-xs">
                                    {item.depth}
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-sm">
                                  £{parseFloat(item.cost).toFixed(2)}
                                </span>
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => handleEdit(item)}
                                    className="p-1 hover:bg-slate-100 rounded"
                                  >
                                    <Edit className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(item.id)}
                                    className="p-1 hover:bg-red-100 rounded"
                                  >
                                    <Trash2 className="h-3 w-3 text-red-600" />
                                  </button>
                                </div>
                              </div>
                              
                              {item.description && (
                                <p className="text-xs text-slate-600 mb-1">
                                  {item.description}
                                </p>
                              )}
                              
                              {item.rule && (
                                <div className="text-xs p-2 bg-yellow-50 border border-yellow-200 rounded">
                                  <span className="font-medium">Rule:</span> {item.rule}
                                  {item.minimumQuantity > 1 && (
                                    <span className="ml-2 text-yellow-700">
                                      (Min: {item.minimumQuantity})
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
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
                    onValueChange={(value) => setFormData({ ...formData, pipeSize: value })}
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
                    onValueChange={(value) => setFormData({ ...formData, depth: value })}
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
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g., Standard structural patch repair"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cost">Cost (£)</Label>
                  <Input
                    id="cost"
                    type="number"
                    step="0.01"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="minimumQuantity">Min Quantity</Label>
                  <Input
                    id="minimumQuantity"
                    type="number"
                    min="1"
                    value={formData.minimumQuantity}
                    onChange={(e) => setFormData({ ...formData, minimumQuantity: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="rule">Rule (optional)</Label>
                <Textarea
                  id="rule"
                  value={formData.rule}
                  onChange={(e) => setFormData({ ...formData, rule: e.target.value })}
                  placeholder="e.g., Rate based on min of 4 patches"
                  rows={2}
                />
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
      </div>
    </div>
  );
}