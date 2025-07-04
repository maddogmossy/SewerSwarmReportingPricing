import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { Calculator, AlertTriangle, CheckCircle } from "lucide-react";

interface PatchRepairResult {
  patchLayer: string;
  thicknessUsed: number;
  description: string;
  warning: string;
  estimatedCost: number;
  costBreakdown: {
    baseCost: number;
    layerMultiplier: number;
    depthMultiplier: number;
    finalCost: number;
  };
}

interface SectionData {
  pipeSize?: string;
  pipeDepth?: string;
  defects?: string;
  itemNo?: number;
  pipeMaterial?: string;
}

interface PatchRepairGeneratorProps {
  sectionData?: SectionData;
}

export function PatchRepairGenerator({ sectionData }: PatchRepairGeneratorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [result, setResult] = useState<PatchRepairResult | null>(null);
  const { toast } = useToast();

  // Extract meterage from defects text
  const extractMeterage = (defectsText: string): string => {
    if (!defectsText) return "";
    
    // Look for patterns like "10.78m", "7.08m", "CR 15.2m", "DER 8.4m"
    const meterageMatch = defectsText.match(/(\d+\.?\d*)\s*m/);
    if (meterageMatch) {
      return meterageMatch[1];
    }
    
    return "";
  };

  // Extract defect type and description
  const extractDefectDescription = (defectsText: string): string => {
    if (!defectsText) return "";
    
    // Remove the meterage and parenthetical content to get clean description
    let description = defectsText;
    
    // Extract defect type (CR, DER, DEF, etc.) and description
    const defectMatch = defectsText.match(/(\w+)\s+\d+\.?\d*m\s*\(([^)]+)\)/);
    if (defectMatch) {
      const defectCode = defectMatch[1];
      const defectDesc = defectMatch[2];
      
      // Map common defect codes to descriptions
      const defectMap: { [key: string]: string } = {
        'CR': 'longitudinal cracking',
        'FC': 'circumferential cracking', 
        'DER': 'debris deposits',
        'DEF': 'pipe deformation',
        'JDL': 'joint displacement',
        'JDM': 'major joint displacement',
        'OJM': 'open joint',
        'RI': 'root intrusion',
        'FL': 'fractured lining'
      };
      
      return defectMap[defectCode] || defectDesc.toLowerCase();
    }
    
    return "structural defect";
  };

  // Initialize form data with section data if provided
  const initializeFormData = () => {
    if (sectionData) {
      const meterage = extractMeterage(sectionData.defects || "");
      const defectDesc = extractDefectDescription(sectionData.defects || "");
      const pipeSize = sectionData.pipeSize?.replace('mm', '') || "150";
      
      return {
        pipeSize: `${pipeSize}mm`,
        pipeDepth: sectionData.pipeDepth || "",
        defectDescription: defectDesc,
        chainage: meterage,
        requiredThickness: "",
        baseCost: "450"
      };
    }
    
    return {
      pipeSize: "150mm",
      pipeDepth: "",
      defectDescription: "",
      chainage: "",
      requiredThickness: "",
      baseCost: "450"
    };
  };

  const [formData, setFormData] = useState(initializeFormData());

  const generateMutation = useMutation({
    mutationFn: async (data: any): Promise<PatchRepairResult> => {
      const response = await fetch('/api/generate-patch-repair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate patch repair');
      }
      
      return response.json();
    },
    onSuccess: (data: PatchRepairResult) => {
      setResult(data);
      toast({
        title: "Patch repair generated successfully",
        description: "Review the WRc/CESWI-compliant specifications below"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error generating patch repair",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleGenerate = () => {
    if (!formData.defectDescription || !formData.chainage) {
      toast({
        title: "Missing required fields",
        description: "Please provide defect description and chainage",
        variant: "destructive"
      });
      return;
    }

    const data = {
      ...formData,
      pipeDepth: formData.pipeDepth ? parseFloat(formData.pipeDepth) : null,
      chainage: parseFloat(formData.chainage),
      requiredThickness: formData.requiredThickness ? parseFloat(formData.requiredThickness) : null,
      baseCost: parseFloat(formData.baseCost)
    };

    generateMutation.mutate(data);
  };

  const resetForm = () => {
    setFormData({
      pipeSize: "150mm",
      pipeDepth: "",
      defectDescription: "",
      chainage: "",
      requiredThickness: "",
      baseCost: "450"
    });
    setResult(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Calculator className="h-4 w-4" />
          Advanced Patch Generator
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>WRc/CESWI Patch Repair Generator</DialogTitle>
          <DialogDescription>
            Generate detailed patch repair specifications with automatic cost calculation
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6">
          {/* Input Form */}
          <div className="space-y-4">
            <h3 className="font-semibold">Defect Parameters</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Pipe Size *</Label>
                <Input
                  value={formData.pipeSize}
                  onChange={(e) => setFormData(prev => ({ ...prev, pipeSize: e.target.value }))}
                  placeholder="e.g. 150mm"
                />
              </div>
              <div>
                <Label>Pipe Depth (metres)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.pipeDepth}
                  onChange={(e) => setFormData(prev => ({ ...prev, pipeDepth: e.target.value }))}
                  placeholder="e.g. 2.5"
                />
              </div>
            </div>

            <div>
              <Label>Defect Description *</Label>
              <Input
                value={formData.defectDescription}
                onChange={(e) => setFormData(prev => ({ ...prev, defectDescription: e.target.value }))}
                placeholder="e.g. longitudinal cracking"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Chainage (metres) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.chainage}
                  onChange={(e) => setFormData(prev => ({ ...prev, chainage: e.target.value }))}
                  placeholder="e.g. 13.25"
                />
              </div>
              <div>
                <Label>Required Thickness (mm)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.requiredThickness}
                  onChange={(e) => setFormData(prev => ({ ...prev, requiredThickness: e.target.value }))}
                  placeholder="e.g. 4.0"
                />
                <p className="text-xs text-muted-foreground mt-1">From Patch Model (optional)</p>
              </div>
            </div>

            <div>
              <Label>Base Cost (£)</Label>
              <Input
                type="number"
                value={formData.baseCost}
                onChange={(e) => setFormData(prev => ({ ...prev, baseCost: e.target.value }))}
              />
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleGenerate}
                disabled={generateMutation.isPending}
                className="flex-1"
              >
                {generateMutation.isPending ? "Generating..." : "Generate Patch Repair"}
              </Button>
              <Button variant="outline" onClick={resetForm}>
                Reset
              </Button>
            </div>
          </div>

          {/* Results */}
          <div className="space-y-4">
            <h3 className="font-semibold">Generated Specification</h3>
            
            {result ? (
              <div className="space-y-4">
                {result.warning && (
                  <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5" />
                    <p className="text-sm text-amber-800 dark:text-amber-200">{result.warning}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Badge variant="secondary">
                    {result.patchLayer.charAt(0).toUpperCase() + result.patchLayer.slice(1)} Patch
                  </Badge>
                  <Badge variant="outline">
                    {result.thicknessUsed.toFixed(1)}mm thick
                  </Badge>
                  <Badge variant="default">
                    £{result.estimatedCost}
                  </Badge>
                </div>

                <div>
                  <Label>WRc/CESWI-Compliant Description</Label>
                  <Textarea
                    value={result.description}
                    readOnly
                    className="min-h-[120px] font-mono text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Cost Breakdown</Label>
                  <div className="bg-muted p-3 rounded-lg space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Base Cost:</span>
                      <span>£{result.costBreakdown.baseCost}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Layer Multiplier:</span>
                      <span>×{result.costBreakdown.layerMultiplier}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Depth Multiplier:</span>
                      <span>×{result.costBreakdown.depthMultiplier}</span>
                    </div>
                    <hr className="my-2" />
                    <div className="flex justify-between font-semibold">
                      <span>Final Cost:</span>
                      <span>£{result.costBreakdown.finalCost}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <p className="text-sm text-green-800 dark:text-green-200">
                    Specification complies with MSCC5, CESWI and WRc Drain Repair Book (4th Ed.)
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Enter defect parameters and generate a patch repair specification</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}