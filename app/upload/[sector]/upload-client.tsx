type Check =
  | { ok: true; kind: "pdf" | "db3" }
  | { ok: false; reason: string };

// later:
const validation: Check = React.useMemo(() => validateSelection(files), [files]);
React.useEffect(() => {
  setError(validation.ok ? null : validation.reason);
}, [validation]);

