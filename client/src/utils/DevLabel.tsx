export const DEV_ID_LIST: string[] = [];

export function DevLabel({ id }: { id: string }) {
  if (typeof window !== "undefined") {
    // Store in global list for console access
    if (!window.DEV_ID_LIST) window.DEV_ID_LIST = [];
    if (!window.DEV_ID_LIST.includes(id)) {
      window.DEV_ID_LIST.push(id);
    }
  }

  return (
    <span
      className="text-[10px] text-white bg-black px-1 rounded absolute bottom-1 right-1 z-[9999] pointer-events-none"
      style={{ fontFamily: "monospace" }}
    >
      ID: {id}
    </span>
  );
}