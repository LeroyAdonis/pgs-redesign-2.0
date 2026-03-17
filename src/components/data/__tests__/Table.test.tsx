import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Table, type TableColumn } from '@/components/data/Table';

// ─── Fixtures ────────────────────────────────────────────────────

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  [key: string]: unknown;
}

const columns: TableColumn<User>[] = [
  { key: 'name', header: 'Name' },
  { key: 'email', header: 'Email' },
  { key: 'role', header: 'Role' },
];

const sampleData: User[] = [
  { id: '1', name: 'Thabo Mbeki', email: 'thabo@example.com', role: 'Admin' },
  { id: '2', name: 'Lerato Khumalo', email: 'lerato@example.com', role: 'Editor' },
  { id: '3', name: 'Sipho Dlamini', email: 'sipho@example.com', role: 'Viewer' },
];

const keyExtractor = (item: User) => item.id;

// ─── Tests ───────────────────────────────────────────────────────

describe('Table', () => {
  it('renders column headers', () => {
    render(<Table columns={columns} data={sampleData} keyExtractor={keyExtractor} />);

    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Role')).toBeInTheDocument();
  });

  it('renders all data rows', () => {
    render(<Table columns={columns} data={sampleData} keyExtractor={keyExtractor} />);

    const rows = screen.getAllByRole('row');
    // 1 header row + 3 data rows
    expect(rows).toHaveLength(4);
  });

  it('renders correct cell values via default string coercion', () => {
    render(<Table columns={columns} data={sampleData} keyExtractor={keyExtractor} />);

    expect(screen.getByText('Thabo Mbeki')).toBeInTheDocument();
    expect(screen.getByText('lerato@example.com')).toBeInTheDocument();
    expect(screen.getByText('Viewer')).toBeInTheDocument();
  });

  it('renders custom cell content via column render function', () => {
    const columnsWithRender: TableColumn<User>[] = [
      {
        key: 'name',
        header: 'Name',
        render: (item) => <strong data-testid="bold-name">{item.name}</strong>,
      },
      { key: 'role', header: 'Role' },
    ];

    render(
      <Table columns={columnsWithRender} data={sampleData} keyExtractor={keyExtractor} />,
    );

    const boldNames = screen.getAllByTestId('bold-name');
    expect(boldNames).toHaveLength(3);
    expect(boldNames[0]).toHaveTextContent('Thabo Mbeki');
  });

  it('renders an empty tbody when data is empty', () => {
    render(<Table columns={columns} data={[]} keyExtractor={keyExtractor} />);

    // Headers still render
    expect(screen.getByText('Name')).toBeInTheDocument();

    // Only the header row exists
    const rows = screen.getAllByRole('row');
    expect(rows).toHaveLength(1);
  });

  it('calls onRowClick with the item when a row is clicked', async () => {
    const user = userEvent.setup();
    const handleRowClick = vi.fn();

    render(
      <Table
        columns={columns}
        data={sampleData}
        keyExtractor={keyExtractor}
        onRowClick={handleRowClick}
      />,
    );

    const firstDataRow = screen.getAllByRole('row')[1];
    await user.click(firstDataRow);

    expect(handleRowClick).toHaveBeenCalledOnce();
    expect(handleRowClick).toHaveBeenCalledWith(sampleData[0]);
  });

  it('applies cursor-pointer class when onRowClick is provided', () => {
    render(
      <Table
        columns={columns}
        data={sampleData}
        keyExtractor={keyExtractor}
        onRowClick={vi.fn()}
      />,
    );

    const firstDataRow = screen.getAllByRole('row')[1];
    expect(firstDataRow.className).toContain('cursor-pointer');
  });

  it('does not apply cursor-pointer when onRowClick is omitted', () => {
    render(<Table columns={columns} data={sampleData} keyExtractor={keyExtractor} />);

    const firstDataRow = screen.getAllByRole('row')[1];
    expect(firstDataRow.className).not.toContain('cursor-pointer');
  });

  it('merges custom className onto the wrapper', () => {
    render(
      <Table
        columns={columns}
        data={sampleData}
        keyExtractor={keyExtractor}
        className="my-custom-table"
      />,
    );

    // The wrapper div is the parent of the <table>
    const table = screen.getByRole('table');
    const wrapper = table.parentElement!;
    expect(wrapper.className).toContain('my-custom-table');
  });

  it('applies column className to header and cell elements', () => {
    const columnsWithClass: TableColumn<User>[] = [
      { key: 'name', header: 'Name', className: 'col-name' },
      { key: 'role', header: 'Role' },
    ];

    render(
      <Table columns={columnsWithClass} data={sampleData} keyExtractor={keyExtractor} />,
    );

    // Header th gets the column className
    const nameHeader = screen.getByText('Name');
    expect(nameHeader.className).toContain('col-name');

    // Data cells in that column also get the className
    const firstDataRow = screen.getAllByRole('row')[1];
    const cells = within(firstDataRow).getAllByRole('cell');
    expect(cells[0].className).toContain('col-name');
  });

  it('renders empty string for missing/undefined data keys', () => {
    interface Sparse {
      id: string;
      name: string;
      [key: string]: unknown;
    }

    const sparseColumns: TableColumn<Sparse>[] = [
      { key: 'name', header: 'Name' },
      { key: 'missing', header: 'Missing' },
    ];

    const sparseData: Sparse[] = [{ id: '1', name: 'Test' }];

    render(
      <Table columns={sparseColumns} data={sparseData} keyExtractor={(item) => item.id} />,
    );

    const cells = screen.getAllByRole('cell');
    // The 'missing' column cell should be empty
    expect(cells[1]).toHaveTextContent('');
  });

  it('does not add bottom border on the last row', () => {
    render(<Table columns={columns} data={sampleData} keyExtractor={keyExtractor} />);

    const rows = screen.getAllByRole('row');
    const lastDataRow = rows[rows.length - 1];
    const lastRowCells = within(lastDataRow).getAllByRole('cell');

    // Last row cells should NOT have border-b
    for (const cell of lastRowCells) {
      expect(cell.className).not.toContain('border-b');
    }
  });
});
