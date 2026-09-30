"use client";

import { forwardRef } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type ButtonProps = Omit<HTMLMotionProps<"button">, "children"> & {
  children?: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg" | "icon";
  icon?: LucideIcon;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "secondary", size = "md", icon: Icon, children, type = "button", ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        type={type}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-full border font-medium transition disabled:pointer-events-none disabled:opacity-45",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-300",
          variant === "primary" &&
            "border-accent-300/40 bg-accent-300 px-5 text-ink-950 shadow-[0_14px_40px_rgba(34,211,238,0.22)] hover:bg-accent-100",
          variant === "secondary" &&
            "border-white/10 bg-white/[0.075] text-paper-50 hover:border-white/18 hover:bg-white/[0.11]",
          variant === "ghost" && "border-transparent bg-transparent text-paper-100/74 hover:bg-white/[0.08] hover:text-paper-50",
          variant === "danger" && "border-red-300/20 bg-red-400/10 text-red-100 hover:bg-red-400/16",
          size === "sm" && "min-h-9 px-3 text-xs",
          size === "md" && "min-h-11 px-4 text-sm",
          size === "lg" && "min-h-12 px-5 text-sm",
          size === "icon" && "h-11 w-11 p-0",
          className
        )}
        {...props}
      >
        {Icon ? <Icon aria-hidden className="h-4 w-4" /> : null}
        {children}
      </motion.button>
    );
  }
);

Button.displayName = "Button";

