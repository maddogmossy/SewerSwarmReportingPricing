import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Settings, CreditCard, User, Users, Building, MapPin, Calculator, Car, Clock, Plus, Edit2, Trash2, Truck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { VehicleTravelRate, InsertVehicleTravelRate } from "@shared/schema";

interface PaymentMethod {
  id: string;
  card: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
}

interface CompanySettings {
  id: number;
  companyName: string;
  companyLogo?: string;
  // Detailed address fields
  buildingName?: string;
  streetName?: string;
  streetName2?: string;
  town?: string;
  city?: string;
  county?: string;
  postcode?: string;
  country?: string;
  // Contact information
  phoneNumber?: string;
  email?: string;
  website?: string;
  // Legacy fields for backward compatibility
  address?: string;
  streetAddress?: string;
  maxUsers: number;
  currentUsers: number;
  pricePerUser: string;
}

interface DepotSettings {
  id?: number;
  depotName: string;
  sameAsCompany: boolean;
  // Detailed address fields
  buildingName?: string;
  streetName?: string;
  streetName2?: string;
  town?: string;
  city?: string;
  county?: string;
  postcode: string;
  country?: string;
  // Contact information
  phoneNumber?: string;
  email?: string;
  // Legacy fields for backward compatibility
  address?: string;
  streetAddress?: string;
  travelRatePerMile?: string;
  standardTravelTime?: string;
  maxTravelDistance?: string;
  operatingHours?: string;
}

interface TeamMember {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

// Vehicle Travel Rate Schema and Types
const vehicleTravelRateSchema = z.object({
  vehicleType: z.string().min(1, "Vehicle type is required"),
  fuelConsumptionMpg: z.number().min(0.1, "Fuel consumption must be greater than 0"),
  fuelCostPerLitre: z.number().min(0.01, "Fuel cost must be greater than 0"),
  driverWagePerHour: z.number().min(0.01, "Driver wage must be greater than 0"),
  vehicleRunningCostPerMile: z.number().min(0.01, "Vehicle running cost must be greater than 0"),
});

type VehicleTravelRateForm = z.infer<typeof vehicleTravelRateSchema>;

const vehicleTypes = [
  "3.5t Van",
  "5t Van", 
  "7.5t Truck",
  "18t Truck",
  "26t Truck",
  "32t Truck"
];

export function CustomerSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [sameAsCompany, setSameAsCompany] = useState(false);

  // Fetch payment methods
  const { data: paymentMethods = [], isLoading: paymentMethodsLoading } = useQuery<PaymentMethod[]>({
    queryKey: ['/api/payment-methods'],
    enabled: isOpen && !!user,
  });

  // Fetch company settings (for admin users)
  const { data: companySettings, isLoading: companyLoading } = useQuery<CompanySettings>({
    queryKey: ['/api/company-settings'],
    enabled: isOpen && !!user && user?.role === 'admin',
  });

  // Fetch depot settings (for admin users) - API returns array, use first depot
  const { data: depotSettingsArray = [], isLoading: depotLoading } = useQuery<DepotSettings[]>({
    queryKey: ['/api/depot-settings'],
    enabled: isOpen && !!user && user?.role === 'admin',
  });

  const depotSettings = depotSettingsArray[0]; // Use first depot

  // Initialize sameAsCompany state when depot settings load
  useEffect(() => {
    if (depotSettings) {
      setSameAsCompany(depotSettings.sameAsCompany || false);
    }
  }, [depotSettings]);

  // Fetch team members (for admin users)
  const { data: teamMembers = [], isLoading: teamLoading } = useQuery<TeamMember[]>({
    queryKey: ['/api/team-members'],
    enabled: isOpen && !!user && user?.role === 'admin',
  });

  // Vehicle Travel Rate state and functionality
  const [isVehicleDialogOpen, setIsVehicleDialogOpen] = useState(false);
  const [editingVehicleRate, setEditingVehicleRate] = useState<VehicleTravelRate | null>(null);

