import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft, Plus, Edit, Trash2, BookOpen, BarChart3 } from "lucide-react";
import { Link } from "wouter";

// Comprehensive Standards Library
const COMPREHENSIVE_STANDARDS = {
  wrc_drain_repair: {
    name: "WRc Drain Repair Book 4th Edition",
    url: "https://wrcgroup.co.uk/products/drain-repair-book-4th-edition/",
    description: "Complete repair methodologies for drainage systems"
  },
  wrc_sewer_cleaning: {
    name: "WRc Sewer Cleaning Manual",
    url: "https://wrcgroup.co.uk/products/sewer-cleaning-manual/",
    description: "Comprehensive cleaning procedures and frequencies"
  },
  mscc5: {
    name: "MSCC5 - Manual of Sewer Condition Classification",
    url: "https://wrcgroup.co.uk/products/mscc5/",
    description: "Standard condition assessment methodology"
  },
  srm: {
    name: "SRM - Sewerage Rehabilitation Manual",
    url: "https://wrcgroup.co.uk/products/srm/",
    description: "Rehabilitation decision-making framework"
  },
  bs_en_752: {
    name: "BS EN 752:2017 - Drain and sewer systems outside buildings",
    url: "https://shop.bsigroup.com/ProductDetail/?pid=000000000030321895",
    description: "European standard for drainage system management"
  },
  bs_en_1610: {
    name: "BS EN 1610:2015 - Construction and testing of drains",
    url: "https://shop.bsigroup.com/ProductDetail/?pid=000000000030297384",
    description: "Construction quality standards for drainage"
  },
  bs_en_14654: {
    name: "BS EN 14654-1:2005 - Management and control of operational activities",
    url: "https://shop.bsigroup.com/ProductDetail/?pid=000000000030175275",
    description: "Operational management standards for wastewater systems"
  },
  os19x: {
    name: "OS19x - Sewers for Adoption 7th Edition",
    url: "https://www.water.org.uk/sewers-for-adoption/",
    description: "Water industry adoption standards"
  },
  os20x: {
    name: "OS20x - Sewers for Adoption 8th Edition",
    url: "https://www.water.org.uk/sewers-for-adoption/",
    description: "Updated water industry adoption standards"
  }
};

// Standard Recommendations Library
const STANDARD_RECOMMENDATIONS = [
  "High-pressure water jetting to remove debris and deposits",
  "CCTV survey to assess structural condition post-cleaning",
  "Chemical root treatment for organic blockages",
  "Mechanical cutting for hard debris removal",
  "Patch lining repair for localized structural damage",
  "Full-length CIPP lining for comprehensive rehabilitation",
  "Excavation and replacement for severely damaged sections",
  "Joint sealing to prevent water ingress",
  "Manhole reconstruction for structural integrity",
  "Flow monitoring to verify system performance",
  "Regular preventive maintenance scheduling",
  "Emergency response protocols for critical defects",
  "Hydrostatic testing for pressure verification",
  "Air testing for joint integrity assessment",
  "Desilting operations for capacity restoration",
  "Root barrier installation for long-term protection"
];

interface StandardsRule {
  id: number;
  standardsApplied: string;
  customRecommendations: string;
  applicableStandards: string;
  sector: string;
  userId: string;
}

const SectorsConfig = {
  utilities: { name: "Utilities", color: "blue" },
  adoption: { name: "Adoption", color: "green" },
  highways: { name: "Highways", color: "orange" },
  insurance: { name: "Insurance", color: "red" },
  construction: { name: "Construction", color: "purple" },
  domestic: { name: "Domestic", color: "yellow" }
};

