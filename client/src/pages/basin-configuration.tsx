import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Save, ArrowLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Link, useParams } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";

const standardsRuleSchema = z.object({
  condition: z.string().min(1, "Condition is required"),
  recommendationType: z.string().min(1, "Recommendation type is required"),
  standardsApplied: z.string().min(1, "Standards applied is required"),
  customRecommendations: z.array(z.string()).default([]),
  notes: z.string().optional(),
  isActive: z.boolean().default(true),
});

type StandardsRuleForm = z.infer<typeof standardsRuleSchema>;

interface ConditionTriggerData {
  conditions: string[];
  recommendedActions: string[];
  allMappings: Array<{
    condition: string;
    triggerDefectCodes: string[];
    recommendedAction: string;
    actionType: number;
    notes: string;
  }>;
}

interface StandardsRule {
  id: number;
  userId: string;
  sector: string;
  condition: string;
  recommendationType: string;
  standardsApplied: string;
  customRecommendations: string[];
  notes?: string;
  isActive: boolean;
}

export default function BasinConfiguration() {
  const { sector } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [editingRule, setEditingRule] = useState<any>(null);
  const [customRecommendation, setCustomRecommendation] = useState("");

  // Fetch condition-trigger-action data
  const { data: conditionData, isLoading: isLoadingConditions } = useQuery<ConditionTriggerData>({
    queryKey: ["/api/condition-triggers"],
  });

  // Fetch existing standards rules for this sector
  const { data: standardsRules = [], isLoading: isLoadingRules } = useQuery<StandardsRule[]>({
    queryKey: [`/api/standards-rules/${sector}`],
    enabled: !!sector,
  });

  const form = useForm<StandardsRuleForm>({
    resolver: zodResolver(standardsRuleSchema),
    defaultValues: {
      condition: "",
      recommendationType: "",
      standardsApplied: "",
      customRecommendations: [],
      notes: "",
      isActive: true,
    },
  });

  // Create standards rule mutation
  const createRuleMutation = useMutation({
    mutationFn: async (rule: StandardsRuleForm) => {
      return await apiRequest("POST", "/api/standards-rules", {
        ...rule,
        sector: sector,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/standards-rules/${sector}`] });
      form.reset();
      setCustomRecommendation("");
      toast({
        title: "Success",
        description: "Standards rule created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create standards rule",
        variant: "destructive",
      });
    },
  });

  // Update standards rule mutation
  const updateRuleMutation = useMutation({
    mutationFn: async ({ id, ...rule }: StandardsRuleForm & { id: number }) => {
      return await apiRequest("PUT", `/api/standards-rules/${id}`, rule);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/standards-rules/${sector}`] });
      setEditingRule(null);
      form.reset();
      setCustomRecommendation("");
      toast({
        title: "Success",
        description: "Standards rule updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update standards rule",
        variant: "destructive",
      });
    },
  });

  // Delete standards rule mutation
  const deleteRuleMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/standards-rules/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/standards-rules/${sector}`] });
      toast({
        title: "Success",
        description: "Standards rule deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete standards rule",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: StandardsRuleForm) => {
    if (editingRule) {
      updateRuleMutation.mutate({ ...data, id: editingRule.id });
    } else {
      createRuleMutation.mutate(data);
    }
  };

  const handleEdit = (rule: StandardsRule) => {
    setEditingRule(rule);
    form.reset({
      condition: rule.condition,
      recommendationType: rule.recommendationType,
      standardsApplied: rule.standardsApplied,
      customRecommendations: rule.customRecommendations || [],
      notes: rule.notes || "",
      isActive: rule.isActive,
    });
  };

  const addCustomRecommendation = () => {
    if (customRecommendation.trim()) {
      const current = form.getValues("customRecommendations");
      form.setValue("customRecommendations", [...current, customRecommendation.trim()]);
      setCustomRecommendation("");
    }
  };

  const removeCustomRecommendation = (index: number) => {
    const current = form.getValues("customRecommendations");
    form.setValue("customRecommendations", current.filter((_, i) => i !== index));
  };

  // Get recommended actions for selected condition
  const getRecommendationsForCondition = (condition: string) => {
    if (!conditionData?.allMappings) return [];
    return conditionData.allMappings
      .filter((mapping) => mapping.condition === condition)
      .map((mapping) => mapping.recommendedAction);
  };

  const selectedCondition = form.watch("condition");
  const availableRecommendations = getRecommendationsForCondition(selectedCondition);

  if (!user) {
    return <div>Please log in to access this page.</div>;
  }

  if (isLoadingConditions || isLoadingRules) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/sector-pricing">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Sectors
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {sector?.charAt(0).toUpperCase() + sector?.slice(1)} Sector Standards
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Configure condition-based recommendations using industry standards
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Configuration Form */}
        <Card>
          <CardHeader>
            <CardTitle>
              {editingRule ? "Edit Standards Rule" : "Add Standards Rule"}
            </CardTitle>
            <CardDescription>
              Configure condition-based recommendations for {sector} sector standards
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Condition Selection */}
                <FormField
                  control={form.control}
                  name="condition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Condition</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select condition" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {conditionData?.conditions?.map((condition: string) => (
                            <SelectItem key={condition} value={condition}>
                              {condition}
                            </SelectItem>
                          )) || []}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Recommendation Type */}
                <FormField
                  control={form.control}
                  name="recommendationType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recommendation Type</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                        disabled={!selectedCondition || availableRecommendations.length === 0}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select recommendation" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableRecommendations.map((recommendation: string) => (
                            <SelectItem key={recommendation} value={recommendation}>
                              {recommendation}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Standards Applied */}
                <FormField
                  control={form.control}
                  name="standardsApplied"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Standards Applied</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., WRc MSCC5, BS EN 752:2017"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Custom Recommendations */}
                <div className="space-y-3">
                  <FormLabel>Custom Recommendations</FormLabel>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add custom recommendation"
                      value={customRecommendation}
                      onChange={(e) => setCustomRecommendation(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addCustomRecommendation())}
                    />
                    <Button 
                      type="button" 
                      onClick={addCustomRecommendation}
                      variant="outline"
                      size="sm"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {form.watch("customRecommendations").map((rec, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {rec}
                        <button
                          type="button"
                          onClick={() => removeCustomRecommendation(index)}
                          className="ml-1 hover:bg-red-100 rounded"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Additional notes or specifications"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Submit Button */}
                <div className="flex gap-2">
                  <Button 
                    type="submit" 
                    disabled={createRuleMutation.isPending || updateRuleMutation.isPending}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {editingRule ? "Update Rule" : "Create Rule"}
                  </Button>
                  {editingRule && (
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => {
                        setEditingRule(null);
                        form.reset();
                        setCustomRecommendation("");
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Existing Rules */}
        <Card>
          <CardHeader>
            <CardTitle>Configured Standards Rules</CardTitle>
            <CardDescription>
              Current condition-based recommendations for {sector} sector
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {standardsRules.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No standards rules configured yet.
                  <br />
                  Create your first rule using the form.
                </p>
              ) : (
                standardsRules.map((rule: any) => (
                  <div
                    key={rule.id}
                    className="border rounded-lg p-4 space-y-3 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {rule.condition}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {rule.recommendationType}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Standards: {rule.standardsApplied}
                        </p>
                        {rule.customRecommendations?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {rule.customRecommendations.map((rec: string, index: number) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {rec}
                              </Badge>
                            ))}
                          </div>
                        )}
                        {rule.notes && (
                          <p className="text-xs text-gray-500 mt-2 italic">
                            {rule.notes}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(rule)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteRuleMutation.mutate(rule.id)}
                          disabled={deleteRuleMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}