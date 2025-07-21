import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Edit2, Trash2, ArrowLeft, Truck } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import type { VehicleTravelRate, InsertVehicleTravelRate } from "@shared/schema";
import { VEHICLE_TYPES } from "@shared/constants";

const vehicleTravelRateSchema = z.object({
  categoryId: z.string().optional(),
  vehicleType: z.string().min(1, "Vehicle type is required"),
  fuelConsumptionMpg: z.number().min(0.1, "Fuel consumption must be greater than 0"),
  fuelCostPerLitre: z.number().min(0.01, "Fuel cost must be greater than 0"),
  driverWagePerHour: z.number().min(0.01, "Driver wage must be greater than 0"),
  assistantWagePerHour: z.number().min(0, "Assistant wage must be 0 or greater"),
  hasAssistant: z.boolean(),
  vehicleRunningCostPerMile: z.number().min(0.01, "Vehicle running cost must be greater than 0"),
  autoUpdateFuelPrice: z.boolean(),
});

type VehicleTravelRateForm = z.infer<typeof vehicleTravelRateSchema>;

export default function VehicleTravelRates() {
  console.log('🚀 VehicleTravelRates component rendering... VERSION 1.2.3');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<VehicleTravelRate | null>(null);

  console.log('VehicleTravelRates component mounted');
  
  // Test if component is actually loading
  useEffect(() => {
    console.log('VehicleTravelRates component fully loaded and useEffect triggered');
  }, []);

  // Fetch category cards
  const { data: categories = [], isLoading: categoriesLoading } = useQuery<any[]>({
    queryKey: ['/api/work-categories'],
  });

  // Debug categories loading
  useEffect(() => {
    console.log('🔍 Categories data:', categories);
    console.log('🔍 Categories loading:', categoriesLoading);
    console.log('🔍 Categories type:', typeof categories);
    console.log('🔍 Categories length:', Array.isArray(categories) ? categories.length : 0);
  }, [categories, categoriesLoading]);

  const form = useForm<VehicleTravelRateForm>({
    resolver: zodResolver(vehicleTravelRateSchema),
    defaultValues: {
      categoryId: "",
      vehicleType: "",
      fuelConsumptionMpg: 0,
      fuelCostPerLitre: 0,
      driverWagePerHour: 0,
      assistantWagePerHour: 0,
      hasAssistant: false,
      vehicleRunningCostPerMile: 0,
      autoUpdateFuelPrice: true,
    },
  });

  // Function to auto-populate vehicle defaults
  const autoPopulateVehicleDefaults = async (vehicleType: string) => {
    console.log('Auto-populating defaults for vehicle type:', vehicleType);
    try {
      const response = await fetch(`/api/vehicle-defaults/${encodeURIComponent(vehicleType)}`);
      console.log('API response status:', response.status);
      
      if (response.ok) {
        const defaults = await response.json();
        console.log('Received defaults:', defaults);
        
        // Only populate if fields are currently empty (not when editing)
        if (!editingRate) {
          console.log('Setting form values...');
          form.setValue('fuelConsumptionMpg', defaults.fuelConsumptionMpg);
          form.setValue('fuelCostPerLitre', defaults.fuelCostPerLitre);
          form.setValue('hasAssistant', defaults.hasAssistant);
          form.setValue('assistantWagePerHour', defaults.assistantWagePerHour);
          
          // Set realistic driver wage (£15/hour for smaller vehicles, £18/hour for larger)
          const weight = vehicleType.match(/(\d+(?:\.\d+)?)[t]/i);
          const vehicleWeight = weight ? parseFloat(weight[1]) : 3.5;
          const driverWage = vehicleWeight <= 7.5 ? 15.00 : 18.00;
          form.setValue('driverWagePerHour', driverWage);
          
          // Set realistic running costs based on vehicle size
          const runningCost = vehicleWeight <= 3.5 ? 0.15 : 
                             vehicleWeight <= 7.5 ? 0.25 : 
                             vehicleWeight <= 18 ? 0.35 : 0.45;
          form.setValue('vehicleRunningCostPerMile', runningCost);
          
          console.log('Form values set successfully');
          toast({
            title: "Vehicle defaults loaded",
            description: `Auto-populated fields for ${vehicleType} with current fuel prices and realistic values.`,
          });
        } else {
          console.log('Skipping auto-population because editing existing rate');
        }
      } else {
        console.error('API response not ok:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching vehicle defaults:', error);
      toast({
        title: "Error",
        description: "Failed to load vehicle defaults",
        variant: "destructive",
      });
    }
  };

  const { data: vehicleRates, isLoading } = useQuery<VehicleTravelRate[]>({
    queryKey: ['/api/vehicle-travel-rates'],
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertVehicleTravelRate) => 
      apiRequest('POST', '/api/vehicle-travel-rates', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vehicle-travel-rates'] });
      setIsDialogOpen(false);
      setEditingRate(null);
      form.reset();
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

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: InsertVehicleTravelRate }) =>
      apiRequest('PUT', `/api/vehicle-travel-rates/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vehicle-travel-rates'] });
      setIsDialogOpen(false);
      setEditingRate(null);
      form.reset();
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

  const deleteMutation = useMutation({
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

  const handleAddNew = () => {
    console.log('🚨🚨🚨 DIALOG OPENING - ADD VEHICLE BUTTON CLICKED!');
    console.log('🔍 Categories data:', categories);
    console.log('🔍 Categories loading:', categoriesLoading);
    console.log('🔍 Categories length:', Array.isArray(categories) ? categories.length : 'NOT ARRAY');
    console.log('🔍 Raw categories:', JSON.stringify(categories));
    console.log('🔍 Categories type:', typeof categories);
    setEditingRate(null);
    form.reset();
    setIsDialogOpen(true);
    
    // Force a manual fetch to test
    console.log('🔥 FORCING CATEGORIES FETCH TEST...');
    fetch('/api/work-categories')
      .then(r => r.json())
      .then(data => console.log('🔥 MANUAL FETCH RESULT:', data))
      .catch(err => console.error('🔥 MANUAL FETCH ERROR:', err));
  };

  const handleEdit = (rate: VehicleTravelRate) => {
    setEditingRate(rate);
    form.reset({
      categoryId: rate.categoryId?.toString() || "",
      vehicleType: rate.vehicleType,
      fuelConsumptionMpg: parseFloat(rate.fuelConsumptionMpg.toString()),
      fuelCostPerLitre: parseFloat(rate.fuelCostPerLitre.toString()),
      driverWagePerHour: parseFloat(rate.driverWagePerHour.toString()),
      assistantWagePerHour: parseFloat(rate.assistantWagePerHour?.toString() || "0"),
      hasAssistant: rate.hasAssistant || false,
      vehicleRunningCostPerMile: parseFloat(rate.vehicleRunningCostPerMile.toString()),
      autoUpdateFuelPrice: rate.autoUpdateFuelPrice || true,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this vehicle travel rate?")) {
      deleteMutation.mutate(id);
    }
  };

  const onSubmit = (data: VehicleTravelRateForm) => {
    const submitData: any = {
      userId: "test-user", // Default user for testing
      vehicleType: data.vehicleType,
      categoryId: data.categoryId ? parseInt(data.categoryId) : undefined,
      fuelConsumptionMpg: data.fuelConsumptionMpg.toString(),
      fuelCostPerLitre: data.fuelCostPerLitre.toString(),
      driverWagePerHour: data.driverWagePerHour.toString(),
      vehicleRunningCostPerMile: data.vehicleRunningCostPerMile.toString(),
      assistantWagePerHour: data.assistantWagePerHour?.toString() || "0",
      hasAssistant: data.hasAssistant || false,
      autoUpdateFuelPrice: data.autoUpdateFuelPrice || true,
    };
    
    if (editingRate) {
      updateMutation.mutate({ id: editingRate.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const calculateTotalCostPerMile = (rate: VehicleTravelRate) => {
    const fuelConsumption = parseFloat(rate.fuelConsumptionMpg.toString());
    const fuelCost = parseFloat(rate.fuelCostPerLitre.toString());
    const runningCost = parseFloat(rate.vehicleRunningCostPerMile.toString());
    const fuelCostPerMile = (fuelCost / 4.546) / fuelConsumption; // Convert litres to gallons
    return (fuelCostPerMile + runningCost).toFixed(2);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Truck className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold">Vehicle Travel Rates</h1>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddNew}>
              <Plus className="w-4 h-4 mr-2" />
              Add Vehicle Rate
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg min-h-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingRate ? "Edit Vehicle Travel Rate" : "🚨 DEBUG MODE - Add New Vehicle Travel Rate"}
              </DialogTitle>
              <div className="text-red-600 font-bold">COMPONENT VERSION: 2025-01-21-DEBUG</div>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* DEBUG: Show categories loading state */}
                <div className="p-4 bg-red-100 border-4 border-red-500 rounded-lg text-xl font-bold text-black">
                  🚨 CATEGORIES DEBUG: Loading={categoriesLoading ? 'YES' : 'NO'} | Count={Array.isArray(categories) ? categories.length : 'NOT_ARRAY'}
                  <br/>
                  📋 CATEGORY NAMES: {Array.isArray(categories) ? categories.map(c => c.name).join(', ') : 'NO CATEGORIES'}
                </div>
                
                <div className="p-4 bg-green-100 border-4 border-green-500 rounded-lg text-xl font-bold text-black">
                  ✅ SERVICE CATEGORY DROPDOWN SHOULD BE RIGHT BELOW THIS BOX
                </div>
                
                <FormField
                    control={form.control}
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
                            <SelectItem value="">-- None Selected --</SelectItem>
                            {(categories as any[]).map((category: any) => (
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
                  control={form.control}
                  name="vehicleType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vehicle Type</FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          console.log('Vehicle type selected:', value);
                          field.onChange(value);
                          autoPopulateVehicleDefaults(value);
                        }} 
                        value={field.value}
                      >
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
                  control={form.control}
                  name="fuelConsumptionMpg"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fuel Consumption (MPG)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.1"
                          placeholder="e.g., 25.5"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fuelCostPerLitre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fuel Cost per Litre (£)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01"
                          placeholder="e.g., 1.45"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="driverWagePerHour"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Driver Wage per Hour (£)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01"
                          placeholder="e.g., 15.50"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="hasAssistant"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Has Assistant</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Does this vehicle type require an assistant/mate?
                        </div>
                      </div>
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="assistantWagePerHour"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assistant Wage per Hour (£)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01"
                          placeholder="e.g., 12.50"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="vehicleRunningCostPerMile"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vehicle Running Cost per Mile (£)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01"
                          placeholder="e.g., 0.85"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="autoUpdateFuelPrice"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Auto-Update Fuel Prices</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Automatically update fuel costs with monthly price changes
                        </div>
                      </div>
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {editingRate ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vehicle Travel Rate Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading vehicle travel rates...</div>
          ) : vehicleRates && vehicleRates.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle Type</TableHead>
                  <TableHead>Fuel MPG</TableHead>
                  <TableHead>Fuel Cost/L</TableHead>
                  <TableHead>Driver Wage/Hr</TableHead>
                  <TableHead>Assistant</TableHead>
                  <TableHead>Vehicle Cost/Mile</TableHead>
                  <TableHead>Total Cost/Mile</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vehicleRates.map((rate) => (
                  <TableRow key={rate.id}>
                    <TableCell className="font-medium">{rate.vehicleType}</TableCell>
                    <TableCell>{rate.fuelConsumptionMpg} MPG</TableCell>
                    <TableCell>£{rate.fuelCostPerLitre}</TableCell>
                    <TableCell>£{rate.driverWagePerHour}</TableCell>
                    <TableCell>
                      {rate.hasAssistant ? (
                        <span className="text-green-600 font-medium">
                          Yes (£{rate.assistantWagePerHour}/hr)
                        </span>
                      ) : (
                        <span className="text-gray-500">No</span>
                      )}
                    </TableCell>
                    <TableCell>£{rate.vehicleRunningCostPerMile}</TableCell>
                    <TableCell className="font-medium">£{calculateTotalCostPerMile(rate)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(rate)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(rate.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No vehicle travel rates configured yet.</p>
              <Button onClick={handleAddNew}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Vehicle Rate
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How Travel Costs are Calculated</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <p><strong>Fuel Cost per Mile:</strong> (Fuel Cost per Litre ÷ 4.546) ÷ Fuel Consumption MPG</p>
            <p><strong>Total Cost per Mile:</strong> Fuel Cost per Mile + Vehicle Running Cost per Mile</p>
            <p><strong>Travel Cost:</strong> Total Cost per Mile × Distance in Miles</p>
            <p><strong>Driver Time Cost:</strong> Travel Time (hours) × Driver Wage per Hour</p>
            <p><strong>Total Travel Cost:</strong> Travel Cost + Driver Time Cost</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}