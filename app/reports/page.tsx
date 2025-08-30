// app/reports/page.tsx
"use client";

import React, { useEffect, useState } from "react";

type FileItem = {
  url: string;
  pathname: string;
  name: string;
  size: number;
  contentType: string;
  uploadedAt: string;
  client: string;
  project: string;
  sector: string;
};

type ProjectsMap = Record<string, FileItem[]>;

export default function ReportsPage() {
  const [projects, setProjects] = useState<ProjectsMap>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReports() {
      try {
        const res = await fetch("/api/reports/list");
        if (!res.ok) throw new Error("Failed to fetch reports");
        const data: FileItem[] = await res.json();

        // Group files by project
        const grouped: ProjectsMap = {};
        data.forEach((file) => {
          const key = `${file.client} - ${file.project}`;
          if (!grouped[key]) grouped[key] = [];
          grouped[key].push(file);
        });

        setProjects(grouped);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchReports();
  }, []);

  if (loading) {
    return (
      <main className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-4">Reports</h1>
        <p>Loading…</p>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">Reports</h1>
      <p className="text-slate-600 mb-6">
        Grouped by client/project from uploaded files.
      </p>

      <div className="space-y-4">
        {Object.entries(projects).map(([project, files]) => (
          <div
            key={project}
            className="rounded-lg border border-slate-200 p-3 bg-white"
          >
            <h2 className="text-lg font-semibold mb-2">{project}</h2>
            <ul className="space-y-1">
              {files.map((f) => (
                <li
                  key={f.pathname}
                  className="flex items-center justify-between text-sm"
                >
                  <a
                    href={f.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {f.name}
                  </a>
                  <span className="text-slate-500 text-xs">
                    {new Date(f.uploadedAt).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {!Object.keys(projects).length && (
          <div className="text-slate-500">No reports uploaded yet.</div>
        )}
      </div>
    </main>
  );
}
