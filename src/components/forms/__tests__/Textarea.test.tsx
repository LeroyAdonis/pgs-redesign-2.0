import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Textarea } from '@/components/forms/Textarea';

describe('Textarea', () => {
  it('renders a textarea element', () => {
    render(<Textarea />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByRole('textbox').tagName).toBe('TEXTAREA');
  });

  it('renders with a placeholder', () => {
    render(<Textarea placeholder="Write something…" />);
    expect(screen.getByPlaceholderText('Write something…')).toBeInTheDocument();
  });

  it('is disabled when disabled prop is true', () => {
    render(<Textarea disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('accepts a rows attribute', () => {
    render(<Textarea rows={8} />);
    expect(screen.getByRole('textbox')).toHaveAttribute('rows', '8');
  });

  it('fires onChange when user types', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<Textarea onChange={handleChange} />);

    await user.type(screen.getByRole('textbox'), 'abc');
    expect(handleChange).toHaveBeenCalledTimes(3);
  });

  it('displays the controlled value', () => {
    render(<Textarea value="preset text" onChange={() => {}} />);
    expect(screen.getByRole('textbox')).toHaveValue('preset text');
  });

  it('merges custom className', () => {
    render(<Textarea className="custom-textarea" />);
    expect(screen.getByRole('textbox').className).toContain('custom-textarea');
  });

  it('applies error state border class', () => {
    render(<Textarea hasError />);
    expect(screen.getByRole('textbox').className).toContain('border-error');
  });

  it('applies success state border class', () => {
    render(<Textarea hasSuccess />);
    expect(screen.getByRole('textbox').className).toContain('border-success');
  });

  it('prioritises error over success when both are set', () => {
    render(<Textarea hasError hasSuccess />);
    const el = screen.getByRole('textbox');
    expect(el.className).toContain('border-error');
    expect(el.className).not.toContain('border-success');
  });

  it('uses the provided id', () => {
    render(<Textarea id="bio-field" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('id', 'bio-field');
  });

  it('generates an id automatically when none is provided', () => {
    render(<Textarea />);
    expect(screen.getByRole('textbox').id).toBeTruthy();
  });

  it('forwards ref to the underlying textarea', () => {
    const ref = vi.fn();
    render(<Textarea ref={ref} />);
    expect(ref).toHaveBeenCalledWith(expect.any(HTMLTextAreaElement));
  });
});
