/**
 * @fileMetadata
 * @owner @ai-team
 * @purpose "Brief description of file purpose"
 * @dependencies ["package1", "package2"]
 * @status stable
 * @ai-integration multi-provider
 * @insurance-context claims
 * @supabase-integration edge-functions
 */
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import Header from "./header";

describe("Header", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the ClaimGuardian title parts", () => {
    render(<Header onProfileClick={() => {}} />);
    expect(screen.getByText("Claim")).toBeInTheDocument();
    expect(screen.getByText("Guardian")).toBeInTheDocument();
  });

  it("renders the bell icon button", () => {
    render(<Header onProfileClick={() => {}} />);
    // The button contains a bell SVG but no aria-label, so we find by role
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(2); // Bell button + user avatar button
  });

  it("renders the user avatar button", () => {
    render(<Header onProfileClick={() => {}} />);
    expect(
      screen.getByRole("button", { name: /user avatar/i }),
    ).toBeInTheDocument();
  });
});
