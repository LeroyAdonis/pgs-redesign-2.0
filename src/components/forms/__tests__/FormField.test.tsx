import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { FormField } from '@/components/forms/FormField';

describe('FormField', () => {
  it('renders children (input slot)', () => {
    render(
      <FormField>
        <input data-testid="inner-input" />
      </FormField>,
    );
    expect(screen.getByTestId('inner-input')).toBeInTheDocument();
  });

  it('renders the label text', () => {
    render(
      <FormField label="Email">
        <input />
      </FormField>,
    );
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('associates label with input via htmlFor', () => {
    render(
      <FormField label="Username" htmlFor="username-input">
        <input id="username-input" />
      </FormField>,
    );
    const label = screen.getByText('Username');
    expect(label.tagName).toBe('LABEL');
    expect(label).toHaveAttribute('for', 'username-input');
  });

  it('does not render label when label prop is omitted', () => {
    const { container } = render(
      <FormField>
        <input />
      </FormField>,
    );
    expect(container.querySelector('label')).toBeNull();
  });

  it('renders helper text when no error or success', () => {
    render(
      <FormField helperText="Must be at least 8 characters">
        <input />
      </FormField>,
    );
    expect(screen.getByText('Must be at least 8 characters')).toBeInTheDocument();
  });

  it('hides helper text when error is present', () => {
    render(
      <FormField helperText="Helper" error="Something went wrong">
        <input />
      </FormField>,
    );
    expect(screen.queryByText('Helper')).not.toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('hides helper text when success is present', () => {
    render(
      <FormField helperText="Helper" success="Looks good!">
        <input />
      </FormField>,
    );
    expect(screen.queryByText('Helper')).not.toBeInTheDocument();
    expect(screen.getByText('Looks good!')).toBeInTheDocument();
  });

  it('displays error message', () => {
    render(
      <FormField error="This field is required">
        <input />
      </FormField>,
    );
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  it('displays success message', () => {
    render(
      <FormField success="Email is available">
        <input />
      </FormField>,
    );
    expect(screen.getByText('Email is available')).toBeInTheDocument();
  });

  it('prioritises error over success when both are set', () => {
    render(
      <FormField error="Invalid" success="Valid">
        <input />
      </FormField>,
    );
    expect(screen.getByText('Invalid')).toBeInTheDocument();
    expect(screen.queryByText('Valid')).not.toBeInTheDocument();
  });

  it('renders error icon as decorative (aria-hidden)', () => {
    const { container } = render(
      <FormField error="Error">
        <input />
      </FormField>,
    );
    const errorP = container.querySelector('p');
    const svg = errorP?.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });

  it('renders success icon as decorative (aria-hidden)', () => {
    const { container } = render(
      <FormField success="OK">
        <input />
      </FormField>,
    );
    const successP = container.querySelector('p');
    const svg = successP?.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });

  it('merges custom className onto the wrapper div', () => {
    const { container } = render(
      <FormField className="mb-6">
        <input />
      </FormField>,
    );
    const wrapper = container.firstElementChild;
    expect(wrapper?.className).toContain('mb-6');
  });

  it('renders label, helper, children, and no messages simultaneously', () => {
    render(
      <FormField label="Password" helperText="8+ chars" htmlFor="pw">
        <input id="pw" data-testid="pw-input" />
      </FormField>,
    );
    expect(screen.getByText('Password')).toBeInTheDocument();
    expect(screen.getByText('8+ chars')).toBeInTheDocument();
    expect(screen.getByTestId('pw-input')).toBeInTheDocument();
  });
});
