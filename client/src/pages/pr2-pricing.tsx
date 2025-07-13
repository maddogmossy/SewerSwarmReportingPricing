import { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  Plus, 
  Settings, 
  Building, 
  Building2,
  Car, 
  Users, 
  ShieldCheck, 
  HardHat, 
  Zap,
  Trash2
} from 'lucide-react';

// Sector definitions copied from repair-pricing.tsx
const SECTORS = [
  { id: 'utilities', name: 'Utilities', icon: Building, color: 'text-blue-600' },
  { id: 'adoption', name: 'Adoption', icon: Building2, color: 'text-green-600' },
  { id: 'highways', name: 'Highways', icon: Car, color: 'text-orange-600' },
  { id: 'insurance', name: 'Insurance', icon: ShieldCheck, color: 'text-red-600' },
  { id: 'construction', name: 'Construction', icon: HardHat, color: 'text-purple-600' },
  { id: 'domestic', name: 'Domestic', icon: Users, color: 'text-brown-600' }
];

export default function PR2Pricing() {
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

  // Fetch PR2 configurations for current sector
  const { data: pr2ConfigurationsRaw = [], isLoading: pr2Loading } = useQuery({
    queryKey: ['/api/pr2-pricing', sector],
    queryFn: () => apiRequest('GET', '/api/pr2-pricing', undefined, { sector }),
    enabled: !!sector,
  });

  // Ensure pr2Configurations is always an array
  const pr2Configurations = Array.isArray(pr2ConfigurationsRaw) ? pr2ConfigurationsRaw : [];

  // Delete mutation
  const deletePR2Configuration = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/pr2-pricing/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pr2-pricing'] });
      toast({ title: "PR2 configuration deleted successfully" });
    }
  });

  // Handle navigation to add new PR2 configuration
  const handleAddConfiguration = () => {
    navigate(`/pr2-pricing-form?sector=${sector}`);
  };

  if (categoriesLoading || pr2Loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading PR2 pricing configuration...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">PR2 Pricing Configuration</h1>
          <p className="text-gray-600">
            Configure pricing for {currentSector.name} sector cleaning and repairs
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
            onClick={() => navigate(`/pr2-pricing?sector=${s.id}`)}
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
            onClick={handleAddConfiguration}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add PR2 Configuration
          </Button>
        </div>

        {workCategories.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <div className="space-y-2">
                <p className="text-gray-500">No work categories found.</p>
                <p className="text-sm text-gray-400">
                  Work categories are managed in the legacy system for now.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {workCategories.map((category: any) => {
              const categoryConfigurations = pr2Configurations.filter(
                (config: any) => config.categoryId === category.id?.toString() || config.categoryName === category.name
              );

              return (
                <Card key={category.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-${category.color?.split('-')[1] || 'blue'}-100`}>
                          <Settings className={`h-5 w-5 ${category.color || 'text-blue-600'}`} />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{category.name}</CardTitle>
                          <p className="text-sm text-gray-600">{category.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={categoryConfigurations.length > 0 ? "default" : "secondary"}>
                          {categoryConfigurations.length} PR2 Configurations
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleAddConfiguration}
                          className="text-blue-600 border-blue-200 hover:bg-blue-50"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Pricing
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  {categoryConfigurations.length > 0 && (
                    <CardContent>
                      <div className="space-y-2">
                        {categoryConfigurations.map((config: any) => (
                          <div key={config.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="space-y-1">
                              <p className="font-medium">{config.categoryName}</p>
                              <p className="text-sm text-gray-600">{config.description}</p>
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span>Pricing Options: {config.pricingOptions?.length || 0}</span>
                                <span>Quantity Options: {config.quantityOptions?.length || 0}</span>
                                <span>Math Operators: {config.mathOperators?.length || 0}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => navigate(`/pr2-pricing-form?sector=${sector}&edit=${config.id}`)}
                              >
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => deletePR2Configuration.mutate(config.id)}
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
          <CardTitle>PR2 Configuration Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-600">{pr2Configurations.length}</p>
              <p className="text-sm text-gray-600">Total Configurations</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{workCategories.length}</p>
              <p className="text-sm text-gray-600">Work Categories</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-600">{currentSector.name}</p>
              <p className="text-sm text-gray-600">Current Sector</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">PR2</p>
              <p className="text-sm text-gray-600">System Version</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}