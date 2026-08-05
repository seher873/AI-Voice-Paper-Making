import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

function createClient(req: Request) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://jdotlluwlelsvtysvkho.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_AkNEquAHcpQjGLG2iMXDUw_hl2bphaW",
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

  const schoolId = crypto.randomUUID();

  const { error: schoolErr } = await supabase
    .from("schools")
    .insert({ id: schoolId, name: schoolName.trim() });

  if (schoolErr) {
    return NextResponse.json({ error: "Failed to create school" }, { status: 500 });
  }

  const { error: profileErr } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      school_id: schoolId,
      email: user.email,
      name: user.user_metadata?.name || "",
      role: "admin",
    });

  if (profileErr) {
    await supabase.from("schools").delete().eq("id", schoolId);
    return NextResponse.json({ error: "Failed to create profile" }, { status: 500 });
  }

  return NextResponse.json({ schoolId });
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
