import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { CustomerSettings } from "@/components/CustomerSettings";
import { 
  Shield, 
  Upload, 
  TrendingUp, 
  Building, 
  Home as HomeIcon, 
  Car, 
  Users, 
  ShieldCheck,
  HardHat,
  Gift,
  Check,
  Wrench,
  House,
  Waves,
  TestTube,
  BarChart3,
  Settings,
  FileText
} from "lucide-react";
import { Link } from "wouter";
import LoginModal from "@/components/login-modal";
import RegistrationModal from "@/components/registration-modal";
import PricingModal from "@/components/pricing-modal";
import { DevLabel } from '@/utils/DevLabel';

export default function Home() {
  const [showLogin, setShowLogin] = useState(false);
  const [showRegistration, setShowRegistration] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [isYearlyPricing, setIsYearlyPricing] = useState(false);
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();

  const handleTestAccess = async () => {
    try {
      // First check if user is logged in
      const authCheck = await fetch("/api/auth/user", {
        credentials: "include",
      });

      if (authCheck.status === 401) {
        toast({
          title: "Please Sign In First",
          description: "You need to be logged in to get test access.",
          variant: "destructive",
        });
        setShowLogin(true);
        return;
      }

      // Now try to get test access
      const response = await fetch("/api/admin/make-me-test-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      const contentType = response.headers.get("content-type");
      
      if (response.ok && contentType?.includes("application/json")) {
        const data = await response.json();
        toast({
          title: "Test Access Activated!",
          description: "You now have unlimited access to test all features. Redirecting to dashboard...",
        });
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          window.location.href = "/";
        }, 2000);
      } else {
        // If we get HTML instead of JSON, likely need to sign in
        toast({
          title: "Please Sign In First",
          description: "You need to be logged in to get test access.",
          variant: "destructive",
        });
        setShowLogin(true);
      }
    } catch (error: any) {
      console.error("Test access error:", error);
      toast({
        title: "Please Sign In First",
        description: "You need to be logged in to get test access.",
        variant: "destructive",
      });
      setShowLogin(true);
    }
  };

  const features = [
    {
      icon: Shield,
      title: "Industry Standards Compliant",
      description: "Full compliance with MSCC5R, WRc, and sector-specific standards including Utilities, Adoption, and Highways requirements.",
      color: "text-primary"
    },
    {
      icon: Upload,
      title: "Easy File Upload",
      description: "Support for PDF and .db files with automatic validation and processing for immediate analysis results.",
      color: "text-emerald-600"
    },
    {
      icon: TrendingUp,
      title: "Detailed Reports",
      description: "Comprehensive analysis reports tailored to your sector with actionable insights and compliance verification.",
      color: "text-amber-600"
    }
  ];

  const sectors = [
    {
      icon: Wrench,
      title: "Utilities",
      description: "WRc SRM standards",
      color: "text-blue-600"
    },
    {
      icon: Building,
      title: "Adoption",
      description: "SfA8 compliance",
      color: "text-emerald-600"
    },
    {
      icon: Car,
      title: "Highways",
      description: "DMRB standards",
      color: "text-amber-600"
    },
    {
      icon: House,
      title: "Domestic",
      description: "Regulatory compliance",
      color: "text-amber-900"
    },
    {
      icon: Shield,
      title: "Insurance",
      description: "ABI guidelines",
      color: "text-red-600"
    },
    {
      icon: HardHat,
      title: "Construction",
      description: "Building regs",
      color: "text-purple-600"
    }
  ];

  const pricingPlans = [
    {
      name: "Free Trial",
      price: "£0",
      period: "",
      description: "1 report included",
      features: [
        "1 analysis report",
        "All sector standards",
        "PDF & .db file support"
      ],
      buttonText: "Start Free Trial",
      buttonVariant: "outline" as const,
      onClick: () => setShowRegistration(true)
    },
    {
      name: "Per Report",
      price: "£15-45",
      period: "",
      description: "Based on report size",
      features: [
        "Pay per analysis",
        "No monthly commitment",
        "All features included"
      ],
      buttonText: "Select Sections",
      buttonVariant: "default" as const,
      onClick: () => setShowPricing(true)
    },
    {
      name: "Monthly",
      price: isYearlyPricing ? "£71" : "£89",
      period: "/user/month",
      description: isYearlyPricing ? "Billed annually" : "Unlimited reports",
      features: [
        "Unlimited analyses",
        "Priority support",
        "Advanced reporting",
        "Team collaboration"
      ],
      buttonText: "Get Started",
      buttonVariant: "default" as const,
      isPopular: true,
      onClick: () => setShowRegistration(true)
    },
    {
      name: "Yearly",
      price: isYearlyPricing ? "£57" : "£71",
      period: "/user/month",
      description: "Billed annually (20% off)",
      features: [
        "Everything in Monthly",
        "20% annual savings",
        "Dedicated account manager",
        "Custom integrations"
      ],
      buttonText: "Save 20%",
      buttonVariant: "outline" as const,
      onClick: () => setShowRegistration(true)
    }
  ];

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show authenticated user dashboard if logged in
  if (isAuthenticated && user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-slate-900 mb-4">
              Welcome to Sewer Swarm AI
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Professional sewer condition analysis and reporting with AI-powered insights
            </p>
          </div>

          <div className="max-w-6xl mx-auto">
            <DevLabel id="p1" position="top-right" />
            <div className="mb-8">
              <Card className="relative">
                <DevLabel id="2" />
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>Welcome back, {user.firstName || user.email}!</CardTitle>
                      <CardDescription>
                        Choose your next action to manage your sewer inspection reports
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <CustomerSettings />
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          // Clear authentication and reload page
                          fetch("/api/auth/logout", { method: "POST", credentials: "include" })
                            .then(() => window.location.reload());
                        }}
                      >
                        Sign Out
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Link to="/upload">
                <Card className="relative hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <DevLabel id="3" />
                  <CardHeader className="text-center">
                    <div className="mx-auto w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                      <Upload className="h-6 w-6 text-blue-600" />
                    </div>
                    <CardTitle className="text-lg">Upload Report</CardTitle>
                    <CardDescription>
                      Upload CCTV inspection files and select applicable sector for analysis
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>

              <Link to="/dashboard">
                <Card className="relative hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <DevLabel id="4" />
                  <CardHeader className="text-center">
                    <div className="mx-auto w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
                      <BarChart3 className="h-6 w-6 text-emerald-600" />
                    </div>
                    <CardTitle className="text-lg">Dashboard</CardTitle>
                    <CardDescription>
                      View section inspection data and analysis results across all reports
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>

              <Link to="/sector-pricing">
                <Card className="relative hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <DevLabel id="5" />
                  <CardHeader className="text-center">
                    <div className="mx-auto w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                      <Settings className="h-6 w-6 text-orange-600" />
                    </div>
                    <CardTitle className="text-lg">Pricing Settings</CardTitle>
                    <CardDescription>
                      Customize repair cost estimates for each sector based on your market rates
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>

              <Link to="/reports">
                <Card className="relative hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <DevLabel id="6" />
                  <CardHeader className="text-center">
                    <div className="mx-auto w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center mb-4">
                      <FileText className="h-6 w-6 text-cyan-600" />
                    </div>
                    <CardTitle className="text-lg">Uploaded Reports</CardTitle>
                    <CardDescription>
                      Manage your inspection reports and organize project folders
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>

              <Link to="/checkout">
                <Card className="relative hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <DevLabel id="7" />
                  <CardHeader className="text-center">
                    <div className="mx-auto w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                      <Gift className="h-6 w-6 text-purple-600" />
                    </div>
                    <CardTitle className="text-lg">Upgrade Plan</CardTitle>
                    <CardDescription>
                      Access premium features and unlimited report processing
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="relative">
                <DevLabel id="8" />
                <CardHeader>
                  <CardTitle className="text-lg">Supported Sectors</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Utilities</span>
                      <span className="text-slate-500">WRc SRM standards</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Adoption</span>
                      <span className="text-slate-500">SfA8 compliance</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Highways</span>
                      <span className="text-slate-500">DMRB standards</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Domestic</span>
                      <span className="text-slate-500">Regulatory compliance</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Insurance</span>
                      <span className="text-slate-500">ABI guidelines</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Construction</span>
                      <span className="text-slate-500">Building regs</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="relative">
                <DevLabel id="9" />
                <CardHeader>
                  <CardTitle className="text-lg">File Formats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>PDF Reports</span>
                      <span className="text-slate-500">Up to 50MB</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Database Files (.db)</span>
                      <span className="text-slate-500">Up to 50MB</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Standards</span>
                      <span className="text-slate-500">WRc/WTI OS19/20x</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Output Format</span>
                      <span className="text-slate-500">MSCC5R compliant</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-primary flex items-center">
                <Waves className="mr-2 h-8 w-8" />
                Sewer Swarm AI
              </h1>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <a href="#features" className="text-slate-600 hover:text-slate-900 px-3 py-2 text-sm font-medium">
                Features
              </a>
              <a href="#pricing" className="text-slate-600 hover:text-slate-900 px-3 py-2 text-sm font-medium">
                Pricing
              </a>
              <a href="#standards" className="text-slate-600 hover:text-slate-900 px-3 py-2 text-sm font-medium">
                Standards
              </a>
              <Button 
                variant="ghost" 
                onClick={handleTestAccess}
                className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
              >
                <TestTube className="mr-2 h-4 w-4" />
                Test Access
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowLogin(true)}
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              >
                Sign In
              </Button>
              <Button onClick={() => setShowRegistration(true)}>
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/5 to-slate-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6">
              Professional Sewer Analysis
              <span className="text-primary block mt-2">Powered by AI</span>
            </h1>
            <p className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto">
              Upload your PDF or database files and get instant analysis compliant with WRc/WTI OS19/20x MSCC5R standards. 
              Trusted by utility professionals across the industry.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={() => setShowRegistration(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Gift className="mr-2 h-5 w-5" />
                Start Free Trial
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              >
                View Pricing
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Why Choose Sewer Swarm AI?
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Built specifically for utility professionals who need accurate, compliant analysis
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="enterprise-card p-8">
                <CardContent className="p-0">
                  <div className="flex items-center justify-center w-16 h-16 rounded-lg bg-slate-100 mb-6">
                    <feature.icon className={`h-8 w-8 ${feature.color}`} />
                  </div>
                  <h3 className="text-xl font-semibold mb-4">{feature.title}</h3>
                  <p className="text-slate-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Flexible Pricing Plans
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-8">
              Choose the plan that fits your workflow and budget
            </p>
            
            {/* Pricing Toggle */}
            <div className="flex items-center justify-center mb-12">
              <span className="text-slate-700 mr-3">Monthly</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsYearlyPricing(!isYearlyPricing)}
                className={`relative h-6 w-11 rounded-full transition-colors ${
                  isYearlyPricing ? 'bg-primary' : 'bg-slate-300'
                }`}
              >
                <span 
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isYearlyPricing ? 'translate-x-5' : 'translate-x-1'
                  }`} 
                />
              </Button>
              <span className="text-slate-700 ml-3">
                Yearly <span className="text-emerald-600 font-semibold">(Save 20%)</span>
              </span>
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {pricingPlans.map((plan, index) => (
              <Card 
                key={index} 
                className={`relative enterprise-card p-8 ${
                  plan.isPopular ? 'border-2 border-primary shadow-lg' : ''
                }`}
              >
                {plan.isPopular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
                  </div>
                )}
                <CardContent className="p-0 text-center">
                  <h3 className="text-xl font-semibold mb-4">{plan.name}</h3>
                  <div className="text-3xl font-bold text-slate-900 mb-2">
                    {plan.price}
                    {plan.period && <span className="text-lg text-slate-600">{plan.period}</span>}
                  </div>
                  <p className="text-slate-600 mb-6">{plan.description}</p>
                  <Button 
                    className="w-full mb-8" 
                    variant={plan.buttonVariant}
                    onClick={plan.onClick}
                  >
                    {plan.buttonText}
                  </Button>
                  <ul className="space-y-3 text-sm">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <Check className="h-4 w-4 text-emerald-500 mr-3 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Standards Section */}
      <section id="standards" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Industry Standards Coverage
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Comprehensive support for all major sector standards and requirements
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {sectors.map((sector, index) => (
              <Card key={index} className="enterprise-card p-6">
                <CardContent className="p-0">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <sector.icon className={`mr-2 h-5 w-5 ${sector.color}`} />
                    {sector.title}
                  </h3>
                  <p className="text-sm text-slate-600">{sector.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Modals */}
      <LoginModal 
        open={showLogin} 
        onOpenChange={setShowLogin}
        onSwitchToRegister={() => {
          setShowLogin(false);
          setShowRegistration(true);
        }}
      />
      
      <RegistrationModal 
        open={showRegistration} 
        onOpenChange={setShowRegistration}
        onSwitchToLogin={() => {
          setShowRegistration(false);
          setShowLogin(true);
        }}
      />
      
      <PricingModal 
        open={showPricing} 
        onOpenChange={setShowPricing}
      />
    </div>
  );
}
