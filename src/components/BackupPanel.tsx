"use client";

import { useState } from "react";
import { exportSchoolData, importSchoolData, type SchoolBackup } from "@/lib/backup";
import { useToast } from "@/context/ToastContext";

export default function BackupPanel() {
  const [loading, setLoading] = useState<"export" | "import" | null>(null);
  const { addToast } = useToast();

  const handleExport = async () => {
    setLoading("export");
    try {
      const data = await exportSchoolData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `backup-${data.schoolName.replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      addToast("Backup downloaded successfully!", "success");
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Export failed", "error");
    } finally {
      setLoading(null);
    }
  };

  const handleImport = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      setLoading("import");
      try {
        const text = await file.text();
        const backup = JSON.parse(text) as SchoolBackup;
        if (backup.version !== 1) throw new Error("Invalid backup file");
        if (!confirm(`This will replace ALL current data with backup data from "${backup.schoolName}". Continue?`)) {
          setLoading(null);
          return;
        }
        const result = await importSchoolData(backup);
        addToast(result.message, "success");
        setTimeout(() => window.location.reload(), 1500);
      } catch (err) {
        addToast(err instanceof Error ? err.message : "Import failed", "error");
      } finally {
        setLoading(null);
      }
    };
    input.click();
  };

  return (
    <div className="border-t border-slate-100 pt-3">
      <label className="block text-xs font-semibold text-slate-500 mb-2">Backup & Restore</label>
      <div className="flex gap-2">
        <button
          onClick={handleExport}
          disabled={loading !== null}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-xs font-bold"
        >
          {loading === "export" ? (
            <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" strokeWidth={3} className="opacity-25" />
              <path d="M4 12a8 8 0 018-8" strokeWidth={3} className="opacity-75" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          )}
          Export
        </button>
        <button
          onClick={handleImport}
          disabled={loading !== null}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 border-2 border-amber-500 text-amber-600 rounded-lg hover:bg-amber-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-xs font-bold"
        >
          {loading === "import" ? (
            <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" strokeWidth={3} className="opacity-25" />
              <path d="M4 12a8 8 0 018-8" strokeWidth={3} className="opacity-75" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L5 8m4-4v12" />
            </svg>
          )}
          Restore
        </button>
      </div>
    </div>
  );
}
