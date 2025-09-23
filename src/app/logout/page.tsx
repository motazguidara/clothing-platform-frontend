"use client";

import { useEffect } from "react";
import { useAuth } from "@/auth/useAuth";

export default function LogoutPage() {
  const { logout } = useAuth();
  useEffect(() => { logout(); }, [logout]);
  return <div className="p-6" aria-live="polite">Signing out…</div>;
}


