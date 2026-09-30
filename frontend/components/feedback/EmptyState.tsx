import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  children,
  className
}: {
  icon?: LucideIcon;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("py-12 text-center", className)}>
      {Icon ? (
        <div className="mx-auto mb-5 grid h-12 w-12 place-items-center rounded-full border border-white/10 bg-white/[0.06] text-accent-100">
          <Icon className="h-5 w-5" aria-hidden />
        </div>
      ) : null}
      <h3 className="text-lg font-medium text-paper-50">{title}</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-paper-100/58">{children}</p>
    </div>
  );
}

