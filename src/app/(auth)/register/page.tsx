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
  const redirectTo = searchParams.get("redirectTo") || "/";
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
    } catch (err: any) {
      console.error('Registration error:', err);
      
      let errorMessage = 'Registration failed. Please try again.';
      if (err?.response?.data?.email) {
        errorMessage = err.response.data.email[0];
      } else if (err?.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      } else if (err?.message) {
        errorMessage = err.message;
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-lg shadow-sm border border-gray-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            Create your account
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Join us to shop faster and track orders.
          </p>
        </div>

        <form onSubmit={onSubmit} className="mt-8 space-y-6" noValidate>
          <div className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
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
                className={`appearance-none block w-full px-3 py-2 border ${errors['email'] ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
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
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
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
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
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
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
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
              <p className="mt-1 text-xs text-gray-500">Must be at least 8 characters long and include uppercase, lowercase, number, and symbol.</p>
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
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="termsConsent"
                  name="termsConsent"
                  type="checkbox"
                  checked={formData.termsConsent}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  required
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="termsConsent" className="font-medium text-gray-700">
                  I agree to the{' '}
                  <Link href="/terms" className="text-primary-600 hover:text-primary-500 hover:underline">
                    Terms and Conditions
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="text-primary-600 hover:text-primary-500 hover:underline">
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
            
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="marketingConsent"
                  name="marketingConsent"
                  type="checkbox"
                  checked={formData.marketingConsent}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="marketingConsent" className="font-medium text-gray-500">
                  I want to receive marketing promotions and updates via email.
                </label>
              </div>
            </div>
          </div>
        
            <div>
              <button
                type="submit"
                disabled={auth.isLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-black text-sm font-medium rounded-md text-black bg-white hover:bg-black hover:text-white transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed"
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
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                Already have an account?
              </span>
            </div>
          </div>

          <div className="mt-6">
            <Link
              href={`/login${redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ''}`}
              className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Sign in to your account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}




