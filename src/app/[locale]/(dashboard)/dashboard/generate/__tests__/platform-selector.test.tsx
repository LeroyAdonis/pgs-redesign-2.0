/**
 * @vitest-environment happy-dom
 */

/**
 * Tests for the PlatformSelector component.
 *
 * Verifies rendering, toggle behavior, and multi-select support.
 */

import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, afterEach } from "vitest";
import { PlatformSelector } from "../_components/PlatformSelector";

describe("PlatformSelector", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders all five platforms", () => {
    render(<PlatformSelector selected={[]} onChange={vi.fn()} />);

    expect(screen.getByText("Instagram")).toBeInTheDocument();
    expect(screen.getByText("Facebook")).toBeInTheDocument();
    expect(screen.getByText("X (Twitter)")).toBeInTheDocument();
    expect(screen.getByText("LinkedIn")).toBeInTheDocument();
    expect(screen.getByText("TikTok")).toBeInTheDocument();
  });

  it("marks selected platforms with aria-pressed=true", () => {
    render(
      <PlatformSelector selected={["instagram", "facebook"]} onChange={vi.fn()} />,
    );

    const igButton = screen.getByText("Instagram").closest("button");
    const fbButton = screen.getByText("Facebook").closest("button");
    const twButton = screen.getByText("X (Twitter)").closest("button");

    expect(igButton).toHaveAttribute("aria-pressed", "true");
    expect(fbButton).toHaveAttribute("aria-pressed", "true");
    expect(twButton).toHaveAttribute("aria-pressed", "false");
  });

  it("calls onChange with added platform when toggling on", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<PlatformSelector selected={["instagram"]} onChange={onChange} />);

    await user.click(screen.getByText("Facebook"));

    expect(onChange).toHaveBeenCalledWith(["instagram", "facebook"]);
  });

  it("calls onChange with removed platform when toggling off", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <PlatformSelector selected={["instagram", "facebook"]} onChange={onChange} />,
    );

    await user.click(screen.getByText("Instagram"));

    expect(onChange).toHaveBeenCalledWith(["facebook"]);
  });

  it("supports multi-select by not clearing previous selections", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<PlatformSelector selected={[]} onChange={onChange} />);

    await user.click(screen.getByText("Instagram"));
    expect(onChange).toHaveBeenCalledWith(["instagram"]);
  });
});
