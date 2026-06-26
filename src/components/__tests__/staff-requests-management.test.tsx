import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import StaffRequestsManagement from '../staff-requests-management';
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
    post: jest.fn(),
    patch: jest.fn(),
  }
}));

describe('StaffRequestsManagement Component', () => {
  const mockRequestsResponse = {
    data: {
      data: {
        data: [
          {
            rid: 61,
            bid: 109,
            hospital: 'Makati Med',
            requested_vol_ml: 200,
            requested_date: '2026-06-25T00:00:00.000Z',
            request_status: 'waiting',
            // FIX: Changed from Sofia to Baby John so it doesn't collide with the search test
            beneficiary: { name: 'Baby John' } 
          },
          {
            rid: 62,
            bid: 67,
            hospital: 'General Hospital',
            requested_vol_ml: 150,
            requested_date: '2026-06-26T00:00:00.000Z',
            request_status: 'allocated',
            beneficiary: { name: 'Baby Ava Torres' }
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

  const mockBeneficiariesResponse = {
    data: {
      data: {
        data: [
          { bid: 109, name: 'Sofia Ezekiel Luna', caregiver_email: 'caregiver@test.com' }
        ]
      }
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    (api.get as jest.Mock).mockImplementation((url) => {
      if (url === '/api/reservations') {
        return Promise.resolve(mockRequestsResponse);
      }
      if (url === '/api/beneficiaries') {
        return Promise.resolve(mockBeneficiariesResponse);
      }
      return Promise.resolve({ data: {} });
    });

    window.confirm = jest.fn(() => true);
  });

  it('renders the table and fetches requests with default params', async () => {
    render(<StaffRequestsManagement />);

    expect(screen.getByRole('heading', { name: 'Milk Requests' })).toBeInTheDocument();
    
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/api/reservations', {
        params: expect.objectContaining({
          page: 1,
          limit: 5,
          sortBy: 'rid',
          sortOrder: 'desc'
        })
      });

      expect(screen.getByText('Baby John')).toBeInTheDocument();
      expect(screen.getByText('Baby Ava Torres')).toBeInTheDocument();
    });
  });

  it('triggers a new fetch when the status filter is changed', async () => {
    render(<StaffRequestsManagement />);

    await waitFor(() => {
      expect(screen.getByText('Baby John')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('All Statuses'));
    fireEvent.click(screen.getByText('Waiting'));

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/api/reservations', {
        params: expect.objectContaining({
          request_status: 'waiting'
        })
      });
    });
  });

  it('creates a new request successfully including beneficiary search', async () => {
    (api.post as jest.Mock).mockResolvedValue({ data: { success: true } });
    
    render(<StaffRequestsManagement />);

    fireEvent.click(screen.getByText('New Request'));

    const searchInput = screen.getByPlaceholderText('Search beneficiary name...');
    fireEvent.change(searchInput, { target: { value: 'Sofia' } });

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/api/beneficiaries', {
        params: { search: 'Sofia', limit: 5 }
      });
    });

    // This will now pass because Sofia is ONLY in the dropdown, not the table!
    fireEvent.mouseDown(screen.getByText('Sofia Ezekiel Luna'));

    fireEvent.change(screen.getByPlaceholderText('e.g. Makati Medical Center'), {
      target: { value: 'Makati Med' }
    });
    
    fireEvent.change(screen.getByPlaceholderText('e.g. 200'), {
      target: { value: '250' }
    });

    fireEvent.click(screen.getByRole('button', { name: 'Create Request' }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/api/reservations', {
        beneficiary_id: 109,
        bid: 109,
        hospital: 'Makati Med',
        volume_ml: 250,
        requested_vol_ml: 250
      });
    });
  });

  it('triggers a cancel request PATCH call when clicking the quick action', async () => {
    (api.patch as jest.Mock).mockResolvedValue({ data: { success: true } });
    
    render(<StaffRequestsManagement />);

    await waitFor(() => {
      expect(screen.getByText('61')).toBeInTheDocument();
    });

    // FIX: Use getAllByTitle and select the first one [0]
    const cancelBtns = screen.getAllByTitle('Cancel Request');
    fireEvent.click(cancelBtns[0]);

    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to cancel Request #61?');

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith('/api/reservations/61/cancel');
    });
  });

  it('triggers a dispense request PATCH call when clicking the quick action', async () => {
    (api.patch as jest.Mock).mockResolvedValue({ data: { success: true } });
    
    render(<StaffRequestsManagement />);

    await waitFor(() => {
      expect(screen.getByText('61')).toBeInTheDocument();
    });

    // FIX: Use getAllByTitle and select the first one [0]
    const dispenseBtns = screen.getAllByTitle('Dispense Milk');
    fireEvent.click(dispenseBtns[0]);

    expect(window.confirm).toHaveBeenCalledWith('Are you ready to dispense milk and fulfill Request #61?');

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith('/api/dispensing/61/dispense');
    });
  });
});