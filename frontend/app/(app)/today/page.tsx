"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CalendarCheck, Check, Sparkle } from "lucide-react";
import { useEffect, useState } from "react";

import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState, LoadingState } from "@/components/feedback/InlineState";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { emitAmbientPulse } from "@/lib/ambient";
import { formatDateLong, friendlyError } from "@/lib/utils";
import { api } from "@/services/api";
import type { InboxItem, TodayPayload } from "@/types/domain";

export default function TodayPage() {
  const [payload, setPayload] = useState<TodayPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cleared, setCleared] = useState(0);

  async function load() {
    setError("");
    try {
      setPayload(await api.today());
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function complete(item: InboxItem) {
    setError("");
    try {
      const done = await api.completeItem(item.id);
      setCleared((value) => value + 1);
      emitAmbientPulse();
      setPayload((current) => {
        if (!current) return current;
        return {
          ...current,
          must_handle: current.must_handle.filter((entry) => entry.id !== item.id),
          today: current.today.filter((entry) => entry.id !== item.id),
          quick_wins: current.quick_wins.filter((entry) => entry.id !== item.id),
          done: [done, ...current.done].slice(0, 8)
        };
      });
    } catch (err) {
      setError(friendlyError(err));
    }
  }

  const total = payload ? payload.must_handle.length + payload.today.length + payload.quick_wins.length : 0;

  return (
    <div className="mx-auto max-w-5xl py-4 md:py-10">
      <header className="mb-10">
        <p className="text-xs uppercase tracking-[0.22em] text-paper-100/38">Today</p>
        <h1 className="mt-3 text-5xl font-semibold uppercase tracking-[-0.05em] text-paper-50 sm:text-7xl">Today</h1>
        <p className="mt-4 text-lg text-paper-100/58">{payload ? formatDateLong(payload.date) : formatDateLong(new Date())}</p>
      </header>

      {loading ? <LoadingState label="Finding what matters..." /> : null}
      {error ? <ErrorState message={error} /> : null}

      {payload && !loading ? (
        <>
          <div className="mb-8">
            <p className="text-2xl font-medium tracking-[-0.02em] text-paper-50">
              {total === 0 ? "Nothing needs you right now." : `${total} ${total === 1 ? "thing matters" : "things matter"}.`}
            </p>
          </div>

          <AnimatePresence>
            {cleared >= 3 ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-8 rounded-[2rem] border border-accent-300/18 bg-accent-300/10 p-5 text-paper-50"
              >
                <Sparkle className="mb-3 h-5 w-5 text-accent-100" aria-hidden />
                <p className="text-lg font-medium">Nice.</p>
                <p className="mt-1 text-sm text-paper-100/62">
                  You cleared {cleared} things from your head. That&apos;s a little more space for today.
                </p>
              </motion.div>
            ) : null}
          </AnimatePresence>

          {total === 0 ? (
            <div className="glass-panel rounded-[2rem]">
              <EmptyState icon={CalendarCheck} title="That's everything for today.">
                Let the quiet count.
              </EmptyState>
            </div>
          ) : (
            <div className="space-y-10">
              <FocusSection title="Must handle" items={payload.must_handle} start={1} onComplete={complete} />
              <FocusSection title="Today" items={payload.today} start={payload.must_handle.length + 1} onComplete={complete} />
              <FocusSection
                title="Quick wins"
                items={payload.quick_wins}
                start={payload.must_handle.length + payload.today.length + 1}
                onComplete={complete}
              />
            </div>
          )}

          {payload.done.length > 0 ? (
            <section className="mt-12">
              <p className="mb-4 text-xs uppercase tracking-[0.18em] text-paper-100/38">Done</p>
              <div className="space-y-2">
                {payload.done.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 rounded-2xl px-3 py-2 text-sm text-paper-100/45 line-through">
                    <Check className="h-4 w-4 text-emerald-100" aria-hidden />
                    {item.title}
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

function FocusSection({
  title,
  items,
  start,
  onComplete
}: {
  title: string;
  items: InboxItem[];
  start: number;
  onComplete: (item: InboxItem) => Promise<void>;
}) {
  if (items.length === 0) return null;
  return (
    <section>
      <p className="mb-4 text-xs uppercase tracking-[0.18em] text-paper-100/38">{title}</p>
      <div className="space-y-3">
        <AnimatePresence initial={false}>
          {items.map((item, index) => (
            <motion.article
              key={item.id}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0, y: -8 }}
              className="glass-panel flex items-center gap-4 rounded-[1.75rem] p-4"
            >
              <span className="w-10 shrink-0 text-xl font-semibold text-paper-100/32">{String(start + index).padStart(2, "0")}</span>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-medium text-paper-50">{item.title}</h2>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge tone={item.priority === "high" ? "warning" : "neutral"}>{item.priority}</Badge>
                  <Badge>{item.type}</Badge>
                </div>
              </div>
              <Button aria-label={`Complete ${item.title}`} variant="secondary" size="icon" icon={Check} onClick={() => onComplete(item)} />
            </motion.article>
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}

