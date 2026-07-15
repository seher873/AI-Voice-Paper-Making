import { supabase } from "@/lib/supabase";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { schoolName } = await req.json();
  if (!schoolName?.trim()) {
    return NextResponse.json({ error: "School name required" }, { status: 400 });
  }

  // Create school
  const { data: school, error: schoolErr } = await supabase
    .from("schools")
    .insert({ name: schoolName.trim() })
    .select("id")
    .single();

  if (schoolErr || !school) {
    return NextResponse.json({ error: "Failed to create school" }, { status: 500 });
  }

  // Create profile
  const { error: profileErr } = await supabase
    .from("profiles")
    .insert({
      id: session.user.id || session.user.email,
      school_id: school.id,
      email: session.user.email,
      name: session.user.name,
      role: "admin",
    });

  if (profileErr) {
    // Rollback school
    await supabase.from("schools").delete().eq("id", school.id);
    return NextResponse.json({ error: "Failed to create profile" }, { status: 500 });
  }

  return NextResponse.json({ schoolId: school.id });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("school_id, schools(name, logo, theme_colors)")
    .eq("id", session.user.id || session.user.email)
    .single();

  return NextResponse.json({ profile });
}
