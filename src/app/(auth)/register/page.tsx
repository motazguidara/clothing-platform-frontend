"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/auth/useAuth";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const { register, loading, isAuthenticated } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => { emailRef.current?.focus(); }, []);
  useEffect(() => { if (isAuthenticated) router.replace("/"); }, [isAuthenticated, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email) { setError("Please enter a valid email."); emailRef.current?.focus(); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    try {
      await register({ email, password, first_name: firstName || undefined, last_name: lastName || undefined });
      router.replace("/");
    } catch (err: any) {
      setError("Registration failed. Check email or password strength.");
    }
  }

  return (
    <section className="max-w-md mx-auto px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight uppercase">Create account</h1>
      <p className="text-muted mt-2">Join us to shop faster and track orders.</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4" noValidate>
        <div>
          <label className="block text-sm font-medium" htmlFor="email">Email</label>
          <input id="email" ref={emailRef} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 block w-full border border-border rounded-md px-3 py-2" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium" htmlFor="firstName">First name</label>
            <input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="mt-1 block w-full border border-border rounded-md px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium" htmlFor="lastName">Last name</label>
            <input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} className="mt-1 block w-full border border-border rounded-md px-3 py-2" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium" htmlFor="password">Password</label>
          <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1 block w-full border border-border rounded-md px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium" htmlFor="confirm">Confirm password</label>
          <input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required className="mt-1 block w-full border border-border rounded-md px-3 py-2" />
        </div>
        {error && <p className="text-sm text-red-600" role="alert" aria-live="assertive">{error}</p>}
        <button type="submit" disabled={loading} className="w-full inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-6 py-3 text-sm font-semibold hover:opacity-90 transition disabled:opacity-50">
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-4 text-sm">
        Already have an account? <Link className="underline" href="/login">Sign in</Link>
      </p>
    </section>
  );
}



