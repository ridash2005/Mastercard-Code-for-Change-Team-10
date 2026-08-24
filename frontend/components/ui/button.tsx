import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "outline" | "danger" }) {
  const styles = {
    primary: "rounded-full bg-barbie text-white hover:bg-moss",
    ghost: "rounded-full bg-transparent text-purple hover:bg-ivory",
    outline: "rounded-full border border-plum/20 bg-ivory text-plum hover:bg-card",
    danger: "rounded-full bg-red-800 text-white hover:bg-red-900",
  } as const;
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 px-3.5 py-2 text-sm font-medium transition disabled:opacity-50",
        styles[variant],
        className,
      )}
      {...props}
    />
  );
}
