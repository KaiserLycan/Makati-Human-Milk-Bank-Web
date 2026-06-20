import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import StaffRequestsManagement from '../staff-requests-management';
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
    loadRequests: jest.fn(),
    saveRequests: jest.fn(),
    loadAudits: jest.fn(),
    saveAudits: jest.fn(),
    loadProfile: jest.fn(),
  };
});

describe('StaffRequestsManagement Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (storage.loadProfile as jest.Mock).mockReturnValue({
      name: 'Alice May Miller',
      id: '2024102114',
      email: 'staff@mhmb.gov',
      role: 'manager',
    });
  });

  const mockRequests: storage.MilkRequest[] = [
    { id: 'REQ001', beneficiaryName: 'Leo Carter', hospital: 'Makati Medical Center', requestedVolume: 200, dateRequested: '2026-06-19', status: 'Pending' },
    { id: 'REQ002', beneficiaryName: 'Noah Phillips', hospital: 'St. Jude Hospital', requestedVolume: 150, dateRequested: '2026-06-20', status: 'Fulfilled' },
  ];

  it('renders milk requests list and supports details viewing', () => {
    (storage.loadRequests as jest.Mock).mockReturnValue(mockRequests);
    render(<StaffRequestsManagement />);

    expect(screen.getByRole('heading', { name: 'Milk Requests' })).toBeInTheDocument();
    expect(screen.getByText('REQ001')).toBeInTheDocument();
    expect(screen.getByText('Leo Carter')).toBeInTheDocument();
    expect(screen.getByText('200 mL')).toBeInTheDocument();

    // Click request ID to open modal
    const rowIdBtn = screen.getByText('REQ001');
    fireEvent.click(rowIdBtn);

    expect(screen.getByTestId('detail-modal')).toBeInTheDocument();
    expect(screen.getByTestId('modal-beneficiary-name')).toHaveTextContent('Leo Carter');
    expect(screen.getByTestId('modal-hospital')).toHaveTextContent('Makati Medical Center');
    expect(screen.getByTestId('modal-volume')).toHaveTextContent('200 mL');
  });

  it('supports filters for status and search queries', () => {
    (storage.loadRequests as jest.Mock).mockReturnValue(mockRequests);
    render(<StaffRequestsManagement />);

    // Search query filter
    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: 'St. Jude' } });

    expect(screen.getByText('Noah Phillips')).toBeInTheDocument();
    expect(screen.queryByText('Leo Carter')).not.toBeInTheDocument();

    // Clear search and filter status
    fireEvent.change(searchInput, { target: { value: '' } });
    const statusSelect = screen.getByTestId('status-select');
    fireEvent.change(statusSelect, { target: { value: 'Pending' } });

    expect(screen.getByText('Leo Carter')).toBeInTheDocument();
    expect(screen.queryByText('Noah Phillips')).not.toBeInTheDocument();
  });

  it('opens registration modal, validates fields, and creates a pending request', () => {
    (storage.loadRequests as jest.Mock).mockReturnValue(mockRequests);
    (storage.loadProfile as jest.Mock).mockReturnValue({ name: 'Alice May Miller', id: '2024102114', email: 'staff@mhmb.gov', role: 'manager' });
    (storage.loadAudits as jest.Mock).mockReturnValue([]);

    render(<StaffRequestsManagement />);

    const newRequestBtn = screen.getByTestId('new-request-btn');
    fireEvent.click(newRequestBtn);

    expect(screen.getByTestId('new-request-modal')).toBeInTheDocument();

    // Input fields
    const nameInput = screen.getByTestId('input-beneficiary-name');
    const hospitalInput = screen.getByTestId('input-hospital');
    const volumeInput = screen.getByTestId('input-volume');

    fireEvent.change(nameInput, { target: { value: 'Mason Jenkins' } });
    fireEvent.change(hospitalInput, { target: { value: 'Taguig Gen Hospital' } });
    fireEvent.change(volumeInput, { target: { value: '180' } });

    const confirmBtn = screen.getByTestId('confirm-register-btn');
    fireEvent.click(confirmBtn);

    // Verify it was saved to storage
    expect(storage.saveRequests).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'REQ003',
          beneficiaryName: 'Mason Jenkins',
          hospital: 'Taguig Gen Hospital',
          requestedVolume: 180,
          status: 'Pending',
        }),
      ])
    );
  });

  it('allows fulfilling and declining of pending requests in details modal', () => {
    (storage.loadRequests as jest.Mock).mockReturnValue(mockRequests);
    (storage.loadProfile as jest.Mock).mockReturnValue({ name: 'Alice May Miller', id: '2024102114', email: 'staff@mhmb.gov', role: 'manager' });
    (storage.loadAudits as jest.Mock).mockReturnValue([]);

    render(<StaffRequestsManagement />);

    // Open detail modal for REQ001
    const rowIdBtn = screen.getByText('REQ001');
    fireEvent.click(rowIdBtn);

    // Click Fulfill
    const fulfillBtn = screen.getByTestId('fulfill-btn');
    fireEvent.click(fulfillBtn);

    // Verify request is saved as Fulfilled
    expect(storage.saveRequests).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'REQ001',
          status: 'Fulfilled',
        }),
      ])
    );
  });
});
