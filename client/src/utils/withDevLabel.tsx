import { ReactNode } from "react";
import { DevLabel } from "./DevLabel";

/**
 * Wraps content with a DevLabel for debugging in development mode.
 * 
 * Naming convention: [sector-or-page]-[element-type]-[purpose]
 * Examples:
 * - "utilities-sector-card-main"
 * - "dashboard-table-sections" 
 * - "pricing-form-length-input"
 * - "config-window-blue-pricing"
 */
export function withDevLabel(id: string, content: ReactNode) {
  if (import.meta.env.DEV) {
    // Validate naming convention in development
    const parts = id.split('-');
    if (parts.length < 3) {
      console.warn(`DevLabel ID "${id}" should follow pattern: [sector-or-page]-[element-type]-[purpose]`);
    }
  }
  
  return (
    <div className="relative">
      {content}
      <DevLabel id={id} />
    </div>
  );
}