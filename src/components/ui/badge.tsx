"use client";

import React from "react";

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "destructive" | "accent";
};

export function Badge({ variant = "default", className = "", ...props }: BadgeProps) {
  const base = "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold";
  const map = {
    default: "bg-subtle text-foreground",
    destructive: "bg-destructive text-destructive-foreground",
    accent: "bg-accent text-accent-foreground",
  } as const;

  const variantClass = variant in map ? map[variant as keyof typeof map] : map.default;

  return <span className={`${base} ${variantClass} ${className}`} {...props} />;
}

export default Badge;
