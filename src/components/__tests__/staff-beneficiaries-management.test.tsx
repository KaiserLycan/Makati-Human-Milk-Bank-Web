import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import StaffBeneficiariesManagement from '../staff-beneficiaries-management';
import { api } from '../../utils/api';

// Mock next/link to forward props in Jest environment
jest.mock('next/link', () => {
  const MockLink = ({ children, href, ...rest }: { children: React.ReactNode; href: string; [key: string]: any }) => {
    return <a href={href} {...rest}>{children}</a>;
  };
  MockLink.displayName = 'MockLink';
  return MockLink;
});

// Mock api
jest.mock('../../utils/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockBeneficiaries = [
  {
    bid: 'B001',
    name: 'Leo Alexander Carter',
    caregiver: 'Olivia Carter | 123 Main St',
    caregiver_phone: '555-0101',
    caregiver_email: 'olivia@test.com',
    birth_date: '2026-01-01',
    weight_kg: 3.5,
    feeding_requirement_ml: 150,
    account_status: 'active',
    application_status: 'approved',
    joined_date: '2026-06-18T00:00:00.000Z',
    profile: { prescription_details: 'prescription.pdf', clinical_abstract: 'abstract.pdf' }
  },
  {
    bid: 'B002',
    name: 'Amelia Rose Mitchell',
    caregiver: 'Sophia Mitchell | 456 Elm St',
    caregiver_phone: '555-0102',
    caregiver_email: 'sophia@test.com',
    birth_date: '2026-02-01',
    weight_kg: 4.0,
    feeding_requirement_ml: 180,
    account_status: 'inactive',
    application_status: 'approved',
    joined_date: '2026-06-19T00:00:00.000Z',
    profile: { prescription_details: null, clinical_abstract: null }
  },
  {
    bid: 'A001',
    name: 'Grace Hope Jenkins',
    caregiver: 'Hannah Jenkins | 789 Pine St',
    caregiver_phone: '555-0103',
    caregiver_email: 'hannah@test.com',
    birth_date: '2026-03-01',
    weight_kg: 3.2,
    feeding_requirement_ml: 120,
    account_status: 'inactive',
    application_status: 'pending',
    joined_date: '2026-06-20T00:00:00.000Z',
    profile: { prescription_details: null, clinical_abstract: null }
  }
];

