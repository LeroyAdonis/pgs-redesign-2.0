import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Toggle } from '@/components/forms/Toggle';

describe('Toggle', () => {
  it('renders a checkbox input (toggle is implemented as checkbox)', () => {
    render(<Toggle />);
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });

  it('is off (unchecked) by default', () => {
    render(<Toggle />);
    expect(screen.getByRole('checkbox')).not.toBeChecked();
  });

  it('is on when defaultChecked is true', () => {
    render(<Toggle defaultChecked />);
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('toggles on click', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<Toggle onChange={handleChange} />);

    const toggle = screen.getByRole('checkbox');
    await user.click(toggle);

    expect(handleChange).toHaveBeenCalledOnce();
    expect(toggle).toBeChecked();
  });

  it('renders the label text', () => {
    render(<Toggle label="Dark mode" />);
    expect(screen.getByText('Dark mode')).toBeInTheDocument();
  });

  it('renders the description text', () => {
    render(<Toggle label="Notifications" description="Receive email alerts" />);
    expect(screen.getByText('Receive email alerts')).toBeInTheDocument();
  });

  it('renders label and description together', () => {
    render(<Toggle label="Auto-save" description="Save drafts automatically" />);
    expect(screen.getByText('Auto-save')).toBeInTheDocument();
    expect(screen.getByText('Save drafts automatically')).toBeInTheDocument();
  });

  it('does not render label/description container when both are omitted', () => {
    const { container } = render(<Toggle />);
    const textSpans = container.querySelectorAll('span.text-sm, span.text-xs');
    expect(textSpans).toHaveLength(0);
  });

  it('is disabled when disabled prop is true', () => {
    render(<Toggle disabled />);
    expect(screen.getByRole('checkbox')).toBeDisabled();
  });

  it('does not toggle when disabled', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<Toggle disabled onChange={handleChange} />);

    await user.click(screen.getByRole('checkbox')).catch(() => {
      // userEvent.click may throw on disabled elements
    });
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('uses the provided id', () => {
    render(<Toggle id="theme-toggle" />);
    expect(screen.getByRole('checkbox')).toHaveAttribute('id', 'theme-toggle');
  });

  it('generates an id automatically when none is provided', () => {
    render(<Toggle />);
    expect(screen.getByRole('checkbox').id).toBeTruthy();
  });

  it('merges custom className onto the wrapper label', () => {
    const { container } = render(<Toggle className="mt-4" />);
    const label = container.querySelector('label');
    expect(label?.className).toContain('mt-4');
  });

  it('supports controlled checked state', () => {
    render(<Toggle checked onChange={() => {}} />);
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('associates the label with the checkbox via htmlFor', () => {
    render(<Toggle label="Enable" id="enable-toggle" />);
    const toggle = screen.getByRole('checkbox');
    const label = toggle.closest('label');
    expect(label).toHaveAttribute('for', 'enable-toggle');
  });
});
