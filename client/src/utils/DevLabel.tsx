export const DEV_ID_LIST: string[] = [];

// Make DEV_ID_LIST globally accessible in development
if (import.meta.env.DEV) {
  (window as any).DEV_ID_LIST = DEV_ID_LIST;
}

export function DevLabel({ id }: { id: string }) {
  if (!import.meta.env.DEV) return null;
  
  // Collect unique IDs for debugging
  if (!DEV_ID_LIST.includes(id)) {
    DEV_ID_LIST.push(id);
  }
  
  return (
    <span className="text-[10px] text-white bg-black px-1 rounded absolute bottom-1 right-1 z-50 pointer-events-none">
      [id: {id}]
    </span>
  );
}