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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Settings, CreditCard, User, Users, Building, MapPin, Calculator, Car, Clock, Plus, Edit2, Trash2, Truck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { DevLabel } from "@/utils/DevLabel";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { VehicleTravelRate, InsertVehicleTravelRate } from "@shared/schema";
import { VEHICLE_TYPES } from "@shared/constants";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY!);

interface PaymentMethod {
  id: string;
  type: 'card' | 'apple_pay' | 'paypal';
  card?: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
  isDefault?: boolean;
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

// Payment Method Dialog Component
function AddPaymentMethodDialog({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentType, setPaymentType] = useState<'card' | 'apple_pay' | 'paypal'>('card');
  const { toast } = useToast();
  const stripe = useStripe();
  const elements = useElements();

  const handleCardSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!stripe || !elements) {
      toast({
        title: "Payment system not ready",
        description: "Please try again in a moment.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error("Card element not found");
      }

      // Create payment method
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (error) {
        throw new Error(error.message);
      }

      // Save payment method to backend
      const response = await apiRequest('POST', '/api/payment-methods', {
        paymentMethodId: paymentMethod.id,
        type: 'card'
      });

      if (!response.ok) {
        throw new Error('Failed to save payment method');
      }

      toast({
        title: "Success",
        description: "Card added successfully!",
      });

      setOpen(false);
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add payment method",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplePaySetup = async () => {
    if (!stripe) {
      toast({
        title: "Payment system not ready",
        description: "Please try again in a moment.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Check if Apple Pay is available
      if (!window.ApplePaySession || !ApplePaySession.canMakePayments()) {
        throw new Error('Apple Pay is not available on this device');
      }

      // Save Apple Pay capability to backend
      const response = await apiRequest('POST', '/api/payment-methods', {
        type: 'apple_pay',
        enabled: true
      });

      if (!response.ok) {
        throw new Error('Failed to enable Apple Pay');
      }

      toast({
        title: "Success",
        description: "Apple Pay enabled successfully!",
      });

      setOpen(false);
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to setup Apple Pay",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayPalSetup = async () => {
    setIsProcessing(true);

    try {
      // Save PayPal setup to backend
      const response = await apiRequest('POST', '/api/payment-methods', {
        type: 'paypal',
        enabled: true
      });

      if (!response.ok) {
        throw new Error('Failed to setup PayPal');
      }

      toast({
        title: "Success",
        description: "PayPal enabled successfully!",
      });

      setOpen(false);
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to setup PayPal",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Add Payment Method</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Payment Method</DialogTitle>
          <DialogDescription>
            Choose your preferred payment method
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Payment Type Selection */}
          <div className="grid grid-cols-3 gap-3">
            <Button
              type="button"
              variant={paymentType === 'card' ? 'default' : 'outline'}
              onClick={() => setPaymentType('card')}
              className="flex flex-col items-center p-4 h-auto"
            >
              <CreditCard className="h-6 w-6 mb-2" />
              <span className="text-sm">Credit Card</span>
            </Button>
            
            <Button
              type="button"
              variant={paymentType === 'apple_pay' ? 'default' : 'outline'}
              onClick={() => setPaymentType('apple_pay')}
              className="flex flex-col items-center p-4 h-auto"
            >
              <div className="h-6 w-6 mb-2 bg-black rounded text-white flex items-center justify-center text-xs font-bold">
                
              </div>
              <span className="text-sm">Apple Pay</span>
            </Button>
            
            <Button
              type="button"
              variant={paymentType === 'paypal' ? 'default' : 'outline'}
              onClick={() => setPaymentType('paypal')}
              className="flex flex-col items-center p-4 h-auto"
            >
              <div className="h-6 w-6 mb-2 bg-blue-600 rounded text-white flex items-center justify-center text-xs font-bold">
                PP
              </div>
              <span className="text-sm">PayPal</span>
            </Button>
          </div>

          {/* Payment Method Forms */}
          {paymentType === 'card' && (
            <form onSubmit={handleCardSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Card Details</Label>
                <div className="p-3 border rounded-md">
                  <CardElement 
                    options={{
                      style: {
                        base: {
                          fontSize: '16px',
                          color: '#424770',
                          '::placeholder': {
                            color: '#aab7c4',
                          },
                        },
                      },
                    }}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={!stripe || isProcessing}>
                  {isProcessing ? "Processing..." : "Add Card"}
                </Button>
              </div>
            </form>
          )}

          {paymentType === 'apple_pay' && (
            <div className="space-y-4">
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground mb-4">
                  Apple Pay allows you to make secure payments using Touch ID, Face ID, or your device passcode.
                </p>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleApplePaySetup} disabled={isProcessing}>
                    {isProcessing ? "Setting up..." : "Enable Apple Pay"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {paymentType === 'paypal' && (
            <div className="space-y-4">
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground mb-4">
                  PayPal allows you to pay securely using your PayPal account balance, bank account, or linked cards.
                </p>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handlePayPalSetup} disabled={isProcessing}>
                    {isProcessing ? "Setting up..." : "Connect PayPal"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Vehicle Travel Rate Schema and Types
const vehicleTravelRateSchema = z.object({
  categoryId: z.string().optional(),
  vehicleType: z.string().min(1, "Vehicle type is required"),
  additionalTravelRatePerHour: z.number().min(0.01, "Additional travel rate must be greater than 0"),
  hoursTraveAllowed: z.number().min(1, "Hours allowed must be at least 1").default(10),
});

type VehicleTravelRateForm = z.infer<typeof vehicleTravelRateSchema>;



// Main component wrapped with Stripe Elements
function CustomerSettingsContent() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [sameAsCompany, setSameAsCompany] = useState(false);

  // Fetch payment methods
  const { data: paymentMethods = [], isLoading: paymentMethodsLoading, error: paymentMethodsError } = useQuery<PaymentMethod[]>({
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
      categoryId: "",
      vehicleType: "",
      additionalTravelRatePerHour: 0,
      hoursTraveAllowed: 10,
    },
  });

  // Fetch vehicle travel rates
  const { data: vehicleRates = [], isLoading: vehicleRatesLoading } = useQuery<VehicleTravelRate[]>({
    queryKey: ['/api/vehicle-travel-rates'],
    enabled: isOpen && !!user,
  });

  // Fetch work categories for Service Category dropdown
  const { data: workCategories = [], isLoading: categoriesLoading } = useQuery<any[]>({
    queryKey: ['/api/work-categories'],
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
    onSuccess: (updatedData) => {
      // Force an immediate cache update with the new data
      queryClient.setQueryData(['/api/vehicle-travel-rates'], (oldData: VehicleTravelRate[] | undefined) => {
        if (!oldData) return [updatedData];
        return oldData.map(item => item.id === updatedData.id ? updatedData : item);
      });
      
      // Also invalidate to refetch from server
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
  const fetchVehicleDefaults = async (vehicleType: string) => {
    console.log('Fetching vehicle defaults for:', vehicleType);
    
    // UK Commercial Vehicle Industry Standard Defaults
    const vehicleDefaults = {
      '3.5t': { 
        fuelConsumptionMpg: '30.0', 
        fuelCostPerLitre: '1.429', // Current UK diesel average
        driverWagePerHour: '12.50', 
        vehicleRunningCostPerMile: '0.25', 
        hasAssistant: false, 
        assistantWagePerHour: '0.00',
        hoursTraveAllowed: '2.00',
        autoUpdateFuelPrice: true,
        workCategory: 'Small van/light commercial',
        assistantReason: 'single operator typical for this vehicle class'
      },
      '5.0t': { 
        fuelConsumptionMpg: '22.0', 
        fuelCostPerLitre: '1.429',
        driverWagePerHour: '13.00', 
        vehicleRunningCostPerMile: '0.30', 
        hasAssistant: false, 
        assistantWagePerHour: '0.00',
        hoursTraveAllowed: '2.00',
        autoUpdateFuelPrice: true,
        workCategory: 'Medium van',
        assistantReason: 'single operator typical for this vehicle class'
      },
      '7.5t': { 
        fuelConsumptionMpg: '13.5', 
        fuelCostPerLitre: '1.429',
        driverWagePerHour: '14.50', 
        vehicleRunningCostPerMile: '0.40', 
        hasAssistant: false, 
        assistantWagePerHour: '0.00',
        hoursTraveAllowed: '2.00',
        autoUpdateFuelPrice: true,
        workCategory: 'Light truck/large van',
        assistantReason: 'single operator typical for this vehicle class'
      },
      '10t': { 
        fuelConsumptionMpg: '11.0', 
        fuelCostPerLitre: '1.429',
        driverWagePerHour: '15.50', 
        vehicleRunningCostPerMile: '0.50', 
        hasAssistant: false, 
        assistantWagePerHour: '0.00',
        hoursTraveAllowed: '2.00',
        autoUpdateFuelPrice: true,
        workCategory: '4-wheel rigid truck',
        assistantReason: 'single operator typical for this vehicle class'
      },
      '12t': { 
        fuelConsumptionMpg: '10.0', 
        fuelCostPerLitre: '1.429',
        driverWagePerHour: '16.00', 
        vehicleRunningCostPerMile: '0.60', 
        hasAssistant: false, 
        assistantWagePerHour: '0.00',
        hoursTraveAllowed: '2.00',
        autoUpdateFuelPrice: true,
        workCategory: '6-wheel rigid truck',
        assistantReason: 'single operator typical for this vehicle class'
      },
      '18t': { 
        fuelConsumptionMpg: '9.0', 
        fuelCostPerLitre: '1.429',
        driverWagePerHour: '17.50', 
        vehicleRunningCostPerMile: '0.75', 
        hasAssistant: true, 
        assistantWagePerHour: '14.00',
        hoursTraveAllowed: '2.00',
        autoUpdateFuelPrice: true,
        workCategory: 'Heavy rigid truck',
        assistantReason: 'assistant typically required for 18t+ vehicles for safety and efficiency'
      },
      '26t': { 
        fuelConsumptionMpg: '8.5', 
        fuelCostPerLitre: '1.429',
        driverWagePerHour: '18.50', 
        vehicleRunningCostPerMile: '0.85', 
        hasAssistant: true, 
        assistantWagePerHour: '14.80',
        hoursTraveAllowed: '2.00',
        autoUpdateFuelPrice: true,
        workCategory: 'Articulated truck',
        assistantReason: 'assistant required for heavy articulated vehicles and complex equipment operation'
      },
      '32t': { 
        fuelConsumptionMpg: '9.0', 
        fuelCostPerLitre: '1.429',
        driverWagePerHour: '19.00', 
        vehicleRunningCostPerMile: '0.95', 
        hasAssistant: true, 
        assistantWagePerHour: '15.20',
        hoursTraveAllowed: '2.00',
        autoUpdateFuelPrice: true,
        workCategory: 'Maximum weight articulated truck',
        assistantReason: 'assistant required for maximum weight vehicles and specialized equipment'
      }
    };

    const defaults = vehicleDefaults[vehicleType as keyof typeof vehicleDefaults];
    console.log('Vehicle defaults response:', defaults);
    return defaults || null;
  };

  const handleVehicleTypeChange = (vehicleType: string) => {
    console.log('Vehicle type selected:', vehicleType);
    vehicleForm.setValue('vehicleType', vehicleType);
  };

  const handleAddNewVehicle = () => {
    setEditingVehicleRate(null);
    vehicleForm.reset();
    setIsVehicleDialogOpen(true);
  };

  const handleEditVehicle = (rate: VehicleTravelRate) => {
    setEditingVehicleRate(rate);
    vehicleForm.reset({
      categoryId: rate.categoryId?.toString() || "",
      vehicleType: rate.vehicleType,
      additionalTravelRatePerHour: parseFloat(rate.additionalTravelRatePerHour?.toString() || '0'),
      hoursTraveAllowed: parseFloat(rate.hoursTraveAllowed?.toString() || '10'),
    });
    setIsVehicleDialogOpen(true);
  };

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState<number | null>(null);

  const handleDeleteVehicle = (id: number) => {
    setVehicleToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteVehicle = () => {
    if (vehicleToDelete) {
      deleteVehicleRateMutation.mutate(vehicleToDelete);
      setDeleteConfirmOpen(false);
      setVehicleToDelete(null);
    }
  };

  const onVehicleSubmit = (data: VehicleTravelRateForm) => {
    const vehicleData = {
      vehicleType: data.vehicleType,
      fuelConsumptionMpg: data.fuelConsumptionMpg.toString(),
      fuelCostPerLitre: data.fuelCostPerLitre.toString(),
      driverWagePerHour: data.driverWagePerHour.toString(),
      vehicleRunningCostPerMile: data.vehicleRunningCostPerMile.toString(),
      hasAssistant: data.hasAssistant || false,
      assistantWagePerHour: data.assistantWagePerHour?.toString() || '0',
      hoursTraveAllowed: data.hoursTraveAllowed?.toString() || '2',
      autoUpdateFuelPrice: data.autoUpdateFuelPrice || false,
      userId: user?.id || '',
    };

    if (editingVehicleRate) {
      updateVehicleRateMutation.mutate({ id: editingVehicleRate.id, data: vehicleData });
    } else {
      createVehicleRateMutation.mutate(vehicleData);
    }
  };

  const calculateTotalCostPerMile = (rate: VehicleTravelRate) => {
    if (!rate) return '0.00';
    
    const fuelCostPerLitre = parseFloat(rate.fuelCostPerLitre?.toString() || '0');
    const fuelConsumptionMpg = parseFloat(rate.fuelConsumptionMpg?.toString() || '1');
    const vehicleRunningCost = parseFloat(rate.vehicleRunningCostPerMile?.toString() || '0');
    
    const fuelCostPerMile = (fuelCostPerLitre / 4.546) / fuelConsumptionMpg; // Convert litres to gallons
    return (fuelCostPerMile + vehicleRunningCost).toFixed(2);
  };

  const calculateTotalCostPerHour = (rate: VehicleTravelRate) => {
    if (!rate) return '0.00';
    
    const fuelCostPerLitre = parseFloat(rate.fuelCostPerLitre?.toString() || '0');
    const fuelConsumptionMpg = parseFloat(rate.fuelConsumptionMpg?.toString() || '1');
    const driverWage = parseFloat(rate.driverWagePerHour?.toString() || '0');
    const assistantWage = ((rate as any).hasAssistant ? parseFloat((rate as any).assistantWagePerHour?.toString() || '0') : 0);
    
    // Calculate fuel cost per hour (assuming 30 mph average speed)
    const fuelCostPerHour = (fuelCostPerLitre * 4.54609 / fuelConsumptionMpg) * 30;
    
    // Total cost per hour = fuel cost/hour + driver wage + assistant wage
    const totalCostPerHour = fuelCostPerHour + driverWage + assistantWage;
    
    return totalCostPerHour.toFixed(2);
  };

  // Update payment method mutation
  const updatePaymentMethodMutation = useMutation({
    mutationFn: async (paymentMethodId: string) => {
      const response = await apiRequest('POST', '/api/update-default-payment-method', { paymentMethodId });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payment-methods'] });
      toast({
        title: "Payment Method Updated",
        description: "Default payment method has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update payment method.",
        variant: "destructive",
      });
    },
  });

  const deletePaymentMethodMutation = useMutation({
    mutationFn: async (paymentMethodId: string) => {
      const response = await apiRequest('DELETE', `/api/payment-methods/${paymentMethodId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payment-methods'] });
      toast({
        title: "Payment Method Deleted",
        description: "Payment method has been removed successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete payment method.",
        variant: "destructive",
      });
    },
  });

  const handleDeletePaymentMethod = (paymentMethodId: string) => {
    if (confirm("Are you sure you want to delete this payment method?")) {
      deletePaymentMethodMutation.mutate(paymentMethodId);
    }
  };

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
            <Card className="relative">
              <DevLabel id="8" />
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
            <Card className="relative">
              <DevLabel id="9" />
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
                <CardDescription>
                  Manage your payment methods for report purchases and subscriptions.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {paymentMethodsLoading ? (
                  <div className="text-center py-4">Loading payment methods...</div>
                ) : !paymentMethods || paymentMethods.length === 0 ? (
                  <div className="text-center py-8">
                    <CreditCard className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">No payment methods on file</p>
                    <p className="text-sm text-gray-500 mt-2 mb-6">
                      Add a payment method to enable automatic billing for reports and subscriptions.
                    </p>
                    <AddPaymentMethodDialog onSuccess={() => {
                      queryClient.invalidateQueries({ queryKey: ['/api/payment-methods'] });
                      toast({ title: "Payment method added successfully" });
                    }} />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-3">
                      {(paymentMethods as PaymentMethod[]).map((method: PaymentMethod) => (
                        <div
                          key={method.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            {method.type === 'card' && <CreditCard className="h-5 w-5 text-gray-400" />}
                            {method.type === 'apple_pay' && (
                              <div className="h-5 w-5 bg-black rounded text-white flex items-center justify-center text-xs font-bold">
                                
                              </div>
                            )}
                            {method.type === 'paypal' && (
                              <div className="h-5 w-5 bg-blue-600 rounded text-white flex items-center justify-center text-xs font-bold">
                                PP
                              </div>
                            )}
                            <div>
                              {method.type === 'card' && method.card && (
                                <>
                                  <p className="font-medium">
                                    {method.card.brand.toUpperCase()} •••• {method.card.last4}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    Expires {method.card.exp_month}/{method.card.exp_year}
                                  </p>
                                </>
                              )}
                              {method.type === 'apple_pay' && (
                                <>
                                  <p className="font-medium">Apple Pay</p>
                                  <p className="text-sm text-gray-500">Touch ID, Face ID, or Passcode</p>
                                </>
                              )}
                              {method.type === 'paypal' && (
                                <>
                                  <p className="font-medium">PayPal</p>
                                  <p className="text-sm text-gray-500">Connected PayPal Account</p>
                                </>
                              )}
                              {method.isDefault && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 mt-1">
                                  Default
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            {!method.isDefault && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updatePaymentMethodMutation.mutate(method.id)}
                                disabled={updatePaymentMethodMutation.isPending}
                              >
                                Set as Default
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeletePaymentMethod(method.id)}
                              disabled={deletePaymentMethodMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-center pt-4">
                      <AddPaymentMethodDialog onSuccess={() => {
                        queryClient.invalidateQueries({ queryKey: ['/api/payment-methods'] });
                        toast({ title: "Payment method added successfully" });
                      }} />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {user.role === 'admin' && (
            <>
              <TabsContent value="company" className="space-y-4">
                <Card className="relative">
                  <DevLabel id="10" />
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
                                  src={`/api/logo/${companySettings.companyLogo.split('/').pop()}`}
                                  alt="Company Logo"
                                  className="h-16 w-16 object-contain bg-white border rounded"
                                  onLoad={() => {
                                    console.log("✅ Logo loaded successfully via API endpoint");
                                  }}
                                  onError={(e) => {
                                    console.error("❌ Logo API endpoint failed, URL:", e.currentTarget.src);
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
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={async () => {
                                    try {
                                      await apiRequest('PUT', '/api/company-settings', { companyLogo: '' });
                                      queryClient.invalidateQueries({ queryKey: ['/api/company-settings'] });
                                      toast({
                                        title: "Logo removed",
                                        description: "Company logo and file have been deleted successfully.",
                                      });
                                    } catch (error) {
                                      toast({
                                        title: "Error",
                                        description: "Failed to remove logo. Please try again.",
                                        variant: "destructive",
                                      });
                                    }
                                  }}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Remove
                                </Button>
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
                <Card className="relative">
                  <DevLabel id="11" />
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
                <Card className="relative">
                  <DevLabel id="12" />
                  <CardHeader>
                    <CardTitle>Vehicle Travel Rates</CardTitle>
                    <CardDescription>
                      Configure additional travel rates for vehicle types when travel exceeds 10 hours from company address to site.
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
                                  ({rate.categoryId ? 
                                    (workCategories.find(cat => cat.id === parseInt(rate.categoryId?.toString() || '0'))?.name || 'General') 
                                    : 'General'
                                  })
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                                <div>
                                  <span className="font-medium">Additional Rate:</span> £{rate.additionalTravelRatePerHour || '0'}/hr
                                </div>
                                <div>
                                  <span className="font-medium">Hours Allowed:</span> {rate.hoursTraveAllowed || '10'} hours
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
                      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>
                            {editingVehicleRate ? 'Edit Vehicle Travel Rate' : 'Add Vehicle Travel Rate'}
                          </DialogTitle>
                          <DialogDescription>
                            Configure additional travel rate for this vehicle type.
                          </DialogDescription>
                        </DialogHeader>
                        <Form {...vehicleForm}>
                          <form onSubmit={vehicleForm.handleSubmit(onVehicleSubmit)} className="space-y-4">
                            <FormField
                              control={vehicleForm.control}
                              name="categoryId"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Service Category (Optional)</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select a service category" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="none">-- None Selected --</SelectItem>
                                      {workCategories
                                        .sort((a: any, b: any) => a.sort_order - b.sort_order)
                                        .map((category: any) => (
                                        <SelectItem key={category.id} value={category.id.toString()}>
                                          {category.name} (ID: {category.id})
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={vehicleForm.control}
                              name="vehicleType"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Vehicle Type</FormLabel>
                                  <Select onValueChange={handleVehicleTypeChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select vehicle type" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {VEHICLE_TYPES.map((type) => (
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

                            <FormField
                              control={vehicleForm.control}
                              name="additionalTravelRatePerHour"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Additional Travel Rate per Hour (£)</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      {...field}
                                      value={field.value || ''}
                                      onChange={(e) => {
                                        const value = e.target.value;
                                        field.onChange(value === '' ? 0 : parseFloat(value) || 0);
                                      }}
                                    />
                                  </FormControl>
                                  <FormDescription>
                                    Rate charged for travel hours over 10 hours from company address to site
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={vehicleForm.control}
                              name="hoursTraveAllowed"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Number of Hours Travel Allowed</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      step="0.5"
                                      {...field}
                                      value={field.value || ''}
                                      onChange={(e) => {
                                        const value = e.target.value;
                                        field.onChange(value === '' ? 10 : parseFloat(value) || 10);
                                      }}
                                    />
                                  </FormControl>
                                  <FormDescription>
                                    Maximum hours of travel allowed per day (default: 10 hours)
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

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
                                  : "Save"}
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
                <Card className="relative">
                  <DevLabel id="13" />
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Vehicle Travel Rate</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this vehicle travel rate? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteVehicle}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}

// Export the main component wrapped with Stripe Elements
export function CustomerSettings() {
  return (
    <Elements stripe={stripePromise}>
      <CustomerSettingsContent />
    </Elements>
  );
}