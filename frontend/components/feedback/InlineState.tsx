import { Loader2 } from "lucide-react";

export function LoadingState({ label = "Making space..." }: { label?: string }) {
  return (
    <div className="flex min-h-40 items-center justify-center gap-3 text-sm text-paper-100/62">
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      <span>{label}</span>
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div role="alert" className="rounded-3xl border border-red-300/16 bg-red-400/10 p-4 text-sm text-red-100">
      {message}
    </div>
  );
}

