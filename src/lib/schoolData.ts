import { getSupabase, getSchoolId } from "@/lib/supabase";
import type { ResultState } from "@/types/result";
import type { PaperState } from "@/types/paper";

interface SchoolStateRow {
  paper_state: PaperState | null;
  result_state: ResultState | null;
}

export async function loadSchoolState(): Promise<{ paper: PaperState | null; result: ResultState | null } | null> {
  try {
    const schoolId = await getSchoolId();
    if (!schoolId) return null;
    const { data, error } = await getSupabase()
      .from("school_state")
      .select("paper_state, result_state")
      .eq("school_id", schoolId)
      .maybeSingle();
    if (error || !data) return null;
    const row = data as SchoolStateRow;
    return {
      paper: row.paper_state || null,
      result: row.result_state || null,
    };
  } catch {
    return null;
  }
}

export async function saveSchoolState(paper: PaperState, result: ResultState): Promise<boolean> {
  try {
    const schoolId = await getSchoolId();
    if (!schoolId) return false;
    const { error } = await getSupabase()
      .from("school_state")
      .upsert(
        { school_id: schoolId, paper_state: paper, result_state: result, updated_at: new Date().toISOString() },
        { onConflict: "school_id" }
      );
    return !error;
  } catch {
    return false;
  }
}
