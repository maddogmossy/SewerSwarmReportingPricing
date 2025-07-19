export function DevLabel({ id, position = "underneath" }: { id: string; position?: "bottom-right" | "top-right" | "underneath" }) {
  if (typeof window !== "undefined") {
    if (!window.DEV_ID_LIST) window.DEV_ID_LIST = [];
    if (!window.DEV_ID_LIST.includes(id)) {
      window.DEV_ID_LIST.push(id);
    }
  }

  // For underneath positioning, render as a block element below the button
  if (position === "underneath") {
    return (
      <div
        className="text-[10px] text-gray-600 bg-gray-100 px-2 py-1 rounded text-center mt-1 font-bold border"
        style={{ fontFamily: "monospace" }}
      >
        {id}
      </div>
    );
  }

  const positionClass = position === "top-right" ? "top-1 right-1" : "bottom-1 right-1";

  return (
    <span
      className={`text-[10px] text-gray-700 bg-white px-1 rounded absolute ${positionClass} z-[9999] pointer-events-none font-bold`}
      style={{ fontFamily: "monospace", opacity: 0.9 }}
    >
      (id: {id})
    </span>
  );
}