export default function StandardsConfiguration() {
  const { sectorId } = useParams();
  const { toast } = useToast();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingRule, setEditingRule] = useState<StandardsRule | null>(null);
  const [formData, setFormData] = useState({
    standardsApplied: "",
    customRecommendations: "",
    applicableStandards: ""
  });

  const sector = SectorsConfig[sectorId as keyof typeof SectorsConfig] || SectorsConfig.utilities;

  // Fetch existing standards rules
  const { data: standardsRules = [], isLoading } = useQuery({
    queryKey: [`/api/standards-rules/${sectorId}`],
    enabled: !!sectorId
  });

  // Create standards rule mutation
  const createRuleMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('POST', `/api/standards-rules`, {
        ...data,
        sector: sectorId
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/standards-rules/${sectorId}`] });
      setShowAddDialog(false);
      setFormData({ standardsApplied: "", customRecommendations: "", applicableStandards: "" });
      toast({ title: "Standards rule created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error creating rule", description: error.message, variant: "destructive" });
    }
  });

  // Update standards rule mutation
  const updateRuleMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('PUT', `/api/standards-rules/${editingRule?.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/standards-rules/${sectorId}`] });
      setEditingRule(null);
      setFormData({ standardsApplied: "", customRecommendations: "", applicableStandards: "" });
      toast({ title: "Standards rule updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error updating rule", description: error.message, variant: "destructive" });
    }
  });

  // Delete standards rule mutation
  const deleteRuleMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('DELETE', `/api/standards-rules/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/standards-rules/${sectorId}`] });
      toast({ title: "Standards rule deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error deleting rule", description: error.message, variant: "destructive" });
    }
  });

  const handleSubmit = () => {
    if (editingRule) {
      updateRuleMutation.mutate(formData);
    } else {
      createRuleMutation.mutate(formData);
    }
  };

  const handleEdit = (rule: StandardsRule) => {
    setEditingRule(rule);
    setFormData({
      standardsApplied: rule.standardsApplied,
      customRecommendations: rule.customRecommendations,
      applicableStandards: rule.applicableStandards
    });
    setShowAddDialog(true);
  };

  const handleAddRecommendation = (recommendation: string) => {
    const current = formData.customRecommendations;
    const newRecommendations = current 
      ? `${current}\n${recommendation}`
      : recommendation;
    setFormData({ ...formData, customRecommendations: newRecommendations });
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/sector-pricing">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Sectors
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">
              {sector.name} Sector - Standards Configuration
            </h1>
            <p className="text-slate-600 mt-1">
              Configure standards-based recommendations using WRc, MSCC5, SRM, BS EN, and OS19x/OS20x standards
            </p>
          </div>
        </div>
        <Link href="/dashboard">
          <Button variant="outline">
            <BarChart3 className="h-4 w-4 mr-2 text-green-600" />
            Dashboard
          </Button>
        </Link>
      </div>

      {/* Standards Rules */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Standards-Based Recommendations</CardTitle>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Standards-Based Rule
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Loading standards rules...</p>
          ) : standardsRules.length === 0 ? (
            <p className="text-slate-500 text-center py-8">
              No standards rules configured yet. Add your first rule to get started.
            </p>
          ) : (
            <div className="space-y-4">
              {standardsRules.map((rule: StandardsRule) => (
                <div key={rule.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Standards Applied: {rule.standardsApplied}</h4>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(rule)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => deleteRuleMutation.mutate(rule.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 mb-2">
                    <strong>Applicable Standards:</strong> {rule.applicableStandards}
                  </p>
                  <p className="text-sm">
                    <strong>Custom Recommendations:</strong>
                  </p>
                  <div className="bg-slate-50 p-2 rounded mt-1">
                    {rule.customRecommendations.split('\n').map((rec, idx) => (
                      <div key={idx} className="text-sm">{rec}</div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Standards Rule Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRule ? "Edit" : "Add"} Standards-Based Recommendation Rule
            </DialogTitle>
            <DialogDescription>
              Configure recommendations using WRc, MSCC5, SRM, BS EN, and OS19x/OS20x standards
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">Basic Configuration</TabsTrigger>
              <TabsTrigger value="standards">Standards & Recommendations</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div>
                <Label htmlFor="standardsApplied">
                  <BookOpen className="h-4 w-4 inline mr-2" />
                  Standards Applied
                </Label>
                <Input
                  id="standardsApplied"
                  value={formData.standardsApplied}
                  onChange={(e) => setFormData({ ...formData, standardsApplied: e.target.value })}
                  placeholder="e.g., WRc Drain Repair Book 4th Ed., MSCC5, BS EN 1610"
                />
              </div>
            </TabsContent>

            <TabsContent value="standards" className="space-y-4">
              <div>
                <Label>Custom Recommendations (one per line)</Label>
                <Textarea
                  value={formData.customRecommendations}
                  onChange={(e) => setFormData({ ...formData, customRecommendations: e.target.value })}
                  placeholder="Enter recommendations based on standards..."
                  rows={8}
                />
              </div>

              <div>
                <Label>Quick Add Standard Recommendations</Label>
                <div className="grid grid-cols-2 gap-2 mt-2 max-h-40 overflow-y-auto">
                  {STANDARD_RECOMMENDATIONS.map((rec, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddRecommendation(rec)}
                      className="text-left justify-start h-auto py-2 px-3"
                    >
                      <Plus className="h-3 w-3 mr-2 flex-shrink-0" />
                      <span className="text-xs">{rec}</span>
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label>Applicable Standards</Label>
                <Textarea
                  value={formData.applicableStandards}
                  onChange={(e) => setFormData({ ...formData, applicableStandards: e.target.value })}
                  placeholder="List all applicable standards for this rule..."
                  rows={4}
                />
              </div>

              <div>
                <Label>Reference Standards Library</Label>
                <div className="grid grid-cols-1 gap-3 mt-2 max-h-60 overflow-y-auto">
                  {Object.entries(COMPREHENSIVE_STANDARDS).map(([key, standard]) => (
                    <div key={key} className="border rounded p-3">
                      <h4 className="font-medium text-sm">{standard.name}</h4>
                      <p className="text-xs text-slate-600 mb-2">{standard.description}</p>
                      <a 
                        href={standard.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline"
                      >
                        View Documentation →
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={createRuleMutation.isPending || updateRuleMutation.isPending}
            >
              {editingRule ? "Update" : "Create"} Standards Rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}