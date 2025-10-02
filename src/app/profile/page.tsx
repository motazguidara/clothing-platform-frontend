"use client";

import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { authService } from "@/lib/api/services/auth";
import type { UserProfile } from "@/lib/api/schemas";
import { useProtectedRoute } from "@/hooks/useAuth";

export default function ProfilePage() {
  // Protect this page: redirect unauthenticated users to login with redirect back to /profile
  useProtectedRoute("/login?next=/profile");

  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: async (): Promise<UserProfile> => authService.getUserProfile(),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: Partial<{ first_name: string; last_name: string; phone: string | null; marketing_consent: boolean }>) => {
      return authService.updateProfile(payload);
    },
    onSuccess: async (updated) => {
      // Update caches for profile and auth
      qc.setQueryData(["profile"], updated);
      await qc.invalidateQueries({ queryKey: ["auth"] });
      await qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profile updated");
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.detail || err?.message || "Failed to update profile";
      toast.error(msg);
    }
  });

  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [marketingConsent, setMarketingConsent] = React.useState(false);
  // Security form state
  const [newEmail, setNewEmail] = React.useState("");
  const [emailPassword, setEmailPassword] = React.useState("");
  const [oldPassword, setOldPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");

  async function onChangeEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!newEmail || !emailPassword) {
      toast.error('Email and current password are required');
      return;
    }
    try {
      const updated = await authService.updateProfile({ email: newEmail, password: emailPassword } as any);
      // sync caches and refetch to confirm backend state
      qc.setQueryData(["profile"], updated as any);
      await qc.invalidateQueries({ queryKey: ["auth"] });
      await qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success('Email updated. Please verify your new email.');
      // Optionally: sign out if your app gates by email verification
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Failed to update email';
      toast.error(msg);
    }
  }

  async function onChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error('All password fields are required');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    try {
      await authService.updateProfile({ old_password: oldPassword, new_password: newPassword } as any);
      // Force logout as backend should revoke tokens
      await authService.logout();
      toast.success('Password updated — please log in again.');
      window.location.href = '/login';
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Failed to update password';
      toast.error(msg);
    }
  }

  React.useEffect(() => {
    if (data) {
      setFirstName((data.first_name ?? "") as string);
      setLastName((data.last_name ?? "") as string);
      setPhone((data.phone ?? "") as string);
      setMarketingConsent(Boolean((data as any).marketing_consent));
    }
  }, [data]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    await updateMutation.mutateAsync({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      phone: phone.trim() || null,
      marketing_consent: marketingConsent,
    });
  }

  return (
    <section className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight uppercase">Profile</h1>
      <p className="text-muted mt-2">Edit your profile details.</p>

      {!isLoading && (data as any) && ( (data as any).email_verified === false || (data as any).is_verified === false) && (
        <div className="mt-4 rounded-md border border-amber-400 bg-amber-50 text-amber-900 px-4 py-3 text-sm">
          Your email is not verified. Please check your inbox for a verification email.
        </div>
      )}

      {isLoading ? (
        <div className="mt-8">Loading…</div>
      ) : (
        <form onSubmit={onSave} className="mt-8 space-y-6">
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-semibold">Email</span>
              <div className="mt-1">{data?.email}</div>
            </div>
          </div>

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

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-semibold">Phone</span>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="border rounded-md px-3 py-2"
                placeholder="Phone number"
              />
            </label>
            <label className="flex items-center gap-2 text-sm mt-6">
              <input
                type="checkbox"
                checked={marketingConsent}
                onChange={(e) => setMarketingConsent(e.target.checked)}
                className="h-4 w-4"
              />
              <span>Receive marketing emails</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="inline-flex items-center justify-center rounded-md bg-black text-white px-6 py-3 text-sm font-semibold hover:opacity-90 disabled:opacity-50"
          >
            {updateMutation.isPending ? "Saving…" : "Save"}
          </button>
        </form>
      )}

      {!isLoading && (
        <div className="mt-12 space-y-8">
          <div>
            <h2 className="text-xl font-semibold">Security</h2>
            <p className="text-muted mt-1">Manage email and password.</p>
          </div>

          <form onSubmit={onChangeEmail} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-semibold">New email</span>
                <input
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="border rounded-md px-3 py-2"
                  placeholder="you@domain.com"
                  type="email"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-semibold">Current password</span>
                <input
                  value={emailPassword}
                  onChange={(e) => setEmailPassword(e.target.value)}
                  className="border rounded-md px-3 py-2"
                  placeholder="••••••••"
                  type="password"
                />
              </label>
            </div>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-md bg-black text-white px-6 py-3 text-sm font-semibold hover:opacity-90"
            >
              Update Email
            </button>
          </form>

          <form onSubmit={onChangePassword} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-semibold">Current password</span>
                <input
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="border rounded-md px-3 py-2"
                  placeholder="••••••••"
                  type="password"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-semibold">New password</span>
                <input
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="border rounded-md px-3 py-2"
                  placeholder="••••••••"
                  type="password"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-semibold">Confirm new password</span>
                <input
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="border rounded-md px-3 py-2"
                  placeholder="••••••••"
                  type="password"
                />
              </label>
            </div>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-md bg-black text-white px-6 py-3 text-sm font-semibold hover:opacity-90"
            >
              Update Password
            </button>
          </form>
        </div>
      )}
    </section>
  );
}
