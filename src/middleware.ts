import { createClient } from "@/lib/supabaseServer";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/api/auth") || pathname.startsWith("/_next") || pathname === "/auth/callback") {
    return NextResponse.next();
  }

  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session && pathname !== "/login" && pathname !== "/no-access") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (session && pathname === "/login") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
