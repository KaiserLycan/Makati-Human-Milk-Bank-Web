import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import StaffCollectionManagement from '../staff-collection-management';
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

describe('StaffCollectionManagement Component', () => {
  const mockCollectionsResponse = {
    data: {
      data: {
        data: [
          {
            ctn: 101,
            donor: { dtn: 201, name: 'Olivia Carter' },
            program: 'WI',
            hospital: null,
            health_center: null,
            volume_ml: 150,
            collected_by_user: { user_id: '1', name: 'Alice May Miller' },
            collection_date: '2026-06-18T00:00:00.000Z',
            expiration_date: '2026-12-18T00:00:00.000Z',
            pickup_date: null,
            qat_status: 'pass',
            milk_status: 'good',
            remarks: null,
            pid: null
          },
          {
            ctn: 102,
            donor: { dtn: 202, name: 'Emma Phillips' },
            program: 'WI',
            hospital: null,
            health_center: null,
            volume_ml: 200,
            collected_by_user: { user_id: '1', name: 'Alice May Miller' },
            collection_date: '2026-06-19T00:00:00.000Z',
            expiration_date: '2026-12-19T00:00:00.000Z',
            pickup_date: null,
            qat_status: 'pass',
            milk_status: 'good',
            remarks: null,
            pid: null
          },
          {
            ctn: 103,
            donor: { dtn: 203, name: 'Sophia Mitchell' },
            program: 'WI',
            hospital: null,
            health_center: null,
            volume_ml: 250,
            collected_by_user: { user_id: '1', name: 'Alice May Miller' },
            collection_date: '2026-06-20T00:00:00.000Z',
            expiration_date: '2026-12-20T00:00:00.000Z',
            pickup_date: null,
            qat_status: 'pass',
            milk_status: 'good',
            remarks: null,
            pid: 1
          }
        ],
        meta: {
          total: 3,
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
    (api.get as jest.Mock).mockResolvedValue(mockCollectionsResponse);
  });

  it('renders raw milk collections list and sidebar navigation', async () => {
    render(<StaffCollectionManagement />);

    expect(screen.getByText('Raw Milk Collections')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('101')).toBeInTheDocument();
      expect(screen.getByText('Olivia Carter')).toBeInTheDocument();
      expect(screen.getByText('150 mL')).toBeInTheDocument();

      expect(screen.getByText('102')).toBeInTheDocument();
      expect(screen.getByText('Emma Phillips')).toBeInTheDocument();
      expect(screen.getByText('200 mL')).toBeInTheDocument();
    });
  });

  it('opens detailed collection profile modal on row click', async () => {
    render(<StaffCollectionManagement />);

    await waitFor(() => {
      expect(screen.getByText('101')).toBeInTheDocument();
    });

    // Click row with CTN 101 (represented as text)
    const rowIdBtn = screen.getByText('101');
    fireEvent.click(rowIdBtn);

    await waitFor(() => {
      expect(screen.getByTestId('detail-modal')).toBeInTheDocument();
      expect(screen.getByTestId('modal-donor-name')).toHaveTextContent('Olivia Carter');
      expect(screen.getByTestId('modal-collection-id')).toHaveTextContent('101');
      expect(screen.getByTestId('modal-expected')).toHaveTextContent('150 mL');
    });

    // Close modal
    const closeBtn = screen.getByTestId('close-detail-modal-btn');
    fireEvent.click(closeBtn);
    
    await waitFor(() => {
      expect(screen.queryByTestId('detail-modal')).not.toBeInTheDocument();
    });
  });

  it('enables pooling and processes selected collections', async () => {
    (api.post as jest.Mock).mockResolvedValue({ data: { success: true } });

    render(<StaffCollectionManagement />);

    await waitFor(() => {
      expect(screen.getByTestId('checkbox-101')).toBeInTheDocument();
      expect(screen.getByTestId('checkbox-102')).toBeInTheDocument();
    });

    const checkbox1 = screen.getByTestId('checkbox-101');
    const checkbox2 = screen.getByTestId('checkbox-102');

    // Select both
    fireEvent.click(checkbox1);
    fireEvent.click(checkbox2);

    const poolBtn = screen.getByTestId('pool-selected-btn');
    expect(poolBtn).toBeInTheDocument();
    expect(poolBtn).toHaveTextContent('Pool (2)');

    // Click pool to open modal
    fireEvent.click(poolBtn);
    expect(screen.getByTestId('pool-modal')).toBeInTheDocument();
    expect(screen.getByText('350 mL')).toBeInTheDocument(); // 150 + 200

    // Enter actual volume
    const actualVolumeInput = screen.getByTestId('actual-volume-input');
    fireEvent.change(actualVolumeInput, { target: { value: '345' } });

    const confirmBtn = screen.getByTestId('confirm-pool-btn');
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/api/pooling', {
        collections: [101, 102],
        actual_volume_ml: 345,
        remarks: 'Pooled from UI',
      });
    });
  });
});
