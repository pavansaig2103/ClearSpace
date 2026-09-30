import { cn, itemTypeLabel } from "@/lib/utils";

export function Badge({
  children,
  tone = "neutral",
  className
}: {
  children: React.ReactNode;
  tone?: "neutral" | "accent" | "success" | "warning";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex min-h-7 items-center rounded-full border px-2.5 text-[11px] font-medium capitalize tracking-[0.02em]",
        tone === "neutral" && "border-white/10 bg-white/[0.06] text-paper-100/68",
        tone === "accent" && "border-accent-300/28 bg-accent-300/12 text-accent-100",
        tone === "success" && "border-emerald-300/20 bg-emerald-300/10 text-emerald-100",
        tone === "warning" && "border-amber-200/20 bg-amber-200/10 text-amber-100",
        className
      )}
    >
      {typeof children === "string" ? itemTypeLabel(children) : children}
    </span>
  );
}

