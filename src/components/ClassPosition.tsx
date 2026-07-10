"use client";

import { useResult } from "@/context/ResultContext";

export default function ClassPosition() {
  const { state } = useResult();
  const { results, classStats } = state;

  if (!classStats || results.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <p className="font-medium">Calculate results first to view positions</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-bold text-slate-800 mb-4">Class Position & Ranking</h2>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-200 text-center">
          <p className="text-2xl font-bold text-indigo-700">{classStats.totalStudents}</p>
          <p className="text-xs text-indigo-500">Total Students</p>
        </div>
        <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-center">
          <p className="text-2xl font-bold text-amber-700">{classStats.highest}%</p>
          <p className="text-xs text-amber-500">Highest</p>
        </div>
        <div className="p-4 bg-orange-50 rounded-xl border border-orange-200 text-center">
          <p className="text-2xl font-bold text-orange-700">{classStats.lowest}%</p>
          <p className="text-xs text-orange-500">Lowest</p>
        </div>
        <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
          <p className="text-2xl font-bold text-emerald-700">{classStats.average}%</p>
          <p className="text-xs text-emerald-500">Average</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h3 className="text-sm font-bold text-slate-700">Ranking</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50">
                <th className="text-left px-4 py-2.5 font-semibold text-slate-600 text-xs">Position</th>
                <th className="text-left px-4 py-2.5 font-semibold text-slate-600 text-xs">Roll No</th>
                <th className="text-left px-4 py-2.5 font-semibold text-slate-600 text-xs">Student Name</th>
                <th className="text-center px-3 py-2.5 font-semibold text-slate-600 text-xs">Percentage</th>
                <th className="text-center px-3 py-2.5 font-semibold text-slate-600 text-xs">Grade</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={r.rollNo} className={`${i % 2 === 0 ? "bg-white" : "bg-slate-50/50"} border-t border-slate-100`}>
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                      r.position === 1 ? "bg-yellow-100 text-yellow-700 ring-2 ring-yellow-300" :
                      r.position === 2 ? "bg-slate-100 text-slate-600 ring-2 ring-slate-300" :
                      r.position === 3 ? "bg-orange-100 text-orange-700 ring-2 ring-orange-300" :
                      "text-slate-500"
                    }`}>{r.position}</span>
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">{r.rollNo}</td>
                  <td className="px-4 py-2.5 font-medium text-slate-700">{r.studentName}</td>
                  <td className="text-center px-3 py-2.5 font-medium text-slate-700">{r.percentage}%</td>
                  <td className="text-center px-3 py-2.5">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${
                      r.grade === "A+" ? "bg-emerald-100 text-emerald-700" :
                      r.grade === "A" ? "bg-blue-100 text-blue-700" :
                      r.grade === "B" ? "bg-indigo-100 text-indigo-700" :
                      r.grade === "C" ? "bg-amber-100 text-amber-700" :
                      r.grade === "D" ? "bg-orange-100 text-orange-700" :
                      "bg-red-100 text-red-700"
                    }`}>{r.grade}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
