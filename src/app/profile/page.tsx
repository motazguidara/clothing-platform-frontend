"use client";

import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { authService } from "@/lib/api/services/auth";
import type { UserProfile } from "@/lib/api/schemas";
import { useProtectedRoute } from "@/hooks/useAuth";

const LANGUAGE_OPTIONS = [
  { value: "en-US", label: "English (United States)" },
  { value: "en-GB", label: "English (United Kingdom)" },
  { value: "fr-FR", label: "Français (France)" },
  { value: "de-DE", label: "Deutsch (Deutschland)" },
  { value: "es-ES", label: "Español (España)" },
  { value: "it-IT", label: "Italiano (Italia)" },
  { value: "ja-JP", label: "??? (??)" },
];

const COUNTRY_OPTIONS = [
  { value: "US", label: "United States" },
  { value: "GB", label: "United Kingdom" },
  { value: "CA", label: "Canada" },
  { value: "FR", label: "France" },
  { value: "DE", label: "Germany" },
  { value: "ES", label: "Spain" },
  { value: "IT", label: "Italy" },
  { value: "JP", label: "Japan" },
  { value: "AU", label: "Australia" },
];

export default function ProfilePage() {
  useProtectedRoute("/login?next=/profile");

  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: async (): Promise<UserProfile> => authService.getUserProfile(),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const updateMutation = useMutation({
    mutationFn: async (
      payload: Partial<{
        first_name: string;
        last_name: string;
        phone: string | null;
        preferred_language: string;
        preferred_country: string | null;
        marketing_consent: boolean;
      }>
    ) => authService.updateProfile(payload)
    ,
    onSuccess: async (updated) => {
      qc.setQueryData(["profile"], updated);
      await qc.invalidateQueries({ queryKey: ["auth"] });
      await qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profile updated");
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.detail || err?.message || "Failed to update profile";
      toast.error(msg);
    },
  });

  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [preferredLanguage, setPreferredLanguage] = React.useState("en-US");
  const [preferredCountry, setPreferredCountry] = React.useState("US");
  const [marketingConsent, setMarketingConsent] = React.useState(false);

  const languageOptions = React.useMemo(() => {
    if (!preferredLanguage) return LANGUAGE_OPTIONS;
    return LANGUAGE_OPTIONS.some((option) => option.value === preferredLanguage)
      ? LANGUAGE_OPTIONS
      : [{ value: preferredLanguage, label: preferredLanguage }, ...LANGUAGE_OPTIONS];
  }, [preferredLanguage]);

  const countryOptions = React.useMemo(() => {
    if (!preferredCountry) return COUNTRY_OPTIONS;
    return COUNTRY_OPTIONS.some((option) => option.value === preferredCountry)
      ? COUNTRY_OPTIONS
      : [{ value: preferredCountry, label: preferredCountry }, ...COUNTRY_OPTIONS];
  }, [preferredCountry]);

  const [newEmail, setNewEmail] = React.useState("");
  const [emailPassword, setEmailPassword] = React.useState("");
  const [oldPassword, setOldPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");

  React.useEffect(() => {
    if (!data) return;

    const deriveNameParts = () => {
      const seed = ((data as any)?.username ?? data.email ?? "").trim();
      if (!seed) return { first: "", last: "" };
      const base = seed.includes("@") ? seed.split("@")[0] : seed;
      const parts = base.split(/[\s._-]+/).filter(Boolean);
      if (parts.length === 0) return { first: "", last: "" };
      if (parts.length === 1) return { first: parts[0], last: "" };
      return { first: parts[0], last: parts.slice(1).join(" ") };
    };

    const { first, last } = deriveNameParts();

    setFirstName((data.first_name?.trim() || first));
    setLastName((data.last_name?.trim() || last));
    setPhone((data.phone as string | null) ?? "");
    setPreferredLanguage(data.preferred_language ?? data.locale ?? "en-US");
    setPreferredCountry((data.preferred_country ?? "US").toUpperCase());
    setMarketingConsent(Boolean((data as any).marketing_consent));
    setNewEmail(data.email ?? "");
  }, [data]);

  const emailVerified = Boolean(data?.is_email_confirmed);
  const isSaving = updateMutation.isPending;

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    await updateMutation.mutateAsync({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      phone: phone.trim() ? phone.trim() : null,
      preferred_language: preferredLanguage,
      preferred_country: preferredCountry ? preferredCountry.toUpperCase() : null,
      marketing_consent: marketingConsent,
    });
  }

  async function onChangeEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!newEmail || !emailPassword) {
      toast.error("Email and current password are required");
      return;
    }
    try {
      const updated = await authService.updateProfile({ email: newEmail, password: emailPassword } as any);
      qc.setQueryData(["profile"], updated as any);
      await qc.invalidateQueries({ queryKey: ["auth"] });
      await qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Email updated. Please verify your new email.");
      setEmailPassword("");
    } catch (err: any) {
      const msg = err?.response?.data?.detail || "Failed to update email";
      toast.error(msg);
    }
  }

  async function onChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error("All password fields are required");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    try {
      await authService.updateProfile({ old_password: oldPassword, new_password: newPassword } as any);
      await authService.logout();
      toast.success("Password updated — please log in again.");
      window.location.href = "/login";
    } catch (err: any) {
      const msg = err?.response?.data?.detail || "Failed to update password";
      toast.error(msg);
    }
  }

  return (
    <section className="mx-auto max-w-4xl px-6 py-16">
      <div className="mb-10 space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Account Settings</h1>
        <p className="text-sm text-gray-500">
          Manage your personal details, security preferences, and account access in one place.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          {[...Array(2)].map((_, idx) => (
            <div key={idx} className="h-64 rounded-2xl border border-gray-200 bg-white shadow-sm animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-10">
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-6 py-5">
              <h2 className="text-xl font-semibold">Identity &amp; Contact</h2>
              <p className="text-sm text-gray-500">Update how we reach you and how your name appears on orders.</p>
            </div>
            <form onSubmit={onSave} className="px-6 py-6 space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium text-gray-700">First name</span>
                  <input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="rounded-lg border border-gray-200 px-3 py-2 focus:border-black focus:outline-none"
                    placeholder="First name"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium text-gray-700">Last name</span>
                  <input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="rounded-lg border border-gray-200 px-3 py-2 focus:border-black focus:outline-none"
                    placeholder="Last name"
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-[2fr,1fr]">
                <div className="flex flex-col gap-1 text-sm">
                  <span className="font-medium text-gray-700 flex items-center gap-2">
                    Email
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${emailVerified ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}
                    >
                      {emailVerified ? "Verified" : "Unverified"}
                    </span>
                  </span>
                  <input
                    value={data?.email ?? ""}
                    disabled
                    className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-500"
                  />
                </div>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium text-gray-700">Phone</span>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="rounded-lg border border-gray-200 px-3 py-2 focus:border-black focus:outline-none"
                    placeholder="e.g., +15551234567"
                    type="tel"
                    pattern="^\+[1-9]\d{7,14}$"
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium text-gray-700">Preferred language</span>
                  <select
                    value={preferredLanguage}
                    onChange={(e) => setPreferredLanguage(e.target.value)}
                    className="rounded-lg border border-gray-200 px-3 py-2 focus:border-black focus:outline-none"
                  >
                    {languageOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium text-gray-700">Preferred country</span>
                  <select
                    value={preferredCountry}
                    onChange={(e) => setPreferredCountry(e.target.value)}
                    className="rounded-lg border border-gray-200 px-3 py-2 focus:border-black focus:outline-none"
                  >
                    {countryOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="flex items-center gap-2 rounded-lg bg-gray-50 px-4 py-3 text-sm">
                <input
                  type="checkbox"
                  checked={marketingConsent}
                  onChange={(e) => setMarketingConsent(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
                />
                <div>
                  <span className="font-medium text-gray-700">Receive tailored updates</span>
                  <p className="text-xs text-gray-500">Stay informed about new drops, offers, and recommendations.</p>
                </div>
              </label>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center justify-center rounded-full bg-black px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-black/85 disabled:opacity-60"
                >
                  {isSaving ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-6 py-5">
              <h2 className="text-xl font-semibold">Security</h2>
              <p className="text-sm text-gray-500">Keep your account protected with up-to-date credentials.</p>
            </div>
            <div className="space-y-8 px-6 py-6">
              <form onSubmit={onChangeEmail} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800">Change email</h3>
                    <p className="text-xs text-gray-500">You will receive a verification link after updating.</p>
                  </div>
                  <button
                    type="submit"
                    className="rounded-full border border-gray-300 px-4 py-1 text-xs font-semibold text-gray-700 transition hover:border-gray-900 hover:text-gray-900"
                  >
                    Save email
                  </button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="font-medium text-gray-700">New email</span>
                    <input
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="rounded-lg border border-gray-200 px-3 py-2 focus:border-black focus:outline-none"
                      placeholder="you@domain.com"
                      type="email"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="font-medium text-gray-700">Current password</span>
                    <input
                      value={emailPassword}
                      onChange={(e) => setEmailPassword(e.target.value)}
                      className="rounded-lg border border-gray-200 px-3 py-2 focus:border-black focus:outline-none"
                      placeholder="********"
                      type="password"
                    />
                  </label>
                </div>
              </form>

              <div className="border-t border-gray-200" />

              <form onSubmit={onChangePassword} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800">Change password</h3>
                    <p className="text-xs text-gray-500">Use a strong password you don’t reuse elsewhere.</p>
                  </div>
                  <button
                    type="submit"
                    className="rounded-full border border-gray-300 px-4 py-1 text-xs font-semibold text-gray-700 transition hover:border-gray-900 hover:text-gray-900"
                  >
                    Save password
                  </button>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="font-medium text-gray-700">Current password</span>
                    <input
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      className="rounded-lg border border-gray-200 px-3 py-2 focus:border-black focus:outline-none"
                      placeholder="********"
                      type="password"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="font-medium text-gray-700">New password</span>
                    <input
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="rounded-lg border border-gray-200 px-3 py-2 focus:border-black focus:outline-none"
                      placeholder="********"
                      type="password"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="font-medium text-gray-700">Confirm new password</span>
                    <input
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="rounded-lg border border-gray-200 px-3 py-2 focus:border-black focus:outline-none"
                      placeholder="********"
                      type="password"
                    />
                  </label>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