  const vehicleForm = useForm<VehicleTravelRateForm>({
    resolver: zodResolver(vehicleTravelRateSchema),
    defaultValues: {
      vehicleType: "",
      fuelConsumptionMpg: 0,
      fuelCostPerLitre: 0,
      driverWagePerHour: 0,
      vehicleRunningCostPerMile: 0,
    },
  });

  // Fetch vehicle travel rates
  const { data: vehicleRates = [], isLoading: vehicleRatesLoading } = useQuery<VehicleTravelRate[]>({
    queryKey: ['/api/vehicle-travel-rates'],
    enabled: isOpen && !!user,
  });

  // Vehicle Travel Rate mutations
  const createVehicleRateMutation = useMutation({
    mutationFn: (data: InsertVehicleTravelRate) => 
      apiRequest('POST', '/api/vehicle-travel-rates', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vehicle-travel-rates'] });
      setIsVehicleDialogOpen(false);
      setEditingVehicleRate(null);
      vehicleForm.reset();
      toast({
        title: "Success",
        description: "Vehicle travel rate created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create vehicle travel rate",
        variant: "destructive",
      });
    },
  });

  const updateVehicleRateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: InsertVehicleTravelRate }) =>
      apiRequest('PUT', `/api/vehicle-travel-rates/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vehicle-travel-rates'] });
      setIsVehicleDialogOpen(false);
      setEditingVehicleRate(null);
      vehicleForm.reset();
      toast({
        title: "Success",
        description: "Vehicle travel rate updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update vehicle travel rate",
        variant: "destructive",
      });
    },
  });

  const deleteVehicleRateMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest('DELETE', `/api/vehicle-travel-rates/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vehicle-travel-rates'] });
      toast({
        title: "Success",
        description: "Vehicle travel rate deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete vehicle travel rate",
        variant: "destructive",
      });
    },
  });

  // Vehicle Travel Rate helper functions
  const handleAddNewVehicle = () => {
    setEditingVehicleRate(null);
    vehicleForm.reset();
    setIsVehicleDialogOpen(true);
  };

  const handleEditVehicle = (rate: VehicleTravelRate) => {
    setEditingVehicleRate(rate);
    vehicleForm.reset({
      vehicleType: rate.vehicleType,
      fuelConsumptionMpg: parseFloat(rate.fuelConsumptionMpg.toString()),
      fuelCostPerLitre: parseFloat(rate.fuelCostPerLitre.toString()),
      driverWagePerHour: parseFloat(rate.driverWagePerHour.toString()),
      vehicleRunningCostPerMile: parseFloat(rate.vehicleRunningCostPerMile.toString()),
    });
    setIsVehicleDialogOpen(true);
  };

  const handleDeleteVehicle = (id: number) => {
    if (confirm("Are you sure you want to delete this vehicle travel rate?")) {
      deleteVehicleRateMutation.mutate(id);
    }
  };

  const onVehicleSubmit = (data: VehicleTravelRateForm) => {
    const vehicleData = {
      vehicleType: data.vehicleType,
      fuelConsumptionMpg: data.fuelConsumptionMpg.toString(),
      fuelCostPerLitre: data.fuelCostPerLitre.toString(),
      driverWagePerHour: data.driverWagePerHour.toString(),
      vehicleRunningCostPerMile: data.vehicleRunningCostPerMile.toString(),
      userId: user?.id || '',
    };

    if (editingVehicleRate) {
      updateVehicleRateMutation.mutate({ id: editingVehicleRate.id, data: vehicleData });
    } else {
      createVehicleRateMutation.mutate(vehicleData);
    }
  };

  const calculateTotalCostPerMile = (rate: VehicleTravelRate) => {
    const fuelCostPerLitre = parseFloat(rate.fuelCostPerLitre.toString());
    const fuelConsumptionMpg = parseFloat(rate.fuelConsumptionMpg.toString());
    const vehicleRunningCost = parseFloat(rate.vehicleRunningCostPerMile.toString());
    
    const fuelCostPerMile = (fuelCostPerLitre / 4.546) / fuelConsumptionMpg; // Convert litres to gallons
    return (fuelCostPerMile + vehicleRunningCost).toFixed(2);
  };

  // Update payment method mutation
  const updatePaymentMethodMutation = useMutation({
    mutationFn: (paymentMethodId: string) =>
      apiRequest('POST', '/api/update-payment-method', { paymentMethodId }),
    onSuccess: () => {
      toast({
        title: "Payment method updated",
        description: "Your default payment method has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/payment-methods'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update payment method. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update company settings mutation
  const updateCompanyMutation = useMutation({
    mutationFn: (data: Partial<CompanySettings> | FormData) =>
      apiRequest('PUT', '/api/company-settings', data),
    onSuccess: () => {
      toast({
        title: "Company settings updated",
        description: "Your company settings have been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/company-settings'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update company settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update depot settings mutation
  const updateDepotMutation = useMutation({
    mutationFn: (data: Partial<DepotSettings>) => {
      if (depotSettings?.id) {
        // Update existing depot
        return apiRequest('PUT', `/api/depot-settings/${depotSettings.id}`, data);
      } else {
        // Create new depot
        return apiRequest('POST', '/api/depot-settings', data);
      }
    },
    onSuccess: () => {
      toast({
        title: "Depot settings saved",
        description: "Your depot settings have been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/depot-settings'] });
      // Don't close the dialog automatically - let user continue editing
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save depot settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Invite team member mutation
  const inviteTeamMemberMutation = useMutation({
    mutationFn: (email: string) =>
      apiRequest('POST', '/api/invite-team-member', { email }),
    onSuccess: () => {
      toast({
        title: "Invitation sent",
        description: "Team member invitation has been sent successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/team-members'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send invitation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCompanySubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // Check if a logo file is uploaded
    const logoFile = formData.get('companyLogo') as File;
    
    if (logoFile && logoFile.size > 0) {
      // If there's a logo file, send FormData directly
      updateCompanyMutation.mutate(formData);
    } else {
      // If no logo file, send JSON data
      const data = {
        companyName: formData.get('companyName') as string,
        buildingName: formData.get('buildingName') as string,
        streetName: formData.get('streetName') as string,
        streetName2: formData.get('streetName2') as string,
        town: formData.get('town') as string,
        city: formData.get('city') as string,
        county: formData.get('county') as string,
        postcode: formData.get('postcode') as string,
        country: formData.get('country') as string,
        phoneNumber: formData.get('phoneNumber') as string,
        email: formData.get('email') as string,
        website: formData.get('website') as string,
        // Legacy fields for backward compatibility
        streetAddress: formData.get('streetAddress') as string,
      };
      updateCompanyMutation.mutate(data);
    }
  };

  const handleDepotSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const sameAsCompany = formData.get('sameAsCompany') === 'on';
    
    let data: Partial<DepotSettings>;
    
    if (sameAsCompany && companySettings) {
      // Use company details when "same as company" is checked
      data = {
        depotName: formData.get('depotName') as string,
        sameAsCompany: true,
        buildingName: companySettings.buildingName,
        streetName: companySettings.streetName,
        streetName2: companySettings.streetName2,
        town: companySettings.town,
        city: companySettings.city,
        county: companySettings.county,
        postcode: companySettings.postcode || '',
        country: companySettings.country,
        phoneNumber: companySettings.phoneNumber,
        email: companySettings.email,
        // Legacy fields for backward compatibility
        address: companySettings.address,
        streetAddress: companySettings.streetAddress,
        travelRatePerMile: formData.get('travelRatePerMile') as string,
        standardTravelTime: formData.get('standardTravelTime') as string,
        maxTravelDistance: formData.get('maxTravelDistance') as string,
        operatingHours: formData.get('operatingHours') as string,
      };
    } else {
      // Use depot-specific details
      data = {
        depotName: formData.get('depotName') as string,
        sameAsCompany: false,
        buildingName: formData.get('buildingName') as string,
        streetName: formData.get('streetName') as string,
        streetName2: formData.get('streetName2') as string,
        town: formData.get('town') as string,
        city: formData.get('city') as string,
        county: formData.get('county') as string,
        postcode: formData.get('postcode') as string,
        country: formData.get('country') as string,
        phoneNumber: formData.get('phoneNumber') as string,
        email: formData.get('email') as string,
        // Legacy fields for backward compatibility
        address: formData.get('address') as string,
        streetAddress: formData.get('streetAddress') as string,
        travelRatePerMile: formData.get('travelRatePerMile') as string,
        standardTravelTime: formData.get('standardTravelTime') as string,
        maxTravelDistance: formData.get('maxTravelDistance') as string,
        operatingHours: formData.get('operatingHours') as string,
      };
    }
    
    updateDepotMutation.mutate(data);
  };

  const handleInviteSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    inviteTeamMemberMutation.mutate(email);
    e.currentTarget.reset();
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Account Settings</DialogTitle>
          <DialogDescription>
            Manage your account preferences, payment methods, and team settings.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="account" className="w-full">
          <TabsList className={`grid w-full ${user.role === 'admin' ? 'grid-cols-6' : 'grid-cols-2'}`}>
            <TabsTrigger value="account">
              <User className="h-4 w-4 mr-2" />
              Account
            </TabsTrigger>
            <TabsTrigger value="payment">
              <CreditCard className="h-4 w-4 mr-2" />
              Payment
            </TabsTrigger>
            {user.role === 'admin' && (
              <>
                <TabsTrigger value="company">
                  <Building className="h-4 w-4 mr-2" />
                  Company
                </TabsTrigger>
                <TabsTrigger value="depot">
                  <MapPin className="h-4 w-4 mr-2" />
                  Depot
                </TabsTrigger>
                <TabsTrigger value="team">
                  <Users className="h-4 w-4 mr-2" />
                  Team
                </TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value="account" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Your account details from Replit authentication.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>First Name</Label>
                    <Input value={user.firstName || ''} disabled />
                  </div>
                  <div>
                    <Label>Last Name</Label>
                    <Input value={user.lastName || ''} disabled />
                  </div>
                </div>
                <div>
                  <Label>Email</Label>
                  <Input value={user.email || ''} disabled />
                </div>
                <div>
                  <Label>Role</Label>
                  <Input value={user.role === 'admin' ? 'Administrator' : 'Team Member'} disabled />
                </div>
                <div>
                  <Label>Subscription Status</Label>
                  <Input value={user.subscriptionStatus || 'none'} disabled />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payment" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
                <CardDescription>
                  Manage your payment methods for report purchases and subscriptions.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {paymentMethodsLoading ? (
                  <div className="text-center py-4">Loading payment methods...</div>
                ) : paymentMethods.length === 0 ? (
                  <div className="text-center py-8">
                    <CreditCard className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">No payment methods on file</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Payment methods will be added when you make your first purchase.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(paymentMethods as PaymentMethod[]).map((method: PaymentMethod) => (
                      <div
                        key={method.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <CreditCard className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="font-medium">
                              {method.card.brand.toUpperCase()} •••• {method.card.last4}
                            </p>
                            <p className="text-sm text-gray-500">
                              Expires {method.card.exp_month}/{method.card.exp_year}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updatePaymentMethodMutation.mutate(method.id)}
                          disabled={updatePaymentMethodMutation.isPending}
                        >
                          Set as Default
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {user.role === 'admin' && (
            <>
              <TabsContent value="company" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Company Settings</CardTitle>
                    <CardDescription>
                      Configure your company details and branding.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {companyLoading ? (
                      <div className="text-center py-4">Loading company settings...</div>
                    ) : (
                      <form onSubmit={handleCompanySubmit} className="space-y-4" encType="multipart/form-data">
                        <div>
                          <Label htmlFor="companyName">Company Name</Label>
                          <Input
                            id="companyName"
                            name="companyName"
                            defaultValue={companySettings?.companyName || ''}
                            required
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="companyLogo">Company Logo</Label>
                          <Input
                            id="companyLogo"
                            name="companyLogo"
                            type="file"
                            accept="image/*"
                            className="cursor-pointer"
                          />
                          {companySettings?.companyLogo && (
                            <div className="mt-3 p-4 border rounded-lg bg-gray-50">
                              <div className="flex items-center space-x-4">
                                <img 
                                  src={`/${companySettings.companyLogo}`}
                                  alt="Company Logo"
                                  className="h-16 w-16 object-contain bg-white border rounded"
                                  onError={(e) => {
                                    const target = e.currentTarget as HTMLImageElement;
                                    target.style.display = 'none';
                                    const fallback = target.nextElementSibling as HTMLElement;
                                    if (fallback) fallback.style.display = 'block';
                                  }}
                                />
                                <div style={{ display: 'none' }} className="h-16 w-16 bg-gray-200 border rounded flex items-center justify-center">
                                  <span className="text-xs text-gray-500">No preview</span>
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-900">Current Logo</p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {companySettings.companyLogo.includes('auto-logo') ? 'Auto-fetched from website' : 'Manually uploaded'}
                                  </p>
                                  <p className="text-xs text-gray-400 mt-1">{companySettings.companyLogo}</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div>
                          <Label htmlFor="buildingName">Building Name</Label>
                          <Input
                            id="buildingName"
                            name="buildingName"
                            defaultValue={companySettings?.buildingName || ''}
                            placeholder="e.g. Business Centre"
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="streetName">Street Name</Label>
                            <Input
                              id="streetName"
                              name="streetName"
                              defaultValue={companySettings?.streetName || ''}
                              placeholder="e.g. High Street"
                            />
                          </div>
                          <div>
                            <Label htmlFor="streetName2">Street Name (2)</Label>
                            <Input
                              id="streetName2"
                              name="streetName2"
                              defaultValue={companySettings?.streetName2 || ''}
                              placeholder="e.g. Industrial Estate"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <Label htmlFor="town">Town</Label>
                            <Input
                              id="town"
                              name="town"
                              defaultValue={companySettings?.town || ''}
                              placeholder="e.g. Maidenhead"
                            />
                          </div>
                          <div>
                            <Label htmlFor="city">City</Label>
                            <Input
                              id="city"
                              name="city"
                              defaultValue={companySettings?.city || ''}
                              placeholder="e.g. London"
                            />
                          </div>
                          <div>
                            <Label htmlFor="county">County</Label>
                            <Input
                              id="county"
                              name="county"
                              defaultValue={companySettings?.county || ''}
                              placeholder="e.g. Berkshire"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="postcode">Postcode</Label>
                            <Input
                              id="postcode"
                              name="postcode"
                              defaultValue={companySettings?.postcode || ''}
                              placeholder="e.g. SW1A 1AA"
                            />
                          </div>
                          <div>
                            <Label htmlFor="country">Country</Label>
                            <Input
                              id="country"
                              name="country"
                              defaultValue={companySettings?.country || 'United Kingdom'}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <Label htmlFor="phoneNumber">Phone Number</Label>
                            <Input
                              id="phoneNumber"
                              name="phoneNumber"
                              defaultValue={companySettings?.phoneNumber || ''}
                              placeholder="e.g. +44 20 1234 5678"
                            />
                          </div>
                          <div>
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                              id="email"
                              name="email"
                              type="email"
                              defaultValue={companySettings?.email || ''}
                              placeholder="e.g. info@company.com"
                            />
                          </div>
                          <div>
                            <Label htmlFor="website">Website</Label>
                            <Input
                              id="website"
                              name="website"
                              defaultValue={companySettings?.website || ''}
                              placeholder="e.g. www.company.com"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Current Users</Label>
                            <Input
                              value={`${companySettings?.currentUsers || 1}/${companySettings?.maxUsers || 1}`}
                              disabled
                            />
                          </div>
                          <div>
                            <Label>Price per Additional User</Label>
                            <Input
                              value={`£${companySettings?.pricePerUser || '25.00'}/month`}
                              disabled
                            />
                          </div>
                        </div>
                        <Button
                          type="submit"
                          disabled={updateCompanyMutation.isPending}
                        >
                          Save Company Settings
                        </Button>
                      </form>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="depot" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Depot Settings</CardTitle>
                    <CardDescription>
                      Configure your depot location for travel time calculations and automatic file naming with site addresses.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {depotLoading ? (
                      <div className="text-center py-4">Loading depot settings...</div>
                    ) : (
                      <form onSubmit={handleDepotSubmit} className="space-y-4">
                        <div>
                          <Label htmlFor="depotName">Depot Name</Label>
                          <Input
                            id="depotName"
                            name="depotName"
                            defaultValue={depotSettings?.depotName || ''}
                            placeholder="e.g. Main Depot, Birmingham Depot"
                            required
                          />
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="sameAsCompany"
                            name="sameAsCompany"
                            checked={sameAsCompany}
                            onCheckedChange={(checked) => setSameAsCompany(checked as boolean)}
                          />
                          <Label htmlFor="sameAsCompany">
                            Use same details as company (address, postcode, phone)
                          </Label>
                        </div>

                        {!sameAsCompany && (
                          <div className="space-y-4" id="depot-details">
                            <div>
                              <Label htmlFor="depot-buildingName">Building Name</Label>
                              <Input
                                id="depot-buildingName"
                                name="buildingName"
                                defaultValue={depotSettings?.buildingName || ''}
                                placeholder="e.g. Industrial Complex"
                              />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="depot-streetName">Street Name</Label>
                                <Input
                                  id="depot-streetName"
                                  name="streetName"
                                  defaultValue={depotSettings?.streetName || ''}
                                  placeholder="e.g. Industrial Road"
                                />
                              </div>
                              <div>
                                <Label htmlFor="depot-streetName2">Street Name (2)</Label>
                                <Input
                                  id="depot-streetName2"
                                  name="streetName2"
                                  defaultValue={depotSettings?.streetName2 || ''}
                                  placeholder="e.g. Trading Estate"
                                />
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-4">
                              <div>
                                <Label htmlFor="depot-town">Town</Label>
                                <Input
                                  id="depot-town"
                                  name="town"
                                  defaultValue={depotSettings?.town || ''}
                                  placeholder="e.g. Birmingham"
                                />
                              </div>
                              <div>
                                <Label htmlFor="depot-city">City</Label>
                                <Input
                                  id="depot-city"
                                  name="city"
                                  defaultValue={depotSettings?.city || ''}
                                  placeholder="e.g. Birmingham"
                                />
                              </div>
                              <div>
                                <Label htmlFor="depot-county">County</Label>
                                <Input
                                  id="depot-county"
                                  name="county"
                                  defaultValue={depotSettings?.county || ''}
                                  placeholder="e.g. West Midlands"
                                />
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="depot-postcode">Postcode *</Label>
                                <Input
                                  id="depot-postcode"
                                  name="postcode"
                                  defaultValue={depotSettings?.postcode || ''}
                                  placeholder="e.g. B1 1AA"
                                  required
                                />
                                <p className="text-sm text-muted-foreground mt-1">
                                  Required for calculating travel time to site locations
                                </p>
                              </div>
                              <div>
                                <Label htmlFor="depot-country">Country</Label>
                                <Input
                                  id="depot-country"
                                  name="country"
                                  defaultValue={depotSettings?.country || 'United Kingdom'}
                                />
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="depot-phoneNumber">Phone Number</Label>
                                <Input
                                  id="depot-phoneNumber"
                                  name="phoneNumber"
                                  defaultValue={depotSettings?.phoneNumber || ''}
                                  placeholder="e.g. +44 121 234 5678"
                                />
                              </div>
                              <div>
                                <Label htmlFor="depot-email">Email Address</Label>
                                <Input
                                  id="depot-email"
                                  name="email"
                                  type="email"
                                  defaultValue={depotSettings?.email || ''}
                                  placeholder="e.g. depot@company.com"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {sameAsCompany && companySettings && (
                          <div className="space-y-4 bg-muted p-4 rounded-lg">
                            <p className="text-sm text-muted-foreground">
                              Using company details for depot:
                            </p>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <strong>Address:</strong> {[
                                  companySettings.buildingName,
                                  companySettings.streetName,
                                  companySettings.streetName2,
                                  companySettings.town,
                                  companySettings.city,
                                  companySettings.county
                                ].filter(Boolean).join(', ') || 'Not set'}
                              </div>
                              <div>
                                <strong>Phone:</strong> {companySettings.phoneNumber || 'Not set'}
                              </div>
                              <div>
                                <strong>Postcode:</strong> {companySettings.postcode || 'Not set'}
                              </div>
                              <div>
                                <strong>Email:</strong> {companySettings.email || 'Not set'}
                              </div>
                            </div>
                            {!companySettings.postcode && (
                              <p className="text-sm text-destructive">
                                Warning: Company postcode is required for travel calculations. Please set it in Company settings.
                              </p>
                            )}
                          </div>
                        )}

                        {/* Operating Hours */}
                        <div className="space-y-4 border-t pt-4">
                          <h4 className="font-semibold text-sm">Operating Hours</h4>
                          
                          <div>
                            <Label htmlFor="operatingHours">Operating Hours</Label>
                            <Input
                              id="operatingHours"
                              name="operatingHours"
                              defaultValue={depotSettings?.operatingHours || ""}
                              placeholder="e.g. 8:00 AM - 6:00 PM"
                            />
                            <p className="text-sm text-muted-foreground mt-1">
                              Normal operating hours for scheduling
                            </p>
                          </div>
                        </div>

                        <Button
                          type="submit"
                          disabled={updateDepotMutation.isPending}
                        >
                          {updateDepotMutation.isPending ? "Saving..." : "Save Depot Settings"}
                        </Button>
                      </form>
                    )}
                  </CardContent>
                </Card>

                {/* Vehicle Travel Rates Section */}
                <Card>
                  <CardHeader>
                    <CardTitle>Vehicle Travel Rates</CardTitle>
                    <CardDescription>
                      Configure fuel costs, wages, and running costs for different vehicle types to calculate accurate travel expenses.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center mb-4">
                      <div className="text-sm text-muted-foreground">
                        {vehicleRates?.length || 0} vehicle type{(vehicleRates?.length || 0) !== 1 ? 's' : ''} configured
                      </div>
                      <Button onClick={handleAddNewVehicle} size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Vehicle Type
                      </Button>
                    </div>

                    {vehicleRatesLoading ? (
                      <div className="text-center py-4">Loading vehicle rates...</div>
                    ) : !vehicleRates || vehicleRates.length === 0 ? (
                      <div className="text-center py-8">
                        <Car className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-600">No vehicle types configured</p>
                        <p className="text-sm text-gray-500 mt-2">
                          Add vehicle types to calculate travel costs accurately.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {vehicleRates.map((rate) => (
                          <div
                            key={rate.id}
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Car className="h-4 w-4 text-blue-600" />
                                <span className="font-medium">{rate.vehicleType}</span>
                                <span className="text-sm text-muted-foreground">
                                  (£{calculateTotalCostPerMile(rate)}/mile)
                                </span>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                                <div>
                                  <span className="font-medium">Fuel:</span> {rate.fuelConsumptionMpg} MPG @ £{rate.fuelCostPerLitre}/L
                                </div>
                                <div>
                                  <span className="font-medium">Wage:</span> £{rate.driverWagePerHour}/hr
                                </div>
                                <div>
                                  <span className="font-medium">Running:</span> £{rate.vehicleRunningCostPerMile}/mile
                                </div>
                                <div>
                                  <span className="font-medium">Total:</span> £{calculateTotalCostPerMile(rate)}/mile
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditVehicle(rate)}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteVehicle(rate.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Vehicle Travel Rate Dialog */}
                    <Dialog open={isVehicleDialogOpen} onOpenChange={setIsVehicleDialogOpen}>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>
                            {editingVehicleRate ? 'Edit Vehicle Travel Rate' : 'Add Vehicle Travel Rate'}
                          </DialogTitle>
                          <DialogDescription>
                            Configure fuel consumption, costs, and wages for this vehicle type.
                          </DialogDescription>
                        </DialogHeader>
                        <Form {...vehicleForm}>
                          <form onSubmit={vehicleForm.handleSubmit(onVehicleSubmit)} className="space-y-4">
                            <FormField
                              control={vehicleForm.control}
                              name="vehicleType"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Vehicle Type</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select vehicle type" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {vehicleTypes.map((type) => (
                                        <SelectItem key={type} value={type}>
                                          {type}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <div className="grid grid-cols-2 gap-4">
                              <FormField
                                control={vehicleForm.control}
                                name="fuelConsumptionMpg"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Fuel Consumption (MPG)</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        step="0.1"
                                        {...field}
                                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={vehicleForm.control}
                                name="fuelCostPerLitre"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Fuel Cost per Litre (£)</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        step="0.01"
                                        {...field}
                                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <FormField
                                control={vehicleForm.control}
                                name="driverWagePerHour"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Driver Wage per Hour (£)</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        step="0.01"
                                        {...field}
                                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={vehicleForm.control}
                                name="vehicleRunningCostPerMile"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Running Cost per Mile (£)</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        step="0.01"
                                        {...field}
                                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <div className="flex justify-end space-x-2">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsVehicleDialogOpen(false)}
                              >
                                Cancel
                              </Button>
                              <Button
                                type="submit"
                                disabled={createVehicleRateMutation.isPending || updateVehicleRateMutation.isPending}
                              >
                                {createVehicleRateMutation.isPending || updateVehicleRateMutation.isPending
                                  ? "Saving..."
                                  : editingVehicleRate
                                  ? "Update Rate"
                                  : "Create Rate"}
                              </Button>
                            </div>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="team" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Team Members</CardTitle>
                    <CardDescription>
                      Invite and manage team members. Each additional user costs £25/month.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <form onSubmit={handleInviteSubmit} className="flex gap-2">
                      <Input
                        name="email"
                        type="email"
                        placeholder="Enter email address"
                        required
                        className="flex-1"
                      />
                      <Button
                        type="submit"
                        disabled={inviteTeamMemberMutation.isPending}
                      >
                        Invite Member
                      </Button>
                    </form>

                    {teamLoading ? (
                      <div className="text-center py-4">Loading team members...</div>
                    ) : teamMembers.length === 0 ? (
                      <div className="text-center py-8">
                        <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-600">No team members yet</p>
                        <p className="text-sm text-gray-500 mt-2">
                          Invite team members to upload reports and export data.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {(teamMembers as TeamMember[]).map((member: TeamMember) => (
                          <div
                            key={member.id}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div>
                              <p className="font-medium">
                                {member.firstName} {member.lastName}
                              </p>
                              <p className="text-sm text-gray-500">{member.email}</p>
                              <p className="text-xs text-gray-400">
                                Role: {member.role} • 
                                Status: {member.isActive ? 'Active' : 'Inactive'}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-500">
                                Last login: {member.lastLoginAt 
                                  ? new Date(member.lastLoginAt).toLocaleDateString()
                                  : 'Never'
                                }
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}