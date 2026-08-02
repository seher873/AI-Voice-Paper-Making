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

export async function GET(req: Request) {
  const supabase = createClient(req);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data, error } = await supabase.rpc("get_admin_school_stats");

  if (error) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  return NextResponse.json({ schools: data });
}
