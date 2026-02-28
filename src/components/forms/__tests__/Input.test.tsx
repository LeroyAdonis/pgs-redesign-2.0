import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Input } from '@/components/forms/Input';

describe('Input', () => {
  it('renders an input element', () => {
    render(<Input />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('renders with a placeholder', () => {
    render(<Input placeholder="Enter your name" />);
    expect(screen.getByPlaceholderText('Enter your name')).toBeInTheDocument();
  });

  it('is disabled when disabled prop is true', () => {
    render(<Input disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('fires onChange when user types', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<Input onChange={handleChange} />);

    await user.type(screen.getByRole('textbox'), 'hello');
    expect(handleChange).toHaveBeenCalledTimes(5);
  });

  it('displays the controlled value', () => {
    render(<Input value="test value" onChange={() => {}} />);
    expect(screen.getByRole('textbox')).toHaveValue('test value');
  });

  it('merges custom className', () => {
    render(<Input className="my-custom-class" />);
    expect(screen.getByRole('textbox').className).toContain('my-custom-class');
  });

  it('applies error state border class', () => {
    render(<Input hasError />);
    expect(screen.getByRole('textbox').className).toContain('border-error');
  });

  it('applies success state border class', () => {
    render(<Input hasSuccess />);
    expect(screen.getByRole('textbox').className).toContain('border-success');
  });

  it('prioritises error over success when both are set', () => {
    render(<Input hasError hasSuccess />);
    const el = screen.getByRole('textbox');
    expect(el.className).toContain('border-error');
    // Success border should not be applied when error is present
    expect(el.className).not.toContain('border-success');
  });

  it('renders left icon', () => {
    render(<Input leftIcon={<span data-testid="left-icon">🔍</span>} />);
    expect(screen.getByTestId('left-icon')).toBeInTheDocument();
  });

  it('renders right icon', () => {
    render(<Input rightIcon={<span data-testid="right-icon">✕</span>} />);
    expect(screen.getByTestId('right-icon')).toBeInTheDocument();
  });

  it('renders both icons simultaneously', () => {
    render(
      <Input
        leftIcon={<span data-testid="left-icon">🔍</span>}
        rightIcon={<span data-testid="right-icon">✕</span>}
      />,
    );
    expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    expect(screen.getByTestId('right-icon')).toBeInTheDocument();
  });

  it('uses the provided id', () => {
    render(<Input id="email-input" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('id', 'email-input');
  });

  it('generates an id automatically when none is provided', () => {
    render(<Input />);
    expect(screen.getByRole('textbox').id).toBeTruthy();
  });

  it('forwards the type attribute', () => {
    render(<Input type="email" />);
    // type="email" inputs still have the textbox role
    expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email');
  });

  it('forwards ref to the underlying input', () => {
    const ref = vi.fn();
    render(<Input ref={ref} />);
    expect(ref).toHaveBeenCalledWith(expect.any(HTMLInputElement));
  });
});
