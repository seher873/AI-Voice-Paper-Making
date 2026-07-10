"use client";

import { useState, useRef } from "react";
import { useResult } from "@/context/ResultContext";
import { parseExcelFile, generateExcelBuffer, downloadExcel } from "@/lib/excelEngine";

export default function BulkExcelUpload() {
  const { state, dispatch } = useResult();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const subjects = state.currentExam?.subjects || [];

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || subjects.length === 0) return;

    setLoading(true);
    setErrors([]);

    try {
      const buffer = await file.arrayBuffer();
      const result = parseExcelFile(buffer, subjects);

      if (result.students.length > 0) {
        dispatch({ type: "SET_STUDENTS", payload: result.students });
      }

      if (result.errors.length > 0) {
        setErrors(result.errors);
      }

      if (result.students.length > 0 && result.errors.length === 0) {
        dispatch({ type: "CALCULATE_RESULTS" });
      }
    } catch (err) {
      setErrors([`Failed to parse file: ${err instanceof Error ? err.message : "Unknown error"}`]);
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const downloadTemplate = () => {
    if (subjects.length === 0) return;
    const headers = ["Roll No", "Student Name", ...subjects.map((s) => s.name)];
    const buffer = generateExcelBuffer(headers, []);
    downloadExcel(buffer, "marks-template.xlsx");
  };

  if (!state.currentExam) {
    return (
      <div className="text-center py-12 text-slate-400">
        <p className="font-medium">Create an exam first to upload marks</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h2 className="text-lg font-bold text-slate-800 mb-4">Bulk Excel Upload</h2>
      <p className="text-xs text-slate-400 mb-4">
        Upload an Excel file with student marks. Columns: Roll No, Student Name, {subjects.map((s) => s.name).join(", ")}
      </p>

      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium text-sm transition-all"
        >
          {loading ? "Processing..." : "Upload Excel File"}
        </button>
        <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleFile} className="hidden" />
        <button
          onClick={downloadTemplate}
          className="px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-medium text-sm transition-all"
        >
          Download Template
        </button>
      </div>

      {errors.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
          <h3 className="text-sm font-bold text-red-700 mb-2">Validation Errors ({errors.length})</h3>
          <div className="max-h-40 overflow-y-auto space-y-1">
            {errors.map((err, i) => (
              <p key={i} className="text-xs text-red-600">{err}</p>
            ))}
          </div>
        </div>
      )}

      {state.students.length > 0 && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
          <p className="text-sm font-semibold text-emerald-700">
            {state.students.length} students loaded successfully
          </p>
          <button
            onClick={() => dispatch({ type: "CALCULATE_RESULTS" })}
            className="mt-3 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-all"
          >
            Calculate Results
          </button>
        </div>
      )}
    </div>
  );
}
