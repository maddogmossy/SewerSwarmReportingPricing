import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, Wrench, Building2, Scissors, Droplets, Hammer, Layers, Truck, Home, ChevronRight } from "lucide-react";
import { Link } from "wouter";

interface WorkCategory {
  id: number;
  name: string;
  description: string;
  icon: any;
  color: string;
  implemented: boolean;
}

const workCategories: WorkCategory[] = [
  { id: 1, name: 'Surveys', description: 'CCTV inspections and condition assessments', icon: Wrench, color: 'text-blue-600', implemented: true },
  { id: 2, name: 'Cleansing / Root Cutting', description: 'High pressure jetting and root removal', icon: Droplets, color: 'text-cyan-600', implemented: false },
  { id: 3, name: 'Robotic Cutting', description: 'Automated cutting and removal operations', icon: Scissors, color: 'text-orange-600', implemented: false },
  { id: 4, name: 'Directional Water Cutting', description: 'Precision water jet cutting systems', icon: Droplets, color: 'text-teal-600', implemented: true },
  { id: 5, name: 'Patching', description: 'Localized repair and patching work', icon: Hammer, color: 'text-red-600', implemented: false },
  { id: 6, name: 'Lining', description: 'Pipe lining and rehabilitation', icon: Layers, color: 'text-purple-600', implemented: false },
  { id: 7, name: 'Excavations', description: 'Open cut excavation and replacement', icon: Building2, color: 'text-amber-600', implemented: false },
  { id: 8, name: 'Tankering', description: 'Waste removal and transportation', icon: Truck, color: 'text-green-600', implemented: false }
];

export default function Pricing() {
  const { data: workCategoriesData = [] } = useQuery({
    queryKey: ['/api/work-categories']
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Navigation */}
        <div className="flex justify-start">
          <Link href="/">
            <Button variant="outline" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
        
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Settings className="h-8 w-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">
              Work Category Pricing
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Configure equipment-specific rates, hourly/daily costs, and capacity metrics across all work categories. 
            Set detailed pricing for surveys, cleansing, repairs, and more based on your local market rates.
          </p>
        </div>

        {/* Work Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workCategories.map((category) => {
            const IconComponent = category.icon;
            return (
              <Card key={category.id} className="relative hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <IconComponent className={`h-6 w-6 ${category.color}`} />
                      <CardTitle className="text-lg">{category.name}</CardTitle>
                    </div>
                    {category.implemented ? (
                      <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                        Available
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-amber-600 border-amber-200">
                        Coming Soon
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-600 text-sm">{category.description}</p>
                  
                  {category.implemented ? (
                    <Link href={category.id === 1 ? "/survey-pricing" : category.id === 4 ? "/jetting-pricing" : "#"}>
                      <Button className="w-full flex items-center justify-between">
                        Configure Pricing
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  ) : (
                    <Button disabled className="w-full">
                      Coming Soon
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Implementation Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Implementation Roadmap
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-3">
                  <Wrench className="h-5 w-5 text-green-600" />
                  <div>
                    <h4 className="font-medium text-green-900">Surveys</h4>
                    <p className="text-sm text-green-700">Fully implemented with 7 equipment types and detailed specifications</p>
                  </div>
                </div>
                <Badge className="bg-green-600 text-white">Complete</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-3">
                  <Droplets className="h-5 w-5 text-green-600" />
                  <div>
                    <h4 className="font-medium text-green-900">Directional Water Cutting</h4>
                    <p className="text-sm text-green-700">Fully implemented with equipment management and pricing configuration</p>
                  </div>
                </div>
                <Badge className="bg-green-600 text-white">Complete</Badge>
              </div>
              
              <div className="text-sm text-gray-600">
                <p><strong>Next Phase:</strong> The remaining 6 work categories will be implemented with similar detailed equipment specifications, rate configurations, and capacity metrics.</p>
                <p className="mt-2"><strong>Each category will include:</strong></p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Equipment-specific configurations</li>
                  <li>Hourly and daily rate settings</li>
                  <li>Capacity metrics (units per hour/day)</li>
                  <li>Size range specifications</li>
                  <li>Custom pricing rules</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}