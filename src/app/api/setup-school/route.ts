import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

function createClient(req: Request) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          const cookieHeader = req.headers.get("cookie") || "";
          return cookieHeader.split(";").filter(c => c.trim()).map(c => {
            const [name, ...rest] = c.trim().split("=");
            return { name, value: rest.join("=") };
          });
        },
        setAll() {},
      },
    }
  );
}

export async function POST(req: Request) {
  const supabase = createClient(req);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { schoolName } = await req.json();
  if (!schoolName?.trim()) {
    return NextResponse.json({ error: "School name required" }, { status: 400 });
  }

  const { data: school, error: schoolErr } = await supabase
    .from("schools")
    .insert({ name: schoolName.trim() })
    .select("id")
    .single();

  if (schoolErr || !school) {
    return NextResponse.json({ error: "Failed to create school" }, { status: 500 });
  }

  const { error: profileErr } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      school_id: school.id,
      email: user.email,
      name: user.user_metadata?.name || "",
      role: "admin",
    });

  if (profileErr) {
    await supabase.from("schools").delete().eq("id", school.id);
    return NextResponse.json({ error: "Failed to create profile" }, { status: 500 });
  }

  return NextResponse.json({ schoolId: school.id });
}

export async function GET(req: Request) {
  const supabase = createClient(req);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("school_id, schools(name, logo, theme_colors)")
    .eq("id", user.id)
    .single();

  return NextResponse.json({ profile });
}
