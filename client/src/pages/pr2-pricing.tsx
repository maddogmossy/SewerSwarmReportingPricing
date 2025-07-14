import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<{id: string, name: string, affectedSectors?: string[]} | null>(null);
  
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
    queryKey: ['pr2-configs', sector], // Changed to avoid cache conflicts
    queryFn: async () => {
      console.log('🔍 Making API request for sector:', sector);
      const response = await apiRequest('GET', '/api/pr2-clean', undefined, { sector });
      const data = await response.json();
      console.log('📥 Raw API response:', data);
      console.log('📊 Response length:', data.length);
      console.log('📊 Response items:', data.map(item => `ID: ${item.id}, Sector: ${item.sector}`));
      return data;
    },
    enabled: !!sector,
    staleTime: 0, // Always fetch fresh data
    cacheTime: 0, // Don't cache results
    refetchOnMount: true,
    refetchOnWindowFocus: true
  });

  // Fetch standard categories from database
  const { data: standardCategoriesFromDB = [], isLoading: standardCategoriesLoading } = useQuery({
    queryKey: ['/api/standard-categories'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/standard-categories');
      return await response.json();
    },
  });

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

  // Delete mutation for PR2 configurations
  const deletePR2Configuration = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/pr2-clean/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pr2-configs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/pr2-pricing'] });
      // Silent operation - no toast notification
    }
  });

  // Check which sectors have this configuration
  const checkConfigurationSectors = async (categoryId: string): Promise<string[]> => {
    const sectorsWithConfig = [];
    
    console.log('🔍 Checking configuration across all sectors for categoryId:', categoryId);
    
    for (const sect of SECTORS) {
      try {
        const response = await apiRequest('GET', `/api/pr2-clean?sector=${sect.id}`);
        const configs = await response.json();
        
        console.log(`📋 Sector ${sect.name} configs:`, configs);
        
        const hasConfig = Array.isArray(configs) ? 
          configs.some(c => c.categoryId === categoryId) : 
          (configs?.categoryId === categoryId);
        
        console.log(`✅ Sector ${sect.name} has config:`, hasConfig);
        
        if (hasConfig) {
          sectorsWithConfig.push(sect.name); // Use sector name for display
        }
      } catch (error) {
        console.error(`Error checking sector ${sect.id}:`, error);
      }
    }
    
    console.log('🎯 Final affected sectors:', sectorsWithConfig);
    return sectorsWithConfig;
  };

  // Handle PR2 configuration delete with dynamic sector warning
  const handlePR2ConfigDelete = async (configId: number, configName: string, categoryId: string) => {
    // Find which sectors have this configuration
    const affectedSectors = await checkConfigurationSectors(categoryId);
    
    // Store the affected sectors info for the dialog
    setCategoryToDelete({ 
      id: configId.toString(), 
      name: configName,
      affectedSectors: affectedSectors 
    });
    setDeleteDialogOpen(true);
  };

  // Delete mutation for standard categories
  const deleteStandardCategory = useMutation({
    mutationFn: (categoryId: string) => apiRequest('DELETE', `/api/standard-categories/${categoryId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/standard-categories'] });
      toast({ title: "Standard category deleted successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Cannot delete category", 
        description: error.message || "Category has existing pricing configurations",
        variant: "destructive"
      });
    }
  });

  // Handle category deletion with validation
  const handleCategoryDelete = async (categoryId: string, categoryName: string) => {
    // First check if category has any pricing configurations
    const hasConfigurations = pr2Configurations.some(config => 
      config.categoryId === categoryId || config.categoryName === categoryName
    );
    
    if (hasConfigurations) {
      toast({
        title: "Cannot delete category",
        description: "This category has existing pricing configurations. Please delete them first.",
        variant: "destructive"
      });
      return;
    }
    
    // Show confirmation dialog
    setCategoryToDelete({ id: categoryId, name: categoryName });
    setDeleteDialogOpen(true);
  };

  // Execute deletion after confirmation (handles both PR2 configs and standard categories)
  const confirmDelete = async () => {
    if (!categoryToDelete) return;
    
    try {
      // Check if it's a PR2 configuration (numeric ID) or standard category (string ID)
      if (/^\d+$/.test(categoryToDelete.id)) {
        // Numeric ID = PR2 configuration
        await deletePR2Configuration.mutateAsync(parseInt(categoryToDelete.id));
      } else {
        // String ID = Standard category
        await deleteStandardCategory.mutateAsync(categoryToDelete.id);
      }
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  // Handle navigation to category-specific pages
  const handleCategoryNavigation = (categoryId: string) => {
    console.log('🔍 Navigation triggered for categoryId:', categoryId);
    console.log('📍 Current sector:', sector);
    
    // Wait for configurations to load before navigation
    if (pr2Loading) {
      console.log('⏳ PR2 configurations still loading, waiting...');
      return;
    }
    
    // Check if there's an existing configuration for this category
    console.log('🔍 All PR2 configurations:', pr2Configurations);
    console.log('🔍 PR2 configurations count:', pr2Configurations.length);
    console.log('🔍 PR2 loading state:', pr2Loading);
    console.log('🔍 Looking for categoryId:', categoryId);
    
    // If configurations are empty, proceed to create new configuration
    if (!pr2Loading && pr2Configurations.length === 0) {
      console.log('⚠️ No configurations found - proceeding to create new configuration');
    }
    
    // Standard categories should always create new configurations, not edit existing ones
    // Only check for existing configs when navigating from "Existing PR2 Configurations" section
    
    // For CCTV specifically, always go to the configuration page
    if (categoryId === 'cctv') {
      console.log('🎥 CCTV category - routing to configuration page');
      const createURL = `/pr2-config-clean?sector=${sector}&categoryId=${categoryId}`;
      console.log('🔗 Creating CCTV config at URL:', createURL);
      // Force navigation by updating both wouter state and browser history
      window.history.replaceState({}, '', createURL);
      setLocation(createURL);
      return;
    }
    
    const routeMap = {
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
        <div className="text-center">Loading pricing configuration...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">Pricing Configuration</h1>
          <p className="text-gray-600">
            Configure pricing for <span className={`font-medium ${currentSector.color}`}>{currentSector.name}</span> sector cleaning and repairs
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Dashboard Navigation */}
          <Button
            onClick={() => setLocation('/dashboard')}
            variant="outline"
            className="bg-white hover:bg-gray-50 border-gray-200 text-black font-bold px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <BarChart3 className="h-5 w-5 text-green-600" />
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
              <CardTitle>Categories</CardTitle>
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
                        
                        {/* Show status icon based on configuration */}
                        {(() => {
                          const hasConfiguration = pr2Configurations.some(config => 
                            config.categoryId === category.id || 
                            config.categoryName?.toLowerCase() === category.id.toLowerCase() ||
                            (category.id === 'cctv' && config.categoryName === 'CCTV')
                          );
                          
                          if (hasConfiguration) {
                            return <Settings className="h-4 w-4 absolute top-2 right-2 text-green-500" />;
                          } else if (isUserCreated) {
                            return <Settings className="h-4 w-4 absolute top-2 right-2 text-green-500" />;
                          } else {
                            return <Settings className="h-4 w-4 absolute top-2 right-2 text-orange-500" />;
                          }
                        })()}
                        
                        {/* Delete button - only for user-created categories */}
                        {isUserCreated && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="absolute bottom-2 right-2 h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent card click navigation
                              handleCategoryDelete(category.id, category.name);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              

            </CardContent>
          </Card>
        </div>

        {/* Existing Configurations - Full width list display */}
        {pr2Configurations.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Existing Configurations</h3>
            <div className="space-y-3">
              {pr2Configurations.map((config: any) => (
                <Card key={config.id} className="w-full hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-6">
                      {/* Left section - Icon and details */}
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="p-2 rounded-lg bg-blue-100 flex-shrink-0">
                          <Settings className="h-5 w-5 text-blue-600" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-4 mb-1">
                            <h4 className="text-lg font-semibold text-gray-900">{config.categoryName}</h4>
                            <Badge variant="default" className="text-xs">Active</Badge>
                            <span className="text-sm font-bold text-gray-800">Description:</span>
                            <span className="text-sm text-gray-700 break-words flex-1">{config.description}</span>
                          </div>
                          
                          <div className="flex items-center justify-center gap-8 text-sm text-gray-500">
                            <span>Pricing Options: {Array.isArray(config.pricingOptions) ? config.pricingOptions.length : Object.keys(config.pricingOptions || {}).length}</span>
                            <span>Quantity Options: {Array.isArray(config.quantityOptions) ? config.quantityOptions.length : Object.keys(config.quantityOptions || {}).length}</span>
                            <span>Math Operators: {config.mathOperators?.length || 0}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Right section - Action buttons */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setLocation(`/pr2-config-clean?sector=${sector}&categoryId=${config.categoryId}&editId=${config.id}`)}
                          className="text-xs px-3"
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePR2ConfigDelete(config.id, config.categoryName, config.categoryId)}
                          className="text-red-600 border-red-200 hover:bg-red-50 px-2"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="mb-2">
              Are you sure you want to delete the "{categoryToDelete?.name}" configuration?
            </p>
            {categoryToDelete?.affectedSectors && categoryToDelete.affectedSectors.length > 0 && (
              <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
                This will delete the configuration from all sectors: <strong>{categoryToDelete.affectedSectors.join(', ')}</strong>
              </p>
            )}
            <p className="mt-2 text-sm text-gray-600">
              This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setCategoryToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteStandardCategory.isPending}
            >
              {deleteStandardCategory.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}