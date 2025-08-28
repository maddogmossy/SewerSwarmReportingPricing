// app/upload/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";

type PostResult =
  | { success: true; sector: string; clientId: number | null; projectId: number | null; files: string[] }
  | { success: false; error: string };

const SECTORS = [
  { id: "S1", label: "S1 — Potable Water" },
  { id: "S2", label: "S2 — Wastewater" },
  { id: "S3", label: "S3 — Stormwater" },
  { id: "S4", label: "S4 — Highways" },
  { id: "S5", label: "S5 — Rail" },
  { id: "S6", label: "S6 — Other" },
];

export default function UploadPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const prefilledSector = typeof searchParams?.sectorId === "string" ? searchParams?.sectorId : "";
  const [sectorId, setSectorId] = useState<string>(prefilledSector || "");
  const [clientName, setClientName] = useState<string>("");
  const [projectName, setProjectName] = useState<string>("");
  const [files, setFiles] = useState<FileList | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (prefilledSector) setSectorId(prefilledSector);
  }, [prefilledSector]);

  const onPickFiles = () => fileInputRef.current?.click();

  const onFilesChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    setFiles(e.target.files && e.target.files.length ? e.target.files : null);
    setMessage(null);
    setError(null);
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    setError(null);

    try {
      if (!sectorId) {
        setError("Please choose a sector.");
        setSubmitting(false);
        return;
      }
      if (!files || files.length === 0) {
        setError("Please select at least one file.");
        setSubmitting(false);
        return;
      }

      const form = new FormData();
      form.set("sectorId", sectorId);
      form.set("clientName", clientName);
      form.set("projectName", projectName);
      Array.from(files).forEach((f) => form.append("files", f));

      const res = await fetch("/api/uploads", { method: "POST", body: form });
      const data = (await res.json()) as PostResult;

      if (!res.ok || !("success" in data) || !data.success) {
        throw new Error(("error" in data && data.error) || "Upload failed");
      }

      setMessage(
        `Uploaded ${data.files.length} file${data.files.length === 1 ? "" : "s"} to ${data.sector}.`
      );
      setFiles(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      setError(err?.message || "Unexpected error while uploading");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ maxWidth: 860, margin: "0 auto" }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>P3: Upload Report Files</h1>

      <form onSubmit={onSubmit}>
        <label style={{ display: "block", fontWeight: 600, marginTop: 8, marginBottom: 6 }}>
          Sector <span style={{ color: "#d00" }}>*</span>
        </label>
        <select
          value={sectorId}
          onChange={(e) => setSectorId(e.target.value)}
          required
          style={{ width: "100%", padding: "10px 12px", border: "1px solid #ccc", borderRadius: 8, marginBottom: 16 }}
        >
          <option value="">— Select a sector —</option>
          {SECTORS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>Client (optional)</label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="e.g. Thames Water"
              style={{ width: "100%", padding: "10px 12px", border: "1px solid #ccc", borderRadius: 8, marginBottom: 16 }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>Project (optional)</label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g. City Centre Renewal"
              style={{ width: "100%", padding: "10px 12px", border: "1px solid #ccc", borderRadius: 8, marginBottom: 16 }}
            />
          </div>
        </div>

        <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
          Files <span style={{ color: "#d00" }}>*</span>
        </label>
        <input ref={fileInputRef} type="file" multiple onChange={onFilesChange} style={{ display: "none" }} />
        <div
          onClick={onPickFiles}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer?.files?.length) {
              setFiles(e.dataTransfer.files);
              setMessage(null);
              setError(null);
            }
          }}
          style={{
            border: "2px dashed #bbb",
            borderRadius: 10,
            padding: 20,
            textAlign: "center",
            cursor: "pointer",
            marginBottom: 12,
            background: "#fafafa",
          }}
          title="Click to choose files, or drop them here"
        >
          {files && files.length > 0 ? (
            <div style={{ textAlign: "left" }}>
              <strong>{files.length} selected:</strong>
              <ul style={{ marginTop: 8 }}>
                {Array.from(files).map((f) => (
                  <li key={f.name}>{f.name}</li>
                ))}
              </ul>
            </div>
          ) : (
            <>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Click to choose files or drop them here</div>
              <div style={{ color: "#666" }}>You can select multiple files</div>
            </>
          )}
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 10 }}>
          <button
            type="submit"
            disabled={submitting}
            style={{
              background: submitting ? "#888" : "#111",
              color: "white",
              border: "none",
              padding: "10px 16px",
              borderRadius: 8,
              fontWeight: 600,
              cursor: submitting ? "not-allowed" : "pointer",
            }}
          >
            {submitting ? "Uploading…" : "Upload"}
          </button>

          <button
            type="button"
            onClick={() => {
              setFiles(null);
              if (fileInputRef.current) fileInputRef.current.value = "";
              setMessage(null);
              setError(null);
            }}
            style={{
              background: "transparent",
              color: "#111",
              border: "1px solid #ccc",
              padding: "10px 16px",
              borderRadius: 8,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Clear files
          </button>
        </div>

        {message && (
          <div style={{ marginTop: 16, padding: 12, background: "#e6ffed", border: "1px solid #b5f2c5", borderRadius: 8 }}>
            {message}
          </div>
        )}
        {error && (
          <div style={{ marginTop: 16, padding: 12, background: "#ffecec", border: "1px solid #ffb3b3", borderRadius: 8 }}>
            {error}
          </div>
        )}
      </form>
    </div>
  );
}