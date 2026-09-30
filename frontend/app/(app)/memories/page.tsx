"use client";

import { BookOpen, Plus } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState, LoadingState } from "@/components/feedback/InlineState";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { formatDateLong, friendlyError } from "@/lib/utils";
import { api } from "@/services/api";
import type { Memory } from "@/types/domain";

export default function MemoriesPage() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setError("");
    try {
      const payload = await api.memories();
      setMemories(payload.data);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      const memory = await api.createMemory({ content });
      setMemories((current) => [memory, ...current]);
      setContent("");
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl py-4 md:py-10">
      <header className="mb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-paper-100/38">Daily reflection</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.035em] text-paper-50 sm:text-6xl">What should stay?</h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-paper-100/56">A tiny place for the parts of the day worth remembering.</p>
      </header>

      <form className="glass-panel-strong rounded-[2rem] p-5" onSubmit={onSubmit}>
        <label className="block">
          <span className="mb-3 block text-lg font-medium text-paper-50">What would you like to remember from today?</span>
          <Textarea value={content} onChange={(event) => setContent(event.target.value)} rows={4} placeholder="A small moment, a lesson, a feeling..." />
        </label>
        <div className="mt-4 flex justify-end">
          <Button type="submit" variant="primary" icon={Plus} disabled={submitting || !content.trim()}>
            {submitting ? "Saving..." : "Save memory"}
          </Button>
        </div>
      </form>

      <section className="mt-10">
        {loading ? <LoadingState label="Opening the timeline..." /> : null}
        {error ? <ErrorState message={error} /> : null}
        {!loading && !error && memories.length === 0 ? (
          <div className="glass-panel rounded-[2rem]">
            <EmptyState icon={BookOpen} title="Nothing remembered yet.">
              One line is enough when something is worth keeping.
            </EmptyState>
          </div>
        ) : null}
        <div className="space-y-6">
          {memories.map((memory) => (
            <article key={memory.id} className="relative border-l border-white/10 pl-6">
              <span className="absolute -left-[5px] top-2 h-2.5 w-2.5 rounded-full bg-accent-300 shadow-[0_0_24px_rgba(34,211,238,0.42)]" />
              <p className="text-sm font-medium text-paper-100/62">{formatDateLong(memory.date)}</p>
              <p className="mt-2 rounded-3xl border border-white/8 bg-white/[0.05] p-4 text-base leading-7 text-paper-50">&quot;{memory.content}&quot;</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

