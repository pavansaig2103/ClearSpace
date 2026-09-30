"use client";

import { AnimatePresence } from "framer-motion";
import { Search as SearchIcon, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState, LoadingState } from "@/components/feedback/InlineState";
import { InboxItemRow } from "@/components/items/InboxItemRow";
import { ItemEditor } from "@/components/items/ItemEditor";
import { Input } from "@/components/ui/Input";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { friendlyError } from "@/lib/utils";
import { api } from "@/services/api";
import type { InboxItem, ItemCategory, ItemStatus, ItemType, Person } from "@/types/domain";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<ItemType | "">("");
  const [category, setCategory] = useState<ItemCategory | "">("");
  const [status, setStatus] = useState<ItemStatus | "">("");
  const [dateFilter, setDateFilter] = useState("");
  const [tag, setTag] = useState("");
  const [items, setItems] = useState<InboxItem[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<InboxItem | null>(null);
  const debounced = useDebouncedValue(query, 320);

  const params = useMemo(() => {
    const search = new URLSearchParams();
    if (debounced.trim()) search.set("q", debounced.trim());
    if (type) search.set("type", type);
    if (category) search.set("category", category);
    if (status) search.set("status", status);
    if (dateFilter) search.set("date", dateFilter);
    if (tag.trim()) search.set("tag", tag.trim());
    return search.toString();
  }, [category, dateFilter, debounced, status, tag, type]);

  useEffect(() => {
    if (!debounced.trim()) {
      setItems([]);
      setPeople([]);
      return;
    }
    setLoading(true);
    setError("");
    api
      .search(`?${params}`)
      .then((payload) => {
        setItems(payload.items);
        setPeople(payload.people);
      })
      .catch((err) => setError(friendlyError(err)))
      .finally(() => setLoading(false));
  }, [debounced, params]);

  function replaceItem(item: InboxItem) {
    setItems((current) => current.map((entry) => (entry.id === item.id ? item : entry)));
  }

  return (
    <div className="mx-auto max-w-6xl py-4 md:py-10">
      <header className="mb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-paper-100/38">Search</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.035em] text-paper-50 sm:text-6xl">Find the thought.</h1>
      </header>

      <section className="glass-panel-strong rounded-[2rem] p-4 sm:p-5">
        <label className="block">
          <span className="sr-only">Search ClearSpace</span>
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search tasks, ideas, follow-ups, people, archived items..."
            className="min-h-14 rounded-[1.5rem] text-base"
          />
        </label>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <FilterSelect label="Type" value={type} onChange={(value) => setType(value as ItemType | "")} options={["", "task", "reminder", "idea", "note", "follow_up"]} />
          <FilterSelect label="Category" value={category} onChange={(value) => setCategory(value as ItemCategory | "")} options={["", "today", "upcoming", "follow_up", "idea", "someday"]} />
          <FilterSelect label="Status" value={status} onChange={(value) => setStatus(value as ItemStatus | "")} options={["", "active", "completed", "archived"]} />
          <FilterSelect label="Date" value={dateFilter} onChange={setDateFilter} options={["", "today", "tomorrow", "this_week", "no_date"]} />
          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-[0.16em] text-paper-100/38">Tag</span>
            <Input value={tag} onChange={(event) => setTag(event.target.value)} placeholder="home" />
          </label>
        </div>
      </section>

      <section className="mt-8">
        {loading ? <LoadingState label="Searching quietly..." /> : null}
        {error ? <ErrorState message={error} /> : null}
        {!query.trim() ? (
          <div className="glass-panel rounded-[2rem]">
            <EmptyState icon={SearchIcon} title="Search across your space.">
              Try a person, tag, half-remembered idea, or something you archived.
            </EmptyState>
          </div>
        ) : null}
        {query.trim() && !loading && !error && items.length === 0 && people.length === 0 ? (
          <div className="glass-panel rounded-[2rem]">
            <EmptyState icon={SearchIcon} title="Nothing surfaced.">
              Try a softer word or remove a filter.
            </EmptyState>
          </div>
        ) : null}

        {people.length > 0 ? (
          <div className="mb-8">
            <p className="mb-3 text-xs uppercase tracking-[0.18em] text-paper-100/38">People</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {people.map((person) => (
                <div key={person.id} className="glass-panel rounded-3xl p-4">
                  <UserRound className="mb-4 h-5 w-5 text-accent-100" aria-hidden />
                  <h2 className="font-medium text-paper-50">{person.name}</h2>
                  <p className="mt-1 text-sm text-paper-100/48">{person.relationship || "No relationship set"}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {items.length > 0 ? (
          <div className="glass-panel rounded-[2rem] px-4 sm:px-6">
            <AnimatePresence initial={false}>
              {items.map((item) => (
                <InboxItemRow
                  key={item.id}
                  item={item}
                  onChanged={replaceItem}
                  onDeleted={(id) => setItems((current) => current.filter((entry) => entry.id !== id))}
                  onEdit={setEditing}
                />
              ))}
            </AnimatePresence>
          </div>
        ) : null}
      </section>

      <ItemEditor item={editing} open={Boolean(editing)} onClose={() => setEditing(null)} onSaved={replaceItem} />
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs uppercase tracking-[0.16em] text-paper-100/38">{label}</span>
      <select className="min-h-11 w-full rounded-2xl border border-white/10 bg-ink-900 px-3 text-sm text-paper-50" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option || "any"} value={option}>
            {option ? option.replace("_", " ") : "Any"}
          </option>
        ))}
      </select>
    </label>
  );
}

