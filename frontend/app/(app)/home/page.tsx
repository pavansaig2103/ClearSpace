"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, Lightbulb, MessageCircle, Moon, Sparkle } from "lucide-react";

import { CaptureBox } from "@/components/capture/CaptureBox";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState, LoadingState } from "@/components/feedback/InlineState";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/features/auth/AuthProvider";
import { formatRelativeDate, friendlyError, greeting } from "@/lib/utils";
import { api } from "@/services/api";
import type { InboxItem, Summary } from "@/types/domain";

export default function HomePage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [recent, setRecent] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setError("");
    try {
      const [summaryData, inboxData] = await Promise.all([api.summary(), api.listInbox("?page_size=5")]);
      setSummary(summaryData);
      setRecent(inboxData.data);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="mx-auto max-w-6xl">
      <section className="grid min-h-[calc(100vh-7rem)] items-center gap-8 py-4 md:grid-cols-[minmax(0,1fr)_18rem] md:py-10">
        <div>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <p className="text-sm uppercase tracking-[0.2em] text-paper-100/40">{greeting()}, {user?.name?.split(" ")[0] ?? "there"}.</p>
            <h1 className="mt-4 max-w-2xl text-4xl font-semibold tracking-[-0.04em] text-paper-50 sm:text-6xl">
              Let&apos;s clear a little space.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-paper-100/56">
              Drop the thought here first. ClearSpace will gently shape it after it leaves your head.
            </p>
          </motion.div>

          <div className="mt-8 max-w-3xl">
            <CaptureBox
              onCaptured={(item) => {
                setRecent((current) => [item, ...current].slice(0, 5));
                void api.summary().then(setSummary).catch(() => undefined);
              }}
            />
          </div>
        </div>

        <aside className="glass-panel rounded-[2rem] p-4 md:p-5">
          {loading ? (
            <LoadingState label="Reading the room..." />
          ) : error ? (
            <ErrorState message={error} />
          ) : summary ? (
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-paper-100/38">Your day</p>
              <div className="mt-4 grid grid-cols-2 gap-2 md:mt-5 md:block md:space-y-5">
                <SummaryLine value={summary.today} label="things need you today" />
                <SummaryLine value={summary.upcoming} label="upcoming" />
                <SummaryLine value={summary.ideas} label="ideas waiting" />
                <SummaryLine value={summary.follow_ups} label="follow-ups" />
              </div>
              {summary.completed_this_week > 0 ? (
                <div className="mt-6 rounded-3xl border border-accent-300/14 bg-accent-300/8 p-4">
                  <Sparkle className="mb-3 h-4 w-4 text-accent-100" aria-hidden />
                  <p className="text-sm leading-6 text-paper-100/72">
                    Nice. You cleared {summary.completed_this_week} things this week.
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}
        </aside>
      </section>

      <section className="pb-10 pt-20 md:pt-0">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-paper-100/38">On your mind</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-paper-50">Recently captured</h2>
          </div>
          <Link
            href="/inbox"
            className="hidden min-h-11 items-center gap-2 rounded-full border border-transparent px-4 text-sm text-paper-100/70 transition hover:bg-white/[0.08] hover:text-paper-50 sm:inline-flex"
          >
            Open inbox
            <ArrowUpRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
        <div className="glass-panel rounded-[2rem] p-2 sm:p-4">
          {recent.length === 0 && !loading ? (
            <EmptyState icon={Moon} title="Your head is quiet.">
              Nothing waiting for you right now. Take the space.
            </EmptyState>
          ) : (
            <div className="space-y-1">
              {recent.map((item) => (
                <Link key={item.id} href="/inbox" className="flex items-center gap-4 rounded-3xl px-3 py-4 transition hover:bg-white/[0.05]">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.055] text-accent-100">
                    {item.type === "idea" ? <Lightbulb className="h-4 w-4" /> : <MessageCircle className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-paper-50">{item.title}</p>
                    <p className="mt-1 text-xs text-paper-100/42">{formatRelativeDate(item.created_at)}</p>
                  </div>
                  <Badge tone={item.category === "idea" ? "accent" : "neutral"}>{item.category}</Badge>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function SummaryLine({ value, label }: { value: number; label: string }) {
  return (
    <div className="min-h-16 rounded-2xl bg-white/[0.045] p-2.5 md:flex md:min-h-0 md:items-baseline md:gap-3 md:bg-transparent md:p-0">
      <span className="block text-xl font-semibold tracking-[-0.04em] text-paper-50 md:w-10 md:text-3xl">{value}</span>
      <span className="mt-0.5 block text-[11px] leading-4 text-paper-100/54 md:mt-0 md:text-sm md:leading-5">{label}</span>
    </div>
  );
}

