import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AppShell } from "@/components/layout/AppShell";
import { user } from "./fixtures";

vi.mock("next/navigation", () => ({
  usePathname: () => "/home",
  useRouter: () => ({ replace: vi.fn() })
}));

vi.mock("@/features/auth/AuthProvider", () => ({
  useAuth: () => ({
    user,
    loading: false,
    logout: vi.fn()
  })
}));

describe("AppShell", () => {
  it("renders primary navigation and mobile more navigation", () => {
    render(
      <AppShell>
        <div>Page content</div>
      </AppShell>
    );

    expect(screen.getAllByText("Home").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Inbox").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Today").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Ideas").length).toBeGreaterThan(0);
    expect(screen.getByText("Page content")).toBeInTheDocument();
  });
});

