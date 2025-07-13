import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Eye, Trash2, BarChart3, Building, CheckCircle, Car, ShieldCheck, HardHat, HomeIcon, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Sector configuration
const SECTORS = [
  { id: 'utilities', name: 'Utilities', color: 'text-blue-600', icon: Building },
  { id: 'adoption', name: 'Adoption', color: 'text-green-600', icon: CheckCircle },
  { id: 'highways', name: 'Highways', color: 'text-orange-600', icon: Car },
  { id: 'insurance', name: 'Insurance', color: 'text-red-600', icon: ShieldCheck },
  { id: 'construction', name: 'Construction', color: 'text-purple-600', icon: HardHat },
  { id: 'domestic', name: 'Domestic', color: 'text-yellow-600', icon: HomeIcon }
];

export default function RepairPricing() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Extract sector from URL
  const sector = new URLSearchParams(location.split('?')[1] || '').get('sector') || 'utilities';
  
  // Get current sector info
  const currentSector = SECTORS.find(s => s.id === sector) || SECTORS[0];

  // Fetch work categories
  const { data: workCategories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['/api/work-categories'],
  });

  // Fetch pricing data for current sector
  const { data: pricingData = [], isLoading: pricingLoading } = useQuery({
    queryKey: [`/api/repair-pricing/${sector}`],
    enabled: !!sector,
  });

  // Delete mutation
  const deletePricing = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/repair-pricing/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/repair-pricing/${sector}`] });
      toast({ title: "Pricing deleted successfully" });
    }
  });

  // Handle navigation to PR2 pricing system  
  const handleAddPricing = () => {
    navigate(`/pr2-pricing?sector=${sector}`);
  };

  if (categoriesLoading || pricingLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading pricing configuration...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">Repair Pricing Configuration</h1>
          <p className="text-gray-600">
            Configure pricing for {currentSector.name} sector repairs and services
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Dashboard Navigation */}
          <Button
            onClick={() => navigate('/dashboard')}
            className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </Button>
          
          {/* Sector Selection */}
          <div className="flex items-center gap-2">
            <currentSector.icon className={`h-5 w-5 ${currentSector.color}`} />
            <span className="font-medium">{currentSector.name}</span>
          </div>
        </div>
      </div>

      {/* Sector Navigation */}
      <div className="flex gap-2 flex-wrap">
        {SECTORS.map((s) => (
          <Button
            key={s.id}
            variant={sector === s.id ? "default" : "outline"}
            size="sm"
            onClick={() => navigate(`/repair-pricing?sector=${s.id}`)}
            className={`flex items-center gap-2 ${
              sector === s.id ? `bg-${s.color.split('-')[1]}-600 text-white` : s.color
            }`}
          >
            <s.icon className="h-4 w-4" />
            {s.name}
          </Button>
        ))}
      </div>

      {/* Work Categories */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Work Categories</h2>
          <Button
            onClick={handleAddPricing}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Pricing Configuration
          </Button>
        </div>

        {workCategories.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-500 mb-4">No work categories configured yet.</p>
              <Button
                onClick={handleAddPricing}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Create First Category
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {workCategories.map((category: any) => {
              const categoryPricing = pricingData.filter((p: any) => p.workCategoryId === category.id);
              
              return (
                <Card key={category.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2">
                          {category.name}
                          <Badge 
                            variant="secondary" 
                            style={{ backgroundColor: category.color }}
                            className="text-white"
                          >
                            {categoryPricing.length} pricing rules
                          </Badge>
                        </CardTitle>
                        <CardDescription>{category.description}</CardDescription>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleAddPricing}
                          className="text-blue-600 border-blue-200 hover:bg-blue-50"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Pricing
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  {categoryPricing.length > 0 && (
                    <CardContent>
                      <div className="space-y-2">
                        {categoryPricing.map((pricing: any) => (
                          <div key={pricing.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="space-y-1">
                              <div className="font-medium">{pricing.description}</div>
                              <div className="text-sm text-gray-600">
                                {pricing.pipeSize} • {pricing.depth} • £{pricing.cost}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => navigate(`/pr1-pricing?edit=${pricing.id}`)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => deletePricing.mutate(pricing.id)}
                                disabled={deletePricing.isPending}
                                className="text-red-600 border-red-200 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Pricing Summary</CardTitle>
          <CardDescription>Current pricing configuration for {currentSector.name} sector</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">0</div>
              <div className="text-sm text-gray-600">Work Categories</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">0</div>
              <div className="text-sm text-gray-600">Pricing Rules</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">£0</div>
              <div className="text-sm text-gray-600">Average Cost</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}