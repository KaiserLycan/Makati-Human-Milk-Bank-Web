import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import StaffBeneficiariesManagement from '../staff-beneficiaries-management';

// Mock next/link to forward props in Jest environment
jest.mock('next/link', () => {
  const MockLink = ({ children, href, ...rest }: { children: React.ReactNode; href: string; [key: string]: any }) => {
    return <a href={href} {...rest}>{children}</a>;
  };
  MockLink.displayName = 'MockLink';
  return MockLink;
});

describe('StaffBeneficiariesManagement Component', () => {
  it('renders beneficiaries list layout, columns, and search controls in beneficiaries mode', () => {
    render(<StaffBeneficiariesManagement mode="beneficiaries" />);

    // Verify Title and Sub-navigation active state
    expect(screen.getByRole('heading', { name: 'Beneficiaries List' })).toBeInTheDocument();
    expect(screen.getByTestId('nav-sub-beneficiaries')).toHaveClass('bg-brand-teal/10');

    // Verify New Beneficiary button is NOT present in beneficiaries mode
    expect(screen.queryByTestId('new-beneficiary-btn')).not.toBeInTheDocument();

    // Verify Table Headers are correct
    expect(screen.getByTestId('th-id')).toHaveTextContent('ID');
    expect(screen.getByTestId('th-infant-name')).toHaveTextContent('Infant Name');
    expect(screen.getByTestId('th-parent-name')).toHaveTextContent('Parent Name');
    expect(screen.getByTestId('th-status')).toHaveTextContent('Status');
    expect(screen.getByTestId('th-date')).toHaveTextContent('Date Joined');

    // Check that checkboxes are NOT present
    const checkboxes = screen.queryAllByRole('checkbox');
    expect(checkboxes.length).toBe(0);

    // Verify mock rows are rendered
    expect(screen.getByText('Leo Alexander Carter')).toBeInTheDocument();
    expect(screen.getByText('Amelia Rose Mitchell')).toBeInTheDocument();
  });

  it('renders applicants list layout, columns, and new beneficiary button in applicants mode', () => {
    render(<StaffBeneficiariesManagement mode="applicants" />);

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
    expect(screen.getByText('Grace Hope Jenkins')).toBeInTheDocument();
  });

  it('filters data by search input and status dropdown', () => {
    render(<StaffBeneficiariesManagement mode="beneficiaries" />);

    // Initially multiple items render
    expect(screen.getByText('Leo Alexander Carter')).toBeInTheDocument();
    expect(screen.getByText('Amelia Rose Mitchell')).toBeInTheDocument();

    // Search for "Amelia"
    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: 'Amelia' } });

    // Should filter out Leo Carter and keep Amelia Mitchell
    expect(screen.queryByText('Leo Alexander Carter')).not.toBeInTheDocument();
    expect(screen.getByText('Amelia Rose Mitchell')).toBeInTheDocument();

    // Clear search
    fireEvent.change(searchInput, { target: { value: '' } });

    // Filter by Inactive status
    const statusSelect = screen.getByTestId('status-select');
    fireEvent.change(statusSelect, { target: { value: 'Inactive' } });

    expect(screen.queryByText('Leo Alexander Carter')).not.toBeInTheDocument(); // Leo is Active
    expect(screen.getByText('Amelia Rose Mitchell')).toBeInTheDocument(); // Amelia is Inactive
  });

  it('opens detailed profile modal when clicking a row', () => {
    render(<StaffBeneficiariesManagement mode="beneficiaries" />);

    // Click Leo Carter row
    const leoRow = screen.getByTestId('row-B001');
    fireEvent.click(leoRow);

    // Modal should be open
    expect(screen.getByTestId('detail-modal')).toBeInTheDocument();
    expect(screen.getByTestId('modal-profile-name')).toHaveTextContent('Leo Alexander Carter');
    expect(screen.getByTestId('modal-profile-id')).toHaveTextContent('B001');
    expect(screen.getByTestId('modal-profile-status')).toHaveTextContent('Active');

    // Check specific profile sections are present in modal
    expect(screen.getByTestId('profile-section-infant')).toHaveTextContent('Infant Information');
    expect(screen.getByTestId('profile-section-parent')).toHaveTextContent('Parent / Guardian Information');
    expect(screen.getByTestId('profile-section-documents')).toHaveTextContent('Clinical Documents & Verification');

    // Click close button
    const closeBtn = screen.getByTestId('close-detail-btn');
    fireEvent.click(closeBtn);

    // Modal should be gone
    expect(screen.queryByTestId('detail-modal')).not.toBeInTheDocument();
  });

  it('opens new beneficiary registration form, supports tabs, and registers a beneficiary applicant', () => {
    render(<StaffBeneficiariesManagement mode="applicants" />);

    // Click New Beneficiary button
    const newBeneficiaryBtn = screen.getByTestId('new-beneficiary-btn');
    fireEvent.click(newBeneficiaryBtn);

    // Registration modal is open
    expect(screen.getByTestId('register-modal')).toBeInTheDocument();

    // Verify Tab 1 inputs are present
    expect(screen.getByTestId('register-pane-1')).toBeInTheDocument();
    
    // Fill in Tab 1 required fields
    const infantFirstInput = screen.getByTestId('input-infant-first-name');
    const infantLastInput = screen.getByTestId('input-infant-last-name');
    const infantDobInput = screen.getByTestId('input-infant-dob');
    const infantWeightInput = screen.getByTestId('input-infant-weight');
    const feedingReqInput = screen.getByTestId('input-feeding-requirement');

    fireEvent.change(infantFirstInput, { target: { value: 'Diana' } });
    fireEvent.change(infantLastInput, { target: { value: 'Prince' } });
    fireEvent.change(infantDobInput, { target: { value: '2026-04-01' } });
    fireEvent.change(infantWeightInput, { target: { value: '3000' } });
    fireEvent.change(feedingReqInput, { target: { value: '140ml/day' } });

    // Navigate to Tab 2
    const nextBtn = screen.getByTestId('register-next-btn');
    fireEvent.click(nextBtn);

    // Verify Tab 2 is active
    expect(screen.getByTestId('register-pane-2')).toBeInTheDocument();
    expect(screen.queryByTestId('register-pane-1')).not.toBeInTheDocument();

    // Fill in Tab 2 required fields
    const parentFirstInput = screen.getByTestId('input-parent-first-name');
    const parentLastInput = screen.getByTestId('input-parent-last-name');
    const addressInput = screen.getByTestId('input-address');
    const phoneInput = screen.getByTestId('input-phone');
    const emailInput = screen.getByTestId('input-email');

    fireEvent.change(parentFirstInput, { target: { value: 'Hippolyta' } });
    fireEvent.change(parentLastInput, { target: { value: 'Prince' } });
    fireEvent.change(addressInput, { target: { value: 'Themyscira Island' } });
    fireEvent.change(phoneInput, { target: { value: '555-0202' } });
    fireEvent.change(emailInput, { target: { value: 'hippolyta@amazon.gov' } });

    // Navigate to Tab 3
    fireEvent.click(screen.getByTestId('register-next-btn'));

    // Verify Tab 3 is active
    expect(screen.getByTestId('register-pane-3')).toBeInTheDocument();

    // Fill prescription and abstract filenames
    const prescriptionFileVal = screen.getByTestId('input-prescription-file');
    const abstractFileVal = screen.getByTestId('input-abstract-file');
    fireEvent.change(prescriptionFileVal, { target: { value: 'prescription_diana.pdf' } });
    fireEvent.change(abstractFileVal, { target: { value: 'abstract_diana.pdf' } });

    // Submit form by triggering form submit
    const form = screen.getByTestId('register-form');
    fireEvent.submit(form);

    // Modal should close and new applicant should be added to the list
    expect(screen.queryByTestId('register-modal')).not.toBeInTheDocument();

    // Search for Diana to bring her to the first page (handles pagination of limit 5)
    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: 'Diana' } });
    expect(screen.getByText('Diana Prince')).toBeInTheDocument();
  });
});
