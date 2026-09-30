export type ItemType = "task" | "reminder" | "idea" | "note" | "follow_up";
export type ItemCategory = "today" | "upcoming" | "follow_up" | "idea" | "someday";
export type ItemPriority = "low" | "normal" | "high";
export type ItemStatus = "active" | "completed" | "archived";

export type User = {
  id: number;
  name: string;
  email: string;
  timezone: string;
  created_at: string;
  updated_at: string;
};

export type Tag = {
  id: number;
  name: string;
  created_at: string;
};

export type Person = {
  id: number;
  name: string;
  relationship: string;
  notes: string;
  last_contacted: string | null;
  created_at: string;
  updated_at: string;
};

export type InboxItem = {
  id: number;
  raw_content: string;
  title: string;
  description: string;
  type: ItemType;
  category: ItemCategory;
  priority: ItemPriority;
  status: ItemStatus;
  due_date: string | null;
  due_time: string | null;
  completed_at: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
  tags: Tag[];
  person: Person | null;
  is_overdue: boolean;
};

export type Memory = {
  id: number;
  content: string;
  date: string;
  created_at: string;
  updated_at: string;
};

export type Summary = {
  today: number;
  upcoming: number;
  ideas: number;
  follow_ups: number;
  completed_this_week: number;
};

export type TodayPayload = {
  date: string;
  must_handle: InboxItem[];
  today: InboxItem[];
  quick_wins: InboxItem[];
  done: InboxItem[];
};

export type SearchPayload = {
  items: InboxItem[];
  people: Person[];
};

export type Paginated<T> = {
  ok: true;
  data: T[];
  meta: {
    count: number;
    next: string | null;
    previous: string | null;
    page: number;
    pages: number;
  };
};

export type ApiEnvelope<T> = {
  ok: true;
  data: T;
};

export type ApiErrorEnvelope = {
  ok: false;
  error: {
    message: string;
    code: string;
    details?: unknown;
  };
};

export type AuthPayload = {
  access: string;
  refresh: string;
  user: User;
};

