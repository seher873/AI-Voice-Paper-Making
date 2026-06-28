"use client";

import { usePaper } from "@/context/PaperContext";

export default function FooterSection() {
  const { state, dispatch } = usePaper();

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l5-5m0 0l5 5m-5-5v12" />
          </svg>
        </div>
        <h2 className="text-sm sm:text-base font-semibold text-slate-800">Footer</h2>
      </div>

      <div className="bg-slate-50 rounded-xl p-3 sm:p-4 border border-slate-200 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">
              Teacher&apos;s Signature
            </label>
            <input
              type="text"
              value={state.footer.teacherSignature}
              onChange={(e) =>
                dispatch({ type: "SET_FOOTER", payload: { teacherSignature: e.target.value } })
              }
              placeholder="Teacher's name"
              className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">
              Principal&apos;s Signature
            </label>
            <input
              type="text"
              value={state.footer.principalSignature}
              onChange={(e) =>
                dispatch({ type: "SET_FOOTER", payload: { principalSignature: e.target.value } })
              }
              placeholder="Principal's name"
              className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">
              Total Marks
            </label>
            <input
              type="text"
              value={state.footer.total}
              onChange={(e) =>
                dispatch({ type: "SET_FOOTER", payload: { total: e.target.value } })
              }
              placeholder="e.g. 100"
              className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
