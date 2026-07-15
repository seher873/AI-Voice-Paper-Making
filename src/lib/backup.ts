import { supabase } from "./supabase";

export interface SchoolBackup {
  version: 1;
  exportedAt: string;
  schoolName: string;
  exams: any[];
  students: any[];
  results: any[];
  gradeScales: any[];
  papers: any[];
}

export async function exportSchoolData(): Promise<SchoolBackup> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("profiles")
    .select("school_id, schools!inner(name)")
    .eq("id", user.id)
    .single();

  if (!profile) throw new Error("No school found");
  const schoolId = profile.school_id;
  const schoolData = profile.schools as unknown as { name: string };

  const [exams, students, results, gradeScales, papers] = await Promise.all([
    supabase.from("exams").select("*").eq("school_id", schoolId),
    supabase.from("students").select("*").eq("school_id", schoolId),
    supabase.from("results").select("*").eq("school_id", schoolId),
    supabase.from("grade_scales").select("*").eq("school_id", schoolId),
    supabase.from("papers").select("*").eq("school_id", schoolId),
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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("profiles")
    .select("school_id")
    .eq("id", user.id)
    .single();

  if (!profile) throw new Error("No school found");
  const schoolId = profile.school_id;

  const { error: delExams } = await supabase.from("exams").delete().eq("school_id", schoolId);
  if (delExams) throw new Error("Failed to clear existing exams");

  const { error: delStudents } = await supabase.from("students").delete().eq("school_id", schoolId);
  if (delStudents) throw new Error("Failed to clear existing students");

  const { error: delResults } = await supabase.from("results").delete().eq("school_id", schoolId);
  if (delResults) throw new Error("Failed to clear existing results");

  const { error: delScales } = await supabase.from("grade_scales").delete().eq("school_id", schoolId);
  if (delScales) throw new Error("Failed to clear existing grade scales");

  const { error: delPapers } = await supabase.from("papers").delete().eq("school_id", schoolId);
  if (delPapers) throw new Error("Failed to clear existing papers");

  const now = new Date().toISOString();
  let imported = 0;

  if (backup.exams.length > 0) {
    const records = backup.exams.map((e: any) => ({ ...e, school_id: schoolId, created_at: e.created_at || now }));
    const { error } = await supabase.from("exams").upsert(records, { onConflict: "id" });
    if (error) throw new Error(`Failed to import exams: ${error.message}`);
    imported += records.length;
  }

  if (backup.students.length > 0) {
    const records = backup.students.map((s: any) => ({ ...s, school_id: schoolId, created_at: s.created_at || now }));
    const { error } = await supabase.from("students").upsert(records, { onConflict: "id" });
    if (error) throw new Error(`Failed to import students: ${error.message}`);
    imported += records.length;
  }

  if (backup.results.length > 0) {
    const records = backup.results.map((r: any) => ({ ...r, school_id: schoolId, created_at: r.created_at || now }));
    const { error } = await supabase.from("results").upsert(records, { onConflict: "id" });
    if (error) throw new Error(`Failed to import results: ${error.message}`);
    imported += records.length;
  }

  if (backup.gradeScales.length > 0) {
    const records = backup.gradeScales.map((g: any) => ({ ...g, school_id: schoolId }));
    const { error } = await supabase.from("grade_scales").upsert(records, { onConflict: "id" });
    if (error) throw new Error(`Failed to import grade scales: ${error.message}`);
    imported += records.length;
  }

  if (backup.papers.length > 0) {
    const records = backup.papers.map((p: any) => ({ ...p, school_id: schoolId, created_at: p.created_at || now, updated_at: now }));
    const { error } = await supabase.from("papers").upsert(records, { onConflict: "id" });
    if (error) throw new Error(`Failed to import papers: ${error.message}`);
    imported += records.length;
  }

  return { success: true, message: `${imported} records restored successfully!` };
}
