"use client";

import { useState, useEffect, useCallback } from "react";
import { getSupabase, getSchoolId } from "@/lib/supabase";
import type { StudentFee, FeeStructure } from "@/types/fee";
import { formatPKR } from "@/types/fee";

interface Props {
  onStudentSelect?: (student: StudentFee) => void;
}

const EMPTY_FORM: Omit<StudentFee, "id" | "school_id" | "created_at"> = {
  student_name: "",
  father_name: "",
  class_name: "",
  section: "",
  roll_no: "",
  parent_phone: "",
  fee_structure_id: null,
  monthly_fee: 0,
  session: "",
  is_active: true,
};

export default function FeeStudentList({ onStudentSelect }: Props) {
  const [students, setStudents] = useState<StudentFee[]>([]);
  const [structures, setStructures] = useState<FeeStructure[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [showStructureForm, setShowStructureForm] = useState(false);
  const [structureForm, setStructureForm] = useState<Partial<FeeStructure>>({
    class_name: "", fee_type: "monthly", amount: 0, description: ""
  });
  const [savingStructure, setSavingStructure] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const sb = getSupabase();
      const schoolId = await getSchoolId();
      if (!schoolId) return;
      const [studRes, strRes] = await Promise.all([
        sb.from("student_fees").select("*").eq("school_id", schoolId).order("class_name").order("student_name"),
        sb.from("fee_structures").select("*").eq("school_id", schoolId).order("class_name"),
      ]);
      if (studRes.data) setStudents(studRes.data as StudentFee[]);
      if (strRes.data) setStructures(strRes.data as FeeStructure[]);
    } catch (e) {
      setError("Load karne mein masla hua");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const uniqueClasses = [...new Set(students.map((s) => s.class_name))].sort();

  const filtered = students.filter((s) => {
    const q = search.toLowerCase();
    const matchSearch = !q || s.student_name.toLowerCase().includes(q) || s.roll_no.toLowerCase().includes(q) || s.father_name.toLowerCase().includes(q);
    const matchClass = !filterClass || s.class_name === filterClass;
    return matchSearch && matchClass;
  });

  async function saveStudent() {
    if (!form.student_name.trim() || !form.class_name.trim()) {
      setError("Student name aur class zaroor bharen");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const sb = getSupabase();
      const schoolId = await getSchoolId();
      if (!schoolId) return;

      // Auto fee from structure
      let monthlyFee = form.monthly_fee;
      if (form.fee_structure_id) {
        const str = structures.find((s) => s.id === form.fee_structure_id);
        if (str && monthlyFee === 0) monthlyFee = str.amount;
      }
      const payload = { ...form, monthly_fee: monthlyFee, school_id: schoolId };

      if (editId) {
        const { error } = await sb.from("student_fees").update(payload).eq("id", editId);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await sb.from("student_fees").insert(payload);
        if (error) throw new Error(error.message);
      }
      setShowForm(false);
      setEditId(null);
      setForm(EMPTY_FORM);
      await load();
    } catch (e) {
      setError(`Save error: ${e instanceof Error ? e.message : "Unknown"}`);
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  async function deleteStudent(id: string) {
    if (!confirm("Kya aap is student ko delete karna chahte hain?")) return;
    try {
      const sb = getSupabase();
      const { error } = await sb.from("student_fees").delete().eq("id", id);
      if (error) throw new Error(error.message);
      await load();
    } catch (e) {
      console.error(e);
      setError(`Delete error: ${e instanceof Error ? e.message : "Unknown"}`);
    }
  }

  async function saveStructure() {
    if (!structureForm.class_name?.trim() || !structureForm.amount) {
      setError("Class aur amount zaroor bharen");
      return;
    }
    setSavingStructure(true);
    try {
      const sb = getSupabase();
      const schoolId = await getSchoolId();
      if (!schoolId) return;
      await sb.from("fee_structures").insert({ ...structureForm, school_id: schoolId });
      setShowStructureForm(false);
      setStructureForm({ class_name: "", fee_type: "monthly", amount: 0, description: "" });
      await load();
    } catch (e) {
      setError("Structure save karne mein masla");
      console.error(e);
    } finally {
      setSavingStructure(false);
    }
  }

  function startEdit(s: StudentFee) {
    setForm({
      student_name: s.student_name,
      father_name: s.father_name,
      class_name: s.class_name,
      section: s.section,
      roll_no: s.roll_no,
      parent_phone: s.parent_phone,
      fee_structure_id: s.fee_structure_id,
      monthly_fee: s.monthly_fee,
      session: s.session,
      is_active: s.is_active,
    });
    setEditId(s.id);
    setShowForm(true);
  }

  if (loading) return (
    <div className="flex items-center justify-center py-12 text-slate-400">
      <svg className="w-5 h-5 animate-spin mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" strokeWidth={3} className="opacity-25" />
        <path d="M4 12a8 8 0 018-8" strokeWidth={3} className="opacity-75" />
      </svg>
      Loading...
    </div>
  );

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-center gap-2">
          <span>⚠️</span> {error}
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

      {/* Fee Structures Summary */}
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
            <span>📋</span> Fee Structures (Class-wise)
          </h3>
          <button
            onClick={() => setShowStructureForm(!showStructureForm)}
            className="px-2.5 py-1 text-[10px] font-bold bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-all"
          >
            + Add Structure
          </button>
        </div>
        {showStructureForm && (
          <div className="bg-white border border-indigo-200 rounded-xl p-3 mb-2 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Class *</label>
                <input type="text" value={structureForm.class_name || ""} onChange={(e) => setStructureForm({ ...structureForm, class_name: e.target.value })}
                  className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400" placeholder="e.g. Class 5" />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Amount (PKR) *</label>
                <input type="number" value={structureForm.amount || ""} onChange={(e) => setStructureForm({ ...structureForm, amount: Number(e.target.value) })}
                  className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400" placeholder="2500" />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Type</label>
                <select value={structureForm.fee_type || "monthly"} onChange={(e) => setStructureForm({ ...structureForm, fee_type: e.target.value as FeeStructure["fee_type"] })}
                  className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400">
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="annual">Annual</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Description</label>
                <input type="text" value={structureForm.description || ""} onChange={(e) => setStructureForm({ ...structureForm, description: e.target.value })}
                  className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400" placeholder="Optional" />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={saveStructure} disabled={savingStructure}
                className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-60 transition-all">
                {savingStructure ? "Saving..." : "Save Structure"}
              </button>
              <button onClick={() => setShowStructureForm(false)} className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-50">
                Cancel
              </button>
            </div>
          </div>
        )}
        {structures.length === 0 ? (
          <p className="text-[10px] text-slate-400 text-center py-2">Koi structure nahi — pehle class fee add karein</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {structures.map((s) => (
              <div key={s.id} className="flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[10px]">
                <span className="font-bold text-slate-700">{s.class_name}</span>
                <span className="text-slate-400">—</span>
                <span className="font-semibold text-green-600">{formatPKR(s.amount)}</span>
                <span className="text-slate-400 capitalize">/{s.fee_type}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-2">
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Student name, roll no search..."
          className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400">
          <option value="">All Classes</option>
          {uniqueClasses.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <button
          onClick={() => { setForm(EMPTY_FORM); setEditId(null); setShowForm(true); }}
          className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-all flex items-center gap-1.5 whitespace-nowrap"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Student
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white border-2 border-indigo-200 rounded-2xl p-4 shadow-sm">
          <h3 className="text-sm font-bold text-slate-700 mb-3">{editId ? "✏️ Student Edit" : "➕ Naya Student"}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Student Name *</label>
              <input type="text" value={form.student_name} onChange={(e) => setForm({ ...form, student_name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400" placeholder="Ahmad Ali" />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Father Name</label>
              <input type="text" value={form.father_name} onChange={(e) => setForm({ ...form, father_name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400" placeholder="Iqbal Ali" />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Class *</label>
              <input type="text" value={form.class_name} onChange={(e) => setForm({ ...form, class_name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400" placeholder="Class 5" />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Section</label>
              <input type="text" value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400" placeholder="A" />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Roll No</label>
              <input type="text" value={form.roll_no} onChange={(e) => setForm({ ...form, roll_no: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400" placeholder="12" />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Parent Phone (WhatsApp) 📱</label>
              <input type="tel" value={form.parent_phone} onChange={(e) => setForm({ ...form, parent_phone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400" placeholder="923001234567" />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Fee Structure</label>
              <select value={form.fee_structure_id || ""} onChange={(e) => {
                const id = e.target.value || null;
                const str = structures.find((s) => s.id === id);
                setForm({ ...form, fee_structure_id: id, monthly_fee: str?.amount ?? form.monthly_fee });
              }}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400">
                <option value="">-- Select Structure --</option>
                {structures.map((s) => (
                  <option key={s.id} value={s.id}>{s.class_name} — {formatPKR(s.amount)}/{s.fee_type}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Monthly Fee (PKR) — Override</label>
              <input type="number" value={form.monthly_fee || ""} onChange={(e) => setForm({ ...form, monthly_fee: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400" placeholder="2500" />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Session</label>
              <input type="text" value={form.session} onChange={(e) => setForm({ ...form, session: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400" placeholder="2025-2026" />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={saveStudent} disabled={saving}
              className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-60 transition-all">
              {saving ? "Saving..." : editId ? "Update" : "Save Student"}
            </button>
            <button onClick={() => { setShowForm(false); setEditId(null); setForm(EMPTY_FORM); }}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Students Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-600">Students ({filtered.length})</span>
        </div>
        {filtered.length === 0 ? (
          <div className="py-10 text-center text-slate-400 text-xs">
            {students.length === 0 ? "Koi student nahi — \"Add Student\" se shuru karein" : "Koi result nahi mila"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] text-slate-400 uppercase">
                  <th className="text-left px-4 py-2 font-semibold">Student</th>
                  <th className="text-left px-4 py-2 font-semibold">Class</th>
                  <th className="text-left px-4 py-2 font-semibold">Roll</th>
                  <th className="text-left px-4 py-2 font-semibold">Monthly Fee</th>
                  <th className="text-left px-4 py-2 font-semibold">Phone</th>
                  <th className="text-right px-4 py-2 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-2.5">
                      <p className="font-semibold text-slate-700">{s.student_name}</p>
                      {s.father_name && <p className="text-[10px] text-slate-400">{s.father_name}</p>}
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">{s.class_name}{s.section ? `-${s.section}` : ""}</td>
                    <td className="px-4 py-2.5 text-slate-500">{s.roll_no || "—"}</td>
                    <td className="px-4 py-2.5 font-bold text-green-700">{formatPKR(s.monthly_fee)}</td>
                    <td className="px-4 py-2.5 text-slate-500">{s.parent_phone || "—"}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-end gap-1">
                        {onStudentSelect && (
                          <button onClick={() => onStudentSelect(s)}
                            className="px-2 py-1 text-[10px] font-bold bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-all">
                            Select
                          </button>
                        )}
                        <button onClick={() => startEdit(s)}
                          className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button onClick={() => deleteStudent(s.id)}
                          className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
