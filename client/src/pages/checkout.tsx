import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Check, Waves } from "lucide-react";
import { useLocation } from "wouter";

if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const subscriptionPlans = [
  {
    name: "Monthly Pro",
    stripePriceId: import.meta.env.VITE_STRIPE_MONTHLY_PRICE_ID || "price_1234567890", 
    price: 89,
    period: "month",
    features: [
      "Unlimited analyses",
      "Priority support", 
      "Advanced reporting",
      "Team collaboration"
    ]
  },
  {
    name: "Yearly Pro",
    stripePriceId: import.meta.env.VITE_STRIPE_YEARLY_PRICE_ID || "price_0987654321",
    price: 71,
    period: "month",
    originalPrice: 89,
    features: [
      "Everything in Monthly",
      "20% annual savings",
      "Dedicated account manager", 
      "Custom integrations"
    ]
  }
];

const reportPricing = [
  { range: "1-10", price: 15 },
  { range: "1-25", price: 22 },
  { range: "1-50", price: 30 },
  { range: "1-75", price: 36 },
  { range: "1-100", price: 40 },
  { range: "100+", price: 45 }
];

export default function Checkout() {
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [selectedReportSize, setSelectedReportSize] = useState<string>("");
  const [paymentType, setPaymentType] = useState<"subscription" | "per-report">("subscription");
  const [clientSecret, setClientSecret] = useState("");
  const [loading, setLoading] = useState(false);
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to access checkout.",
        variant: "destructive",
      });
      setLocation("/");
      return;
    }
  }, [user, authLoading, toast, setLocation]);

  const handleSubscriptionPayment = async (planId: string) => {
    // Check if this is a demo price ID
    if (planId.startsWith("price_") && planId.length < 20) {
      toast({
        title: "Demo Mode",
        description: "This is a demo version. Stripe price IDs need to be configured for live payments.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await apiRequest("POST", "/api/create-subscription", { 
        priceId: planId 
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to create subscription");
      }
      
      setClientSecret(data.clientSecret);
      setSelectedPlan(planId);
    } catch (error: any) {
      toast({
        title: "Payment Setup Failed",
        description: error.message || "Failed to setup payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePerReportPayment = async (reportSize: string, amount: number) => {
    setLoading(true);
    try {
      const response = await apiRequest("POST", "/api/create-payment-intent", {
        amount,
        reportSections: reportSize,
      });
      const data = await response.json();
      setClientSecret(data.clientSecret);
      setSelectedReportSize(reportSize);
      setPaymentType("per-report");
    } catch (error: any) {
      toast({
        title: "Payment Setup Failed", 
        description: error.message || "Failed to setup payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  if (clientSecret) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-2xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => {
                setClientSecret("");
                setSelectedPlan("");
                setSelectedReportSize("");
              }}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Plans
            </Button>
            <div className="flex items-center mb-2">
              <Waves className="mr-2 h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">Complete Your Payment</h1>
            </div>
          </div>

          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <Card>
              <CardHeader>
                <CardTitle>Payment Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-slate-50 p-4 rounded-lg mb-6">
                  <p className="text-sm text-slate-600 mb-4">
                    Secure payment processing powered by Stripe
                  </p>
                  {/* Stripe Elements would go here in a real implementation */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Card Number
                      </label>
                      <div className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-white">
                        <span className="text-slate-400">•••• •••• •••• ••••</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Expiry
                        </label>
                        <div className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-white">
                          <span className="text-slate-400">MM/YY</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          CVC
                        </label>
                        <div className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-white">
                          <span className="text-slate-400">•••</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <Button className="w-full" size="lg">
                  {paymentType === "subscription" ? "Subscribe Now" : "Pay Now"}
                </Button>
              </CardContent>
            </Card>
          </Elements>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => setLocation("/")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
          <div className="flex items-center mb-2">
            <Waves className="mr-2 h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold">Choose Your Plan</h1>
          </div>
          <p className="text-slate-600">Select the plan that best fits your needs</p>
        </div>

        {/* Plan Selection */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Subscription Plans */}
          <div>
            <h2 className="text-2xl font-semibold mb-6">Subscription Plans</h2>
            <div className="space-y-4">
              {subscriptionPlans.map((plan, index) => (
                <Card key={index} className="enterprise-card cursor-pointer hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold">{plan.name}</h3>
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-bold">£{plan.price}</span>
                          <span className="text-slate-600">/{plan.period}</span>
                          {plan.originalPrice && (
                            <span className="text-sm text-slate-500 line-through">
                              £{plan.originalPrice}
                            </span>
                          )}
                        </div>
                      </div>
                      {plan.originalPrice && (
                        <Badge className="bg-emerald-100 text-emerald-800">Save 20%</Badge>
                      )}
                    </div>
                    
                    <ul className="space-y-2 mb-6">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center text-sm">
                          <Check className="h-4 w-4 text-emerald-500 mr-2 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    <Button 
                      className="w-full"
                      onClick={() => handleSubscriptionPayment(plan.stripePriceId)}
                      disabled={loading}
                    >
                      {loading ? "Setting up..." : "Choose Plan"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Per-Report Pricing */}
          <div>
            <h2 className="text-2xl font-semibold mb-6">Pay Per Report</h2>
            <Card className="enterprise-card">
              <CardHeader>
                <CardTitle>Select Report Size</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reportPricing.map((option, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="w-full justify-between p-4 h-auto"
                      onClick={() => handlePerReportPayment(option.range, option.price)}
                      disabled={loading}
                    >
                      <span className="font-medium">{option.range} sections</span>
                      <span className="text-primary font-semibold">£{option.price}</span>
                    </Button>
                  ))}
                </div>
                
                <Separator className="my-6" />
                
                <div className="text-sm text-slate-600">
                  <p className="mb-2">Per-report pricing includes:</p>
                  <ul className="space-y-1">
                    <li className="flex items-center">
                      <Check className="h-3 w-3 text-emerald-500 mr-2" />
                      Full analysis and report
                    </li>
                    <li className="flex items-center">
                      <Check className="h-3 w-3 text-emerald-500 mr-2" />
                      All sector standards
                    </li>
                    <li className="flex items-center">
                      <Check className="h-3 w-3 text-emerald-500 mr-2" />
                      No monthly commitment
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Current Subscription Status */}
        {user.subscriptionStatus === "active" && (
          <Card className="enterprise-card">
            <CardHeader>
              <CardTitle>Current Subscription</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">Pro Plan - Active</p>
                  <p className="text-sm text-slate-600">
                    You have unlimited access to all features
                  </p>
                </div>
                <Badge className="bg-emerald-100 text-emerald-800">Active</Badge>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
