import { ReactNode } from "react";
import { DevLabel } from "./DevLabel";

export function withDevLabel(id: string, content: ReactNode) {
  return (
    <div className="relative">
      {content}
      <DevLabel id={id} />
    </div>
  );
}