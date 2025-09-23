"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/auth/useAuth";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const redirectTo = sp.get("redirectTo") || "/";
  const { login, loading, isAuthenticated } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => { emailRef.current?.focus(); }, []);
  useEffect(() => { if (isAuthenticated) router.replace(redirectTo); }, [isAuthenticated, router, redirectTo]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError("Please enter your email and password.");
      emailRef.current?.focus();
      return;
    }
    try {
      await login({ email, password });
      router.replace(redirectTo);
    } catch (err: any) {
      setError("Invalid email or password.");
    }
  }

  return (
    <section className="max-w-md mx-auto px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight uppercase">Login</h1>
      <p className="text-muted mt-2">Welcome back.</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4" noValidate>
        <div>
          <label className="block text-sm font-medium" htmlFor="email">Email</label>
          <input
            id="email" ref={emailRef}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 block w-full border border-border rounded-md px-3 py-2"
            aria-invalid={!!error}
          />
        </div>
        <div>
          <label className="block text-sm font-medium" htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-1 block w-full border border-border rounded-md px-3 py-2"
          />
        </div>
        {error && <p className="text-sm text-red-600" role="alert" aria-live="assertive">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-6 py-3 text-sm font-semibold hover:opacity-90 transition disabled:opacity-50"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <div className="mt-3 text-sm">
        <a className="underline" href="/forgot-password">Forgot password?</a>
      </div>
      <p className="mt-2 text-sm">
        Don’t have an account? <Link className="underline" href="/register">Create one</Link>
      </p>
    </section>
  );
}



