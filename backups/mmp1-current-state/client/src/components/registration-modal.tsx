import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Lock } from "lucide-react";

interface RegistrationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSwitchToLogin: () => void;
}

export default function RegistrationModal({ open, onOpenChange, onSwitchToLogin }: RegistrationModalProps) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    address: "",
    password: "",
    agreeToTerms: false
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.agreeToTerms) {
      alert("Please agree to the Terms of Service and Privacy Policy");
      return;
    }
    // Redirect to Replit Auth for registration
    window.location.href = "/api/login";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center">
            <div className="text-2xl font-bold text-slate-900 mb-2">Create Your Account</div>
            <p className="text-slate-600 font-normal">Join thousands of utility professionals</p>
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="firstName" className="text-sm font-medium text-slate-700">
                First Name *
              </Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                placeholder="John"
                className="mt-2"
                required
              />
            </div>
            <div>
              <Label htmlFor="lastName" className="text-sm font-medium text-slate-700">
                Last Name *
              </Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
                placeholder="Smith"
                className="mt-2"
                required
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="email" className="text-sm font-medium text-slate-700">
              Email Address *
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              placeholder="john@company.com"
              className="mt-2"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="phone" className="text-sm font-medium text-slate-700">
              Phone Number *
            </Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
              placeholder="+44 20 1234 5678"
              className="mt-2"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="company" className="text-sm font-medium text-slate-700">
              Company *
            </Label>
            <Input
              id="company"
              value={formData.company}
              onChange={(e) => handleInputChange("company", e.target.value)}
              placeholder="Your Company Ltd"
              className="mt-2"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="address" className="text-sm font-medium text-slate-700">
              Company Address *
            </Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
              placeholder="123 Business Street, London, UK, SW1A 1AA"
              className="mt-2"
              rows={3}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="password" className="text-sm font-medium text-slate-700">
              Password *
            </Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              placeholder="Create a strong password"
              className="mt-2"
              required
            />
          </div>
          
          <div className="border-t border-slate-200 pt-6">
            <h3 className="text-lg font-semibold mb-4">Payment Information</h3>
            <Card className="bg-slate-50">
              <CardContent className="p-4">
                <p className="text-sm text-slate-600 mb-4">
                  Secure payment processing powered by Stripe
                </p>
                
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-slate-700">Card Number</Label>
                    <div className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-white mt-2">
                      <span className="text-slate-400">•••• •••• •••• ••••</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-slate-700">Expiry</Label>
                      <div className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-white mt-2">
                        <span className="text-slate-400">MM/YY</span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-slate-700">CVC</Label>
                      <div className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-white mt-2">
                        <span className="text-slate-400">•••</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <p className="text-xs text-slate-500 mt-4 flex items-center">
                  <Lock className="h-3 w-3 mr-1" />
                  Your payment information is secured with 256-bit SSL encryption
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="flex items-start space-x-3">
            <Checkbox 
              id="terms"
              checked={formData.agreeToTerms}
              onCheckedChange={(checked) => handleInputChange("agreeToTerms", checked as boolean)}
            />
            <Label htmlFor="terms" className="text-sm text-slate-600 leading-relaxed">
              I agree to the{" "}
              <Button variant="link" className="text-primary p-0 h-auto font-semibold">
                Terms of Service
              </Button>
              {" "}and{" "}
              <Button variant="link" className="text-primary p-0 h-auto font-semibold">
                Privacy Policy
              </Button>
            </Label>
          </div>
          
          <Button type="submit" className="w-full" size="lg">
            Create Account & Start Trial
          </Button>
        </form>
        
        <div className="text-center py-4">
          <p className="text-slate-600">
            Already have an account?{" "}
            <Button 
              variant="link" 
              onClick={onSwitchToLogin}
              className="text-primary font-semibold p-0"
            >
              Sign in
            </Button>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
