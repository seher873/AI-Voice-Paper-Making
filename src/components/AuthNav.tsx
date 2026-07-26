"use client";

import { getSupabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

export default function AuthNav() {
  const [user, setUser] = useState<{ email?: string } | null>(null);

  useEffect(() => {
    const sb = getSupabase();
    sb.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  if (!user) return null;

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-white border-b border-slate-200">
      <div className="flex-1" />
      <div className="flex items-center gap-3 text-sm">
        <span className="text-slate-600 font-medium">{user.email}</span>
        <button
          onClick={async () => { await getSupabase().auth.signOut({ scope: "global" }); window.location.href = "/login"; }}
          className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all text-xs font-medium"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
