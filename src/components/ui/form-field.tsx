"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type FormFieldProps = {
  id?: string;
  label?: string;
  children: React.ReactElement;
  required?: boolean;
  hint?: string;
  error?: string | null;
  className?: string;
  labelClassName?: string;
  hintClassName?: string;
  errorClassName?: string;
};

/**
 * Accessible form field wrapper that wires up label, hint and error states.
 * - Adds htmlFor/aria-describedby/aria-invalid automatically when possible
 * - Renders hint and error with stable IDs for screen readers
 */
export default function FormField({
  id,
  label,
  children,
  required,
  hint,
  error,
  className,
  labelClassName,
  hintClassName,
  errorClassName,
}: FormFieldProps) {
  const inputId = React.useId();
  const fieldId = id || inputId;
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;

  // Clone child to inject accessible attributes
  const control = React.cloneElement(children, {
    id: children.props.id ?? fieldId,
    'aria-invalid': Boolean(error) || children.props['aria-invalid'] || undefined,
    'aria-describedby': [
      children.props['aria-describedby'],
      error ? errorId : undefined,
      !error && hint ? hintId : undefined,
    ]
      .filter(Boolean)
      .join(' ')
      .trim() || undefined,
    required: required ?? children.props.required,
    name: children.props.name || fieldId,
  });

  return (
    <div className={cn("w-full", className)}>
      {label && (
        <label htmlFor={fieldId} className={cn("block text-sm font-medium", labelClassName)}>
          {label} {required ? <span className="text-red-600">*</span> : null}
        </label>
      )}
      <div className={label ? "mt-1" : undefined}>{control}</div>
      {hint && !error ? (
        <p id={hintId} className={cn("mt-1 text-xs text-muted-foreground", hintClassName)}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p
          id={errorId}
          role="alert"
          aria-live="assertive"
          className={cn("mt-1 text-sm text-red-600", errorClassName)}
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
