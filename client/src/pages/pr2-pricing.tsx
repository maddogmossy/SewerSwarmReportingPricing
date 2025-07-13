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
  Trash2,
  Video,
  Truck,
  Waves,
  Monitor,
  PaintBucket,
  Flame,
  Sun,
  Scissors,
  Pickaxe
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

// Standard category options moved from PR2 form
const STANDARD_CATEGORIES = [
  { id: 'cctv', name: 'CCTV', description: 'Closed-circuit television inspection services', icon: Video, color: 'bg-blue-50 border-blue-200 text-blue-800' },
  { id: 'van-pack', name: 'Van Pack', description: 'Mobile van-based equipment package', icon: Truck, color: 'bg-green-50 border-green-200 text-green-800' },
  { id: 'jet-vac', name: 'Jet Vac', description: 'High-pressure water jetting and vacuum services', icon: Waves, color: 'bg-cyan-50 border-cyan-200 text-cyan-800' },
  { id: 'cctv-van-pack', name: 'CCTV/Van Pack', description: 'Combined CCTV inspection with van pack equipment', icon: Monitor, color: 'bg-purple-50 border-purple-200 text-purple-800' },
  { id: 'cctv-jet-vac', name: 'CCTV/Jet Vac', description: 'Combined CCTV inspection with jet vac services', icon: Video, color: 'bg-indigo-50 border-indigo-200 text-indigo-800' },
  { id: 'directional-water-cutter', name: 'Directional Water Cutter', description: 'Precision directional cutting services', icon: Waves, color: 'bg-teal-50 border-teal-200 text-teal-800' },
  { id: 'ambient-lining', name: 'Ambient Lining', description: 'Ambient temperature pipe lining installation', icon: PaintBucket, color: 'bg-gray-50 border-gray-200 text-gray-800' },
  { id: 'hot-cure-lining', name: 'Hot Cure Lining', description: 'Hot cure pipe lining installation', icon: Flame, color: 'bg-red-50 border-red-200 text-red-800' },
  { id: 'uv-lining', name: 'UV Lining', description: 'Ultraviolet cured pipe lining installation', icon: Sun, color: 'bg-yellow-50 border-yellow-200 text-yellow-800' },
  { id: 'ims-cutting', name: 'IMS Cutting', description: 'Integrated Management System cutting services', icon: Scissors, color: 'bg-orange-50 border-orange-200 text-orange-800' },
  { id: 'excavation', name: 'Excavation', description: 'Traditional excavation and repair services', icon: Pickaxe, color: 'bg-amber-50 border-amber-200 text-amber-800' },
  { id: 'tankering', name: 'Tankering', description: 'Waste removal and tankering services', icon: Truck, color: 'bg-slate-50 border-slate-200 text-slate-800' }
];

export default function PR2Pricing() {
  const [location, navigate] = useLocation();
  
  // Simple extraction without complex parsing
  const urlParams = new URLSearchParams(window.location.search);
  const sector = urlParams.get('sector') || 'utilities';
  
  // Get current sector info
  const currentSector = SECTORS.find(s => s.id === sector) || SECTORS[0];
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Legacy work categories removed - PR2 only
  // Show PR2 configurations directly instead of requiring work categories
  const workCategories = [];
  const categoriesLoading = false;

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

  // Handle navigation to category-specific pages
  const handleCategoryNavigation = (categoryId: string) => {
    const routeMap = {
      'cctv': `/pr2-cctv?sector=${sector}`,
      'van-pack': `/pr2-van-pack?sector=${sector}`,
      'jet-vac': `/pr2-jet-vac?sector=${sector}`,
      'cctv-van-pack': `/pr2-cctv-van-pack?sector=${sector}`,
      'cctv-jet-vac': `/pr2-cctv-jet-vac?sector=${sector}`,
      'directional-water-cutter': `/pr2-directional-water-cutter?sector=${sector}`,
      'ambient-lining': `/pr2-ambient-lining?sector=${sector}`,
      'hot-cure-lining': `/pr2-hot-cure-lining?sector=${sector}`,
      'uv-lining': `/pr2-uv-lining?sector=${sector}`,
      'ims-cutting': `/pr2-ims-cutting?sector=${sector}`,
      'excavation': `/pr2-excavation?sector=${sector}`,
      'tankering': `/pr2-tankering?sector=${sector}`
    };
    
    const route = routeMap[categoryId as keyof typeof routeMap];
    if (route) {
      navigate(route);
    }
  };

  // Handle navigation to add custom configuration
  const handleAddConfiguration = () => {
    navigate(`/pr2-pricing-form?sector=${sector}&category=Custom`);
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

        {/* Standard Categories Section - Always Visible */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Standard Categories</CardTitle>
              <p className="text-sm text-gray-600">Choose from pre-configured standard categories similar to OPS and PR1 systems</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {STANDARD_CATEGORIES.map((category) => (
                  <Card
                    key={category.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${category.color} border-2`}
                    onClick={() => handleCategoryNavigation(category.id)}
                  >
                    <CardContent className="p-4 text-center">
                      <category.icon className="h-8 w-8 mx-auto mb-2" />
                      <h3 className="font-medium text-sm mb-1">{category.name}</h3>
                      <p className="text-xs opacity-75 line-clamp-2">{category.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              <div className="mt-6 pt-6 border-t">
                <Button
                  variant="outline"
                  className="w-full h-auto p-4 border-2 border-dashed"
                  onClick={() => handleAddConfiguration()}
                >
                  <div className="text-center">
                    <Plus className="h-6 w-6 mx-auto mb-2 text-gray-400" />
                    <span className="font-medium">Create Custom Category</span>
                    <p className="text-xs text-gray-500 mt-1">Define your own category with custom specifications</p>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Existing Configurations */}
        {pr2Configurations.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Existing PR2 Configurations</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pr2Configurations.map((config: any) => (
                <Card key={config.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-100">
                          <Settings className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{config.categoryName}</CardTitle>
                          <p className="text-sm text-gray-600">{config.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="default">Active</Badge>
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
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Pricing Options: {config.pricingOptions?.length || 0}</span>
                        <span>Quantity Options: {config.quantityOptions?.length || 0}</span>
                        <span>Math Operators: {config.mathOperators?.length || 0}</span>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm font-medium">Configuration Details:</p>
                        {config.pricingOptions?.map((option: any, index: number) => (
                          <p key={index} className="text-xs text-gray-600">
                            {option.label}: £{option.value}
                          </p>
                        ))}
                        {config.quantityOptions?.map((option: any, index: number) => (
                          <p key={index} className="text-xs text-gray-600">
                            {option.label}: {option.value}
                          </p>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
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
              <p className="text-2xl font-bold text-green-600">0</p>
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