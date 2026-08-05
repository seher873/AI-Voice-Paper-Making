import { getSupabase, getSchoolId } from "@/lib/supabase";
import type { ResultState } from "@/types/result";
import type { PaperState } from "@/types/paper";

interface SchoolStateRow {
  paper_state: PaperState | null;
  result_state: ResultState | null;
}

const LOCAL_PAPER_KEY = "paper-maker-state";
const LOCAL_RESULT_KEY = "paper-maker-results-state";

export async function loadSchoolState(): Promise<{ paper: PaperState | null; result: ResultState | null } | null> {
  try {
    const paperRaw = localStorage.getItem(LOCAL_PAPER_KEY);
    const resultRaw = localStorage.getItem(LOCAL_RESULT_KEY);
    return {
      paper: paperRaw ? (JSON.parse(paperRaw) as PaperState) : null,
      result: resultRaw ? (JSON.parse(resultRaw) as ResultState) : null,
    };
  } catch {
    return null;
  }
}

export async function saveSchoolState(paper: PaperState, result: ResultState): Promise<boolean> {
  try {
    localStorage.setItem(LOCAL_PAPER_KEY, JSON.stringify(paper));
    localStorage.setItem(LOCAL_RESULT_KEY, JSON.stringify(result));
  } catch {
    // ignore
  }
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
