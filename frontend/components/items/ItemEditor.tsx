"use client";

import { FormEvent, useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Textarea";
import { friendlyError } from "@/lib/utils";
import { api } from "@/services/api";
import type { InboxItem, ItemCategory, ItemPriority, ItemType, Person } from "@/types/domain";

const types: ItemType[] = ["task", "reminder", "idea", "note", "follow_up"];
const categories: ItemCategory[] = ["today", "upcoming", "follow_up", "idea", "someday"];
const priorities: ItemPriority[] = ["low", "normal", "high"];

export function ItemEditor({
  item,
  open,
  onClose,
  onSaved
}: {
  item: InboxItem | null;
  open: boolean;
  onClose: () => void;
  onSaved: (item: InboxItem) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<ItemType>("note");
  const [category, setCategory] = useState<ItemCategory>("someday");
  const [priority, setPriority] = useState<ItemPriority>("normal");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [tags, setTags] = useState("");
  const [people, setPeople] = useState<Person[]>([]);
  const [personId, setPersonId] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!item) return;
    setTitle(item.title);
    setDescription(item.description);
    setType(item.type);
    setCategory(item.category);
    setPriority(item.priority);
    setDueDate(item.due_date ?? "");
    setDueTime(item.due_time?.slice(0, 5) ?? "");
    setTags(item.tags.map((tag) => tag.name).join(", "));
    setPersonId(item.person?.id ? String(item.person.id) : "");
  }, [item]);

  useEffect(() => {
    if (!open) return;
    api.people().then(setPeople).catch(() => undefined);
  }, [open]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!item) return;
    setSubmitting(true);
    setError("");
    try {
      const saved = await api.updateItem(item.id, {
        title,
        description,
        type,
        category,
        priority,
        due_date: dueDate || null,
        due_time: dueTime || null,
        tag_names: tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        person_id: personId ? Number(personId) : null
      });
      onSaved(saved);
      onClose();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open && Boolean(item)} title="Shape this thought" onClose={onClose}>
      <form className="space-y-4" onSubmit={onSubmit}>
        <label className="block">
          <span className="mb-2 block text-sm text-paper-100/62">Title</span>
          <Input value={title} onChange={(event) => setTitle(event.target.value)} required />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm text-paper-100/62">Description</span>
          <Textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={4} />
        </label>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block">
            <span className="mb-2 block text-sm text-paper-100/62">Type</span>
            <select className="min-h-11 w-full rounded-2xl border border-white/10 bg-ink-900 px-3 text-sm" value={type} onChange={(event) => setType(event.target.value as ItemType)}>
              {types.map((option) => (
                <option key={option} value={option}>
                  {option.replace("_", " ")}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm text-paper-100/62">Category</span>
            <select className="min-h-11 w-full rounded-2xl border border-white/10 bg-ink-900 px-3 text-sm" value={category} onChange={(event) => setCategory(event.target.value as ItemCategory)}>
              {categories.map((option) => (
                <option key={option} value={option}>
                  {option.replace("_", " ")}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm text-paper-100/62">Priority</span>
            <select className="min-h-11 w-full rounded-2xl border border-white/10 bg-ink-900 px-3 text-sm" value={priority} onChange={(event) => setPriority(event.target.value as ItemPriority)}>
              {priorities.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block">
            <span className="mb-2 block text-sm text-paper-100/62">Due date</span>
            <Input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm text-paper-100/62">Due time</span>
            <Input type="time" value={dueTime} onChange={(event) => setDueTime(event.target.value)} />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm text-paper-100/62">Person</span>
            <select className="min-h-11 w-full rounded-2xl border border-white/10 bg-ink-900 px-3 text-sm" value={personId} onChange={(event) => setPersonId(event.target.value)}>
              <option value="">None</option>
              {people.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="block">
          <span className="mb-2 block text-sm text-paper-100/62">Tags</span>
          <Input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="college, errands, home" />
        </label>
        {error ? <p className="text-sm text-red-100">{error}</p> : null}
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

