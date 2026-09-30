"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Archive, Edit3, Lightbulb, Moon } from "lucide-react";
import { useEffect, useState } from "react";

import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState, LoadingState } from "@/components/feedback/InlineState";
import { ItemEditor } from "@/components/items/ItemEditor";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { emitAmbientPulse } from "@/lib/ambient";
import { formatRelativeDate, friendlyError } from "@/lib/utils";
import { api } from "@/services/api";
import type { InboxItem } from "@/types/domain";

export default function IdeasPage() {
  const [ideas, setIdeas] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<InboxItem | null>(null);
  const [editing, setEditing] = useState<InboxItem | null>(null);

  async function load() {
    setError("");
    try {
      setIdeas(await api.ideas());
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function archive(item: InboxItem) {
    setError("");
    try {
      await api.archiveItem(item.id);
      setIdeas((current) => current.filter((idea) => idea.id !== item.id));
      if (selected?.id === item.id) setSelected(null);
      emitAmbientPulse();
    } catch (err) {
      setError(friendlyError(err));
    }
  }

  function replaceItem(item: InboxItem) {
    setIdeas((current) => current.map((idea) => (idea.id === item.id ? item : idea)));
    setSelected(item);
  }

  return (
    <div className="mx-auto max-w-6xl py-4 md:py-10">
      <header className="mb-10">
        <p className="text-xs uppercase tracking-[0.2em] text-paper-100/38">Ideas</p>
        <h1 className="mt-3 max-w-2xl text-4xl font-semibold tracking-[-0.035em] text-paper-50 sm:text-6xl">
          A visual place for maybe.
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-paper-100/56">
          Ideas can wait without becoming unfinished tasks.
        </p>
      </header>

      {loading ? <LoadingState label="Gathering the sparks..." /> : null}
      {error ? <ErrorState message={error} /> : null}

      {!loading && !error && ideas.length === 0 ? (
        <div className="glass-panel rounded-[2rem]">
          <EmptyState icon={Moon} title="Nothing here yet.">
            Your next interesting thought might be closer than you think.
          </EmptyState>
        </div>
      ) : null}

      <div className="columns-1 gap-5 sm:columns-2 lg:columns-3">
        <AnimatePresence>
          {ideas.map((idea, index) => (
            <motion.article
              key={idea.id}
              layout
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ delay: index * 0.025 }}
              className="mb-5 break-inside-avoid"
            >
              <button
                className="glass-panel group w-full rounded-[2rem] p-6 text-left transition hover:-translate-y-1 hover:border-accent-300/22 hover:bg-white/[0.075]"
                onClick={() => setSelected(idea)}
              >
                <div className="mb-8 grid h-12 w-12 place-items-center rounded-full border border-accent-300/16 bg-accent-300/10 text-accent-100">
                  <Lightbulb className="h-5 w-5" aria-hidden />
                </div>
                <h2 className="text-xl font-semibold leading-7 tracking-[-0.02em] text-paper-50">{idea.title.replace(/^idea:\s*/i, "")}</h2>
                <p className="mt-4 line-clamp-4 text-sm leading-6 text-paper-100/52">{idea.raw_content}</p>
                <p className="mt-6 text-xs text-paper-100/38">Captured {formatRelativeDate(idea.created_at).toLowerCase()}</p>
              </button>
            </motion.article>
          ))}
        </AnimatePresence>
      </div>

      <Modal open={Boolean(selected)} title="Idea" onClose={() => setSelected(null)}>
        {selected ? (
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-paper-100/38">Captured {formatRelativeDate(selected.created_at)}</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-paper-50">{selected.title}</h2>
            <p className="mt-5 whitespace-pre-wrap text-base leading-8 text-paper-100/66">{selected.raw_content}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button icon={Edit3} variant="secondary" onClick={() => setEditing(selected)}>
                Edit
              </Button>
              <Button icon={Archive} variant="ghost" onClick={() => archive(selected)}>
                Archive
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
      <ItemEditor item={editing} open={Boolean(editing)} onClose={() => setEditing(null)} onSaved={replaceItem} />
    </div>
  );
}

