"use client";

import { useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { useToast } from "@/context/ToastContext";

interface Props {
  onComplete: (schoolId: string) => void;
}

export default function SchoolSetup({ onComplete }: Props) {
  const [schoolName, setSchoolName] = useState("");
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolName.trim()) return;
    setLoading(true);
    try {
      const sb = getSupabase();
      const { data: { user } } = await sb.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: existing } = await sb
        .from("profiles")
        .select("school_id")
        .eq("id", user.id)
        .single();

      if (existing?.school_id) {
        onComplete(existing.school_id);
        return;
      }

      const plan = localStorage.getItem("subscription_plan") || "full";
      const schoolId = crypto.randomUUID();

      const { error: schoolErr } = await sb
        .from("schools")
        .insert({ id: schoolId, name: schoolName.trim(), plan });

      if (schoolErr) throw new Error("Failed to create school: " + schoolErr.message);

      const { error: profileErr } = await sb
        .from("profiles")
        .insert({
          id: user.id,
          school_id: schoolId,
          email: user.email,
          name: user.user_metadata?.name || "",
          role: "admin",
        });

      if (profileErr) {
        if (profileErr.code === "23505") {
          const { data: dup } = await sb
            .from("profiles")
            .select("school_id")
            .eq("id", user.id)
            .single();
          if (dup?.school_id) {
            addToast("School already set up", "success");
            onComplete(dup.school_id);
            return;
          }
        }
        await sb.from("schools").delete().eq("id", schoolId);
        throw new Error("Failed to create profile: " + profileErr.message);
      }

      onComplete(schoolId);
      addToast("School created successfully!", "success");
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Setup failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-slate-100 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-8 space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-800">Welcome to Paper Maker</h1>
          <p className="text-sm text-slate-500 mt-2">Setup your school to get started</p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-600 mb-1.5">
            School Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={schoolName}
            onChange={(e) => setSchoolName(e.target.value)}
            placeholder="e.g. Sunshine Public School"
            required
            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !schoolName.trim()}
          className="w-full min-h-[48px] px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-bold shadow-sm"
        >
          {loading ? "Creating..." : "Create School"}
        </button>
      </form>
    </div>
  );
}
