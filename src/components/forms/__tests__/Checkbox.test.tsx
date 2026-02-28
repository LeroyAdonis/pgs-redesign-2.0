import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Checkbox } from '@/components/forms/Checkbox';

describe('Checkbox', () => {
  it('renders a checkbox input', () => {
    render(<Checkbox />);
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });

  it('is unchecked by default', () => {
    render(<Checkbox />);
    expect(screen.getByRole('checkbox')).not.toBeChecked();
  });

  it('is checked when defaultChecked is true', () => {
    render(<Checkbox defaultChecked />);
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('toggles checked state on click', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<Checkbox onChange={handleChange} />);

    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);

    expect(handleChange).toHaveBeenCalledOnce();
    expect(checkbox).toBeChecked();
  });

  it('renders the label text', () => {
    render(<Checkbox label="Accept terms" />);
    expect(screen.getByText('Accept terms')).toBeInTheDocument();
  });

  it('associates the label with the checkbox via htmlFor', () => {
    render(<Checkbox label="Remember me" id="remember" />);
    const checkbox = screen.getByRole('checkbox');
    const label = checkbox.closest('label');
    expect(label).toHaveAttribute('for', 'remember');
  });

  it('does not render label span when label prop is omitted', () => {
    const { container } = render(<Checkbox />);
    const labelSpans = container.querySelectorAll('span.text-sm');
    expect(labelSpans).toHaveLength(0);
  });

  it('is disabled when disabled prop is true', () => {
    render(<Checkbox disabled />);
    expect(screen.getByRole('checkbox')).toBeDisabled();
  });

  it('does not toggle when disabled', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<Checkbox disabled onChange={handleChange} />);

    await user.click(screen.getByRole('checkbox')).catch(() => {
      // userEvent.click may throw on disabled elements — that's fine
    });
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('uses the provided id', () => {
    render(<Checkbox id="tos-checkbox" />);
    expect(screen.getByRole('checkbox')).toHaveAttribute('id', 'tos-checkbox');
  });

  it('generates an id automatically when none is provided', () => {
    render(<Checkbox />);
    expect(screen.getByRole('checkbox').id).toBeTruthy();
  });

  it('merges custom className onto the wrapper label', () => {
    const { container } = render(<Checkbox className="extra-spacing" />);
    const label = container.querySelector('label');
    expect(label?.className).toContain('extra-spacing');
  });

  it('supports controlled checked state', () => {
    render(<Checkbox checked onChange={() => {}} />);
    expect(screen.getByRole('checkbox')).toBeChecked();
  });
});
