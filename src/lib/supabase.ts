import { createClient } from "@supabase/supabase-js";

let browserClient: ReturnType<typeof createClient> | null = null;

export function getSupabase() {
  if (typeof window === "undefined") {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  if (!browserClient) {
    browserClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return browserClient;
}

export async function getSchoolId(): Promise<string | null> {
  const client = getSupabase();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return null;
  const { data } = await client
    .from("profiles")
    .select("school_id")
    .eq("id", user.id)
    .single();
  return data?.school_id ?? null;
}
