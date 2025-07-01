import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Settings } from "lucide-react";
import { useLocation, Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";

interface SectorStandard {
  id: number;
  sector: string;
  standardName: string;
  bellyThreshold: number;
  description: string;
  authority: string;
  referenceDocument: string;
  createdAt: string;
  updatedAt: string;
}

export function StandardsConfig() {
  const [location] = useLocation();
  const [standards, setStandards] = useState<SectorStandard[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Extract sector from URL parameter
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const selectedSector = urlParams.get('sector') || '';

  const sectorDisplayNames = {
    utilities: 'Utilities',
    adoption: 'Adoption',
    highways: 'Highways',
    insurance: 'Insurance',
    construction: 'Construction',
    domestic: 'Domestic'
  };

  useEffect(() => {
    fetchStandards();
  }, []);

  const fetchStandards = async () => {
    try {
      const response = await apiRequest('GET', '/api/sector-standards') as unknown;
      const standardsData = Array.isArray(response) ? response as SectorStandard[] : [];
      setStandards(standardsData);
    } catch (error) {
      console.error('Error fetching standards:', error);
      setStandards([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading standards...</div>;
  }

  const filteredStandards = selectedSector 
    ? (Array.isArray(standards) ? standards.filter(s => s.sector === selectedSector) : [])
    : (Array.isArray(standards) ? standards : []);

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/upload">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Upload
          </Button>
        </Link>
        <Settings className="h-6 w-6 text-blue-600" />
        <h1 className="text-3xl font-bold">
          Water Level Standards
          {selectedSector && ` - ${sectorDisplayNames[selectedSector as keyof typeof sectorDisplayNames]}`}
        </h1>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Sector-Specific Belly Detection Thresholds</CardTitle>
            <p className="text-sm text-gray-600">
              These standards define the water level percentage thresholds for belly detection in each sector.
              Water levels exceeding these thresholds indicate potential gradient issues requiring attention.
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {filteredStandards.map((standard) => (
                <div key={standard.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <h3 className="font-semibold text-lg">{standard.standardName}</h3>
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                          {standard.bellyThreshold}% threshold
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 capitalize font-medium mb-2">
                        {standard.sector} Sector
                      </p>
                      <p className="text-sm text-gray-700 mb-3">{standard.description}</p>
                      <div className="text-xs text-gray-500">
                        <p><strong>Authority:</strong> {standard.authority}</p>
                        <p><strong>Reference:</strong> {standard.referenceDocument}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredStandards.length === 0 && (
                <p className="text-gray-500 text-center py-8">
                  No standards found for this sector.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {!selectedSector && (
          <Card>
            <CardHeader>
              <CardTitle>All Sectors Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(sectorDisplayNames).map(([sectorId, displayName]) => {
                  const sectorStandard = standards.find(s => s.sector === sectorId);
                  return (
                    <div key={sectorId} className="text-center p-3 border rounded-lg">
                      <h4 className="font-medium">{displayName}</h4>
                      <p className="text-2xl font-bold text-blue-600">
                        {sectorStandard?.bellyThreshold || 'N/A'}%
                      </p>
                      <p className="text-xs text-gray-500">
                        {sectorStandard?.standardName || 'No standard'}
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default StandardsConfig;