// components/PageId.tsx
type Props = { id: string; position?: "top-right" | "top-left" };

export function DevLabel({ id, position = "top-right" }: Props) {
  const pos =
    position === "top-left"
      ? "left-2 top-2"
      : "right-2 top-2";

  return (
    <span
      className={`pointer-events-none select-none absolute ${pos} 
                  text-[11px] font-medium px-2 py-0.5 rounded 
                  bg-slate-900 text-white opacity-80`}
    >
      id: {id}
    </span>
  );
}