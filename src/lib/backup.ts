import { getSupabase } from "./supabase";

export interface SchoolBackup {
  version: 1;
  exportedAt: string;
  schoolName: string;
  exams: Record<string, unknown>[];
  students: Record<string, unknown>[];
  results: Record<string, unknown>[];
  gradeScales: Record<string, unknown>[];
  papers: Record<string, unknown>[];
}

export async function exportSchoolData(): Promise<SchoolBackup> {
  const sb = getSupabase();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await sb
    .from("profiles")
    .select("school_id, schools!inner(name)")
    .eq("id", user.id)
    .single();

  if (!profile) throw new Error("No school found");
  const schoolId = profile.school_id;
  const schoolData = profile.schools as unknown as { name: string };

  const [exams, students, results, gradeScales, papers] = await Promise.all([
    sb.from("exams").select("*").eq("school_id", schoolId),
    sb.from("students").select("*").eq("school_id", schoolId),
    sb.from("results").select("*").eq("school_id", schoolId),
    sb.from("grade_scales").select("*").eq("school_id", schoolId),
    sb.from("papers").select("*").eq("school_id", schoolId),
  ]);

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    schoolName: schoolData?.name || "Unknown",
    exams: exams.data || [],
    students: students.data || [],
    results: results.data || [],
    gradeScales: gradeScales.data || [],
    papers: papers.data || [],
  };
}

export async function importSchoolData(backup: SchoolBackup): Promise<{ success: boolean; message: string }> {
  const sb = getSupabase();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await sb
    .from("profiles")
    .select("school_id")
    .eq("id", user.id)
    .single();

  if (!profile) throw new Error("No school found");
  const schoolId = profile.school_id;

  const { error: delExams } = await sb.from("exams").delete().eq("school_id", schoolId);
  if (delExams) throw new Error("Failed to clear existing exams");

  const { error: delStudents } = await sb.from("students").delete().eq("school_id", schoolId);
  if (delStudents) throw new Error("Failed to clear existing students");

  const { error: delResults } = await sb.from("results").delete().eq("school_id", schoolId);
  if (delResults) throw new Error("Failed to clear existing results");

  const { error: delScales } = await sb.from("grade_scales").delete().eq("school_id", schoolId);
  if (delScales) throw new Error("Failed to clear existing grade scales");

  const { error: delPapers } = await sb.from("papers").delete().eq("school_id", schoolId);
  if (delPapers) throw new Error("Failed to clear existing papers");

  const now = new Date().toISOString();
  let imported = 0;

  if (backup.exams.length > 0) {
    const records = backup.exams.map((e: Record<string, unknown>) => ({ ...e, school_id: schoolId, created_at: e.created_at || now }));
    const { error } = await sb.from("exams").upsert(records, { onConflict: "id" });
    if (error) throw new Error(`Failed to import exams: ${error.message}`);
    imported += records.length;
  }

  if (backup.students.length > 0) {
    const records = backup.students.map((s: Record<string, unknown>) => ({ ...s, school_id: schoolId, created_at: s.created_at || now }));
    const { error } = await sb.from("students").upsert(records, { onConflict: "id" });
    if (error) throw new Error(`Failed to import students: ${error.message}`);
    imported += records.length;
  }

  if (backup.results.length > 0) {
    const records = backup.results.map((r: Record<string, unknown>) => ({ ...r, school_id: schoolId, created_at: r.created_at || now }));
    const { error } = await sb.from("results").upsert(records, { onConflict: "id" });
    if (error) throw new Error(`Failed to import results: ${error.message}`);
    imported += records.length;
  }

  if (backup.gradeScales.length > 0) {
    const records = backup.gradeScales.map((g: Record<string, unknown>) => ({ ...g, school_id: schoolId }));
    const { error } = await sb.from("grade_scales").upsert(records, { onConflict: "id" });
    if (error) throw new Error(`Failed to import grade scales: ${error.message}`);
    imported += records.length;
  }

  if (backup.papers.length > 0) {
    const records = backup.papers.map((p: Record<string, unknown>) => ({ ...p, school_id: schoolId, created_at: p.created_at || now, updated_at: now }));
    const { error } = await sb.from("papers").upsert(records, { onConflict: "id" });
    if (error) throw new Error(`Failed to import papers: ${error.message}`);
    imported += records.length;
  }

  return { success: true, message: `${imported} records restored successfully!` };
}
