import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface SurveyData {
  message: string;
  valid: boolean;
  error?: string;
  warning?: string;
  hasMetaDb?: boolean;
}

export function useSurveyLoader(directory: string = "/mnt/data") {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SurveyData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadSurvey = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/load-survey?directory=${encodeURIComponent(directory)}`);
      const result = await response.json();
      
      setData(result);
      
      if (result.error) {
        setError(result.error);
        toast({
          title: "Warning",
          description: result.error,
          variant: "destructive"
        });
      } else {
        // Show warning if meta file is missing but processing continues
        if (result.warning) {
          toast({
            title: "Partial Processing",
            description: result.warning,
            variant: "default"
          });
        }
        
        toast({
          title: "Success",
          description: result.message
        });
      }
    } catch (err) {
      const errorMessage = "Failed to load survey data";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      console.error("Survey loading error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSurvey();
  }, [directory]);

  return {
    loading,
    data,
    error,
    reload: loadSurvey
  };
}