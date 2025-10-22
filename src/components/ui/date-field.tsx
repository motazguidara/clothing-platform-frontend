"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "./input";

type DateFieldProps = {
  id?: string;
  name?: string;
  label?: string;
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  required?: boolean;
  min?: string; // YYYY-MM-DD
  max?: string; // YYYY-MM-DD
  validateDob13?: boolean; // enforce >= 13 years old
  disablePast?: boolean; // prevent selecting past dates
  className?: string;
  error?: string | null;
  hint?: string;
};

function isValidIsoDate(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const parts = date.split("-").map((n) => Number.parseInt(n, 10));
  if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) {
    return false;
  }
  const [y, m, d] = parts as [number, number, number];
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

function todayIso(): string {
  const dt = new Date();
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const d = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function DateField({
  id,
  name,
  label = "Date",
  value,
  onChange,
  required,
  min = "1900-01-01",
  max = "2100-12-31",
  validateDob13,
  disablePast,
  className,
  error,
  hint,
}: DateFieldProps) {
  const uid = React.useId();
  const fieldId = id || `date_${uid}`;
  const [clientSupported, setClientSupported] = React.useState(true);
  const [localError, setLocalError] = React.useState<string | null>(null);

  React.useEffect(() => {
    // Rough feature detect for native date input support
    const input = document.createElement("input");
    input.setAttribute("type", "date");
    setClientSupported(input.type === "date");
  }, []);

  const effectiveMin = disablePast ? todayIso() : min;

  function handleValidate(next: string) {
    let msg: string | null = null;
    if (next && !isValidIsoDate(next)) {
      msg = "Please enter a valid date in the format YYYY-MM-DD.";
    }
    if (!msg && next) {
      if (next < effectiveMin) msg = `Date cannot be earlier than ${effectiveMin}.`;
      if (next > max) msg = `Date cannot be later than ${max}.`;
    }
    if (!msg && next && validateDob13) {
      const parts = next.split("-").map((n) => Number.parseInt(n, 10));
      if (parts.length === 3 && !parts.some((part) => Number.isNaN(part))) {
        const [y, m, d] = parts as [number, number, number];
        const thirteen = new Date();
        thirteen.setFullYear(thirteen.getFullYear() - 13);
        const compare = new Date(y, m - 1, d);
        if (compare > thirteen) msg = "You must be at least 13 years old.";
      }

    }
    setLocalError(msg);
  }

  const describedBy = localError || error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined;

  return (
    <div className={cn("w-full", className)}>
      {label && (
        <label htmlFor={fieldId} className="block text-sm font-medium">
          {label} {required ? <span className="text-red-600">*</span> : null}
        </label>
      )}
      <div className="mt-1">
        <Input
          id={fieldId}
          name={name || fieldId}
          type={clientSupported ? "date" : "text"}
          pattern={clientSupported ? undefined : "\\d{4}-\\d{2}-\\d{2}"}
          placeholder={clientSupported ? undefined : "YYYY-MM-DD"}
          min={effectiveMin}
          max={max}
          value={value}
          onChange={(e) => {
            const next = e.target.value;
            onChange(next);
            handleValidate(next);
          }}
          onBlur={() => handleValidate(value)}
          aria-invalid={!!(localError || error)}
          aria-describedby={describedBy}
          required={required}
        />
      </div>
      {hint && !(localError || error) ? (
        <p id={`${fieldId}-hint`} className="mt-1 text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {localError || error ? (
        <p id={`${fieldId}-error`} role="alert" aria-live="assertive" className="mt-1 text-sm text-red-600">
          {localError || error}
        </p>
      ) : null}
    </div>
  );
}

