"use client";

import * as React from "react";
import { Info } from "lucide-react";

import { cn } from "@/lib/utils";

type FormHintProps = {
  id?: string;
  className?: string;
  children: React.ReactNode;
};

export function FormHint({ id, className, children }: FormHintProps) {
  return (
    <p
      id={id}
      className={cn(
        "mt-1 flex items-start gap-2 text-xs text-muted-foreground",
        className
      )}
    >
      <Info className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}
