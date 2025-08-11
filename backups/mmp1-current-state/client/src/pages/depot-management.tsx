import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Building2, Edit, Trash2, MapPin, Phone, Clock, Car, AlertTriangle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";

interface Depot {
  id: number;
  depotName: string;
  sameAsCompany: boolean;
  address: string;
  postcode: string;
  phoneNumber: string;
  travelRatePerMile: string;
  standardTravelTime: string;
  maxTravelDistance: string;
  operatingHours?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

interface TravelCalculation {
  id: number;
  fromPostcode: string;
  toPostcode: string;
  distanceMiles: string;
  travelTimeMinutes: string;
  travelCost: string;
  travelRatePerMile: string;
  routeType: string;
  calculatedAt: string;
}

export default function DepotManagement() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingDepot, setEditingDepot] = useState<Depot | null>(null);
  const [travelFromPostcode, setTravelFromPostcode] = useState("");
  const [travelToPostcode, setTravelToPostcode] = useState("");
  const [selectedDepotId, setSelectedDepotId] = useState<number | null>(null);
  const [newDepot, setNewDepot] = useState({
    depotName: "",
    sameAsCompany: false,
    address: "",
    postcode: "",
    phoneNumber: "",
    travelRatePerMile: "0.45",
    standardTravelTime: "30.0",
    maxTravelDistance: "50.0",
    operatingHours: "",
    isActive: true
  });

  const queryClient = useQueryClient();

  // Fetch depots
  const { data: depots = [], isLoading: isLoadingDepots } = useQuery<Depot[]>({
    queryKey: ['/api/depot-settings']
  });

  // Add depot mutation
  const addDepotMutation = useMutation({
    mutationFn: (depot: any) => apiRequest('POST', '/api/depot-settings', depot),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/depot-settings'] });
      setIsAddDialogOpen(false);
      setNewDepot({
        depotName: "",
        sameAsCompany: false,
        address: "",
        postcode: "",
        phoneNumber: "",
        travelRatePerMile: "0.45",
        standardTravelTime: "30.0",
        maxTravelDistance: "50.0",
        operatingHours: "",
        isActive: true
      });
    }
  });

  // Update depot mutation
  const updateDepotMutation = useMutation({
    mutationFn: ({ id, ...depot }: { id: number } & Partial<Depot>) => 
      apiRequest('PUT', `/api/depot-settings/${id}`, depot),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/depot-settings'] });
      setEditingDepot(null);
    }
  });

  // Delete depot mutation
  const deleteDepotMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/depot-settings/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/depot-settings'] });
    }
  });

  // Travel calculation mutation
  const travelCalculationMutation = useMutation({
    mutationFn: (data: { fromPostcode: string; toPostcode: string; depotId?: number }) =>
      apiRequest('POST', '/api/calculate-travel', data)
  });

  const handleAddDepot = () => {
    addDepotMutation.mutate(newDepot);
  };

  const handleUpdateDepot = () => {
    if (editingDepot) {
      updateDepotMutation.mutate(editingDepot);
    }
  };

  const handleDeleteDepot = (id: number) => {
    deleteDepotMutation.mutate(id);
  };

  const handleCalculateTravel = () => {
    if (travelFromPostcode && travelToPostcode) {
      travelCalculationMutation.mutate({
        fromPostcode: travelFromPostcode,
        toPostcode: travelToPostcode,
        depotId: selectedDepotId || undefined
      });
    }
  };

  if (isLoadingDepots) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Building2 className="w-6 h-6" />
          <h1 className="text-3xl font-bold">Depot Management</h1>
        </div>
        <div className="text-center">Loading depots...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Building2 className="w-6 h-6" />
          <h1 className="text-3xl font-bold">Depot Management</h1>
        </div>
        <div className="flex space-x-2">
          <Link href="/dashboard">
            <Button variant="outline" className="flex items-center space-x-2">
              <Car className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </Button>
          </Link>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>Add Depot</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Depot</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="depotName">Depot Name</Label>
                  <Input
                    id="depotName"
                    value={newDepot.depotName}
                    onChange={(e) => setNewDepot({ ...newDepot, depotName: e.target.value })}
                    placeholder="Main Depot"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sameAsCompany"
                    checked={newDepot.sameAsCompany}
                    onCheckedChange={(checked) => 
                      setNewDepot({ ...newDepot, sameAsCompany: checked as boolean })
                    }
                  />
                  <Label htmlFor="sameAsCompany">Same as company address</Label>
                </div>

                <div>
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={newDepot.address}
                    onChange={(e) => setNewDepot({ ...newDepot, address: e.target.value })}
                    placeholder="123 Industrial Estate, Birmingham"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="postcode">Postcode</Label>
                  <Input
                    id="postcode"
                    value={newDepot.postcode}
                    onChange={(e) => setNewDepot({ ...newDepot, postcode: e.target.value })}
                    placeholder="B1 1AA"
                  />
                </div>

                <div>
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    value={newDepot.phoneNumber}
                    onChange={(e) => setNewDepot({ ...newDepot, phoneNumber: e.target.value })}
                    placeholder="+44 121 123 4567"
                  />
                </div>

                <Separator />

                <div>
                  <Label htmlFor="travelRatePerMile">Travel Rate per Mile (£)</Label>
                  <Input
                    id="travelRatePerMile"
                    type="text"
                    value={newDepot.travelRatePerMile}
                    onChange={(e) => setNewDepot({ ...newDepot, travelRatePerMile: e.target.value })}
                    placeholder="0.45"
                  />
                </div>

                <div>
                  <Label htmlFor="standardTravelTime">Standard Travel Time (minutes)</Label>
                  <Input
                    id="standardTravelTime"
                    type="text"
                    value={newDepot.standardTravelTime}
                    onChange={(e) => setNewDepot({ ...newDepot, standardTravelTime: e.target.value })}
                    placeholder="30.0"
                  />
                </div>

                <div>
                  <Label htmlFor="maxTravelDistance">Max Travel Distance (miles)</Label>
                  <Input
                    id="maxTravelDistance"
                    type="text"
                    value={newDepot.maxTravelDistance}
                    onChange={(e) => setNewDepot({ ...newDepot, maxTravelDistance: e.target.value })}
                    placeholder="50.0"
                  />
                </div>

                <div>
                  <Label htmlFor="operatingHours">Operating Hours</Label>
                  <Input
                    id="operatingHours"
                    value={newDepot.operatingHours}
                    onChange={(e) => setNewDepot({ ...newDepot, operatingHours: e.target.value })}
                    placeholder="8:00 AM - 5:00 PM"
                  />
                </div>

                <Button 
                  onClick={handleAddDepot} 
                  disabled={addDepotMutation.isPending}
                  className="w-full"
                >
                  {addDepotMutation.isPending ? "Adding..." : "Add Depot"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Depot List */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        {depots.map((depot) => (
          <Card key={depot.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{depot.depotName}</CardTitle>
                <div className="flex items-center space-x-1">
                  <Badge variant={depot.isActive ? "default" : "secondary"}>
                    {depot.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-start space-x-2">
                  <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <div>{depot.address}</div>
                    <div className="font-medium">{depot.postcode}</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span>{depot.phoneNumber}</span>
                </div>

                {depot.operatingHours && (
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>{depot.operatingHours}</span>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Car className="w-4 h-4 text-muted-foreground" />
                  <span>£{depot.travelRatePerMile}/mile</span>
                </div>

                <Separator className="my-3" />

                <div className="flex justify-between space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingDepot(depot)}
                    className="flex-1"
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Trash2 className="w-3 h-3 mr-1" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="w-5 h-5 text-orange-500" />
                          <AlertDialogTitle>Delete Depot</AlertDialogTitle>
                        </div>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{depot.depotName}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteDepot(depot.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Delete Depot
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Travel Calculator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Car className="w-5 h-5" />
            <span>Travel Calculator</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <Label htmlFor="fromPostcode">From Postcode</Label>
              <Input
                id="fromPostcode"
                value={travelFromPostcode}
                onChange={(e) => setTravelFromPostcode(e.target.value)}
                placeholder="B1 1AA"
              />
            </div>
            
            <div>
              <Label htmlFor="toPostcode">To Postcode</Label>
              <Input
                id="toPostcode"
                value={travelToPostcode}
                onChange={(e) => setTravelToPostcode(e.target.value)}
                placeholder="M1 1AA"
              />
            </div>

            <div>
              <Label htmlFor="depotSelect">Depot (optional)</Label>
              <select
                id="depotSelect"
                value={selectedDepotId || ""}
                onChange={(e) => setSelectedDepotId(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full h-10 px-3 border border-input rounded-md"
              >
                <option value="">Select depot...</option>
                {depots.map((depot) => (
                  <option key={depot.id} value={depot.id}>
                    {depot.depotName}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <Button 
                onClick={handleCalculateTravel}
                disabled={!travelFromPostcode || !travelToPostcode || travelCalculationMutation.isPending}
                className="w-full"
              >
                {travelCalculationMutation.isPending ? "Calculating..." : "Calculate"}
              </Button>
            </div>
          </div>

          {travelCalculationMutation.data && (
            <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <h4 className="font-medium mb-2">Travel Calculation Result</h4>
              <div className="grid gap-2 md:grid-cols-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Distance:</span>
                  <div className="font-medium">{travelCalculationMutation.data.distanceMiles} miles</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Travel Time:</span>
                  <div className="font-medium">{travelCalculationMutation.data.travelTimeMinutes} minutes</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Rate:</span>
                  <div className="font-medium">£{travelCalculationMutation.data.travelRatePerMile}/mile</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Cost:</span>
                  <div className="font-medium text-green-600">£{travelCalculationMutation.data.travelCost}</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Depot Dialog */}
      <Dialog open={!!editingDepot} onOpenChange={() => setEditingDepot(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Depot</DialogTitle>
          </DialogHeader>
          {editingDepot && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="editDepotName">Depot Name</Label>
                <Input
                  id="editDepotName"
                  value={editingDepot.depotName}
                  onChange={(e) => setEditingDepot({ ...editingDepot, depotName: e.target.value })}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="editSameAsCompany"
                  checked={editingDepot.sameAsCompany}
                  onCheckedChange={(checked) => 
                    setEditingDepot({ ...editingDepot, sameAsCompany: checked as boolean })
                  }
                />
                <Label htmlFor="editSameAsCompany">Same as company address</Label>
              </div>

              <div>
                <Label htmlFor="editAddress">Address</Label>
                <Textarea
                  id="editAddress"
                  value={editingDepot.address}
                  onChange={(e) => setEditingDepot({ ...editingDepot, address: e.target.value })}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="editPostcode">Postcode</Label>
                <Input
                  id="editPostcode"
                  value={editingDepot.postcode}
                  onChange={(e) => setEditingDepot({ ...editingDepot, postcode: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="editPhoneNumber">Phone Number</Label>
                <Input
                  id="editPhoneNumber"
                  value={editingDepot.phoneNumber}
                  onChange={(e) => setEditingDepot({ ...editingDepot, phoneNumber: e.target.value })}
                />
              </div>

              <Separator />

              <div>
                <Label htmlFor="editTravelRatePerMile">Travel Rate per Mile (£)</Label>
                <Input
                  id="editTravelRatePerMile"
                  type="text"
                  value={editingDepot.travelRatePerMile}
                  onChange={(e) => setEditingDepot({ ...editingDepot, travelRatePerMile: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="editStandardTravelTime">Standard Travel Time (minutes)</Label>
                <Input
                  id="editStandardTravelTime"
                  type="text"
                  value={editingDepot.standardTravelTime}
                  onChange={(e) => setEditingDepot({ ...editingDepot, standardTravelTime: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="editMaxTravelDistance">Max Travel Distance (miles)</Label>
                <Input
                  id="editMaxTravelDistance"
                  type="text"
                  value={editingDepot.maxTravelDistance}
                  onChange={(e) => setEditingDepot({ ...editingDepot, maxTravelDistance: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="editOperatingHours">Operating Hours</Label>
                <Input
                  id="editOperatingHours"
                  value={editingDepot.operatingHours || ""}
                  onChange={(e) => setEditingDepot({ ...editingDepot, operatingHours: e.target.value })}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="editIsActive"
                  checked={editingDepot.isActive}
                  onCheckedChange={(checked) => 
                    setEditingDepot({ ...editingDepot, isActive: checked as boolean })
                  }
                />
                <Label htmlFor="editIsActive">Active</Label>
              </div>

              <Button 
                onClick={handleUpdateDepot} 
                disabled={updateDepotMutation.isPending}
                className="w-full"
              >
                {updateDepotMutation.isPending ? "Updating..." : "Update Depot"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}