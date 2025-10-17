"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "./input";
import { SecurityManager } from "@/lib/security";

type PasswordFieldProps = {
  id?: string;
  name?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  showRules?: boolean;
  disablePaste?: boolean;
  className?: string;
  inputClassName?: string;
  error?: string | null;
};

export function PasswordField({
  id,
  name,
  label = "Password",
  value,
  onChange,
  required,
  showRules = true,
  disablePaste,
  className,
  inputClassName,
  error,
}: PasswordFieldProps) {
  const uid = React.useId();
  const fieldId = id || `pw_${uid}`;
  const [visible, setVisible] = React.useState(false);
  const rules = React.useMemo(() => {
    const pwd = value || "";
    return {
      len: pwd.length >= 8,
      lower: /[a-z]/.test(pwd),
      upper: /[A-Z]/.test(pwd),
      digit: /\d/.test(pwd),
      sym: /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
    };
  }, [value]);

  const strength = React.useMemo(() => {
    const result = SecurityManager.validatePasswordStrength(value || "");
    const level = result.score <= 2 ? "weak" : result.score === 3 ? "medium" : "strong";
    return { ...result, level } as typeof result & { level: "weak" | "medium" | "strong" };
  }, [value]);

  const onPaste: React.ClipboardEventHandler<HTMLInputElement> | undefined = disablePaste
    ? (e) => {
        e.preventDefault();
      }
    : undefined;

  const describedBy: string | undefined = error ? `${fieldId}-error` : undefined;

  return (
    <div className={cn("w-full", className)}>
      {label && (
        <label htmlFor={fieldId} className="block text-sm font-medium">
          {label} {required ? <span className="text-red-600">*</span> : null}
        </label>
      )}
      <div className={cn("mt-1 relative")}
        data-slot="password-field">
        <Input
          id={fieldId}
          name={name || fieldId}
          type={visible ? "text" : "password"}
          autoComplete={name === "current" ? "current-password" : name === "new" ? "new-password" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onPaste={onPaste}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          required={required}
          className={cn("pr-12", inputClassName)}
        />
        <button
          type="button"
          className="absolute inset-y-0 right-2 my-auto inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          onClick={() => setVisible((v) => !v)}
        >
          {visible ? "Hide" : "Show"}
        </button>
      </div>
      {error ? (
        <p id={`${fieldId}-error`} role="alert" aria-live="assertive" className="mt-1 text-sm text-red-600">
          {error}
        </p>
      ) : null}

      {showRules ? (
        <div className="mt-2 space-y-2" aria-live="polite">
          <div className="h-2 w-full rounded bg-gray-200 overflow-hidden" aria-hidden="true">
            <div
              className={cn(
                "h-2 transition-all",
                strength.level === "weak" && "bg-red-500 w-1/3",
                strength.level === "medium" && "bg-yellow-500 w-2/3",
                strength.level === "strong" && "bg-green-600 w-full"
              )}
            />
          </div>
          <ul className="text-xs text-gray-600 grid grid-cols-2 gap-x-4 gap-y-1">
            <li className={rules.len ? "text-green-700" : ""}>{rules.len ? "✅" : "⬜"} At least 8 characters</li>
            <li className={rules.upper ? "text-green-700" : ""}>{rules.upper ? "✅" : "⬜"} Uppercase letter</li>
            <li className={rules.lower ? "text-green-700" : ""}>{rules.lower ? "✅" : "⬜"} Lowercase letter</li>
            <li className={rules.digit ? "text-green-700" : ""}>{rules.digit ? "✅" : "⬜"} Number</li>
            <li className={rules.sym ? "text-green-700" : ""}>{rules.sym ? "✅" : "⬜"} Symbol</li>
          </ul>
        </div>
      ) : null}
    </div>
  );
}

