"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { FormHint } from "@/components/forms/FormHint";
import { useAuth } from "@/hooks/useAuth";

// This is a client component that handles the login form
// It uses the useAuth hook to manage authentication state

export default function LoginPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const redirectTo = sp.get("next") || sp.get("redirectTo") || "/";
  const auth = useAuth();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const emailHintId = "login-email-hint";
  const passwordHintId = "login-password-hint";
  const errorId = "login-error";
  const emailDescribedBy = useMemo(
    () =>
      [error ? errorId : null, emailHintId].filter(Boolean).join(" ") || undefined,
    [error]
  );

  useEffect(() => {
    // Check if we need to redirect
    if (auth.isAuthenticated) {
      router.replace(redirectTo);
    } else {
      setIsLoading(false);
    }
    
    // Focus the email input on mount
    emailRef.current?.focus();
  }, [auth.isAuthenticated, router, redirectTo]);
  
  // Show loading state while checking auth
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
    
    // Basic validation
    if (!email || !password) {
      setError("Please enter your email and password.");
      emailRef.current?.focus();
      return;
    }
    
    try {
      setIsLoggingIn(true);

      // Call the login mutation and redirect here
      await auth.loginAsync({ email, password });

      // Show success message
      toast.success("Successfully logged in!");

      // Redirect to target
      router.replace(redirectTo);
    } catch (err: any) {
      console.error("Login error:", err);
      
      // Handle different types of errors
      let errorMessage = "Failed to log in. Please check your credentials and try again.";
      
      if (err?.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoggingIn(false);
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
            aria-describedby={emailDescribedBy}
          />
          <FormHint id={emailHintId}>
            Use the email you registered with so we can link your account activity.
          </FormHint>
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
            aria-describedby={passwordHintId}
          />
          <FormHint id={passwordHintId}>
            Passwords are case sensitive. Double-check caps lock before signing in.
          </FormHint>
        </div>
        {error && (
          <p
            id={errorId}
            className="text-sm text-red-600"
            role="alert"
            aria-live="assertive"
          >
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={isLoggingIn || auth.isLoading}
          className="w-full inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-6 py-3 text-sm font-semibold hover:opacity-90 transition disabled:opacity-50"
        >
          {isLoggingIn ? "Signing in..." : "Sign in"}
        </button>
      </form>
      <div className="mt-3 text-sm">
        <a className="underline" href="/forgot-password">Forgot password?</a>
      </div>
      <p className="mt-2 text-sm">
        Don't have an account? <Link className="underline" href="/register">Create one</Link>
      </p>
    </section>
  );
}