describe('StaffBeneficiariesManagement Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (api.get as jest.Mock).mockImplementation((url, config) => {
      if (url === '/api/beneficiaries') {
        const queryStatus = config?.params?.status || config?.params?.application_status;
        let filtered = [...mockBeneficiaries];
        if (queryStatus === 'active') {
          filtered = filtered.filter(b => b.account_status === 'active');
        } else if (queryStatus === 'inactive') {
          filtered = filtered.filter(b => b.account_status === 'inactive');
        } else if (queryStatus === 'pending') {
          filtered = filtered.filter(b => b.application_status === 'pending');
        } else if (queryStatus === 'rejected') {
          filtered = filtered.filter(b => b.application_status === 'rejected');
        }
        return Promise.resolve({
          data: {
            success: true,
            data: {
              data: filtered,
              meta: {
                total: filtered.length,
                page: 1,
                limit: config?.params?.limit || 5,
                totalPages: 1
              }
            }
          }
        });
      }
      return Promise.resolve({ data: {} });
    });

    (api.post as jest.Mock).mockResolvedValue({
      data: {
        success: true,
        data: {
          bid: 'B003',
          name: 'Diana Prince',
          caregiver: 'Hippolyta Prince | Themyscira Island',
          caregiver_phone: '555-0202',
          caregiver_email: 'hippolyta@amazon.gov',
          birth_date: '2026-04-01',
          weight_kg: 3.0,
          feeding_requirement_ml: 140,
          account_status: 'inactive',
          application_status: 'pending',
          joined_date: '2026-06-21T00:00:00.000Z',
          profile: { prescription_details: 'prescription_diana.pdf', clinical_abstract: 'abstract_diana.pdf' }
        }
      }
    });
  });

  it('renders beneficiaries list layout, columns, and search controls in beneficiaries mode', async () => {
    await act(async () => {
      render(<StaffBeneficiariesManagement mode="beneficiaries" />);
    });

    // Verify Title and Sub-navigation active state
    expect(screen.getByRole('heading', { name: 'Beneficiaries List' })).toBeInTheDocument();
    expect(screen.getByTestId('nav-sub-beneficiaries')).toHaveClass('bg-brand-teal/10');

    // Verify Table Headers are correct
    expect(screen.getByTestId('th-id')).toHaveTextContent('ID');
    expect(screen.getByTestId('th-infant-name')).toHaveTextContent('Infant Name');
    expect(screen.getByTestId('th-parent-name')).toHaveTextContent('Parent Name');
    expect(screen.getByTestId('th-status')).toHaveTextContent('Status');
    expect(screen.getByTestId('th-date')).toHaveTextContent('Date Joined');

    // Verify mock rows are rendered
    await waitFor(() => {
      expect(screen.getByText('Leo Alexander Carter')).toBeInTheDocument();
      expect(screen.getByText('Amelia Rose Mitchell')).toBeInTheDocument();
    });
  });

  it('renders applicants list layout, columns, and new beneficiary button in applicants mode', async () => {
    await act(async () => {
      render(<StaffBeneficiariesManagement mode="applicants" />);
    });

    // Verify Title and Sub-navigation active state
    expect(screen.getByRole('heading', { name: 'Applicants List' })).toBeInTheDocument();
    expect(screen.getByTestId('nav-sub-beneficiary-applicants')).toHaveClass('bg-brand-teal/10');

    // Verify New Beneficiary button exists
    expect(screen.getByTestId('new-beneficiary-btn')).toBeInTheDocument();

    // Verify Table Headers are correct
    expect(screen.getByTestId('th-id')).toHaveTextContent('ID');
    expect(screen.getByTestId('th-infant-name')).toHaveTextContent('Infant Name');
    expect(screen.getByTestId('th-parent-name')).toHaveTextContent('Parent Name');
    expect(screen.getByTestId('th-status')).toHaveTextContent('Application Status');
    expect(screen.getByTestId('th-date')).toHaveTextContent('Date Applied');

    // Verify mock rows are rendered
    await waitFor(() => {
      expect(screen.getByText('Grace Hope Jenkins')).toBeInTheDocument();
    });
  });

  it('filters data by search input and status dropdown', async () => {
    await act(async () => {
      render(<StaffBeneficiariesManagement mode="beneficiaries" />);
    });

    await waitFor(() => {
      expect(screen.getByText('Leo Alexander Carter')).toBeInTheDocument();
    });

    // Search for "Amelia"
    const searchInput = screen.getByTestId('search-input');
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: 'Amelia' } });
    });

    // Should filter out Leo Carter and keep Amelia Mitchell
    expect(screen.queryByText('Leo Alexander Carter')).not.toBeInTheDocument();
    expect(screen.getByText('Amelia Rose Mitchell')).toBeInTheDocument();

    // Clear search
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: '' } });
    });

    // Log the current DOM state to understand why status-select might be missing
    screen.debug();

    // Filter by Inactive status
    const statusSelect = screen.getByTestId('status-select');
    await act(async () => {
      fireEvent.click(statusSelect);
    });

    const inactiveOption = screen.getByTestId('option-Inactive');
    await act(async () => {
      fireEvent.click(inactiveOption);
    });

    await waitFor(() => {
      expect(screen.queryByText('Leo Alexander Carter')).not.toBeInTheDocument(); // Leo is Active
      expect(screen.getByText('Amelia Rose Mitchell')).toBeInTheDocument(); // Amelia is Inactive
    });
  });

  it('opens detailed profile modal when clicking a row', async () => {
    await act(async () => {
      render(<StaffBeneficiariesManagement mode="beneficiaries" />);
    });

    await waitFor(() => {
      expect(screen.getByText('Leo Alexander Carter')).toBeInTheDocument();
    });

    // Click Leo Carter row
    const leoRow = screen.getByTestId('row-B001');
    await act(async () => {
      fireEvent.click(leoRow);
    });

    // Modal should be open
    expect(screen.getByTestId('detail-modal')).toBeInTheDocument();
    expect(screen.getByTestId('modal-profile-name')).toHaveTextContent('Leo Alexander Carter');
    expect(screen.getByTestId('modal-profile-id')).toHaveTextContent('B001');
    expect(screen.getByTestId('modal-profile-status')).toHaveTextContent('Active');

    // Click close button
    const closeBtn = screen.getByTestId('close-detail-btn');
    await act(async () => {
      fireEvent.click(closeBtn);
    });

    // Modal should be gone
    expect(screen.queryByTestId('detail-modal')).not.toBeInTheDocument();
  });

  it('opens new beneficiary registration form, supports tabs, and registers a beneficiary applicant', async () => {
    let currentBeneficiaries = [...mockBeneficiaries];

    (api.get as jest.Mock).mockImplementation((url, config) => {
      if (url === '/api/beneficiaries') {
        const queryStatus = config?.params?.status || config?.params?.application_status;
        let filtered = [...currentBeneficiaries];
        if (queryStatus === 'active') {
          filtered = filtered.filter(b => b.account_status === 'active');
        } else if (queryStatus === 'inactive') {
          filtered = filtered.filter(b => b.account_status === 'inactive');
        } else if (queryStatus === 'pending') {
          filtered = filtered.filter(b => b.application_status === 'pending');
        } else if (queryStatus === 'rejected') {
          filtered = filtered.filter(b => b.application_status === 'rejected');
        }
        return Promise.resolve({
          data: {
            success: true,
            data: {
              data: filtered,
              meta: {
                total: filtered.length,
                page: 1,
                limit: config?.params?.limit || 5,
                totalPages: 1
              }
            }
          }
        });
      }
      return Promise.resolve({ data: {} });
    });

    (api.post as jest.Mock).mockImplementation((url, payload) => {
      if (url === '/api/beneficiaries/register') {
        const dataStr = payload.get('data');
        const parsedData = JSON.parse(dataStr);
        const newBeneficiary = {
          bid: 'B003',
          name: parsedData.name,
          caregiver: parsedData.caregiver,
          caregiver_phone: parsedData.caregiver_phone,
          caregiver_email: parsedData.caregiver_email,
          birth_date: parsedData.birth_date,
          weight_kg: parsedData.weight_kg,
          feeding_requirement_ml: parsedData.feeding_requirement_ml,
          account_status: 'inactive',
          application_status: 'pending',
          joined_date: new Date().toISOString(),
          profile: { prescription_details: 'prescription_diana.pdf', clinical_abstract: 'abstract_diana.pdf' }
        };
        currentBeneficiaries.push(newBeneficiary);
        return Promise.resolve({
          data: {
            success: true,
            data: newBeneficiary
          }
        });
      }
      return Promise.resolve({ data: {} });
    });

    await act(async () => {
      render(<StaffBeneficiariesManagement mode="applicants" />);
    });

    // Click New Beneficiary button
    const newBeneficiaryBtn = screen.getByTestId('new-beneficiary-btn');
    await act(async () => {
      fireEvent.click(newBeneficiaryBtn);
    });

    // Registration modal is open
    expect(screen.getByTestId('register-modal')).toBeInTheDocument();

    // Fill in Tab 1 required fields
    const infantFirstInput = screen.getByTestId('input-infant-first-name');
    const infantLastInput = screen.getByTestId('input-infant-last-name');
    const infantDobInput = screen.getByTestId('input-infant-dob');
    const infantWeightInput = screen.getByTestId('input-infant-weight');
    const feedingReqInput = screen.getByTestId('input-feeding-requirement');

    await act(async () => {
      fireEvent.change(infantFirstInput, { target: { value: 'Diana' } });
      fireEvent.change(infantLastInput, { target: { value: 'Prince' } });
      fireEvent.change(infantDobInput, { target: { value: '2026-04-01' } });
      fireEvent.change(infantWeightInput, { target: { value: '3000' } });
      fireEvent.change(feedingReqInput, { target: { value: '140ml/day' } });
    });

    // Navigate to Tab 2
    const nextBtn = screen.getByTestId('register-next-btn');
    await act(async () => {
      fireEvent.click(nextBtn);
    });

    // Fill in Tab 2 required fields
    const parentFirstInput = screen.getByTestId('input-parent-first-name');
    const parentLastInput = screen.getByTestId('input-parent-last-name');
    const addressInput = screen.getByTestId('input-address');
    const phoneInput = screen.getByTestId('input-phone');
    const emailInput = screen.getByTestId('input-email');

    await act(async () => {
      fireEvent.change(parentFirstInput, { target: { value: 'Hippolyta' } });
      fireEvent.change(parentLastInput, { target: { value: 'Prince' } });
      fireEvent.change(addressInput, { target: { value: 'Themyscira Island' } });
      fireEvent.change(phoneInput, { target: { value: '555-0202' } });
      fireEvent.change(emailInput, { target: { value: 'hippolyta@amazon.gov' } });
    });

    // Navigate to Tab 3
    await act(async () => {
      fireEvent.click(screen.getByTestId('register-next-btn'));
    });

    // Mock file input selection correctly for JSDOM
    const prescriptionFileVal = screen.getByTestId('input-prescription-file');
    const abstractFileVal = screen.getByTestId('input-abstract-file');

    const mockFile1 = new File(['prescription'], 'prescription_diana.pdf', { type: 'application/pdf' });
    const mockFile2 = new File(['abstract'], 'abstract_diana.pdf', { type: 'application/pdf' });

    await act(async () => {
      fireEvent.change(prescriptionFileVal, { target: { files: [mockFile1] } });
      fireEvent.change(abstractFileVal, { target: { files: [mockFile2] } });
    });

    // Submit form by triggering form submit
    const form = screen.getByTestId('register-form');
    await act(async () => {
      fireEvent.submit(form);
    });

    // Modal should close
    await waitFor(() => {
      expect(screen.queryByTestId('register-modal')).not.toBeInTheDocument();
    });

    // Search for Diana
    const searchInput = screen.getByTestId('search-input');
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: 'Diana' } });
    });

    await waitFor(() => {
      expect(screen.getByText('Diana Prince')).toBeInTheDocument();
    });
  });
});
