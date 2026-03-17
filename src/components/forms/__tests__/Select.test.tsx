import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Select } from '@/components/forms/Select';

describe('Select', () => {
  const options = (
    <>
      <option value="">Choose…</option>
      <option value="za">South Africa</option>
      <option value="ng">Nigeria</option>
      <option value="ke">Kenya</option>
    </>
  );

  it('renders a select element (combobox role)', () => {
    render(<Select>{options}</Select>);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('renders all option children', () => {
    render(<Select>{options}</Select>);
    const opts = screen.getAllByRole('option');
    expect(opts).toHaveLength(4);
  });

  it('shows the default/placeholder option as selected initially', () => {
    render(<Select>{options}</Select>);
    expect(screen.getByRole('combobox')).toHaveValue('');
  });

  it('fires onChange when a different option is selected', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<Select onChange={handleChange}>{options}</Select>);

    await user.selectOptions(screen.getByRole('combobox'), 'za');
    expect(handleChange).toHaveBeenCalledOnce();
    expect(screen.getByRole('combobox')).toHaveValue('za');
  });

  it('is disabled when disabled prop is true', () => {
    render(<Select disabled>{options}</Select>);
    expect(screen.getByRole('combobox')).toBeDisabled();
  });

  it('applies error state border class', () => {
    render(<Select hasError>{options}</Select>);
    expect(screen.getByRole('combobox').className).toContain('border-error');
  });

  it('merges custom className', () => {
    render(<Select className="wide-select">{options}</Select>);
    expect(screen.getByRole('combobox').className).toContain('wide-select');
  });

  it('uses the provided id', () => {
    render(<Select id="country-select">{options}</Select>);
    expect(screen.getByRole('combobox')).toHaveAttribute('id', 'country-select');
  });

  it('generates an id automatically when none is provided', () => {
    render(<Select>{options}</Select>);
    expect(screen.getByRole('combobox').id).toBeTruthy();
  });

  it('renders the chevron icon as decorative (aria-hidden)', () => {
    const { container } = render(<Select>{options}</Select>);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });

  it('forwards ref to the underlying select', () => {
    const ref = vi.fn();
    render(<Select ref={ref}>{options}</Select>);
    expect(ref).toHaveBeenCalledWith(expect.any(HTMLSelectElement));
  });

  it('displays the controlled value', () => {
    render(
      <Select value="ng" onChange={() => {}}>
        {options}
      </Select>,
    );
    expect(screen.getByRole('combobox')).toHaveValue('ng');
  });
});
