"use client";

import { useState } from "react";
import { getSupabase, getSchoolId } from "@/lib/supabase";
import type { StudentFee } from "@/types/fee";
import { sessionOptions, STANDARD_CLASSES } from "@/types/fee";

interface Props {
  onClose: () => void;
  onSaved: () => void;
}

type FormState = Omit<StudentFee, "id" | "school_id" | "created_at">;

const EMPTY_FORM: FormState = {
  student_name: "",
  father_name: "",
  class_name: "Class 1",
  section: "",
  roll_no: "",
  parent_phone: "",
  fee_structure_id: null,
  monthly_fee: 0,
  session: sessionOptions()[1] || "",
  admission_date: "",
  is_active: true,
};

export default function StudentAddModal({ onClose, onSaved }: Props) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!form.student_name.trim()) {
      setError("Student name zaroor bharen");
      return;
    }
    if (!form.class_name.trim()) {
      setError("Class zaroor bharen");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const sb = getSupabase();
      const schoolId = await getSchoolId();
      if (!schoolId) throw new Error("School nahi mila — dobara login karein");
      const payload = {
        ...form,
        school_id: schoolId,
        admission_date: form.admission_date || null,
      };
      const { error } = await sb.from("student_fees").insert(payload);
      if (error) throw new Error(error.message);
      onSaved();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-base font-bold text-slate-800">➕ Add Student</h2>
            <p className="text-[10px] text-slate-400 mt-0.5">Fee system mein naya student add karein</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-6 space-y-3 overflow-y-auto">
          {error && <div className="p-2 bg-red-50 text-red-600 text-xs rounded-lg">{error}</div>}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Student Name *</label>
            <input autoFocus className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400" value={form.student_name} onChange={(e) => setForm({ ...form, student_name: e.target.value })} placeholder="e.g. Ahmed Khan" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Father Name</label>
            <input className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400" value={form.father_name || ""} onChange={(e) => setForm({ ...form, father_name: e.target.value })} placeholder="e.g. Muhammad Khan" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Class *</label>
              <select className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400" value={form.class_name} onChange={(e) => setForm({ ...form, class_name: e.target.value })}>
                {STANDARD_CLASSES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Section</label>
              <input className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400" value={form.section || ""} onChange={(e) => setForm({ ...form, section: e.target.value })} placeholder="A" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Roll No</label>
              <input className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400" value={form.roll_no || ""} onChange={(e) => setForm({ ...form, roll_no: e.target.value })} placeholder="e.g. 12" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Parent Phone</label>
              <input className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400" value={form.parent_phone || ""} onChange={(e) => setForm({ ...form, parent_phone: e.target.value })} placeholder="03xx-xxxxxxx" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Monthly Fee (PKR)</label>
              <input type="number" className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400" value={form.monthly_fee} onChange={(e) => setForm({ ...form, monthly_fee: Number(e.target.value) })} />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Admission Date</label>
              <input type="date" className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400" value={form.admission_date || ""} onChange={(e) => setForm({ ...form, admission_date: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Academic Session</label>
            <select className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400" value={form.session} onChange={(e) => setForm({ ...form, session: e.target.value })}>
              {sessionOptions().map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50 transition-colors">Cancel</button>
          <button onClick={save} disabled={saving || !form.student_name.trim()} className="px-5 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-md shadow-indigo-600/20">
            {saving ? "Saving..." : "Add Student"}
          </button>
        </div>
      </div>
    </div>
  );
}
