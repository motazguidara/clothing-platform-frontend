import React from "react";

export type ButtonVariant =
  | "default"
  | "primary"
  | "secondary"
  | "ghost"
  | "destructive"
  | "outline"
  | "link";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

export const buttonVariantClasses: Record<ButtonVariant, string> = {
  default: "bg-black text-white hover:bg-black/90",
  primary: "bg-black text-white hover:bg-black/90",
  secondary: "bg-gray-200 text-black hover:bg-gray-300",
  ghost: "bg-transparent text-black hover:bg-gray-100",
  destructive: "bg-red-600 text-white hover:bg-red-700",
  outline:
    "bg-white text-gray-900 border border-gray-300 hover:bg-gray-50",
  link: "bg-transparent text-blue-600 hover:underline hover:bg-transparent",
};

export const buttonSizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-5 text-base",
  icon: "h-9 w-9",
};

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
};

export function Button({
  variant = "default",
  size = "md",
  className = "",
  ...props
}: Props) {
  const classes = [
    "inline-flex items-center justify-center rounded-md font-semibold",
    "outline-none focus:outline-none focus-visible:ring-2 ring-offset-2 ring-black",
    "transition-all duration-200 active:duration-100",
    "cursor-pointer disabled:cursor-not-allowed disabled:opacity-60",
    // motion-safe interactions
    "motion-safe:hover:-translate-y-px motion-safe:hover:scale-[1.02]",
    "motion-safe:hover:shadow",
    "motion-safe:active:scale-95 motion-safe:active:shadow-sm",
    buttonVariantClasses[variant],
    buttonSizeClasses[size],
    className,
  ].join(" ");

  return (
    <button
      data-variant={variant}
      data-size={size}
      className={classes}
      {...props}
    />
  );
}

export default Button;
