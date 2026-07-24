"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Suspense } from "react";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("Completing sign in...");

  useEffect(() => {
    const code = searchParams.get("code");
    const type = searchParams.get("type");

    if (!code) {
      router.replace("/login?error=no_code");
      return;
    }

    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (error) {
        console.error("Auth callback error:", error);
        router.replace("/login?error=auth");
      } else if (type === "recovery") {
        router.replace("/auth/update-password");
      } else {
        router.replace("/");
      }
    });
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50/50">
      <div className="flex items-center gap-3 text-slate-500">
        <svg className="w-6 h-6 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" strokeWidth={3} className="opacity-25" />
          <path d="M4 12a8 8 0 018-8" strokeWidth={3} className="opacity-75" />
        </svg>
        <span className="font-medium">{status}</span>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-slate-500 font-medium">Loading...</span>
      </div>
    }>
      <CallbackHandler />
    </Suspense>
  );
}
