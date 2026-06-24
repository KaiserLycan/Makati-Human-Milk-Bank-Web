import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import StaffPoolManagement from '../staff-pool-management';
import * as storage from '../../utils/storage';
import { api } from '../../utils/api';

// Mock next/link to prevent issues in Jest environment
jest.mock('next/link', () => {
  const MockLink = ({ children, href, ...rest }: { children: React.ReactNode; href: string; [key: string]: any }) => {
    return <a href={href} {...rest}>{children}</a>;
  };
  MockLink.displayName = 'MockLink';
  return MockLink;
});

// Mock api utility
jest.mock('../../utils/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  }
}));

// Mock storage module functions
jest.mock('../../utils/storage', () => {
  const actual = jest.requireActual('../../utils/storage');
  return {
    ...actual,
    loadProfile: jest.fn(),
  };
});

describe('StaffPoolManagement Component', () => {
  const mockPoolsResponse = {
    data: {
      data: {
        data: [
          {
            pid: 1,
            pooled_date: '2026-06-20T00:00:00.000Z',
            expected_volume_ml: 350,
            actual_volume_ml: 340,
            remaining_volume_ml: 340,
            milk_status: 'good',
            remarks: 'Remarks 1',
            raw_milk: [
              { ctn: 101, volume_ml: 150, expiration_date: '2026-12-20' },
              { ctn: 102, volume_ml: 200, expiration_date: '2026-12-20' }
            ]
          },
          {
            pid: 2,
            pooled_date: '2026-06-19T00:00:00.000Z',
            expected_volume_ml: 260,
            actual_volume_ml: 250,
            remaining_volume_ml: 250,
            milk_status: 'good',
            remarks: 'Remarks 2',
            raw_milk: [
              { ctn: 103, volume_ml: 260, expiration_date: '2026-12-19' }
            ]
          }
        ],
        meta: {
          total: 2,
          page: 1,
          limit: 5,
          totalPages: 1
        }
      }
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (storage.loadProfile as jest.Mock).mockReturnValue({
      name: 'Alice May Miller',
      id: '2024102114',
      email: 'staff@mhmb.gov',
      role: 'manager',
    });
    (api.get as jest.Mock).mockResolvedValue(mockPoolsResponse);
  });

  it('renders pooled batches list and details', async () => {
    render(<StaffPoolManagement />);

    expect(screen.getByText('Pooled Milk Batches')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    expect(screen.getByText('340 mL')).toBeInTheDocument();
    expect(screen.getByText('250 mL')).toBeInTheDocument();
  });

  it('filters data by search query and triggers fetch with search param', async () => {
    render(<StaffPoolManagement />);

    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: '1' } });

    await waitFor(() => {
      expect(api.get).toHaveBeenLastCalledWith(
        '/api/pooling',
        expect.objectContaining({
          params: expect.objectContaining({
            search: '1'
          })
        })
      );
    });
  });

  it('opens detailed batch profile modal on row click', async () => {
    render(<StaffPoolManagement />);

    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    // Click row with ID 1
    const rowIdBtn = screen.getByText('1');
    fireEvent.click(rowIdBtn);

    expect(screen.getByTestId('detail-modal')).toBeInTheDocument();
    expect(screen.getByTestId('modal-batch-id')).toHaveTextContent('1');
    expect(screen.getByTestId('modal-sources')).toHaveTextContent('101');
    expect(screen.getByTestId('modal-sources')).toHaveTextContent('102');
    expect(screen.getByTestId('modal-actual')).toHaveTextContent('340 mL');
  });

  it('deletes pool and fetches list again', async () => {
    window.confirm = jest.fn().mockImplementation(() => true);
    (api.delete as jest.Mock).mockResolvedValue({ data: { success: true } });

    render(<StaffPoolManagement />);

    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    // Open detail modal
    fireEvent.click(screen.getByText('1'));

    // Click delete
    const deleteBtn = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteBtn);

    expect(window.confirm).toHaveBeenCalled();
    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith('/api/pooling/1');
    });
  });

  it('allows pasteurizing and submits post request', async () => {
    (api.post as jest.Mock).mockResolvedValue({ data: { success: true } });

    render(<StaffPoolManagement />);

    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    // Open detail modal
    fireEvent.click(screen.getByText('1'));

    // Click Pasteurize to open Pasteurization form modal
    const pasteurizeBtn = screen.getByTestId('modal-pasteurize-btn');
    fireEvent.click(pasteurizeBtn);

    expect(screen.getByTestId('pasteurize-modal')).toBeInTheDocument();

    // Fill details
    const countInput = screen.getByPlaceholderText('Enter bottle count');
    const volInput = screen.getByPlaceholderText('Enter volume per bottle in mL');
    fireEvent.change(countInput, { target: { value: '5' } });
    fireEvent.change(volInput, { target: { value: '60' } });

    const submitBtn = screen.getByRole('button', { name: /Confirm Pasteurization/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/api/pasteurization', expect.objectContaining({
        pid: 1,
        bottle_count: 5,
        volume_per_bottle: 60,
        bottle_type: 'ameda',
      }));
    });
  });

  it('displays correct processed status alerts and conditionally hides the pasteurize button', async () => {
    const processedPoolMockResponse = {
      data: {
        data: {
          data: [
            {
              pid: 1,
              pooled_date: '2026-06-20T00:00:00.000Z',
              expected_volume_ml: 350,
              actual_volume_ml: 340,
              remaining_volume_ml: 0,
              milk_status: 'good',
              remarks: 'Remarks 1',
              raw_milk: [
                { ctn: 101, volume_ml: 150, expiration_date: '2026-12-20' },
                { ctn: 102, volume_ml: 200, expiration_date: '2026-12-20' }
              ]
            },
            {
              pid: 2,
              pooled_date: '2026-06-19T00:00:00.000Z',
              expected_volume_ml: 260,
              actual_volume_ml: 250,
              remaining_volume_ml: 100,
              milk_status: 'good',
              remarks: 'Remarks 2',
              raw_milk: [
                { ctn: 103, volume_ml: 260, expiration_date: '2026-12-19' }
              ]
            }
          ],
          meta: {
            total: 2,
            page: 1,
            limit: 5,
            totalPages: 1
          }
        }
      }
    };
    (api.get as jest.Mock).mockResolvedValue(processedPoolMockResponse);

    render(<StaffPoolManagement />);

    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    expect(screen.getByText('Processed')).toBeInTheDocument();

    // Click row 1 (remaining_volume_ml === 0)
    fireEvent.click(screen.getByText('1'));
    
    // Check contextual alert: Completely Processed
    expect(screen.getByText('Completely Processed')).toBeInTheDocument();
    expect(screen.getByText('This milk pool is completely processed and all actual volume is bottled.')).toBeInTheDocument();
    
    // Pasteurize button should not be present
    expect(screen.queryByTestId('modal-pasteurize-btn')).not.toBeInTheDocument();

    // Milk status dropdown trigger should be disabled
    const detailModal1 = screen.getByTestId('detail-modal');
    const dropdownTrigger1 = within(detailModal1).getByText('Good');
    expect(dropdownTrigger1.parentElement).toHaveClass('cursor-not-allowed');

    // Close modal using Done button
    fireEvent.click(screen.getByTestId('close-modal-btn'));

    // Click row 2 (remaining_volume_ml === 100)
    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('2'));

    // Check contextual alert: Partially Processed
    expect(screen.getByText('Partially Processed')).toBeInTheDocument();
    expect(screen.getByText(/This milk pool is partially processed with 100 mL left to be pasteurized out of 250 mL/)).toBeInTheDocument();

    // Pasteurize button should be present
    expect(screen.getByTestId('modal-pasteurize-btn')).toBeInTheDocument();

    // Milk status dropdown trigger should be active (not disabled)
    const detailModal2 = screen.getByTestId('detail-modal');
    const dropdownTrigger2 = within(detailModal2).getByText('Good');
    expect(dropdownTrigger2.parentElement).not.toHaveClass('cursor-not-allowed');
  });
});

