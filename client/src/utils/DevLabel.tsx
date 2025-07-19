import { ReactNode } from "react";

export function DevLabel({ id }: { id: string }) {
  if (!import.meta.env.DEV) return null;
  return (
    <span className="text-xs text-gray-400 absolute bottom-1 right-2 z-50">
      [id: {id}]
    </span>
  );
}

export function withDevLabel(id: string, content: ReactNode) {
  return (
    <div className="relative">
      {content}
      <DevLabel id={id} />
    </div>
  );
}