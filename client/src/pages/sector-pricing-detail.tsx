import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Settings } from "lucide-react";
import { Link } from "wouter";

export default function SectorPricingDetail() {
  const { sector } = useParams<{ sector: string }>();

  const getSectorName = (sectorId: string) => {
    const sectors = {
      utilities: "Utilities",
      adoption: "Adoption", 
      highways: "Highways",
      insurance: "Insurance",
      construction: "Construction",
      domestic: "Domestic"
    };
    return sectors[sectorId as keyof typeof sectors] || sectorId;
  };

  const getSectorColor = (sectorId: string) => {
    const colors = {
      utilities: "border-blue-200 bg-blue-50",
      adoption: "border-green-200 bg-green-50",
      highways: "border-orange-200 bg-orange-50", 
      insurance: "border-red-200 bg-red-50",
      construction: "border-purple-200 bg-purple-50",
      domestic: "border-yellow-200 bg-yellow-50"
    };
    return colors[sectorId as keyof typeof colors] || "border-gray-200 bg-gray-50";
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/sector-pricing">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Sectors
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">{getSectorName(sector || "")} Sector Pricing</h1>
      </div>

      {/* Repair Pricing Section */}
      <Card className={getSectorColor(sector || "")}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3">
              <Settings className="h-6 w-6" />
              Work Category Pricing Configuration
            </CardTitle>
            <Button onClick={() => window.location.href = `/repair-pricing/${sector}`}>
              Configure Pricing
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="text-center py-8">
              <h3 className="text-lg font-semibold mb-4">Configure Work Category Pricing</h3>
              <p className="text-gray-600 mb-6">
                Set up pricing for CCTV surveys, jetting, tankering, and directional water cutting.
                <br />
                These prices will be used when hovering over defective sections in the dashboard.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium text-blue-600">CCTV Surveys</h4>
                  <p className="text-sm text-gray-500">Camera inspection and condition assessment</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium text-green-600">Jetting</h4>
                  <p className="text-sm text-gray-500">High-pressure water cleaning systems</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium text-orange-600">Tankering</h4>
                  <p className="text-sm text-gray-500">Vacuum tanker waste removal services</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium text-purple-600">Directional Water Cutting</h4>
                  <p className="text-sm text-gray-500">Precision cutting for blockage removal</p>
                </div>
              </div>
              
              <Button 
                onClick={() => window.location.href = `/repair-pricing/${sector}`}
                size="lg"
              >
                Open Work Category Pricing Configuration
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>How Work Category Pricing Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm text-gray-600">
            <div className="flex items-start gap-3">
              <span className="font-medium text-blue-600">1.</span>
              <p>Configure pricing for each work category (CCTV, Jetting, Tankering, Directional Water Cutting) by pipe size</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="font-medium text-blue-600">2.</span>
              <p>Add custom descriptions with dynamic templates like "To survey a ()mm pipe at ()mtrs"</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="font-medium text-blue-600">3.</span>
              <p>Set minimum quantity rules and validation thresholds</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="font-medium text-blue-600">4.</span>
              <p>When users hover over defective sections in the dashboard, they see work category options with pricing</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}