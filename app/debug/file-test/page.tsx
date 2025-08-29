"use client";

import { useState } from "react";

export default function FileTest() {
  const [names, setNames] = useState<string[]>([]);
  return (
    <main className="mx-auto max-w-xl p-6">
      <h1 className="text-2xl font-bold">Minimal File Picker Test</h1>
      <p className="mt-1 text-slate-600">No drag/drop, no fetch, no toasts — just a plain input.</p>

      <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <label htmlFor="picker" className="inline-block rounded-md bg-indigo-600 px-4 py-2 text-white cursor-pointer">
          Choose files
        </label>
        <input
          id="picker"
          type="file"
          multiple
          className="sr-only"
          accept=".pdf,.db,.db3,application/pdf,application/x-sqlite3"
          onChange={(e) => {
            const list = Array.from(e.target.files ?? []);
            setNames(list.map(f => `${f.name} (${(f.size/1024/1024).toFixed(2)} MB)`));
          }}
        />

        <ul className="mt-4 list-disc pl-5 text-sm">
          {names.length === 0 ? <li className="text-slate-500">No files selected</li> :
            names.map(n => <li key={n}>{n}</li>)}
        </ul>
      </div>
    </main>
  );
}
