import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import StaffPoolManagement from '../staff-pool-management';
import * as storage from '../../utils/storage';

// Mock next/link to prevent issues in Jest environment
jest.mock('next/link', () => {
  const MockLink = ({ children, href, ...rest }: { children: React.ReactNode; href: string; [key: string]: any }) => {
    return <a href={href} {...rest}>{children}</a>;
  };
  MockLink.displayName = 'MockLink';
  return MockLink;
});

// Mock storage module functions
jest.mock('../../utils/storage', () => {
  const actual = jest.requireActual('../../utils/storage');
  return {
    ...actual,
    loadPools: jest.fn(),
    savePools: jest.fn(),
    loadInventory: jest.fn(),
    saveInventory: jest.fn(),
    loadAudits: jest.fn(),
    saveAudits: jest.fn(),
    loadProfile: jest.fn(),
  };
});

describe('StaffPoolManagement Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (storage.loadProfile as jest.Mock).mockReturnValue({
      name: 'Alice May Miller',
      id: '2024102114',
      email: 'staff@mhmb.gov',
      role: 'manager',
    });
  });

  const mockPools: storage.PooledMilkBatch[] = [
    { id: 'PM001', sourceIds: ['RM001', 'RM002'], expectedVolume: 350, actualVolume: 340, status: 'Pooled', datePooled: '2026-06-20' },
    { id: 'PM002', sourceIds: ['RM003'], expectedVolume: 260, actualVolume: 250, status: 'Pasteurized', datePooled: '2026-06-19' },
  ];

  it('renders pooled batches list and details', () => {
    (storage.loadPools as jest.Mock).mockReturnValue(mockPools);
    render(<StaffPoolManagement />);

    expect(screen.getByText('Pooled Milk Batches')).toBeInTheDocument();
    expect(screen.getByText('PM001')).toBeInTheDocument();
    expect(screen.getByText('PM002')).toBeInTheDocument();
    expect(screen.getByText('340 mL')).toBeInTheDocument();
    expect(screen.getByText('250 mL')).toBeInTheDocument();
  });

  it('filters data by search query and status filter', () => {
    (storage.loadPools as jest.Mock).mockReturnValue(mockPools);
    render(<StaffPoolManagement />);

    // Search filter
    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: 'PM002' } });

    expect(screen.getByText('PM002')).toBeInTheDocument();
    expect(screen.queryByText('PM001')).not.toBeInTheDocument();

    // Clear search and filter by status 'Pooled'
    fireEvent.change(searchInput, { target: { value: '' } });
    const statusSelect = screen.getByTestId('status-select');
    fireEvent.change(statusSelect, { target: { value: 'Pooled' } });

    expect(screen.getByText('PM001')).toBeInTheDocument();
    expect(screen.queryByText('PM002')).not.toBeInTheDocument();
  });

  it('opens detailed batch profile modal on row click', () => {
    (storage.loadPools as jest.Mock).mockReturnValue(mockPools);
    render(<StaffPoolManagement />);

    // Click PM001 batch ID
    const rowIdBtn = screen.getByText('PM001');
    fireEvent.click(rowIdBtn);

    expect(screen.getByTestId('detail-modal')).toBeInTheDocument();
    expect(screen.getByTestId('modal-batch-id')).toHaveTextContent('Batch: PM001');
    expect(screen.getByTestId('modal-sources')).toHaveTextContent('RM001, RM002');
    expect(screen.getByTestId('modal-actual')).toHaveTextContent('340 mL');
  });

  it('completes Pasteurization and moves batch to inventory dataset', () => {
    (storage.loadPools as jest.Mock).mockReturnValue(mockPools);
    (storage.loadInventory as jest.Mock).mockReturnValue([]);
    (storage.loadProfile as jest.Mock).mockReturnValue({ name: 'Alice May Miller', id: '2024102114', email: 'staff@mhmb.gov', role: 'manager' });
    (storage.loadAudits as jest.Mock).mockReturnValue([]);

    render(<StaffPoolManagement />);

    // Pasteurize button for PM001 should be present
    const pasteurizeBtn = screen.getByTestId('pasteurize-btn-PM001');
    expect(pasteurizeBtn).toBeInTheDocument();

    fireEvent.click(pasteurizeBtn);

    // Verify batch is saved as Pasteurized
    expect(storage.savePools).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'PM001',
          status: 'Pasteurized',
        }),
      ])
    );

    // Verify batch is added to inventory list
    expect(storage.saveInventory).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          sourceBatchId: 'PM001',
          volume: 340,
          status: 'Available',
        }),
      ])
    );
  });
});
