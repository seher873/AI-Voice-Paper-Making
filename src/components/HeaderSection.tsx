"use client";

import { usePaper } from "@/context/PaperContext";
import { useRef, useState } from "react";
import { useToast } from "@/context/ToastContext";

export default function HeaderSection() {
  const { state, dispatch } = usePaper();
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoError, setLogoError] = useState(false);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      addToast("Logo must be under 2MB", "error");
      return;
    }

    if (!file.type.startsWith("image/")) {
      addToast("Please select a valid image file", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      dispatch({ type: "SET_SCHOOL_LOGO", payload: event.target?.result as string });
      setLogoError(false);
      addToast("Logo uploaded successfully", "success");
    };
    reader.onerror = () => {
      addToast("Failed to read the image file", "error");
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    dispatch({ type: "SET_SCHOOL_LOGO", payload: null });
    setLogoError(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 sm:w-9 sm:h-9 bg-indigo-100 rounded-xl flex items-center justify-center">
          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </div>
        <h2 className="text-base sm:text-lg font-bold text-slate-800">Paper Header</h2>
      </div>

      <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200 space-y-4 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
              School Name
            </label>
            <textarea
              value={state.schoolName}
              onChange={(e) => dispatch({ type: "SET_SCHOOL_NAME", payload: e.target.value })}
              dir="auto"
              placeholder="Enter school name"
              rows={2}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-base text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all resize-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
              Paper Title
            </label>
            <input
              type="text"
              value={state.paperTitle}
              onChange={(e) => dispatch({ type: "SET_PAPER_TITLE", payload: e.target.value })}
              placeholder="e.g. Annual Examination 2026"
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-base text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
              Time
            </label>
            <input
              type="text"
              value={state.time}
              onChange={(e) => dispatch({ type: "SET_TIME", payload: e.target.value })}
              placeholder="e.g. 3 Hours"
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-base text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
              Obtained Marks
            </label>
            <input
              type="text"
              value={state.totalMarks}
              onChange={(e) => dispatch({ type: "SET_TOTAL_MARKS", payload: e.target.value })}
              placeholder="e.g. 85"
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-base text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
              Date
            </label>
            <input
              type="text"
              value={state.date}
              onChange={(e) => dispatch({ type: "SET_DATE", payload: e.target.value })}
              placeholder="e.g. 15-03-2026"
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-base text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
              Class
            </label>
            <input
              type="text"
              value={state.className}
              onChange={(e) => dispatch({ type: "SET_CLASS", payload: e.target.value })}
              placeholder="e.g. 10th"
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-base text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
              Subject
            </label>
            <input
              type="text"
              value={state.subject}
              onChange={(e) => dispatch({ type: "SET_SUBJECT", payload: e.target.value })}
              placeholder="e.g. English"
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-base text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
              Teacher Signature
            </label>
            <input
              type="text"
              value={state.teacherSignature}
              onChange={(e) => dispatch({ type: "SET_TEACHER_SIGNATURE", payload: e.target.value })}
              placeholder="Teacher name"
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-base text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
              Principal Signature
            </label>
            <input
              type="text"
              value={state.principalSignature}
              onChange={(e) => dispatch({ type: "SET_PRINCIPAL_SIGNATURE", payload: e.target.value })}
              placeholder="Principal name"
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-base text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
              Student Name Label
            </label>
            <input
              type="text"
              value={state.studentNameLabel}
              onChange={(e) => dispatch({ type: "SET_STUDENT_NAME_LABEL", payload: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-base text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
              Father Name Label
            </label>
            <input
              type="text"
              value={state.fatherNameLabel}
              onChange={(e) => dispatch({ type: "SET_FATHER_NAME_LABEL", payload: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-base text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
              School Logo
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2.5 min-h-[48px] px-5 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 hover:border-indigo-400 hover:text-indigo-600 transition-all font-medium shadow-sm"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {state.schoolLogo ? "Change Logo" : "Upload Logo"}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
              {state.schoolLogo && (
                <>
                  <div className="flex items-center gap-2">
                    {logoError ? (
                      <span className="text-sm text-red-500">Invalid image</span>
                    ) : (
                      <img src={state.schoolLogo} alt="Preview" className="w-12 h-12 rounded-xl object-cover border-2 border-slate-200 shadow-sm" />
                    )}
                  </div>
                  <button
                    onClick={handleRemoveLogo}
                    className="text-sm text-red-500 hover:text-red-700 font-semibold transition-colors min-h-[44px] px-4 py-2 bg-red-50 hover:bg-red-100 rounded-xl"
                  >
                    Remove
                  </button>
                </>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1.5">PNG, JPG or WEBP. Max 2MB.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
