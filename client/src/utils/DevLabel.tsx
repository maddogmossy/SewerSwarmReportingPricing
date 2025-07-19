export const DEV_ID_LIST: string[] = [];

export function DevLabel({ id }: { id: string }) {
  if (!import.meta.env.DEV) return null;
  
  // Collect unique IDs for debugging
  if (!DEV_ID_LIST.includes(id)) {
    DEV_ID_LIST.push(id);
  }
  
  return (
    <span className="text-xs text-gray-400 absolute bottom-1 right-2 z-50 pointer-events-none">
      [id: {id}]
    </span>
  );
}