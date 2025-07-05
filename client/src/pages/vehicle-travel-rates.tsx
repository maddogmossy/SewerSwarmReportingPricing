import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Edit2, Trash2, ArrowLeft, Truck } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import type { VehicleTravelRate, InsertVehicleTravelRate } from "@shared/schema";

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

export default function VehicleTravelRates() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<VehicleTravelRate | null>(null);

  const form = useForm<VehicleTravelRateForm>({
    resolver: zodResolver(vehicleTravelRateSchema),
    defaultValues: {
      vehicleType: "",
      fuelConsumptionMpg: 0,
      fuelCostPerLitre: 0,
      driverWagePerHour: 0,
      vehicleRunningCostPerMile: 0,
    },
  });

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
    setEditingRate(null);
    form.reset();
    setIsDialogOpen(true);
  };

  const handleEdit = (rate: VehicleTravelRate) => {
    setEditingRate(rate);
    form.reset({
      vehicleType: rate.vehicleType,
      fuelConsumptionMpg: rate.fuelConsumptionMpg,
      fuelCostPerLitre: rate.fuelCostPerLitre,
      driverWagePerHour: rate.driverWagePerHour,
      vehicleRunningCostPerMile: rate.vehicleRunningCostPerMile,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this vehicle travel rate?")) {
      deleteMutation.mutate(id);
    }
  };

  const onSubmit = (data: VehicleTravelRateForm) => {
    if (editingRate) {
      updateMutation.mutate({ id: editingRate.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const calculateTotalCostPerMile = (rate: VehicleTravelRate) => {
    const fuelCostPerMile = (rate.fuelCostPerLitre / 4.546) / rate.fuelConsumptionMpg; // Convert litres to gallons
    return (fuelCostPerMile + rate.vehicleRunningCostPerMile).toFixed(2);
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
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingRate ? "Edit Vehicle Travel Rate" : "Add New Vehicle Travel Rate"}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
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