"use client";

import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { authService } from "@/lib/api/services/auth";
import type { UserProfile } from "@/lib/api/schemas";
import { useProtectedRoute } from "@/hooks/useAuth";
import { PasswordField } from "@/components/ui";

const LANGUAGE_OPTIONS = [
  { value: "en-US", label: "English (United States)" },
  { value: "en-GB", label: "English (United Kingdom)" },
  { value: "fr-FR", label: "French (France)" },
  { value: "de-DE", label: "German (Germany)" },
  { value: "es-ES", label: "Spanish (Spain)" },
  { value: "it-IT", label: "Italian (Italy)" },
  { value: "ja-JP", label: "Japanese (Japan)" },
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
    ) => authService.updateProfile(payload),
    onSuccess: async (updated) => {
      qc.setQueryData(["profile"], updated);
      await qc.invalidateQueries({ queryKey: ["auth"] });
      await qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profile updated");
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { detail?: string } }; message?: string };
      const msg = error?.response?.data?.detail || error?.message || "Failed to update profile";
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
  const [isUpdatingEmail, setIsUpdatingEmail] = React.useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = React.useState(false);

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

    setFirstName(data.first_name?.trim() || first);
    setLastName(data.last_name?.trim() || last);
    setPhone((data.phone as string | null) ?? "");
    setPreferredLanguage(data.preferred_language ?? data.locale ?? "en-US");
    setPreferredCountry((data.preferred_country ?? "US").toUpperCase());
    setMarketingConsent(Boolean((data as any).marketing_consent));
    setNewEmail(data.email ?? "");
  }, [data]);

  const emailVerified = Boolean(data?.is_email_confirmed);
  const isSavingProfile = updateMutation.isPending;

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
    setIsUpdatingEmail(true);
    try {
      const updated = await authService.updateProfile({ email: newEmail, password: emailPassword } as any);
      qc.setQueryData(["profile"], updated as any);
      await qc.invalidateQueries({ queryKey: ["auth"] });
      await qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Email updated. Please verify your new email.");
      setEmailPassword("");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      const msg = error?.response?.data?.detail || "Failed to update email";
      toast.error(msg);
    } finally {
      setIsUpdatingEmail(false);
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
    const { isValid } = (await import("@/lib/security")).SecurityManager.validatePasswordStrength(newPassword);
    if (!isValid) {
      toast.error("Password must be at least 8 characters long and include uppercase, lowercase, number, and symbol.");
      return;
    }
    setIsUpdatingPassword(true);
    try {
      await authService.updateProfile({ old_password: oldPassword, new_password: newPassword } as any);
      await authService.logout();
      toast.success("Password updated — please log in again.");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      window.location.href = "/login";
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      const msg = error?.response?.data?.detail || "Failed to update password";
      toast.error(msg);
    } finally {
      setIsUpdatingPassword(false);
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
                    autoComplete="given-name"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium text-gray-700">Last name</span>
                  <input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="rounded-lg border border-gray-200 px-3 py-2 focus:border-black focus:outline-none"
                    placeholder="Last name"
                    autoComplete="family-name"
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-[2fr,1fr]">
                <div className="flex flex-col gap-1 text-sm">
                  <span className="font-medium text-gray-700 flex items-center gap-2">
                    Email
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        emailVerified ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {emailVerified ? "Verified" : "Unverified"}
                    </span>
                  </span>
                  <input
                    value={data?.email ?? ""}
                    disabled
                    className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-500"
                    autoComplete="email"
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
                    autoComplete="tel"
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
                  disabled={isSavingProfile}
                  className="inline-flex items-center justify-center rounded-full bg-black px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-black/85 disabled:opacity-60"
                >
                  {isSavingProfile ? "Saving..." : "Save changes"}
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
                <div className="space-y-1 text-sm">
                  <span className="font-medium text-gray-700">Change email</span>
                  <p className="text-xs text-gray-500">
                    Update the email address you use to sign in. We will send a verification link to your new inbox.
                  </p>
                </div>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium text-gray-700">New email</span>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="rounded-lg border border-gray-200 px-3 py-2 focus:border-black focus:outline-none"
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </label>
                <div>
                  <PasswordField
                    id="email_current_password"
                    name="current"
                    label="Current password"
                    value={emailPassword}
                    onChange={setEmailPassword}
                    showRules={false}
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isUpdatingEmail}
                    className="inline-flex items-center justify-center rounded-full bg-black px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-black/85 disabled:opacity-60"
                  >
                    {isUpdatingEmail ? "Updating..." : "Update email"}
                  </button>
                </div>
              </form>

              <form onSubmit={onChangePassword} className="space-y-4 border-t border-gray-200 pt-6">
                <div className="space-y-1 text-sm">
                  <span className="font-medium text-gray-700">Change password</span>
                  <p className="text-xs text-gray-500">
                    Choose a strong password that you have not used elsewhere. You will be signed out after updating.
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <PasswordField
                    id="current_password"
                    name="current"
                    label="Current password"
                    value={oldPassword}
                    onChange={setOldPassword}
                    showRules={false}
                  />
                  <PasswordField
                    id="new_password"
                    name="new"
                    label="New password"
                    value={newPassword}
                    onChange={setNewPassword}
                    required
                    showRules
                  />
                  <PasswordField
                    id="confirm_new_password"
                    name="confirm"
                    label="Confirm new password"
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    required
                    showRules={false}
                    disablePaste
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isUpdatingPassword}
                    className="inline-flex items-center justify-center rounded-full bg-black px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-black/85 disabled:opacity-60"
                  >
                    {isUpdatingPassword ? "Updating..." : "Update password"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
