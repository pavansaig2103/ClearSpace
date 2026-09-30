import { forwardRef } from "react";

import { cn } from "@/lib/utils";

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "w-full resize-none rounded-[1.6rem] border border-white/10 bg-white/[0.06] px-5 py-4 text-base leading-7 text-paper-50 placeholder:text-paper-100/36",
        "transition focus:border-accent-300/55 focus:bg-white/[0.09] focus:outline-none",
        className
      )}
      {...props}
    />
  )
);

Textarea.displayName = "Textarea";

