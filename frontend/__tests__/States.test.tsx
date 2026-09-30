import { render, screen } from "@testing-library/react";
import { Moon } from "lucide-react";
import { describe, expect, it } from "vitest";

import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/InlineState";

describe("feedback states", () => {
  it("renders a specific empty state", () => {
    render(
      <EmptyState icon={Moon} title="Your head is quiet.">
        Nothing waiting for you right now.
      </EmptyState>
    );
    expect(screen.getByText("Your head is quiet.")).toBeInTheDocument();
    expect(screen.getByText("Nothing waiting for you right now.")).toBeInTheDocument();
  });

  it("renders a friendly error state", () => {
    render(<ErrorState message="Something went wrong while saving that. Please try again." />);
    expect(screen.getByRole("alert")).toHaveTextContent("Please try again");
  });
});

