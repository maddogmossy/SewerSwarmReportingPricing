import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, CheckCircle, Building, Car, ShieldCheck, HardHat, Home } from "lucide-react";

interface SectorStandardsDisplayProps {
  sector: string;
  sectorName: string;
}

export function SectorStandardsDisplay({ sector, sectorName }: SectorStandardsDisplayProps) {
  const { data: sectorStandards, isLoading } = useQuery({
    queryKey: [`/api/${sector}/profile`],
    enabled: !!sector,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Loading Standards...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!sectorStandards) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Analysis Standards Applied - {sectorName} Sector</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-500">Standards information not available for this sector.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getSectorIcon = (sectorName: string) => {
    switch (sectorName.toLowerCase()) {
      case 'utilities':
        return <Building className="h-5 w-5" />;
      case 'adoption':
        return <CheckCircle className="h-5 w-5" />;
      case 'highways':
        return <Car className="h-5 w-5" />;
      case 'insurance':
        return <ShieldCheck className="h-5 w-5" />;
      case 'construction':
        return <HardHat className="h-5 w-5" />;
      case 'domestic':
        return <Home className="h-5 w-5" />;
      default:
        return <Building className="h-5 w-5" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <div className="p-2 rounded-lg" style={{ backgroundColor: `${sectorStandards.sectorColor}20` }}>
            <div style={{ color: sectorStandards.sectorColor }}>
              {getSectorIcon(sectorStandards.sectorName)}
            </div>
          </div>
          Analysis Standards Applied - {sectorStandards.sectorName} Sector
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Standards List */}
          <div>
            <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Standards Documentation
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {sectorStandards.standards.map((standard, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{standard.name}</div>
                    {standard.version && (
                      <Badge variant="outline" className="mt-1 text-xs">
                        {standard.version}
                      </Badge>
                    )}
                    <div className="text-xs text-gray-600 mt-1">{standard.description}</div>
                    <div className="text-xs text-gray-500 mt-1">Authority: {standard.authority}</div>
                  </div>
                  {standard.url && (
                    <a 
                      href={standard.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 ml-2 flex items-center gap-1"
                      title="View Documentation"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Compliance Note */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-sm text-blue-800 mb-2">
              Compliance Assessment
            </h4>
            <p className="text-sm text-blue-700">
              {sectorStandards.complianceNote}
            </p>
          </div>

          {/* Enhanced Observation Formatting Note */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-medium text-sm text-green-800 mb-2">
              Enhanced Observation Display
            </h4>
            <div className="text-sm text-green-700 space-y-1">
              <div>✓ Detailed defect descriptions with percentages and cross-sectional area loss</div>
              <div>✓ Filtered 5% water level observations for cleaner reporting</div>
              <div>✓ Meterage grouping for repeated codes (e.g., "DER at 13.27, 16.63, 17.73")</div>
              <div>✓ Conditional junction display only when structural defects are present</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}