import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [location, setLocation] = useLocation();
  
  console.error('404 Error - Current URL:', window.location.href);
  console.error('404 Error - Current path:', location);
  
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-bold text-gray-900">404 Page Not Found</h1>
          </div>

          <p className="mt-4 text-sm text-gray-600">
            The page "{location}" could not be found.
          </p>
          
          <p className="mt-2 text-xs text-gray-500">
            Current URL: {window.location.href}
          </p>
          
          <div className="mt-6 space-y-2">
            <Button 
              onClick={() => setLocation('/dashboard')} 
              className="w-full"
            >
              <Home className="h-4 w-4 mr-2" />
              Go to Dashboard
            </Button>
            <Button 
              onClick={() => setLocation('/pr2-pricing?sector=utilities')} 
              variant="outline"
              className="w-full"
            >
              Go to PR2 Pricing
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
