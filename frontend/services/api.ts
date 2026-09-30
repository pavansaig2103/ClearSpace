import type {
  ApiEnvelope,
  AuthPayload,
  InboxItem,
  ItemCategory,
  Memory,
  Paginated,
  Person,
  SearchPayload,
  Summary,
  Tag,
  TodayPayload,
  User
} from "@/types/domain";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api";

type RequestOptions = RequestInit & {
  auth?: boolean;
};

type Tokens = {
  access: string;
  refresh: string;
};

let tokens: Tokens | null = null;

function isBrowser() {
  return typeof window !== "undefined";
}

export function loadStoredTokens() {
  if (!isBrowser()) return null;
  const raw = window.localStorage.getItem("clearspace.tokens");
  if (!raw) return null;
  try {
    tokens = JSON.parse(raw) as Tokens;
    return tokens;
  } catch {
    window.localStorage.removeItem("clearspace.tokens");
    return null;
  }
}

export function setStoredTokens(nextTokens: Tokens | null) {
  tokens = nextTokens;
  if (!isBrowser()) return;
  if (nextTokens) {
    window.localStorage.setItem("clearspace.tokens", JSON.stringify(nextTokens));
  } else {
    window.localStorage.removeItem("clearspace.tokens");
  }
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }
  if (options.auth !== false) {
    const current = tokens ?? loadStoredTokens();
    if (current?.access) headers.set("Authorization", `Bearer ${current.access}`);
  }

  let response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: "include"
  });

  if (response.status === 401 && options.auth !== false && !path.startsWith("/auth/refresh/")) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      headers.set("Authorization", `Bearer ${refreshed.access}`);
      response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers,
        credentials: "include"
      });
    }
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.ok === false) {
    throw new Error(payload?.error?.message ?? "Something went wrong. Please try again.");
  }
  return payload as T;
}

async function refreshAccessToken() {
  const current = tokens ?? loadStoredTokens();
  if (!current?.refresh) return null;
  const response = await fetch(`${API_URL}/auth/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh: current.refresh })
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.access) {
    setStoredTokens(null);
    return null;
  }
  const refreshed = {
    access: payload.access as string,
    refresh: (payload.refresh as string | undefined) ?? current.refresh
  };
  setStoredTokens(refreshed);
  return refreshed;
}

export const api = {
  async register(body: { name: string; email: string; password: string; timezone: string }) {
    const payload = await request<ApiEnvelope<AuthPayload>>("/auth/register/", {
      method: "POST",
      body: JSON.stringify(body),
      auth: false
    });
    setStoredTokens({ access: payload.data.access, refresh: payload.data.refresh });
    return payload.data;
  },
  async login(body: { email: string; password: string }) {
    const payload = await request<ApiEnvelope<AuthPayload>>("/auth/login/", {
      method: "POST",
      body: JSON.stringify(body),
      auth: false
    });
    setStoredTokens({ access: payload.data.access, refresh: payload.data.refresh });
    return payload.data;
  },
  async logout() {
    const current = tokens ?? loadStoredTokens();
    if (current?.refresh) {
      await request<ApiEnvelope<{ message: string }>>("/auth/logout/", {
        method: "POST",
        body: JSON.stringify({ refresh: current.refresh })
      }).catch(() => undefined);
    }
    setStoredTokens(null);
  },
  async me() {
    return (await request<ApiEnvelope<User>>("/auth/me/")).data;
  },
  async summary() {
    return (await request<ApiEnvelope<Summary>>("/summary/")).data;
  },
  async listInbox(params = "") {
    return await request<Paginated<InboxItem>>(`/inbox/${params}`);
  },
  async capture(raw_content: string) {
    return (await request<ApiEnvelope<InboxItem>>("/inbox/", {
      method: "POST",
      body: JSON.stringify({ raw_content })
    })).data;
  },
  async updateItem(id: number, body: Partial<InboxItem> & { tag_names?: string[]; person_id?: number | null }) {
    return (await request<ApiEnvelope<InboxItem>>(`/inbox/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(body)
    })).data;
  },
  async completeItem(id: number) {
    return (await request<ApiEnvelope<InboxItem>>(`/inbox/${id}/complete/`, { method: "POST" })).data;
  },
  async archiveItem(id: number) {
    return (await request<ApiEnvelope<InboxItem>>(`/inbox/${id}/archive/`, { method: "POST" })).data;
  },
  async restoreItem(id: number) {
    return (await request<ApiEnvelope<InboxItem>>(`/inbox/${id}/restore/`, { method: "POST" })).data;
  },
  async deleteItem(id: number) {
    return (await request<ApiEnvelope<{ message: string }>>(`/inbox/${id}/`, { method: "DELETE" })).data;
  },
  async scheduleItem(id: number, body: { due_date: string; due_time?: string | null }) {
    return (await request<ApiEnvelope<InboxItem>>(`/inbox/${id}/schedule/`, {
      method: "POST",
      body: JSON.stringify(body)
    })).data;
  },
  async moveItem(id: number, category: ItemCategory) {
    return (await request<ApiEnvelope<InboxItem>>(`/inbox/${id}/move/`, {
      method: "POST",
      body: JSON.stringify({ category })
    })).data;
  },
  async today() {
    return (await request<ApiEnvelope<TodayPayload>>("/today/")).data;
  },
  async ideas() {
    return (await request<ApiEnvelope<InboxItem[]>>("/ideas/")).data;
  },
  async followUps() {
    return (await request<ApiEnvelope<InboxItem[]>>("/follow-ups/")).data;
  },
  async search(params: string) {
    return (await request<ApiEnvelope<SearchPayload>>(`/search/${params}`)).data;
  },
  async people(q = "") {
    return (await request<ApiEnvelope<Person[]>>(`/people/${q ? `?q=${encodeURIComponent(q)}` : ""}`)).data;
  },
  async createPerson(body: Pick<Person, "name" | "relationship" | "notes"> & { last_contacted?: string | null }) {
    return (await request<ApiEnvelope<Person>>("/people/", {
      method: "POST",
      body: JSON.stringify(body)
    })).data;
  },
  async tags() {
    return (await request<ApiEnvelope<Tag[]>>("/tags/")).data;
  },
  async memories() {
    return await request<Paginated<Memory>>("/memories/");
  },
  async createMemory(body: { content: string; date?: string }) {
    return (await request<ApiEnvelope<Memory>>("/memories/", {
      method: "POST",
      body: JSON.stringify(body)
    })).data;
  },
  async clearMoment() {
    return (await request<ApiEnvelope<{ cleared: number }>>("/clear-space-moment/")).data;
  }
};

