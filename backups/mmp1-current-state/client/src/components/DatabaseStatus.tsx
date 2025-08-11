import { useSurveyLoader } from "@/hooks/useSurveyLoader";
import MetaFileStatus from "./MetaFileStatus";
import { Loader2 } from "lucide-react";

interface DatabaseStatusProps {
  directory?: string;
  className?: string;
}

export default function DatabaseStatus({ directory = "/mnt/data", className = "" }: DatabaseStatusProps) {
  const { loading, data, error } = useSurveyLoader(directory);

  if (loading) {
    return (
      <div className={`flex items-center gap-2 text-sm text-gray-600 ${className}`}>
        <Loader2 className="h-4 w-4 animate-spin" />
        Checking database files...
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-red-500 text-sm ${className}`}>
        ❌ {error}
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className={className}>
      <div className="text-green-600 text-sm">
        ✅ {data.message}
      </div>
      <MetaFileStatus hasMetaDb={data.hasMetaDb || false} variant="alert" />
    </div>
  );
}