import { useState, useEffect } from 'react';
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

// Sector definitions matching upload window colors from image
const SECTORS = [
  { id: 'utilities', name: 'Utilities', icon: Building, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  { id: 'adoption', name: 'Adoption', icon: Building2, color: 'text-teal-600', bgColor: 'bg-teal-50' },
  { id: 'highways', name: 'Highways', icon: Car, color: 'text-orange-600', bgColor: 'bg-orange-50' },
  { id: 'insurance', name: 'Insurance', icon: ShieldCheck, color: 'text-red-600', bgColor: 'bg-red-50' },
  { id: 'construction', name: 'Construction', icon: HardHat, color: 'text-cyan-600', bgColor: 'bg-cyan-50' },
  { id: 'domestic', name: 'Domestic', icon: Users, color: 'text-amber-600', bgColor: 'bg-amber-50' }
];

// Standard category options with no colors, just symbols
const STANDARD_CATEGORIES = [
  { id: 'cctv', name: 'CCTV', description: 'Closed-circuit television inspection services', icon: Video },
  { id: 'van-pack', name: 'Van Pack', description: 'Mobile van-based equipment package', icon: Truck },
  { id: 'jet-vac', name: 'Jet Vac', description: 'High-pressure water jetting and vacuum services', icon: Waves },
  { id: 'cctv-van-pack', name: 'CCTV/Van Pack', description: 'Combined CCTV inspection with van pack equipment', icon: Monitor },
  { id: 'cctv-jet-vac', name: 'CCTV/Jet Vac', description: 'Combined CCTV inspection with jet vac services', icon: Video },
  { id: 'directional-water-cutter', name: 'Directional Water Cutter', description: 'Precision directional cutting services', icon: Waves },
  { id: 'ambient-lining', name: 'Ambient Lining', description: 'Ambient temperature pipe lining installation', icon: PaintBucket },
  { id: 'hot-cure-lining', name: 'Hot Cure Lining', description: 'Hot cure pipe lining installation', icon: Flame },
  { id: 'uv-lining', name: 'UV Lining', description: 'Ultraviolet cured pipe lining installation', icon: Sun },
  { id: 'ims-cutting', name: 'IMS Cutting', description: 'Integrated Management System cutting services', icon: Scissors },
  { id: 'excavation', name: 'Excavation', description: 'Traditional excavation and repair services', icon: Pickaxe },
  { id: 'tankering', name: 'Tankering', description: 'Waste removal and tankering services', icon: Truck }
];

export default function PR2Pricing() {
  const [location, setLocation] = useLocation();
  const [sector, setSector] = useState('utilities');
  
  // Initialize sector from URL on page load only
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const initialSector = urlParams.get('sector') || 'utilities';
    
    console.log('Initial page load - setting sector to:', initialSector);
    setSector(initialSector);
  }, []); // Empty dependency array - only run once on mount
  
  // Get current sector info
  const currentSector = SECTORS.find(s => s.id === sector) || SECTORS[0];
  
  // Debug: Log current sector info
  console.log('Current sector object:', currentSector);
  console.log('Current sector bgColor:', currentSector.bgColor);
  
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

  // Fetch standard categories from database
  const { data: standardCategoriesFromDB = [], isLoading: standardCategoriesLoading } = useQuery({
    queryKey: ['/api/standard-categories'],
    // Use default queryFn instead of apiRequest to get proper JSON parsing
  });

  // Debug: Log the API response
  console.log('🔍 Standard categories API response:', standardCategoriesFromDB);
  console.log('🔍 Is array?', Array.isArray(standardCategoriesFromDB));
  console.log('🔍 Type:', typeof standardCategoriesFromDB);

  // Ensure pr2Configurations is always an array
  const pr2Configurations = Array.isArray(pr2ConfigurationsRaw) ? pr2ConfigurationsRaw : [];
  
  // Ensure standardCategoriesFromDB is always an array and handle potential errors
  const validStandardCategories = Array.isArray(standardCategoriesFromDB) ? standardCategoriesFromDB : [];
  
  // Combine hardcoded standard categories with user-created standard categories
  const allStandardCategories = [
    ...STANDARD_CATEGORIES,
    ...validStandardCategories.map(cat => ({
      id: cat.categoryId,
      name: cat.categoryName,
      description: cat.description,
      icon: Settings // Use Settings icon for user-created categories
    }))
  ];

  console.log('🔍 Valid standard categories:', validStandardCategories);
  console.log('🔍 All standard categories:', allStandardCategories);

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
    console.log('🔍 Navigation triggered for categoryId:', categoryId);
    console.log('📍 Current sector:', sector);
    
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
      console.log('✅ Found predefined route:', route);
      setLocation(route);
    } else {
      // For user-created categories, use a generic category page
      const genericRoute = `/pr2-category?sector=${sector}&categoryId=${categoryId}`;
      console.log('🔄 Using generic category route:', genericRoute);
      setLocation(genericRoute);
    }
  };

  // Handle navigation to add custom configuration
  const handleAddConfiguration = () => {
    setLocation(`/pr2-pricing-form?sector=${sector}&category=Custom`);
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
            Configure pricing for <span className={`font-medium ${currentSector.color}`}>{currentSector.name}</span> sector cleaning and repairs
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Dashboard Navigation */}
          <Button
            onClick={() => setLocation('/dashboard')}
            className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </Button>
          
          {/* Sector Selection */}
          <div className="flex items-center gap-2">
            <currentSector.icon className={`h-5 w-5 ${currentSector.color}`} />
            <span className={`font-medium ${currentSector.color}`}>{currentSector.name}</span>
          </div>
        </div>
      </div>

      {/* Sector Navigation */}
      <div className="flex gap-2 flex-wrap">
        {SECTORS.map((s) => (
          <Button
            key={s.id}
            variant="outline"
            size="sm"
            onClick={() => {
              console.log(`Navigating to sector: ${s.id}`);
              // Update sector state and URL simultaneously
              setSector(s.id);
              const newUrl = `/pr2-pricing?sector=${s.id}`;
              window.history.pushState({}, '', newUrl);
              console.log(`URL updated to: ${newUrl}`);
            }}
            className={`flex items-center gap-2 ${s.color} hover:bg-gray-100`}
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
            Create New Category
          </Button>
        </div>

        {/* Standard Categories Section - Always Visible */}
        <div className="space-y-6">
          <Card className={`${currentSector.bgColor} border-2`}>
            <CardHeader>
              <CardTitle>Standard Categories</CardTitle>
              <p className="text-sm text-gray-600">Choose from pre-configured standard categories similar to OPS and PR1 systems</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {allStandardCategories.map((category) => {
                  // Check if this is a user-created category
                  const isUserCreated = !STANDARD_CATEGORIES.some(std => std.id === category.id);
                  
                  return (
                    <Card
                      key={category.id}
                      className={`cursor-pointer transition-all hover:shadow-md bg-white border-2 ${
                        isUserCreated ? 'border-green-200' : 'border-gray-200'
                      }`}
                      onClick={() => handleCategoryNavigation(category.id)}
                    >
                      <CardContent className="p-4 text-center relative">
                        <category.icon className={`h-8 w-8 mx-auto mb-2 ${
                          isUserCreated ? 'text-green-700' : 'text-gray-700'
                        }`} />
                        <h3 className="font-medium text-sm mb-1 text-gray-800">{category.name}</h3>
                        <p className="text-xs text-gray-600 line-clamp-2">{category.description}</p>
                        {/* Orange cog for default categories, green cog for user-created */}
                        <Settings className={`h-4 w-4 absolute top-2 right-2 ${
                          isUserCreated ? 'text-green-500' : 'text-orange-500'
                        }`} />
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              

            </CardContent>
          </Card>
        </div>

        {/* Existing Configurations - Only show actual PR2 configurations (not standard categories) */}
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
                          onClick={() => setLocation(`/pr2-pricing-form?sector=${sector}&edit=${config.id}`)}
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
              <p className={`text-2xl font-bold ${currentSector.color}`}>{currentSector.name}</p>
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