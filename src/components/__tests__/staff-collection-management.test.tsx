import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import StaffCollectionManagement from '../staff-collection-management';
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
    loadCollections: jest.fn(),
    saveCollections: jest.fn(),
    loadPools: jest.fn(),
    savePools: jest.fn(),
    loadAudits: jest.fn(),
    saveAudits: jest.fn(),
    loadProfile: jest.fn(),
  };
});

describe('StaffCollectionManagement Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (storage.loadProfile as jest.Mock).mockReturnValue({
      name: 'Alice May Miller',
      id: '2024102114',
      email: 'staff@mhmb.gov',
      role: 'manager',
    });
  });

  const mockCollections: storage.RawMilkCollection[] = [
    { id: 'RM001', donorName: 'Olivia Carter', dateCollected: '2026-06-18', expectedVolume: 150, actualVolume: null, status: 'Collected' },
    { id: 'RM002', donorName: 'Emma Phillips', dateCollected: '2026-06-19', expectedVolume: 200, actualVolume: null, status: 'Collected' },
    { id: 'RM003', donorName: 'Sophia Mitchell', dateCollected: '2026-06-20', expectedVolume: 250, actualVolume: null, status: 'Pooled' },
  ];

  it('renders raw milk collections list and sidebar navigation', () => {
    (storage.loadCollections as jest.Mock).mockReturnValue(mockCollections);
    render(<StaffCollectionManagement />);

    expect(screen.getByText('Raw Milk Collections')).toBeInTheDocument();
    expect(screen.getByTestId('search-input')).toBeInTheDocument();
    expect(screen.getByTestId('status-select')).toBeInTheDocument();

    // Verify raw milk collections in table
    expect(screen.getByText('RM001')).toBeInTheDocument();
    expect(screen.getByText('Olivia Carter')).toBeInTheDocument();
    expect(screen.getByText('150 mL')).toBeInTheDocument();

    expect(screen.getByText('RM002')).toBeInTheDocument();
    expect(screen.getByText('Emma Phillips')).toBeInTheDocument();
    expect(screen.getByText('200 mL')).toBeInTheDocument();
  });

  it('supports filtering collections by search and status', () => {
    (storage.loadCollections as jest.Mock).mockReturnValue(mockCollections);
    render(<StaffCollectionManagement />);

    // Search for Emma
    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: 'Emma' } });

    expect(screen.getByText('Emma Phillips')).toBeInTheDocument();
    expect(screen.queryByText('Olivia Carter')).not.toBeInTheDocument();

    // Clear search and filter by status 'Pooled'
    fireEvent.change(searchInput, { target: { value: '' } });
    const statusSelect = screen.getByTestId('status-select');
    fireEvent.change(statusSelect, { target: { value: 'Pooled' } });

    expect(screen.getByText('Sophia Mitchell')).toBeInTheDocument();
    expect(screen.queryByText('Olivia Carter')).not.toBeInTheDocument();
  });

  it('opens detailed collection profile modal on row ID click', () => {
    (storage.loadCollections as jest.Mock).mockReturnValue(mockCollections);
    render(<StaffCollectionManagement />);

    // Click RM001 link
    const rowIdBtn = screen.getByText('RM001');
    fireEvent.click(rowIdBtn);

    expect(screen.getByTestId('detail-modal')).toBeInTheDocument();
    expect(screen.getByTestId('modal-donor-name')).toHaveTextContent('Olivia Carter');
    expect(screen.getByTestId('modal-collection-id')).toHaveTextContent('RM001');
    expect(screen.getByTestId('modal-expected')).toHaveTextContent('150 mL');

    // Close modal
    const closeBtn = screen.getByTestId('close-detail-modal-btn');
    fireEvent.click(closeBtn);
    expect(screen.queryByTestId('detail-modal')).not.toBeInTheDocument();
  });

  it('enables pooling and processes selected collections', () => {
    (storage.loadCollections as jest.Mock).mockReturnValue(mockCollections);
    (storage.loadPools as jest.Mock).mockReturnValue([]);
    (storage.loadProfile as jest.Mock).mockReturnValue({ name: 'Alice May Miller', id: '2024102114', email: 'staff@mhmb.gov', role: 'manager' });
    (storage.loadAudits as jest.Mock).mockReturnValue([]);

    render(<StaffCollectionManagement />);

    // Checkboxes should be in the table
    const checkbox1 = screen.getByTestId('checkbox-RM001');
    const checkbox2 = screen.getByTestId('checkbox-RM002');

    // Click both checkboxes
    fireEvent.click(checkbox1);
    fireEvent.click(checkbox2);

    // Pool Selected button should appear
    const poolBtn = screen.getByTestId('pool-selected-btn');
    expect(poolBtn).toBeInTheDocument();
    expect(poolBtn).toHaveTextContent('Pool Selected (2)');

    // Click Pool Selected button to open modal
    fireEvent.click(poolBtn);
    expect(screen.getByTestId('pool-modal')).toBeInTheDocument();
    expect(screen.getByText('350 mL')).toBeInTheDocument(); // 150 + 200 expected total

    // Fill in actual volume and submit
    const actualVolumeInput = screen.getByTestId('actual-volume-input');
    fireEvent.change(actualVolumeInput, { target: { value: '345' } });

    const confirmBtn = screen.getByTestId('confirm-pool-btn');
    fireEvent.click(confirmBtn);

    // Verify pools were saved
    expect(storage.savePools).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'PM001',
          sourceIds: ['RM001', 'RM002'],
          expectedVolume: 350,
          actualVolume: 345,
          status: 'Pooled',
        }),
      ])
    );

    // Verify collections were updated
    expect(storage.saveCollections).toHaveBeenCalled();
    expect(screen.queryByTestId('pool-modal')).not.toBeInTheDocument();
  });
});
