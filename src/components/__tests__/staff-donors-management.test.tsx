import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import StaffDonorsManagement from '../staff-donors-management';

// Mock next/link to forward props in Jest environment
jest.mock('next/link', () => {
  const MockLink = ({ children, href, ...rest }: { children: React.ReactNode; href: string; [key: string]: any }) => {
    return <a href={href} {...rest}>{children}</a>;
  };
  MockLink.displayName = 'MockLink';
  return MockLink;
});

describe('StaffDonorsManagement Component', () => {
  it('renders donors list layout, columns, and search controls in donors mode', () => {
    render(<StaffDonorsManagement mode="donors" />);

    // Verify Title and Sub-navigation active state
    expect(screen.getByRole('heading', { name: 'Donors List' })).toBeInTheDocument();
    expect(screen.getByTestId('nav-sub-donors')).toHaveClass('bg-brand-teal/10');

    // Verify New Donor button does NOT exist in donors mode
    expect(screen.queryByTestId('new-donor-btn')).not.toBeInTheDocument();

    // Verify Table Headers are correct
    expect(screen.getByTestId('th-id')).toHaveTextContent('ID');
    expect(screen.getByTestId('th-name')).toHaveTextContent('Name');
    expect(screen.getByTestId('th-status')).toHaveTextContent('Status');
    expect(screen.getByTestId('th-date')).toHaveTextContent('Date Joined');
    expect(screen.getByTestId('th-last')).toHaveTextContent('Last Donation');

    // Check that checkboxes are NOT present
    const checkboxes = screen.queryAllByRole('checkbox');
    expect(checkboxes.length).toBe(0);

    // Verify mock rows are rendered
    expect(screen.getByText('Olivia Carter')).toBeInTheDocument();
    expect(screen.getByText('Sophia Mitchell')).toBeInTheDocument();
  });

  it('renders applicants list layout and columns in applicants mode', () => {
    render(<StaffDonorsManagement mode="applicants" />);

    // Verify Title and Sub-navigation active state
    expect(screen.getByRole('heading', { name: 'Applicants List' })).toBeInTheDocument();
    expect(screen.getByTestId('nav-sub-applicants')).toHaveClass('bg-brand-teal/10');

    // Verify New Donor button is present in applicants mode
    expect(screen.getByTestId('new-donor-btn')).toBeInTheDocument();

    // Verify Table Headers are correct
    expect(screen.getByTestId('th-id')).toHaveTextContent('ID');
    expect(screen.getByTestId('th-name')).toHaveTextContent('Name');
    expect(screen.getByTestId('th-status')).toHaveTextContent('Application Status');
    expect(screen.getByTestId('th-date')).toHaveTextContent('Date Applied');
    expect(screen.getByTestId('th-email')).toHaveTextContent('Email');

    // Verify mock rows are rendered
    expect(screen.getByText('Sarah Jenkins')).toBeInTheDocument();
  });

  it('filters data by search input and status dropdown', () => {
    render(<StaffDonorsManagement mode="donors" />);

    // Initially multiple items render
    expect(screen.getByText('Olivia Carter')).toBeInTheDocument();
    expect(screen.getByText('Sophia Mitchell')).toBeInTheDocument();

    // Search for "Sophia"
    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: 'Sophia' } });

    // Should filter out Olivia Carter and keep Sophia Mitchell
    expect(screen.queryByText('Olivia Carter')).not.toBeInTheDocument();
    expect(screen.getByText('Sophia Mitchell')).toBeInTheDocument();

    // Clear search
    fireEvent.change(searchInput, { target: { value: '' } });

    // Filter by Inactive status
    const statusSelect = screen.getByTestId('status-select');
    fireEvent.change(statusSelect, { target: { value: 'Inactive' } });

    expect(screen.queryByText('Olivia Carter')).not.toBeInTheDocument(); // Olivia is Active
    expect(screen.getByText('Sophia Mitchell')).toBeInTheDocument(); // Sophia is Inactive
  });

  it('opens detailed profile modal when clicking a row', () => {
    render(<StaffDonorsManagement mode="donors" />);

    // Click Olivia Carter row
    const oliviaRow = screen.getByTestId('row-D001');
    fireEvent.click(oliviaRow);

    // Modal should be open
    expect(screen.getByTestId('detail-modal')).toBeInTheDocument();
    expect(screen.getByTestId('modal-profile-name')).toHaveTextContent('Olivia Carter');
    expect(screen.getByTestId('modal-profile-id')).toHaveTextContent('D001');
    expect(screen.getByTestId('modal-profile-status')).toHaveTextContent('Active');

    // Check specific profile sections are present in modal
    expect(screen.getByTestId('profile-section-personal')).toHaveTextContent('Personal Information');
    expect(screen.getByTestId('profile-section-contact')).toHaveTextContent('Contact Information');
    expect(screen.getByTestId('profile-section-travel')).toHaveTextContent('Traveling Information');
    expect(screen.getByTestId('profile-section-donation')).toHaveTextContent('Donation Information');
    expect(screen.getByTestId('profile-section-medical')).toHaveTextContent('Medical Checklists & Screening');

    // Click close button
    const closeBtn = screen.getByTestId('close-detail-btn');
    fireEvent.click(closeBtn);

    // Modal should be gone
    expect(screen.queryByTestId('detail-modal')).not.toBeInTheDocument();
  });

  it('opens new donor registration form, supports tabs, and registers a donor', () => {
    render(<StaffDonorsManagement mode="applicants" />);

    // Click New Donor button
    const newDonorBtn = screen.getByTestId('new-donor-btn');
    fireEvent.click(newDonorBtn);

    // Registration modal is open
    expect(screen.getByTestId('register-modal')).toBeInTheDocument();

    // Verify Tab 1 inputs are present
    expect(screen.getByTestId('register-pane-1')).toBeInTheDocument();
    
    // Fill in Tab 1 required fields
    const nameInput = screen.getByTestId('input-name');
    const dobInput = screen.getByTestId('input-dob');
    const addressInput = screen.getByTestId('input-address');
    const phoneInput = screen.getByTestId('input-phone');
    const emailInput = screen.getByTestId('input-email');

    fireEvent.change(nameInput, { target: { value: 'Diana Prince' } });
    fireEvent.change(dobInput, { target: { value: '1990-03-24' } });
    fireEvent.change(addressInput, { target: { value: '123 Justice Way' } });
    fireEvent.change(phoneInput, { target: { value: '555-0101' } });
    fireEvent.change(emailInput, { target: { value: 'diana@justice.org' } });

    // Navigate to Tab 2
    const nextBtn = screen.getByTestId('register-next-btn');
    fireEvent.click(nextBtn);

    // Verify Tab 2 is active
    expect(screen.getByTestId('register-pane-2')).toBeInTheDocument();
    expect(screen.queryByTestId('register-pane-1')).not.toBeInTheDocument();

    // Navigate to Tab 3
    fireEvent.click(screen.getByTestId('register-next-btn'));

    // Verify Tab 3 is active
    expect(screen.getByTestId('register-pane-3')).toBeInTheDocument();

    // Submit form by triggering form submit
    const form = screen.getByTestId('register-form');
    fireEvent.submit(form);

    // Modal should close and new donor should be added to the list
    expect(screen.queryByTestId('register-modal')).not.toBeInTheDocument();

    // Filter by searching 'Diana' so she appears on page 1 (since page limit is 5 and default sort order places D006 on page 2)
    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: 'Diana' } });
    expect(screen.getByText('Diana Prince')).toBeInTheDocument();
  });
});
