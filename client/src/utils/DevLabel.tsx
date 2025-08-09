declare global {
  interface Window {
    DEV_ID_LIST?: string[];
  }
}

export function DevLabel({ id, position = "bottom-right" }: { id: string; position?: "bottom-right" | "top-right" }) {
  if (typeof window !== "undefined") {
    if (!window.DEV_ID_LIST) window.DEV_ID_LIST = [];
    if (!window.DEV_ID_LIST.includes(id)) {
      window.DEV_ID_LIST.push(id);
    }
  }

  const positionClass = position === "top-right" ? "top-1 right-1" : "bottom-1 right-1";

  return (
    <span
      className={`text-[10px] text-gray-700 bg-white px-1 rounded absolute ${positionClass} z-10 pointer-events-none font-bold`}
      style={{ fontFamily: "monospace", opacity: 0.9 }}
    >
      (id: {id})
    </span>
  );
}
