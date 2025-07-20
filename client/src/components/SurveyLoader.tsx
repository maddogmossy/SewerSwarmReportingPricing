import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface SurveyLoaderProps {
  directory?: string;
  onLoad?: (data: any) => void;
}

export default function SurveyLoader({ directory = "/mnt/data", onLoad }: SurveyLoaderProps) {
  const { toast } = useToast();

  useEffect(() => {
    fetch(`/api/load-survey?directory=${encodeURIComponent(directory)}`) // This will hit the endpoint using `validateDb3Files()`
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          toast({
            title: "Warning",
            description: data.error,
            variant: "destructive"
          });
        } else {
          toast({
            title: "Success",
            description: data.message
          });
          
          // Call onLoad callback if provided
          if (onLoad) {
            onLoad(data);
          }
        }
      })
      .catch(error => {
        toast({
          title: "Error",
          description: "Failed to load survey data",
          variant: "destructive"
        });
        console.error("Survey loading error:", error);
      });
  }, [directory, toast, onLoad]);

  return null; // This is a utility component that doesn't render anything
}