"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Inbox as InboxIcon, Sparkle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { CaptureBox } from "@/components/capture/CaptureBox";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState, LoadingState } from "@/components/feedback/InlineState";
import { InboxItemRow } from "@/components/items/InboxItemRow";
import { ItemEditor } from "@/components/items/ItemEditor";
import { Button } from "@/components/ui/Button";
import { cn, friendlyError } from "@/lib/utils";
import { api } from "@/services/api";
import type { InboxItem, ItemStatus } from "@/types/domain";

const statusFilters: { label: string; value: ItemStatus | "" }[] = [
  { label: "Active", value: "active" },
  { label: "Completed", value: "completed" },
  { label: "Archived", value: "archived" }
];

export default function InboxPage() {
  const [items, setItems] = useState<InboxItem[]>([]);
  const [status, setStatus] = useState<ItemStatus | "">("active");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<InboxItem | null>(null);
  const [cleared, setCleared] = useState(0);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("page_size", "15");
    if (status) params.set("status", status);
    return `?${params.toString()}`;
  }, [page, status]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    api
      .listInbox(query)
      .then((result) => {
        if (!active) return;
        setItems((current) => (page === 1 ? result.data : [...current, ...result.data]));
        setPages(result.meta.pages);
      })
      .catch((err) => {
        if (active) setError(friendlyError(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [page, query]);

  function itemMatchesCurrentStatus(item: InboxItem) {
    if (!status) return item.status !== "archived";
    return item.status === status;
  }

  function replaceItem(item: InboxItem) {
    setItems((current) => {
      if (!itemMatchesCurrentStatus(item)) {
        return current.filter((existing) => existing.id !== item.id);
      }
      return current.map((existing) => (existing.id === item.id ? item : existing));
    });
  }

  return (
    <div className="mx-auto max-w-5xl py-4 md:py-8">
      <header className="mb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-paper-100/38">Inbox</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.035em] text-paper-50">Everything that left your head.</h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-paper-100/56">
          Raw thoughts stay intact here. Shape them when you are ready.
        </p>
      </header>

      <div className="mb-8">
        <CaptureBox compact onCaptured={(item) => setItems((current) => [item, ...current])} />
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {statusFilters.map((filter) => (
          <button
            key={filter.label}
            className={cn(
              "min-h-10 rounded-full border px-4 text-sm transition",
              status === filter.value ? "border-accent-300/35 bg-accent-300/12 text-accent-100" : "border-white/10 bg-white/[0.055] text-paper-100/58 hover:text-paper-50"
            )}
            onClick={() => {
              setStatus(filter.value);
              setPage(1);
            }}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <AnimatePresence>
        {cleared >= 3 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-5 rounded-[2rem] border border-accent-300/18 bg-accent-300/10 p-5 text-paper-50"
          >
            <Sparkle className="mb-3 h-5 w-5 text-accent-100" aria-hidden />
            <p className="text-lg font-medium">Nice.</p>
            <p className="mt-1 text-sm text-paper-100/62">
              You cleared {cleared} things from your head. That&apos;s a little more space for today.
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <section className="glass-panel rounded-[2rem] px-4 sm:px-6">
        {loading && items.length === 0 ? <LoadingState /> : null}
        {error ? <div className="py-5"><ErrorState message={error} /></div> : null}
        {!loading && !error && items.length === 0 ? (
          <EmptyState icon={InboxIcon} title={status === "archived" ? "Nothing archived." : "Your head is quiet."}>
            {status === "archived" ? "Archived thoughts will wait here if you need them later." : "Nothing waiting for you right now."}
          </EmptyState>
        ) : null}
        <AnimatePresence initial={false}>
          {items.map((item) => (
            <InboxItemRow
              key={item.id}
              item={item}
              onChanged={replaceItem}
              onDeleted={(id) => setItems((current) => current.filter((existing) => existing.id !== id))}
              onEdit={setEditing}
              onCleared={() => setCleared((value) => value + 1)}
            />
          ))}
        </AnimatePresence>
      </section>

      {page < pages ? (
        <div className="mt-6 flex justify-center">
          <Button variant="secondary" onClick={() => setPage((value) => value + 1)}>
            Load more
          </Button>
        </div>
      ) : null}

      <ItemEditor item={editing} open={Boolean(editing)} onClose={() => setEditing(null)} onSaved={replaceItem} />
    </div>
  );
}

