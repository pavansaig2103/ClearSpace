import { forwardRef } from "react";

import { cn } from "@/lib/utils";

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "min-h-11 w-full rounded-2xl border border-white/10 bg-white/[0.065] px-4 text-sm text-paper-50 placeholder:text-paper-100/38",
        "transition focus:border-accent-300/50 focus:bg-white/[0.09] focus:outline-none",
        className
      )}
      {...props}
    />
  )
);

Input.displayName = "Input";

