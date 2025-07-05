import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import Home from "@/pages/home";
import Dashboard from "@/pages/dashboard";
import Upload from "@/pages/upload";
import Pricing from "@/pages/pricing";
import SectorPricing from "@/pages/sector-pricing";

import SurveyPricing from "@/pages/survey-pricing";
import CleansingPricing from "@/pages/cleansing-pricing";
import JettingPricing from "@/pages/jetting-pricing";
import RepairPricing from "@/pages/repair-pricing";
import StandardsConfig from "@/pages/standards-config";
import DepotManagement from "@/pages/depot-management";
import Checkout from "@/pages/checkout";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    // Global error handler for unhandled rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      event.preventDefault(); // Prevent the default browser behavior
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        <p className="ml-4 text-gray-600">Loading authentication...</p>
      </div>
    );
  }

  return (
    <Switch>
      {!isAuthenticated ? (
        <>
          <Route path="/" component={Home} />
          <Route path="/checkout" component={Checkout} />
        </>
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/upload" component={Upload} />
          <Route path="/pricing" component={Pricing} />
          <Route path="/sector-pricing" component={SectorPricing} />

          <Route path="/pricing/surveys" component={SurveyPricing} />
          <Route path="/pricing/cleansing" component={CleansingPricing} />
          <Route path="/pricing/jetting" component={JettingPricing} />
          <Route path="/repair-pricing/:sector" component={RepairPricing} />
          <Route path="/standards-config" component={StandardsConfig} />
          <Route path="/depot-management" component={DepotManagement} />
          <Route path="/checkout" component={Checkout} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
