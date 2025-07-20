import { useToast } from "@/hooks/use-toast";
import { useEffect, ReactNode } from "react";

interface AppWrapperProps {
  children: ReactNode;
}

export default function AppWrapper({ children }: AppWrapperProps) {
  const { toast } = useToast();

  useEffect(() => {
    const handler = (e: any) => {
      toast({
        title: "Warning",
        description: e.detail,
        variant: "destructive"
      });
    };

    window.addEventListener("SHOW_WARNING", handler);
    return () => window.removeEventListener("SHOW_WARNING", handler);
  }, [toast]);

  return <>{children}</>;
}