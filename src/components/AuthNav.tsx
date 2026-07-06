"use client";

import { useSession, signOut } from "next-auth/react";

export default function AuthNav() {
  const { data: session } = useSession();

  if (!session) return null;

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-white border-b border-slate-200">
      <div className="flex-1" />
      <div className="flex items-center gap-3 text-sm">
        <span className="text-slate-600 font-medium">{session.user?.email}</span>
        <button
          onClick={() => signOut()}
          className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all text-xs font-medium"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
