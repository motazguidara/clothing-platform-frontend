"use client";

import React from "react";
import { toast } from "sonner";
import { clientConfig } from "@/lib/client-env";

export default function ForgotPasswordPage() {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter your name.");
      return;
    }
    if (!email.trim()) {
      toast.error("Please enter your account email.");
      return;
    }
    setIsSubmitting(true);
    try {
      const apiBase = clientConfig.apiUrl.replace(/\/$/, "");
      const res = await fetch(`${apiBase}/accounts/contact/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          subject: "Temporary password request",
          message:
            notes.trim().length > 0
              ? notes.trim()
              : "I would like a temporary password to access my account.",
          reason: "forgot_password",
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const detail = typeof data?.detail === "string" ? data.detail : "Unable to send request. Please try again.";
        throw new Error(detail);
      }
      toast.success("Request sent. Our team will email you a temporary password.");
      setName("");
      setEmail("");
      setNotes("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to send request";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <section className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white/90 p-8 shadow-lg backdrop-blur">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Forgot password?</h1>
          <p className="text-sm text-slate-600">
            Send a request to our team and we will generate a temporary password for your account.
          </p>
        </div>

        <form onSubmit={onSubmit} className="mt-8 space-y-5" noValidate>
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-900" htmlFor="name">
              Full name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-400"
              placeholder="Your name"
              autoComplete="name"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-900" htmlFor="email">
              Account email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-400"
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-900" htmlFor="notes">
              Additional details (optional)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-400"
              placeholder="Add any info that might help the admin verify your account."
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 disabled:opacity-50"
          >
            {isSubmitting ? "Sending..." : "Send request"}
          </button>
        </form>

        <p className="mt-4 text-xs text-slate-500">
          We will review your request and respond with a temporary password via email.
        </p>
      </section>
    </main>
  );
}
