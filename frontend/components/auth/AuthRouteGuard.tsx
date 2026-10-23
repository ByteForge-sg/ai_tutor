"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { fetchCurrentUser } from "@/lib/api";
import { getAuthToken } from "@/lib/auth";

function ProtectedRoute({ pathname, children }: { pathname: string; children: React.ReactNode }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    let active = true;

    const validateSession = async () => {
      if (!getAuthToken()) {
        router.replace("/login");
        return;
      }

      try {
        await fetchCurrentUser();
        if (active) setAuthorized(true);
      } catch {
        if (active) router.replace("/login");
      }
    };

    const handlePageShow = () => {
      setAuthorized(false);
      void validateSession();
    };

    void validateSession();
    window.addEventListener("pageshow", handlePageShow);
    return () => {
      active = false;
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [pathname, router]);

  if (!authorized) {
    return (
      <main className="min-h-screen bg-[#07050E] text-white flex items-center justify-center" aria-busy="true">
        <p role="status" className="text-sm text-slate-400">Checking your session…</p>
      </main>
    );
  }

  return children;
}

export default function AuthRouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/" || pathname === "/login") return children;

  return <ProtectedRoute key={pathname} pathname={pathname}>{children}</ProtectedRoute>;
}
