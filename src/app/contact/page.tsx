"use client";

import Link from "next/link";
import { useState } from "react";

export default function ContactPage() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const rawBase = process.env.NEXT_PUBLIC_API_URL || "";
  const apiBase = rawBase.replace(/\/$/, "");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      name: String(formData.get("name") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      subject: String(formData.get("subject") || "").trim(),
      message: String(formData.get("message") || "").trim(),
    };
    if (!payload.name || !payload.email || !payload.message) {
      setError("Please fill in name, email, and message.");
      return;
    }
    setStatus("loading");
    setError(null);
    try {
      let target = "/api/accounts/contact/";
      if (apiBase) {
        // If NEXT_PUBLIC_API_URL already includes /api, avoid double-prefixing
        target = apiBase.endsWith("/api") ? `${apiBase}/accounts/contact/` : `${apiBase}/api/accounts/contact/`;
      }
      const res = await fetch(target, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.detail || "Unable to send message.");
      }
      setStatus("success");
      form.reset();
    } catch (e: any) {
      setStatus("error");
      setError(e?.message || "Unable to send message.");
    }
  }

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Support</p>
        <h1 className="text-3xl font-extrabold text-gray-900">Contact Us</h1>
        <p className="text-sm text-gray-600">
          We’re here to help with orders, sizing, returns, and general questions. Reach out and we’ll reply promptly.
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Send a message</h2>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  name="name"
                  placeholder="Your name"
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
                required
              />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Subject</label>
              <input
                type="text"
                name="subject"
                placeholder="How can we help?"
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Message</label>
              <textarea
                name="message"
                rows={5}
                placeholder="Tell us a bit more about what you need."
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
                required
              />
            </div>
            <button
              type="submit"
              disabled={status === "loading"}
              className="inline-flex items-center justify-center rounded-md bg-black px-5 py-2.5 text-sm font-semibold text-white hover:bg-black/85 transition disabled:opacity-50"
            >
              {status === "loading" ? "Sending..." : "Send message"}
            </button>
            {status === "success" && <p className="text-xs text-green-700">Message sent. We respond within one business day.</p>}
            {error && <p className="text-xs text-red-600">{error}</p>}
            {status === "idle" && <p className="text-xs text-gray-500">We respond within one business day.</p>}
          </form>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Contact details</h2>
          <div className="space-y-3 text-sm text-gray-700">
            <div>
              <div className="font-semibold text-gray-900">Email</div>
              <a href="mailto:support@clothing-platform.com" className="text-black hover:underline">
                support@clothing-platform.com
              </a>
            </div>
            <div>
              <div className="font-semibold text-gray-900">Phone</div>
              <a href="tel:+21620000000" className="text-black hover:underline">
                +216 20 000 000
              </a>
            </div>
            <div>
              <div className="font-semibold text-gray-900">Hours</div>
              <div>Mon–Fri: 9:00 – 18:00</div>
              <div>Sat: 10:00 – 14:00</div>
            </div>
            <div>
              <div className="font-semibold text-gray-900">Address</div>
              <div>123 Fashion Ave</div>
              <div>Tunis, Tunisia</div>
            </div>
          </div>
          <div className="pt-2">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Quick links</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li><Link href="/size-guide" className="hover:underline">Size Guide</Link></li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}
