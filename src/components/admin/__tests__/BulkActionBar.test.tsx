import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { BulkActionBar } from "@/components/admin/BulkActionBar";

describe("BulkActionBar", () => {
  const defaultProps = {
    selectedCount: 3,
    onApprove: vi.fn(),
    onReject: vi.fn(),
    onDelete: vi.fn(),
    isProcessing: false,
  };

  it("renders nothing when selectedCount is 0", () => {
    const { container } = render(
      <BulkActionBar {...defaultProps} selectedCount={0} />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("displays the selected count", () => {
    render(<BulkActionBar {...defaultProps} />);
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText(/posts selected/)).toBeInTheDocument();
  });

  it("uses singular 'post' when count is 1", () => {
    render(<BulkActionBar {...defaultProps} selectedCount={1} />);
    expect(screen.getByText(/post selected/)).toBeInTheDocument();
    expect(screen.queryByText(/posts selected/)).not.toBeInTheDocument();
  });

  it("renders Approve, Reject, and Delete buttons", () => {
    render(<BulkActionBar {...defaultProps} />);
    expect(screen.getByRole("button", { name: /approve/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /reject/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /delete$/i })).toBeInTheDocument();
  });

  it("calls onApprove when Approve button is clicked", async () => {
    const user = userEvent.setup();
    const onApprove = vi.fn();
    render(<BulkActionBar {...defaultProps} onApprove={onApprove} />);

    await user.click(screen.getByRole("button", { name: /approve/i }));
    expect(onApprove).toHaveBeenCalledOnce();
  });

  it("calls onReject when Reject button is clicked", async () => {
    const user = userEvent.setup();
    const onReject = vi.fn();
    render(<BulkActionBar {...defaultProps} onReject={onReject} />);

    await user.click(screen.getByRole("button", { name: /reject/i }));
    expect(onReject).toHaveBeenCalledOnce();
  });

  it("shows confirmation dialog before delete", async () => {
    const user = userEvent.setup();
    render(<BulkActionBar {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: /delete$/i }));

    // Confirmation dialog should appear
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText(/delete 3 posts\?/i)).toBeInTheDocument();
    expect(screen.getByText(/cannot be undone/i)).toBeInTheDocument();
  });

  it("calls onDelete after confirming delete", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(<BulkActionBar {...defaultProps} onDelete={onDelete} />);

    // Click delete to open confirmation
    await user.click(screen.getByRole("button", { name: /delete$/i }));

    // Confirm the deletion
    await user.click(screen.getByRole("button", { name: /delete permanently/i }));
    expect(onDelete).toHaveBeenCalledOnce();
  });

  it("closes confirmation dialog on cancel", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(<BulkActionBar {...defaultProps} onDelete={onDelete} />);

    // Click delete to open confirmation
    await user.click(screen.getByRole("button", { name: /delete$/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // Cancel
    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(onDelete).not.toHaveBeenCalled();
  });

  it("disables all buttons when isProcessing is true", () => {
    render(<BulkActionBar {...defaultProps} isProcessing={true} />);

    expect(screen.getByRole("button", { name: /approve/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /reject/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /delete$/i })).toBeDisabled();
  });

  it("has toolbar role with accessible label", () => {
    render(<BulkActionBar {...defaultProps} />);
    expect(screen.getByRole("toolbar", { name: /bulk actions/i })).toBeInTheDocument();
  });
});
