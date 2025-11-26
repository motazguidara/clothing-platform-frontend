"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { toast } from "sonner";
import { SecurityManager } from "@/lib/security";
import { PasswordField } from "@/components/ui";

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/";
  const auth = useAuth({ fetchProfile: false });
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirm: "",
    firstName: "",
    lastName: "",
    marketingConsent: false,
    termsConsent: false,
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const emailRef = useRef<HTMLInputElement>(null);

  // Handle redirect if already authenticated
  useEffect(() => {
    if (auth.isAuthenticated) {
      router.replace(redirectTo);
    } else {
      setIsLoading(false);
    }
    
    // Focus the email input on mount
    emailRef.current?.focus();
  }, [auth.isAuthenticated, router, redirectTo]);
  
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  }, []);
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.email) {
      newErrors['email'] = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors['email'] = 'Please enter a valid email address';
    }
    
    if (!formData.password) {
      newErrors['password'] = 'Password is required';
    } else {
      const { isValid } = SecurityManager.validatePasswordStrength(formData.password);
      if (!isValid) {
        newErrors['password'] = 'Password must be at least 8 characters long and include uppercase, lowercase, number, and symbol.';
      }
    }
    
    if (formData.password !== formData.confirm) {
      newErrors['confirm'] = 'Passwords do not match';
    }
    
    if (!formData.termsConsent) {
      newErrors['termsConsent'] = 'You must accept the terms and conditions';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    
    if (!validateForm()) {
      return;
    }
    
    try {
      const payload: {
        email: string;
        password: string;
        marketing_consent?: boolean;
        terms_consent?: boolean;
        first_name?: string;
        last_name?: string;
      } = {
        email: formData.email,
        password: formData.password,
        marketing_consent: formData.marketingConsent,
        terms_consent: formData.termsConsent,
      };
      const fn = formData.firstName.trim();
      const ln = formData.lastName.trim();
      if (fn) payload.first_name = fn;
      if (ln) payload.last_name = ln;

      await auth.registerAsync(payload);
      
      await auth.loginAsync({ email: formData.email, password: formData.password });
      
      toast.success('Account created successfully!');
      router.push(redirectTo);
    } catch (err: unknown) {
      console.error('Registration error:', err);
      
      let errorMessage = 'Registration failed. Please try again.';
      if (typeof err === "object" && err !== null) {
        const responseData = (err as { response?: { data?: { email?: unknown; detail?: unknown } } }).response?.data;
        if (Array.isArray(responseData?.email) && typeof responseData.email[0] === "string") {
          errorMessage = responseData.email[0];
        } else if (typeof responseData?.detail === "string") {
          errorMessage = responseData.detail;
        } else if ("message" in err && typeof (err as { message?: unknown }).message === "string") {
          errorMessage = (err as { message: string }).message;
        }
      }
      
      toast.error(errorMessage);
    }
  }

  // Show loading state while checking auth
  if (isLoading || auth.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-white/90 p-8 rounded-2xl shadow-lg border border-slate-200 backdrop-blur">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Create your account
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Join us to shop faster and track orders.
          </p>
        </div>

        <form onSubmit={onSubmit} className="mt-8 space-y-6" noValidate>
          <div className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-slate-900">
              Email address <span className="text-red-500">*</span>
            </label>
            <div className="mt-1">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                ref={emailRef}
                value={formData.email}
                onChange={handleChange}
                required
                className={`appearance-none block w-full px-3 py-2 border ${errors['email'] ? 'border-red-300' : 'border-slate-300'} rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-400 sm:text-sm`}
                aria-invalid={!!errors['email']}
                aria-describedby={errors['email'] ? 'email-error' : undefined}
              />
            </div>
            {errors['email'] && (
              <p id="email-error" className="mt-1 text-sm text-red-600">
                {errors['email']}
              </p>
            )}
          </div>
        
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="firstName" className="block text-sm font-semibold text-slate-900">
                First name
              </label>
              <div className="mt-1">
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  autoComplete="given-name"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-400 sm:text-sm"
                />
              </div>
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-semibold text-slate-900">
                Last name
              </label>
              <div className="mt-1">
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  autoComplete="family-name"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-400 sm:text-sm"
                />
              </div>
            </div>
          </div>
        
          <div>
            <PasswordField
              id="password"
              name="password"
              label={"Password"}
              value={formData.password}
              onChange={(v) => setFormData((p) => ({ ...p, password: v }))}
              required
              showRules
              error={errors['password'] ?? null}
            />
            {!errors['password'] && (
              <p className="mt-1 text-xs text-slate-500">Must be at least 8 characters long and include uppercase, lowercase, number, and symbol.</p>
            )}
          </div>
        
          <div>
            <PasswordField
              id="confirm"
              name="confirm"
              label={"Confirm password"}
              value={formData.confirm}
              onChange={(v) => setFormData((p) => ({ ...p, confirm: v }))}
              required
              showRules={false}
              disablePaste
              error={errors['confirm'] ?? null}
            />
          </div>
        
          <div className="space-y-4 pt-2">
            <div className="flex items-start rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
              <div className="flex items-center h-5">
                <input
                  id="termsConsent"
                  name="termsConsent"
                  type="checkbox"
                  checked={formData.termsConsent}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                  required
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="termsConsent" className="font-semibold text-slate-900">
                  I agree to the{' '}
                  <Link href="/terms" className="text-slate-800 underline underline-offset-4">
                    Terms and Conditions
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="text-slate-800 underline underline-offset-4">
                    Privacy Policy
                  </Link>{' '}
                  <span className="text-red-500">*</span>
                </label>
                {errors['termsConsent'] && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors['termsConsent']}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-start rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
              <div className="flex items-center h-5">
                <input
                  id="marketingConsent"
                  name="marketingConsent"
                  type="checkbox"
                  checked={formData.marketingConsent}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="marketingConsent" className="font-semibold text-slate-700">
                  I want to receive marketing promotions and updates via email.
                </label>
              </div>
            </div>
          </div>
        
            <div>
              <button
                type="submit"
                disabled={auth.isLoading}
                className="group relative w-full flex justify-center py-3 px-4 rounded-full text-sm font-semibold text-white bg-slate-900 border border-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {auth.isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating account...
                  </>
                ) : 'Create account'}
              </button>
            </div>
          </div>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-slate-500">
                Already have an account?
              </span>
            </div>
          </div>

          <div className="mt-6">
            <Link
              href={`/login${redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ''}`}
              className="w-full flex items-center justify-center px-4 py-2 border border-slate-200 rounded-full shadow-sm text-sm font-semibold text-slate-800 bg-white hover:bg-slate-50"
            >
              Sign in to your account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}






