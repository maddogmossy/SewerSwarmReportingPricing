import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface MetaFileStatusProps {
  hasMetaDb: boolean;
  className?: string;
  variant?: "alert" | "badge" | "simple";
}

export default function MetaFileStatus({ hasMetaDb, className = "", variant = "alert" }: MetaFileStatusProps) {
  if (hasMetaDb) {
    return null; // Don't render anything if meta file is present
  }

  if (variant === "badge") {
    return (
      <Badge variant="destructive" className={`ml-2 ${className}`}>
        Meta.db3 Missing
      </Badge>
    );
  }

  if (variant === "simple") {
    return (
      <div className={`text-red-500 text-sm mt-2 ${className}`}>
        ⚠️ Meta.db3 file not found. Service and structural grading may be incomplete.
      </div>
    );
  }

  return (
    <Alert variant="destructive" className={`mt-2 ${className}`}>
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="text-sm">
        ⚠️ Meta.db3 file not found. Service and structural grading may be incomplete.
      </AlertDescription>
    </Alert>
  );
}

// Alternative simpler version without Alert component
export function SimpleMetaFileStatus({ hasMetaDb, className = "" }: MetaFileStatusProps) {
  if (hasMetaDb) {
    return null;
  }

  return (
    <div className={`text-red-500 text-sm mt-2 ${className}`}>
      ⚠️ Meta.db3 file not found. Service and structural grading may be incomplete.
    </div>
  );
}

// Badge-only version for inline display
export function MetaFileBadge({ hasMetaDb, className = "" }: Omit<MetaFileStatusProps, 'variant'>) {
  if (hasMetaDb) {
    return null;
  }

  return (
    <Badge variant="destructive" className={`ml-2 ${className}`}>
      Meta.db3 Missing
    </Badge>
  );
}