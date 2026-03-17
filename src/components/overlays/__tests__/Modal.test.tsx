import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, afterEach } from 'vitest';

import { Modal } from '@/components/overlays/Modal';

/* ── Helpers ── */

function renderModal(props: Partial<React.ComponentProps<typeof Modal>> = {}) {
  const onClose = props.onClose ?? vi.fn();
  const result = render(
    <Modal isOpen onClose={onClose} {...props}>
      {props.children ?? <p>Modal body content</p>}
    </Modal>,
  );
  return { ...result, onClose };
}

afterEach(() => {
  // Restore body overflow in case a test leaves it locked
  document.body.style.overflow = '';
});

/* ── Tests ── */

describe('Modal', () => {
  /* ─── Open / Close lifecycle ─── */

  describe('open / close states', () => {
    it('renders nothing when isOpen is false', () => {
      render(
        <Modal isOpen={false} onClose={vi.fn()}>
          Hidden content
        </Modal>,
      );
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('renders the dialog when isOpen is true', () => {
      renderModal();
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('renders children inside the dialog', () => {
      renderModal({ children: <p>Hello world</p> });
      expect(screen.getByText('Hello world')).toBeInTheDocument();
    });

    it('removes the dialog from DOM when isOpen transitions to false', () => {
      const { rerender } = render(
        <Modal isOpen onClose={vi.fn()}>
          Content
        </Modal>,
      );
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      rerender(
        <Modal isOpen={false} onClose={vi.fn()}>
          Content
        </Modal>,
      );
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  /* ─── Portal rendering ─── */

  describe('portal rendering', () => {
    it('renders the dialog as a direct child of document.body', () => {
      renderModal();
      const dialog = screen.getByRole('dialog');
      // Portal renders into document.body — the dialog's ancestor should be body
      expect(document.body.contains(dialog)).toBe(true);
    });
  });

  /* ─── Title / header ─── */

  describe('title and header', () => {
    it('displays the title as a heading when provided', () => {
      renderModal({ title: 'Confirm action' });
      expect(
        screen.getByRole('heading', { name: /confirm action/i }),
      ).toBeInTheDocument();
    });

    it('sets aria-label on the dialog to the title', () => {
      renderModal({ title: 'Settings' });
      expect(screen.getByRole('dialog')).toHaveAttribute(
        'aria-label',
        'Settings',
      );
    });

    it('still renders a close button when no title is provided', () => {
      renderModal();
      expect(
        screen.getByRole('button', { name: /close modal/i }),
      ).toBeInTheDocument();
    });
  });

  /* ─── Footer ─── */

  describe('footer', () => {
    it('renders footer content when the footer prop is provided', () => {
      renderModal({
        footer: <button type="button">Save</button>,
      });
      expect(
        screen.getByRole('button', { name: /save/i }),
      ).toBeInTheDocument();
    });

    it('does not render a footer section when footer prop is omitted', () => {
      const { container } = renderModal();
      // The footer wrapper has a border-t class — there should be none
      const dialog = screen.getByRole('dialog');
      const footerDiv = dialog.querySelector('.border-t');
      expect(footerDiv).toBeNull();
    });
  });

  /* ─── Sizes ─── */

  describe('sizes', () => {
    it.each([
      ['sm', 'w-[400px]'],
      ['md', 'w-[520px]'],
      ['lg', 'w-[680px]'],
    ] as const)('applies %s size class', (size, expectedClass) => {
      renderModal({ size });
      expect(screen.getByRole('dialog').className).toContain(expectedClass);
    });

    it('defaults to md size', () => {
      renderModal();
      expect(screen.getByRole('dialog').className).toContain('w-[520px]');
    });
  });

  /* ─── Custom className ─── */

  describe('custom className', () => {
    it('merges custom className onto the dialog panel', () => {
      renderModal({ className: 'my-custom-modal' });
      expect(screen.getByRole('dialog').className).toContain(
        'my-custom-modal',
      );
    });
  });

  /* ─── Accessibility attributes ─── */

  describe('accessibility', () => {
    it('has role="dialog" and aria-modal="true"', () => {
      renderModal();
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });
  });

  /* ─── Close button click ─── */

  describe('close button', () => {
    it('calls onClose when the close button is clicked', async () => {
      const user = userEvent.setup();
      const { onClose } = renderModal({ title: 'Test' });

      await user.click(
        screen.getByRole('button', { name: /close modal/i }),
      );
      expect(onClose).toHaveBeenCalledOnce();
    });
  });

  /* ─── Escape key ─── */

  describe('Escape key dismiss', () => {
    it('calls onClose when Escape is pressed', async () => {
      const user = userEvent.setup();
      const { onClose } = renderModal();

      await user.keyboard('{Escape}');
      expect(onClose).toHaveBeenCalledOnce();
    });

    it('does not call onClose for other keys', async () => {
      const user = userEvent.setup();
      const { onClose } = renderModal({
        children: <input type="text" data-testid="text-input" />,
      });

      // Focus a non-button element so Enter doesn't trigger a click
      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        expect(dialog.contains(document.activeElement)).toBe(true);
      });
      screen.getByTestId('text-input').focus();

      await user.keyboard('{Enter}');
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  /* ─── Backdrop click dismiss ─── */

  describe('backdrop click dismiss', () => {
    it('calls onClose when clicking the backdrop area', async () => {
      const user = userEvent.setup();
      const { onClose } = renderModal();

      // The centering wrapper with role="presentation" handles backdrop clicks
      const backdrop = screen.getByRole('presentation');
      await user.click(backdrop);
      expect(onClose).toHaveBeenCalledOnce();
    });

    it('does not call onClose when clicking inside the dialog panel', async () => {
      const user = userEvent.setup();
      const { onClose } = renderModal({
        children: <p>Inner content</p>,
      });

      await user.click(screen.getByText('Inner content'));
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  /* ─── Focus management ─── */

  describe('focus management', () => {
    it('moves focus into the modal when opened', async () => {
      renderModal({
        children: <button type="button">Focusable</button>,
      });

      await waitFor(() => {
        // The close button (in header) or the first focusable child should be focused
        const dialog = screen.getByRole('dialog');
        expect(dialog.contains(document.activeElement)).toBe(true);
      });
    });

    it('traps Tab focus within the modal', async () => {
      const user = userEvent.setup();
      renderModal({
        title: 'Trap test',
        children: (
          <>
            <button type="button">First</button>
            <button type="button">Second</button>
          </>
        ),
        footer: <button type="button">Footer btn</button>,
      });

      // Wait for auto-focus to settle
      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        expect(dialog.contains(document.activeElement)).toBe(true);
      });

      // Tab through all focusable elements — the close button + children + footer
      // After the last one, focus should wrap to the first
      const focusableButtons = screen.getAllByRole('button');
      const lastButton = focusableButtons[focusableButtons.length - 1];

      // Focus the last button and Tab — should wrap to first
      lastButton.focus();
      await user.tab();

      // After wrapping, focus should still be inside the dialog
      const dialog = screen.getByRole('dialog');
      expect(dialog.contains(document.activeElement)).toBe(true);
    });
  });

  /* ─── Body scroll lock ─── */

  describe('body scroll lock', () => {
    it('sets body overflow to hidden when open', () => {
      renderModal();
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('restores body overflow when closed', () => {
      document.body.style.overflow = 'auto';

      const { unmount } = render(
        <Modal isOpen onClose={vi.fn()}>
          Content
        </Modal>,
      );
      expect(document.body.style.overflow).toBe('hidden');

      unmount();
      expect(document.body.style.overflow).toBe('auto');
    });
  });
});
