import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import StaffInventoryManagement from '../staff-inventory-management';
import { api } from '../../utils/api';

// Mock next/link
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
    patch: jest.fn(),
  }
}));

describe('StaffInventoryManagement Component', () => {
  // UPDATED: Replaced batch_number with nested batch_milk and removed pasteurization_date
  const mockInventoryResponse = {
    data: {
      data: {
        data: [
          {
            btl_id: 1001,
            volume_ml: 120,
            expiration_date: '2026-12-20T00:00:00.000Z',
            milk_status: 'good',
            mbt_status: 'pending',
            dispense_status: 'available',
            batch_milk: {
              batch_id: 50,
              processed_date: '2026-06-20T00:00:00.000Z'
            }
          },
          {
            btl_id: 1002,
            volume_ml: 150,
            expiration_date: '2026-12-21T00:00:00.000Z',
            milk_status: 'good',
            mbt_status: 'pass',
            dispense_status: 'dispensed',
            batch_milk: {
              batch_id: 51,
              processed_date: '2026-06-21T00:00:00.000Z'
            }
          }
        ],
        meta: {
          total: 2,
          totalPages: 1
        }
      }
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (api.get as jest.Mock).mockImplementation((url: string, config: any) => {
      if (url === '/api/pasteurization') {
        const searchVal = config?.params?.search;
        if (searchVal === '51') {
          return Promise.resolve({
            data: {
              data: {
                data: [mockInventoryResponse.data.data.data[1]],
                meta: {
                  total: 1,
                  totalPages: 1
                }
              }
            }
          });
        }
        return Promise.resolve(mockInventoryResponse);
      }
      return Promise.resolve({ data: {} });
    });
  });

  it('renders the inventory table with fetched data', async () => {
    render(<StaffInventoryManagement />);

    expect(screen.getByRole('heading', { name: 'Milk Inventory' })).toBeInTheDocument();
    
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/api/pasteurization', expect.objectContaining({
        params: expect.objectContaining({ limit: 5 })
      }));
      expect(screen.getByText('1001')).toBeInTheDocument();
      expect(screen.getByText('1002')).toBeInTheDocument();
    });

    // Check statuses render correctly
    expect(screen.getByText('pending')).toBeInTheDocument();
    expect(screen.getByText('pass')).toBeInTheDocument();
  });

  it('filters table rows based on search input (testing nested batch ID)', async () => {
    render(<StaffInventoryManagement />);

    await waitFor(() => {
      expect(screen.getByText('1001')).toBeInTheDocument();
    });

    const searchInput = screen.getByTestId('search-input');
    // Searching for batch ID 51 (which belongs to btl_id 1002)
    fireEvent.change(searchInput, { target: { value: '51' } });

    // 1002 should remain, 1001 should disappear
    await waitFor(() => {
      expect(screen.getByText('1002')).toBeInTheDocument();
      expect(screen.queryByText('1001')).not.toBeInTheDocument();
    });
  });

  it('opens detail modal and triggers MBT PATCH request on dropdown change', async () => {
    (api.patch as jest.Mock).mockResolvedValue({ data: { success: true } });
    
    render(<StaffInventoryManagement />);

    await waitFor(() => {
      expect(screen.getByText('1001')).toBeInTheDocument();
    });

    // Open Modal
    fireEvent.click(screen.getByText('1001'));
    expect(screen.getByTestId('detail-modal')).toBeInTheDocument();
    expect(screen.getByTestId('modal-item-id')).toHaveTextContent('1001');

    // Change MBT Status
    const mbtTrigger = screen.getByTestId('select-mbt-status');
    fireEvent.click(mbtTrigger);
    
    const passedOption = screen.getByText('Passed');
    fireEvent.click(passedOption);

    await waitFor(() => {
      // UPDATED: Now points to the correct Swagger endpoint
      expect(api.patch).toHaveBeenCalledWith('/api/pasteurization/1001/mbt-status', {
        mbt_status: 'pass'
      });
    });
  });

  it('triggers Milk Status (Incident) PATCH request on dropdown change', async () => {
    (api.patch as jest.Mock).mockResolvedValue({ data: { success: true } });
    
    render(<StaffInventoryManagement />);

    await waitFor(() => {
      expect(screen.getByText('1001')).toBeInTheDocument();
    });

    // Open Modal
    fireEvent.click(screen.getByText('1001'));

    // Change Milk Status
    const milkTrigger = screen.getByTestId('select-milk-status');
    fireEvent.click(milkTrigger);
    
    const discardedOption = screen.getByText('Discarded');
    fireEvent.click(discardedOption);

    await waitFor(() => {
      // UPDATED: Now points to the base ID endpoint as per Swagger
      expect(api.patch).toHaveBeenCalledWith('/api/pasteurization/1001', {
        milk_status: 'discarded'
      });
    });
  });
});