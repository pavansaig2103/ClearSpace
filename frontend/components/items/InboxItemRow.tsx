"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Archive, Calendar, Check, Edit3, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatRelativeDate, friendlyError } from "@/lib/utils";
import { api } from "@/services/api";
import type { InboxItem, ItemCategory } from "@/types/domain";

export function InboxItemRow({
  item,
  onChanged,
  onDeleted,
  onEdit,
  onCleared
}: {
  item: InboxItem;
  onChanged: (item: InboxItem) => void;
  onDeleted: (id: number) => void;
  onEdit: (item: InboxItem) => void;
  onCleared?: () => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [date, setDate] = useState(item.due_date ?? "");
  const [error, setError] = useState("");

  async function run(action: string, fn: () => Promise<InboxItem | void>) {
    setBusy(action);
    setError("");
    try {
      const result = await fn();
      if (result) onChanged(result);
      if (["complete", "archive", "move"].includes(action)) onCleared?.();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(null);
    }
  }

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      className="group border-b border-white/9 py-5 last:border-b-0"
    >
      <div className="flex gap-4">
        <button
          className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/12 bg-white/[0.045] text-paper-100/60 transition hover:border-accent-300/45 hover:text-accent-100"
          aria-label={`Complete ${item.title}`}
          disabled={busy !== null || item.status === "completed"}
          onClick={() => run("complete", () => api.completeItem(item.id))}
        >
          <Check className="h-4 w-4" aria-hidden />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-base font-medium leading-7 text-paper-50">{item.title}</h3>
              {item.description ? <p className="mt-1 line-clamp-2 text-sm leading-6 text-paper-100/52">{item.description}</p> : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge tone={item.type === "idea" ? "accent" : "neutral"}>{item.type}</Badge>
              <Badge tone={item.priority === "high" ? "warning" : "neutral"}>{item.priority}</Badge>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-paper-100/44">
            <span>{formatRelativeDate(item.due_date ?? item.created_at)}</span>
            <span>•</span>
            <span className="capitalize">{item.category.replace("_", " ")}</span>
            {item.person ? (
              <>
                <span>•</span>
                <span>{item.person.name}</span>
              </>
            ) : null}
            {item.tags.map((tag) => (
              <span key={tag.id} className="rounded-full bg-white/[0.06] px-2 py-1">
                #{tag.name}
              </span>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="ghost" size="sm" icon={Edit3} onClick={() => onEdit(item)}>
              Edit
            </Button>
            <Button variant="ghost" size="sm" icon={Calendar} onClick={() => setScheduleOpen((value) => !value)}>
              Schedule
            </Button>
            <select
              aria-label={`Move ${item.title}`}
              className="min-h-9 rounded-full border border-white/10 bg-white/[0.06] px-3 text-xs text-paper-100/72"
              value={item.category}
              disabled={busy !== null}
              onChange={(event) => run("move", () => api.moveItem(item.id, event.target.value as ItemCategory))}
            >
              <option className="bg-ink-900" value="today">Today</option>
              <option className="bg-ink-900" value="upcoming">Upcoming</option>
              <option className="bg-ink-900" value="follow_up">Follow up</option>
              <option className="bg-ink-900" value="idea">Idea</option>
              <option className="bg-ink-900" value="someday">Someday</option>
            </select>
            {item.status === "archived" ? (
              <Button variant="ghost" size="sm" onClick={() => run("restore", () => api.restoreItem(item.id))}>
                Restore
              </Button>
            ) : (
              <Button variant="ghost" size="sm" icon={Archive} onClick={() => run("archive", () => api.archiveItem(item.id))}>
                Archive
              </Button>
            )}
            <Button variant="danger" size="sm" icon={Trash2} onClick={() => run("delete", async () => {
              await api.deleteItem(item.id);
              onDeleted(item.id);
            })}>
              Delete
            </Button>
          </div>
          {scheduleOpen ? (
            <div className="mt-3 flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/[0.045] p-3 sm:flex-row sm:items-center">
              <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} aria-label="Schedule date" />
              <Button
                variant="primary"
                size="sm"
                disabled={!date || busy !== null}
                onClick={() => run("schedule", () => api.scheduleItem(item.id, { due_date: date }))}
              >
                Save date
              </Button>
            </div>
          ) : null}
          {error ? <p className="mt-3 text-sm text-red-100">{error}</p> : null}
        </div>
      </div>
    </motion.article>
  );
}

