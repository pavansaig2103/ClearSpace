"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Bell, Check, Plus, UserRound } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState, LoadingState } from "@/components/feedback/InlineState";
import { ItemEditor } from "@/components/items/ItemEditor";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Textarea";
import { emitAmbientPulse } from "@/lib/ambient";
import { formatRelativeDate, friendlyError } from "@/lib/utils";
import { api } from "@/services/api";
import type { InboxItem, Person } from "@/types/domain";

export default function FollowUpsPage() {
  const [items, setItems] = useState<InboxItem[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [personModal, setPersonModal] = useState(false);
  const [editing, setEditing] = useState<InboxItem | null>(null);

  async function load() {
    setError("");
    try {
      const [followUps, peopleData] = await Promise.all([api.followUps(), api.people()]);
      setItems(followUps);
      setPeople(peopleData);
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
      setItems((current) => current.filter((entry) => entry.id !== done.id));
      emitAmbientPulse();
    } catch (err) {
      setError(friendlyError(err));
    }
  }

  async function remindTomorrow(item: InboxItem) {
    setError("");
    try {
      const date = new Date();
      date.setDate(date.getDate() + 1);
      const updated = await api.scheduleItem(item.id, { due_date: date.toISOString().slice(0, 10) });
      setItems((current) => current.map((entry) => (entry.id === item.id ? updated : entry)));
    } catch (err) {
      setError(friendlyError(err));
    }
  }

  function replaceItem(item: InboxItem) {
    setItems((current) => current.map((entry) => (entry.id === item.id ? item : entry)));
  }

  return (
    <div className="mx-auto max-w-6xl py-4 md:py-10">
      <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-paper-100/38">Follow Up</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.035em] text-paper-50 sm:text-6xl">People, not pings.</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-paper-100/56">Keep social loops from floating around in your head.</p>
        </div>
        <Button icon={Plus} variant="primary" onClick={() => setPersonModal(true)}>
          Add person
        </Button>
      </header>

      {loading ? <LoadingState label="Looking for open loops..." /> : null}
      {error ? <ErrorState message={error} /> : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
        <section className="space-y-4">
          {!loading && !error && items.length === 0 ? (
            <div className="glass-panel rounded-[2rem]">
              <EmptyState icon={UserRound} title="No open follow-ups.">
                Nobody is waiting on you here.
              </EmptyState>
            </div>
          ) : null}
          <AnimatePresence>
            {items.map((item) => (
              <motion.article
                key={item.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="glass-panel rounded-[2rem] p-5"
              >
                <p className="text-xs uppercase tracking-[0.18em] text-paper-100/38">Follow up</p>
                <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold tracking-[-0.02em] text-paper-50">{item.person?.name ?? "Someone"}</h2>
                    <p className="mt-2 text-sm text-paper-100/48">
                      {item.person?.last_contacted ? `Last contacted ${formatRelativeDate(item.person.last_contacted).toLowerCase()}` : "No last contact date yet"}
                    </p>
                    <p className="mt-5 text-base leading-7 text-paper-100/72">&quot;{item.raw_content}&quot;</p>
                  </div>
                  <div className="flex flex-wrap gap-2 sm:justify-end">
                    <Button variant="secondary" icon={Bell} onClick={() => remindTomorrow(item)}>
                      Remind me
                    </Button>
                    <Button variant="primary" icon={Check} onClick={() => complete(item)}>
                      Done
                    </Button>
                    <Button variant="ghost" onClick={() => setEditing(item)}>
                      Edit
                    </Button>
                  </div>
                </div>
                {item.due_date ? <p className="mt-4 text-xs text-accent-100">Reminder set for {formatRelativeDate(item.due_date).toLowerCase()}.</p> : null}
              </motion.article>
            ))}
          </AnimatePresence>
        </section>

        <aside className="glass-panel h-fit rounded-[2rem] p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-paper-100/38">People</p>
          <div className="mt-4 space-y-3">
            {people.length === 0 ? (
              <p className="text-sm leading-6 text-paper-100/52">Add a person when a follow-up has a real human attached.</p>
            ) : (
              people.slice(0, 8).map((person) => (
                <div key={person.id} className="rounded-2xl border border-white/8 bg-white/[0.045] p-3">
                  <p className="font-medium text-paper-50">{person.name}</p>
                  <p className="mt-1 text-xs text-paper-100/42">{person.relationship || "No relationship set"}</p>
                </div>
              ))
            )}
          </div>
        </aside>
      </div>

      <PersonModal
        open={personModal}
        onClose={() => setPersonModal(false)}
        onCreated={(person) => {
          setPeople((current) => [person, ...current]);
          setPersonModal(false);
        }}
      />
      <ItemEditor item={editing} open={Boolean(editing)} onClose={() => setEditing(null)} onSaved={replaceItem} />
    </div>
  );
}

function PersonModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (person: Person) => void }) {
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [notes, setNotes] = useState("");
  const [lastContacted, setLastContacted] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const person = await api.createPerson({ name, relationship, notes, last_contacted: lastContacted || null });
      setName("");
      setRelationship("");
      setNotes("");
      setLastContacted("");
      onCreated(person);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} title="Add a person" onClose={onClose}>
      <form className="space-y-4" onSubmit={onSubmit}>
        <label className="block">
          <span className="mb-2 block text-sm text-paper-100/62">Name</span>
          <Input value={name} onChange={(event) => setName(event.target.value)} required />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm text-paper-100/62">Relationship</span>
          <Input value={relationship} onChange={(event) => setRelationship(event.target.value)} placeholder="Friend, professor, colleague" />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm text-paper-100/62">Last contacted</span>
          <Input type="date" value={lastContacted} onChange={(event) => setLastContacted(event.target.value)} />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm text-paper-100/62">Notes</span>
          <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} />
        </label>
        {error ? <p className="text-sm text-red-100">{error}</p> : null}
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? "Saving..." : "Save person"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

