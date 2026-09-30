import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { InboxItemRow } from "@/components/items/InboxItemRow";
import { inboxItem } from "./fixtures";

const completeItem = vi.fn();

vi.mock("@/services/api", () => ({
  api: {
    completeItem: (...args: unknown[]) => completeItem(...args),
    archiveItem: vi.fn(),
    restoreItem: vi.fn(),
    deleteItem: vi.fn(),
    scheduleItem: vi.fn(),
    moveItem: vi.fn()
  }
}));

describe("InboxItemRow", () => {
  it("completes an item through the API and reports the changed item", async () => {
    const completed = { ...inboxItem, status: "completed" as const, completed_at: "2026-09-29T12:00:00Z" };
    completeItem.mockResolvedValueOnce(completed);
    const onChanged = vi.fn();
    const user = userEvent.setup();

    render(<InboxItemRow item={inboxItem} onChanged={onChanged} onDeleted={vi.fn()} onEdit={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /complete buy laptop charger/i }));

    expect(completeItem).toHaveBeenCalledWith(inboxItem.id);
    expect(onChanged).toHaveBeenCalledWith(completed);
  });
});

