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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Settings, CreditCard, User, Users, Building, MapPin } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

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
  address?: string;
  postcode?: string;
  phoneNumber?: string;
  maxUsers: number;
  currentUsers: number;
  pricePerUser: string;
}

interface DepotSettings {
  id?: number;
  depotName: string;
  sameAsCompany: boolean;
  address?: string;
  postcode: string;
  phoneNumber?: string;
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

  // Fetch depot settings (for admin users)
  const { data: depotSettings, isLoading: depotLoading } = useQuery<DepotSettings>({
    queryKey: ['/api/depot-settings'],
    enabled: isOpen && !!user && user?.role === 'admin',
  });

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
    mutationFn: (data: Partial<CompanySettings>) =>
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
    mutationFn: (data: Partial<DepotSettings>) =>
      apiRequest('PUT', '/api/depot-settings', data),
    onSuccess: () => {
      toast({
        title: "Depot settings updated",
        description: "Your depot settings have been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/depot-settings'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update depot settings. Please try again.",
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
    const data = {
      companyName: formData.get('companyName') as string,
      address: formData.get('address') as string,
      phoneNumber: formData.get('phoneNumber') as string,
      postcode: formData.get('postcode') as string,
    };
    updateCompanyMutation.mutate(data);
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
        address: companySettings.address,
        postcode: companySettings.postcode || '',
        phoneNumber: companySettings.phoneNumber,
      };
    } else {
      // Use depot-specific details
      data = {
        depotName: formData.get('depotName') as string,
        sameAsCompany: false,
        address: formData.get('address') as string,
        postcode: formData.get('postcode') as string,
        phoneNumber: formData.get('phoneNumber') as string,
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
                      <form onSubmit={handleCompanySubmit} className="space-y-4">
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
                          <Label htmlFor="address">Address</Label>
                          <Input
                            id="address"
                            name="address"
                            defaultValue={companySettings?.address || ''}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="phoneNumber">Phone Number</Label>
                            <Input
                              id="phoneNumber"
                              name="phoneNumber"
                              defaultValue={companySettings?.phoneNumber || ''}
                            />
                          </div>
                          <div>
                            <Label htmlFor="postcode">Postcode</Label>
                            <Input
                              id="postcode"
                              name="postcode"
                              defaultValue={companySettings?.postcode || ''}
                              placeholder="e.g. SW1A 1AA"
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
                              <Label htmlFor="depot-address">Depot Address</Label>
                              <Input
                                id="depot-address"
                                name="address"
                                defaultValue={depotSettings?.address || ''}
                                placeholder="Enter depot address if different from company"
                              />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="depot-phoneNumber">Phone Number</Label>
                                <Input
                                  id="depot-phoneNumber"
                                  name="phoneNumber"
                                  defaultValue={depotSettings?.phoneNumber || ''}
                                  placeholder="Depot phone number"
                                />
                              </div>
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
                                <strong>Address:</strong> {companySettings.address || 'Not set'}
                              </div>
                              <div>
                                <strong>Phone:</strong> {companySettings.phoneNumber || 'Not set'}
                              </div>
                              <div>
                                <strong>Postcode:</strong> {companySettings.postcode || 'Not set'}
                              </div>
                            </div>
                            {!companySettings.postcode && (
                              <p className="text-sm text-destructive">
                                Warning: Company postcode is required for travel calculations. Please set it in Company settings.
                              </p>
                            )}
                          </div>
                        )}

                        <Button
                          type="submit"
                          disabled={updateDepotMutation.isPending}
                        >
                          Save Depot Settings
                        </Button>
                      </form>
                    )}
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