"use client";

import { useState } from "react";
import { useResult } from "@/context/ResultContext";
import type { Subject } from "@/types/result";

export default function ManageSubjects() {
  const { state, dispatch } = useResult();
  const subjects = state.currentExam?.subjects || [];
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", code: "", totalMarks: 100, passingMarks: 33 });
  const [editing, setEditing] = useState<string | null>(null);

  const handleSave = () => {
    if (!form.name || !form.code || !state.currentExam) return;

    let updated: Subject[];
    if (editing) {
      updated = subjects.map((s) =>
        s.id === editing ? { ...s, ...form } : s
      );
    } else {
      updated = [...subjects, { ...form, id: crypto.randomUUID() }];
    }

    dispatch({ type: "SET_SUBJECTS", payload: updated });
    setForm({ name: "", code: "", totalMarks: 100, passingMarks: 33 });
    setEditing(null);
    setShowForm(false);
  };

  const handleEdit = (sub: Subject) => {
    setForm({ name: sub.name, code: sub.code, totalMarks: sub.totalMarks, passingMarks: sub.passingMarks });
    setEditing(sub.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    dispatch({ type: "SET_SUBJECTS", payload: subjects.filter((s) => s.id !== id) });
  };

  if (!state.currentExam) {
    return (
      <div className="text-center py-12 text-slate-400">
        <p className="font-medium">Create an exam first to manage subjects</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-800">Manage Subjects</h2>
        <button
          onClick={() => { setShowForm(true); setEditing(null); setForm({ name: "", code: "", totalMarks: 100, passingMarks: 33 }); }}
          className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 text-sm font-medium transition-all"
        >
          Add Subject
        </button>
      </div>

      {showForm && (
        <div className="mb-6 p-4 bg-indigo-50 rounded-xl border border-indigo-200 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Subject Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40" placeholder="e.g. English" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Subject Code</label>
              <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40" placeholder="e.g. ENG" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Total Marks</label>
              <input type="number" value={form.totalMarks} onChange={(e) => setForm({ ...form, totalMarks: Number(e.target.value) })} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Passing Marks</label>
              <input type="number" value={form.passingMarks} onChange={(e) => setForm({ ...form, passingMarks: Number(e.target.value) })} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-all">
              {editing ? "Update" : "Save"}
            </button>
            <button onClick={() => { setShowForm(false); setEditing(null); }} className="px-4 py-2 bg-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-300 transition-all">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {subjects.map((sub) => (
          <div key={sub.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200">
            <div>
              <p className="text-sm font-semibold text-slate-700">{sub.name} ({sub.code})</p>
              <p className="text-xs text-slate-400">Total: {sub.totalMarks} | Passing: {sub.passingMarks}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleEdit(sub)} className="px-3 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">Edit</button>
              <button onClick={() => handleDelete(sub.id)} className="px-3 py-1 text-xs font-medium text-red-500 hover:bg-red-50 rounded-lg transition-all">Delete</button>
            </div>
          </div>
        ))}
        {subjects.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-8">No subjects added yet</p>
        )}
      </div>
    </div>
  );
}
