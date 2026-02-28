import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, afterEach } from 'vitest';

import { Drawer } from '@/components/overlays/Drawer';

/* ── Helpers ── */

function renderDrawer(
  props: Partial<React.ComponentProps<typeof Drawer>> = {},
) {
  const onClose = props.onClose ?? vi.fn();
  const result = render(
    <Drawer isOpen onClose={onClose} {...props}>
      {props.children ?? <p>Drawer body content</p>}
    </Drawer>,
  );
  return { ...result, onClose };
}

afterEach(() => {
  document.body.style.overflow = '';
});

/* ── Tests ── */

describe('Drawer', () => {
  /* ─── Open / Close lifecycle ─── */

  describe('open / close states', () => {
    it('renders nothing when isOpen is false', () => {
      render(
        <Drawer isOpen={false} onClose={vi.fn()}>
          Hidden content
        </Drawer>,
      );
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('renders the dialog when isOpen is true', () => {
      renderDrawer();
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('renders children inside the drawer', () => {
      renderDrawer({ children: <p>Drawer child</p> });
      expect(screen.getByText('Drawer child')).toBeInTheDocument();
    });

    it('removes the dialog from DOM when isOpen transitions to false', () => {
      const { rerender } = render(
        <Drawer isOpen onClose={vi.fn()}>
          Content
        </Drawer>,
      );
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      rerender(
        <Drawer isOpen={false} onClose={vi.fn()}>
          Content
        </Drawer>,
      );
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  /* ─── Portal rendering ─── */

  describe('portal rendering', () => {
    it('renders the dialog as a child of document.body', () => {
      renderDrawer();
      const dialog = screen.getByRole('dialog');
      expect(document.body.contains(dialog)).toBe(true);
    });
  });

  /* ─── Title / header ─── */

  describe('title and header', () => {
    it('displays the title as a heading when provided', () => {
      renderDrawer({ title: 'Navigation' });
      expect(
        screen.getByRole('heading', { name: /navigation/i }),
      ).toBeInTheDocument();
    });

    it('sets aria-label on the dialog to the title', () => {
      renderDrawer({ title: 'Filters' });
      expect(screen.getByRole('dialog')).toHaveAttribute(
        'aria-label',
        'Filters',
      );
    });

    it('defaults aria-label to "Drawer" when no title is given', () => {
      renderDrawer();
      expect(screen.getByRole('dialog')).toHaveAttribute(
        'aria-label',
        'Drawer',
      );
    });

    it('always renders a close button', () => {
      renderDrawer();
      expect(
        screen.getByRole('button', { name: /close drawer/i }),
      ).toBeInTheDocument();
    });
  });

  /* ─── Footer ─── */

  describe('footer', () => {
    it('renders footer content when the footer prop is provided', () => {
      renderDrawer({
        footer: <button type="button">Apply</button>,
      });
      expect(
        screen.getByRole('button', { name: /apply/i }),
      ).toBeInTheDocument();
    });

    it('does not render a footer section when footer prop is omitted', () => {
      renderDrawer();
      const dialog = screen.getByRole('dialog');
      // Footer wrapper uses border-t — the header also uses border-b,
      // so we specifically look for border-t within the dialog
      const borderTopDivs = dialog.querySelectorAll('.border-t');
      expect(borderTopDivs.length).toBe(0);
    });
  });

  /* ─── Position (side) ─── */

  describe('side positioning', () => {
    it('defaults to right side', () => {
      renderDrawer();
      expect(screen.getByRole('dialog').className).toContain('right-0');
    });

    it('positions on the left when side="left"', () => {
      renderDrawer({ side: 'left' });
      const dialog = screen.getByRole('dialog');
      expect(dialog.className).toContain('left-0');
    });

    it('positions on the right when side="right"', () => {
      renderDrawer({ side: 'right' });
      const dialog = screen.getByRole('dialog');
      expect(dialog.className).toContain('right-0');
    });
  });

  /* ─── Width ─── */

  describe('width variants', () => {
    it.each([
      ['narrow', 'w-[320px]'],
      ['default', 'w-[480px]'],
      ['wide', 'w-[640px]'],
    ] as const)('applies %s width class', (width, expectedClass) => {
      renderDrawer({ width });
      expect(screen.getByRole('dialog').className).toContain(expectedClass);
    });

    it('defaults to "default" width', () => {
      renderDrawer();
      expect(screen.getByRole('dialog').className).toContain('w-[480px]');
    });
  });

  /* ─── Custom className ─── */

  describe('custom className', () => {
    it('merges custom className onto the drawer panel', () => {
      renderDrawer({ className: 'my-custom-drawer' });
      expect(screen.getByRole('dialog').className).toContain(
        'my-custom-drawer',
      );
    });
  });

  /* ─── Accessibility attributes ─── */

  describe('accessibility', () => {
    it('has role="dialog" and aria-modal="true"', () => {
      renderDrawer();
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });
  });

  /* ─── Close button click ─── */

  describe('close button', () => {
    it('calls onClose when the close button is clicked', async () => {
      const user = userEvent.setup();
      const { onClose } = renderDrawer({ title: 'Test' });

      await user.click(
        screen.getByRole('button', { name: /close drawer/i }),
      );
      expect(onClose).toHaveBeenCalledOnce();
    });
  });

  /* ─── Escape key ─── */

  describe('Escape key dismiss', () => {
    it('calls onClose when Escape is pressed', async () => {
      const user = userEvent.setup();
      const { onClose } = renderDrawer();

      await user.keyboard('{Escape}');
      expect(onClose).toHaveBeenCalledOnce();
    });

    it('does not call onClose for other keys', async () => {
      const user = userEvent.setup();
      const { onClose } = renderDrawer({
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
    it('calls onClose when clicking the backdrop', async () => {
      const user = userEvent.setup();
      const { onClose } = renderDrawer();

      // The backdrop is the aria-hidden div — use the container to find it
      const backdrop = document.querySelector('[aria-hidden="true"]');
      expect(backdrop).toBeTruthy();
      await user.click(backdrop!);
      expect(onClose).toHaveBeenCalledOnce();
    });

    it('does not call onClose when clicking inside the drawer panel', async () => {
      const user = userEvent.setup();
      const { onClose } = renderDrawer({
        children: <p>Inner content</p>,
      });

      await user.click(screen.getByText('Inner content'));
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  /* ─── Focus management ─── */

  describe('focus management', () => {
    it('moves focus into the drawer when opened', async () => {
      renderDrawer({
        children: <button type="button">Focusable</button>,
      });

      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        expect(dialog.contains(document.activeElement)).toBe(true);
      });
    });

    it('traps Tab focus within the drawer', async () => {
      const user = userEvent.setup();
      renderDrawer({
        title: 'Trap test',
        children: (
          <>
            <button type="button">First</button>
            <button type="button">Second</button>
          </>
        ),
        footer: <button type="button">Footer btn</button>,
      });

      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        expect(dialog.contains(document.activeElement)).toBe(true);
      });

      const focusableButtons = screen.getAllByRole('button');
      const lastButton = focusableButtons[focusableButtons.length - 1];

      lastButton.focus();
      await user.tab();

      const dialog = screen.getByRole('dialog');
      expect(dialog.contains(document.activeElement)).toBe(true);
    });
  });

  /* ─── Body scroll lock ─── */

  describe('body scroll lock', () => {
    it('sets body overflow to hidden when open', () => {
      renderDrawer();
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('restores body overflow when closed', () => {
      document.body.style.overflow = 'auto';

      const { unmount } = render(
        <Drawer isOpen onClose={vi.fn()}>
          Content
        </Drawer>,
      );
      expect(document.body.style.overflow).toBe('hidden');

      unmount();
      expect(document.body.style.overflow).toBe('auto');
    });
  });
});
