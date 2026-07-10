"use client";

import { useResult } from "@/context/ResultContext";

export default function ResultAnalytics() {
  const { state } = useResult();
  const { classStats, results } = state;
  const subjects = state.currentExam?.subjects || [];

  if (!classStats || results.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <p className="font-medium">Calculate results first to view analytics</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-bold text-slate-800 mb-4">Result Analytics</h2>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
          <p className="text-2xl font-bold text-emerald-700">{classStats.passPercentage}%</p>
          <p className="text-xs text-emerald-500">Pass Rate</p>
        </div>
        <div className="p-4 bg-red-50 rounded-xl border border-red-200 text-center">
          <p className="text-2xl font-bold text-red-600">{classStats.failPercentage}%</p>
          <p className="text-xs text-red-500">Fail Rate</p>
        </div>
        <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 text-center">
          <p className="text-2xl font-bold text-blue-700">{classStats.passed}</p>
          <p className="text-xs text-blue-500">Passed</p>
        </div>
        <div className="p-4 bg-orange-50 rounded-xl border border-orange-200 text-center">
          <p className="text-2xl font-bold text-orange-600">{classStats.failed}</p>
          <p className="text-xs text-orange-500">Failed</p>
        </div>
      </div>

      {/* Grade Distribution */}
      <div className="mb-6">
        <h3 className="text-sm font-bold text-slate-700 mb-3">Grade Distribution</h3>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {Object.entries(classStats.gradeDistribution).map(([grade, count]) => {
            const pct = Math.round((count / classStats.totalStudents) * 100);
            return (
              <div key={grade} className="p-3 bg-white rounded-xl border border-slate-200 text-center">
                <p className="text-lg font-bold text-slate-700">{grade}</p>
                <p className="text-2xl font-bold text-indigo-600">{count}</p>
                <p className="text-xs text-slate-400">{pct}%</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Subject-wise Stats */}
      <div className="mb-6">
        <h3 className="text-sm font-bold text-slate-700 mb-3">Subject-wise Performance</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm bg-white rounded-xl border border-slate-200">
            <thead>
              <tr className="bg-slate-50">
                <th className="text-left px-4 py-2.5 font-semibold text-slate-600 text-xs">Subject</th>
                <th className="text-center px-3 py-2.5 font-semibold text-slate-600 text-xs">Average</th>
                <th className="text-center px-3 py-2.5 font-semibold text-slate-600 text-xs">Highest</th>
                <th className="text-center px-3 py-2.5 font-semibold text-slate-600 text-xs">Lowest</th>
                <th className="text-center px-3 py-2.5 font-semibold text-slate-600 text-xs">Passed</th>
                <th className="text-center px-3 py-2.5 font-semibold text-slate-600 text-xs">Failed</th>
              </tr>
            </thead>
            <tbody>
              {classStats.subjectStats.map((stat, i) => (
                <tr key={stat.subject} className={`${i % 2 === 0 ? "bg-white" : "bg-slate-50/50"} border-t border-slate-100`}>
                  <td className="px-4 py-2.5 font-medium text-slate-700">{stat.subject}</td>
                  <td className="text-center px-3 py-2.5 text-slate-600">{stat.average}</td>
                  <td className="text-center px-3 py-2.5 text-emerald-600 font-medium">{stat.highest}</td>
                  <td className="text-center px-3 py-2.5 text-red-500 font-medium">{stat.lowest}</td>
                  <td className="text-center px-3 py-2.5 text-emerald-600 font-medium">{stat.passed}</td>
                  <td className="text-center px-3 py-2.5 text-red-500 font-medium">{stat.failed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top & Weak Students */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <h3 className="text-sm font-bold text-emerald-700 mb-3">Top 10 Performers</h3>
          <div className="space-y-1.5">
            {classStats.topPerformers.slice(0, 5).map((r) => (
              <div key={r.rollNo} className="flex items-center justify-between p-2.5 bg-emerald-50 rounded-lg border border-emerald-200">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-500">#{r.position}</span>
                  <span className="text-sm font-medium text-slate-700">{r.studentName}</span>
                </div>
                <span className="text-sm font-bold text-emerald-700">{r.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-sm font-bold text-red-600 mb-3">Needs Improvement</h3>
          <div className="space-y-1.5">
            {classStats.weakStudents.slice(0, 5).map((r) => (
              <div key={r.rollNo} className="flex items-center justify-between p-2.5 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-red-400">#{r.position}</span>
                  <span className="text-sm font-medium text-slate-700">{r.studentName}</span>
                </div>
                <span className="text-sm font-bold text-red-600">{r.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
