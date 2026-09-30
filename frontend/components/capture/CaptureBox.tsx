"use client";

import { FormEvent, KeyboardEvent, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { emitAmbientFocus, emitAmbientPulse } from "@/lib/ambient";
import { friendlyError } from "@/lib/utils";
import { api } from "@/services/api";
import type { InboxItem } from "@/types/domain";

export function CaptureBox({ onCaptured, compact = false }: { onCaptured?: (item: InboxItem) => void; compact?: boolean }) {
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit() {
    if (!value.trim() || submitting) return;
    setSubmitting(true);
    setError("");
    setMessage("");
    try {
      const item = await api.capture(value);
      onCaptured?.(item);
      setValue("");
      setMessage("Captured. Your head is a little lighter.");
      emitAmbientPulse();
      window.setTimeout(() => setMessage(""), 2800);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setSubmitting(false);
    }
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      void submit();
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void submit();
  }

  return (
    <motion.form
      onSubmit={onSubmit}
      layout
      className="glass-panel-strong relative overflow-hidden rounded-[2rem] p-4 shadow-ambient sm:p-5"
      onFocus={() => emitAmbientFocus(true)}
      onBlur={() => emitAmbientFocus(false)}
      whileFocus={{ scale: 1.01 }}
    >
      <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      <label className="block">
        <span className="mb-3 block text-lg font-semibold tracking-[-0.01em] text-paper-50 sm:text-xl">What&apos;s on your mind?</span>
        <Textarea
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Dump anything here..."
          aria-label="Dump anything here"
          rows={compact ? 3 : 5}
          className="border-transparent bg-transparent px-0 py-0 text-[1.05rem] shadow-none focus:bg-transparent sm:text-lg"
        />
      </label>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-paper-100/42">Press Ctrl or Command + Enter to clear it out.</p>
        <Button type="submit" variant="primary" icon={ArrowRight} disabled={submitting || !value.trim()} className="sm:min-w-36">
          {submitting ? "Clearing..." : "Clear it out"}
        </Button>
      </div>
      <AnimatePresence>
        {message ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="mt-4 flex items-center gap-2 rounded-2xl border border-emerald-300/16 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-100"
          >
            <Check className="h-4 w-4" aria-hidden />
            {message}
          </motion.div>
        ) : null}
      </AnimatePresence>
      {error ? <p className="mt-4 text-sm text-red-100">{error}</p> : null}
    </motion.form>
  );
}

