"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { toast } from "sonner";
import { PasswordField } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const redirectTo = sp.get("next") ?? sp.get("redirectTo") ?? "/";
  const auth = useAuth();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (auth.isAuthenticated) {
      router.replace(redirectTo);
    } else {
      setIsLoading(false);
    }
    emailRef.current?.focus();
  }, [auth.isAuthenticated, router, redirectTo]);

  if (isLoading || auth.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Please enter your email and password.");
      emailRef.current?.focus();
      return;
    }

    try {
      setIsLoggingIn(true);
      await auth.loginAsync({ email, password });
      toast.success("Successfully logged in!");
      router.replace(redirectTo);
    } catch (err: unknown) {
      console.error("Login error:", err);
      let errorMessage = "Failed to log in. Please check your credentials and try again.";
      if (typeof err === "object" && err !== null) {
        const responseDetail = (err as { response?: { data?: { detail?: unknown } } }).response?.data?.detail;
        if (typeof responseDetail === "string") {
          errorMessage = responseDetail;
        } else if ("message" in err && typeof (err as { message?: unknown }).message === "string") {
          errorMessage = (err as { message: string }).message;
        }
      }
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoggingIn(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white/90 p-8 shadow-lg backdrop-blur">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Welcome back</h1>
          <p className="mt-2 text-sm text-slate-600">Sign in to continue shopping and tracking orders.</p>
        </div>

        <form onSubmit={onSubmit} className="mt-8 space-y-5" noValidate>
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-900" htmlFor="email">Email</label>
            <input
              id="email"
              ref={emailRef}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-400"
              aria-invalid={!!error}
            />
          </div>
          <div>
            <PasswordField
              id="password"
              name="password"
              label="Password"
              value={password}
              onChange={setPassword}
              required
              showRules={false}
            />
          </div>
          {error && <p className="text-sm text-red-600" role="alert" aria-live="assertive">{error}</p>}
          <button
            type="submit"
            disabled={isLoggingIn || auth.isLoading}
            className="w-full inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 disabled:opacity-50"
          >
            {isLoggingIn ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="mt-4 flex items-center justify-between text-sm text-slate-700">
          <Link className="underline underline-offset-4" href="/forgot-password">Forgot password?</Link>
          <Link
            className="underline underline-offset-4"
            href={`/register${redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ""}`}
          >
            Create account
          </Link>
        </div>
      </section>
    </div>
  );
}
