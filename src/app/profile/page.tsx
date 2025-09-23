"use client";

import React from "react";
import { useProfile } from "@/hooks/useAuth";
import api from "@/lib/api";

export default function ProfilePage() {
  const { data, isLoading, refetch } = useProfile();
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (data) {
      setFirstName(data.first_name ?? "");
      setLastName(data.last_name ?? "");
    }
  }, [data]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await api.put("/auth/me/", {
        first_name: firstName || null,
        last_name: lastName || null,
      });
      await refetch();
      setMessage("Saved");
    } catch (err: any) {
      setMessage(err?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight uppercase">Profile</h1>
      <p className="text-muted mt-2">Edit your profile details.</p>

      {isLoading ? (
        <div className="mt-8">Loading…</div>
      ) : (
        <form onSubmit={onSave} className="mt-8 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-semibold">First name</span>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="border rounded-md px-3 py-2"
                placeholder="First name"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-semibold">Last name</span>
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="border rounded-md px-3 py-2"
                placeholder="Last name"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center rounded-md bg-black text-white px-6 py-3 text-sm font-semibold hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          {message && <div className="text-sm text-muted">{message}</div>}
        </form>
      )}
    </section>
  );
}



