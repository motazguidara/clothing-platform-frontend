"use client";

import React from "react";

export type IconButtonSize = "sm" | "md" | "lg";

const sizeClasses: Record<IconButtonSize, string> = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12",
};

export type IconButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  size?: IconButtonSize;
  tooltip?: string;
};

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ size = "md", className = "", tooltip, children, ...props }, ref) => {
    const classes = [
      "relative grid place-items-center rounded-md group",
      "outline-none focus:outline-none focus-visible:ring-2 ring-offset-2 ring-black",
      "transition-all duration-200 active:duration-100",
      "cursor-pointer disabled:cursor-not-allowed disabled:opacity-60",
      // motion-safe interactions
      "motion-safe:hover:-translate-y-px motion-safe:hover:scale-[1.02]",
      "motion-safe:hover:shadow",
      "motion-safe:active:scale-95 motion-safe:active:shadow-sm",
      "hover:bg-secondary/50",
      sizeClasses[size],
      className,
    ].join(" ");

    return (
      <button ref={ref} className={classes} {...props}>
        {children}
        {tooltip && (
          <span
            role="tooltip"
            className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-[calc(100%+6px)] whitespace-nowrap rounded-md bg-black/90 text-white text-[11px] px-2 py-1 opacity-0 translate-y-1 motion-safe:transition-all motion-safe:duration-150 group-hover:opacity-100 group-hover:translate-y-0 focus-visible:opacity-100"
          >
            {tooltip}
          </span>
        )}
      </button>
    );
  }
);
IconButton.displayName = "IconButton";

export default IconButton;
