"use client";

import React from "react";
import Link from "next/link";

const FAQ_ENTRIES = [
  {
    question: "Where is my order?",
    answer:
      "You can track every shipment from the Orders page inside your account. We send live status emails the moment your parcel ships or encounters a delay.",
  },
  {
    question: "How do I start a return?",
    answer:
      "Initiate a return from the Orders page within 30 days. We will generate a prepaid label and keep you posted while your refund is processed.",
  },
  {
    question: "Can I change or cancel an order?",
    answer:
      "We move quickly—reach out within one hour of ordering and we will do our best. After that window we cannot guarantee changes.",
  },
];

export default function SupportPage() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-16">
      <div className="mb-10 space-y-2 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">Support</p>
        <h1 className="text-4xl font-semibold tracking-tight">Here to help, 7 days a week</h1>
        <p className="text-base text-gray-500">
          Reach us through chat, email, or phone. We respond within one business day.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
          <h2 className="text-xl font-semibold">Contact us</h2>
          <p className="mt-2 text-sm text-gray-500">Pick the channel that works best for you.</p>

          <div className="mt-6 space-y-6 text-sm">
            <div>
              <h3 className="text-gray-900 font-medium">Live chat</h3>
              <p className="text-gray-500">Daily, 8:00–22:00 GMT.</p>
              <Link
                href="/support/chat"
                className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-black underline-offset-4 hover:underline"
              >
                Start chat →
              </Link>
            </div>
            <div>
              <h3 className="text-gray-900 font-medium">Email</h3>
              <p className="text-gray-500">We reply in less than 24 hours.</p>
              <a
                href="mailto:support@clothing-platform.com"
                className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-black underline-offset-4 hover:underline"
              >
                support@clothing-platform.com
              </a>
            </div>
            <div>
              <h3 className="text-gray-900 font-medium">Phone</h3>
              <p className="text-gray-500">Monday–Friday, 9:00–18:00 GMT.</p>
              <a
                href="tel:+18005551234"
                className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-black underline-offset-4 hover:underline"
              >
                +1 (800) 555-1234
              </a>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
          <h2 className="text-xl font-semibold">Quick answers</h2>
          <p className="mt-2 text-sm text-gray-500">Most questions are solved in a few clicks.</p>

          <div className="mt-6 space-y-5 text-sm">
            {FAQ_ENTRIES.map((faq) => (
              <details key={faq.question} className="group rounded-2xl border border-gray-100 p-4">
                <summary className="flex cursor-pointer items-center justify-between gap-4 font-medium text-gray-900">
                  {faq.question}
                  <span className="text-xs text-gray-500 group-open:hidden">+</span>
                  <span className="text-xs text-gray-500 hidden group-open:block">−</span>
                </summary>
                <p className="mt-3 text-gray-600">{faq.answer}</p>
              </details>
            ))}
          </div>

          <div className="mt-6 rounded-2xl bg-gray-50 p-4 text-sm text-gray-600">
            Need something specific?{" "}
            <Link href="/faq" className="font-medium text-black underline-offset-4 hover:underline">
              Browse the full FAQ
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
