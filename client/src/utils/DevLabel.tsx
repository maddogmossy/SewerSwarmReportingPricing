export function DevLabel({ id }: { id: string }) {
  if (typeof window !== "undefined") {
    if (!window.DEV_ID_LIST) window.DEV_ID_LIST = [];
    if (!window.DEV_ID_LIST.includes(id)) {
      window.DEV_ID_LIST.push(id);
    }

    return (
      <span className="text-[10px] text-white bg-red-600 px-1 rounded absolute bottom-1 right-1 z-[9999] pointer-events-none font-mono">
        ID: {id}
      </span>
    );
  }

  return null;
}
