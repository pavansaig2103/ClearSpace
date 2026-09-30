import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { CaptureBox } from "@/components/capture/CaptureBox";
import { inboxItem } from "./fixtures";

const capture = vi.fn();

vi.mock("@/services/api", () => ({
  api: {
    capture: (...args: unknown[]) => capture(...args)
  }
}));

describe("CaptureBox", () => {
  it("captures a thought and shows reassuring feedback", async () => {
    capture.mockResolvedValueOnce(inboxItem);
    const onCaptured = vi.fn();
    const user = userEvent.setup();

    render(<CaptureBox onCaptured={onCaptured} />);

    await user.type(screen.getByLabelText(/dump anything here/i), "Buy laptop charger tomorrow");
    await user.click(screen.getByRole("button", { name: /clear it out/i }));

    expect(capture).toHaveBeenCalledWith("Buy laptop charger tomorrow");
    expect(await screen.findByText(/your head is a little lighter/i)).toBeInTheDocument();
    expect(onCaptured).toHaveBeenCalledWith(inboxItem);
  });
});

