import type { InboxItem, User } from "@/types/domain";

export const user: User = {
  id: 1,
  name: "Pavan",
  email: "pavan@example.com",
  timezone: "Asia/Calcutta",
  created_at: "2026-09-29T10:00:00Z",
  updated_at: "2026-09-29T10:00:00Z"
};

export const inboxItem: InboxItem = {
  id: 42,
  raw_content: "Buy laptop charger tomorrow #errands",
  title: "Buy laptop charger tomorrow",
  description: "",
  type: "reminder",
  category: "upcoming",
  priority: "normal",
  status: "active",
  due_date: "2026-09-30",
  due_time: null,
  completed_at: null,
  archived_at: null,
  created_at: "2026-09-29T10:00:00Z",
  updated_at: "2026-09-29T10:00:00Z",
  tags: [{ id: 1, name: "errands", created_at: "2026-09-29T10:00:00Z" }],
  person: null,
  is_overdue: false
};

