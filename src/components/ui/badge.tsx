"use client";

import React from "react";

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "destructive" | "accent";
};

export function Badge({ variant = "default", className = "", ...props }: BadgeProps) {
  const base = "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold";
  const map: Record<string, string> = {
    default: "bg-subtle text-foreground",
    destructive: "bg-destructive text-destructive-foreground",
    accent: "bg-accent text-accent-foreground",
  };

  return <span className={`${base} ${map[variant] ?? map.default} ${className}`} {...props} />;
}

export default Badge;
