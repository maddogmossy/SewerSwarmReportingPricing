import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building, CheckCircle, Car, ShieldCheck, HardHat, Home, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

const sectors = [
  {
    id: 'utilities',
    name: 'Utilities',
    description: 'Water authority and sewerage undertaker compliance',
    icon: Building,
    color: 'border-blue-500 text-blue-600',
    bgColor: 'bg-blue-50'
  },
  {
    id: 'adoption',
    name: 'Adoption',
    description: 'Section 104 and Sewers for Adoption standards',
    icon: CheckCircle,
    color: 'border-green-500 text-green-600',
    bgColor: 'bg-green-50'
  },
  {
    id: 'highways',
    name: 'Highways',
    description: 'HADDMS and highway drainage compliance',
    icon: Car,
    color: 'border-orange-500 text-orange-600',
    bgColor: 'bg-orange-50'
  },
  {
    id: 'insurance',
    name: 'Insurance',
    description: 'ABI guidelines and insurance claim assessments',
    icon: ShieldCheck,
    color: 'border-red-500 text-red-600',
    bgColor: 'bg-red-50'
  },
  {
    id: 'construction',
    name: 'Construction',
    description: 'BS EN 1610:2015 and construction standards',
    icon: HardHat,
    color: 'border-purple-500 text-purple-600',
    bgColor: 'bg-purple-50'
  },
  {
    id: 'domestic',
    name: 'Domestic',
    description: 'Domestic drainage and trading standards',
    icon: Home,
    color: 'border-yellow-500 text-yellow-600',
    bgColor: 'bg-yellow-50'
  }
];

export default function SectorPricing() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sector Pricing Configuration</h1>
            <p className="text-gray-600 mt-2">Configure pricing rules and equipment costs for each sector</p>
          </div>
          <Link href="/dashboard">
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sectors.map((sector) => {
            const IconComponent = sector.icon;
            return (
              <Link key={sector.id} href={`/sector-pricing/${sector.id}`}>
                <Card className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${sector.color} ${sector.bgColor} border-2`}>
                  <CardHeader className="text-center pb-4">
                    <div className="flex justify-center mb-3">
                      <IconComponent className={`h-12 w-12 ${sector.color.split(' ')[1]}`} />
                    </div>
                    <CardTitle className="text-xl font-bold text-gray-900">
                      {sector.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 text-center mb-4">
                      {sector.description}
                    </p>
                    <div className="flex justify-center">
                      <Button className="w-full">
                        Configure Pricing Rules
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}