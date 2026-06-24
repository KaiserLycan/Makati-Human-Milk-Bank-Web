import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import StaffDashboard from '../staff-dashboard';

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
    get: jest.fn(() => new Promise(() => {})),
  },
}));

describe('StaffDashboard Component', () => {
  it('renders sidebar navigation links, profile section, and notification', () => {
    render(<StaffDashboard />);

    // Verify logo and core links
    expect(screen.getByText('MHMB')).toBeInTheDocument();
    expect(screen.getByTestId('nav-dashboard')).toBeInTheDocument();
    const reportsLink = screen.getByTestId('nav-reports');
    expect(reportsLink).toBeInTheDocument();
    expect(reportsLink).toHaveAttribute('href', '/work/reports');
    expect(screen.getByText('Pool Milk')).toBeInTheDocument();
    expect(screen.getByText('Milk Inventory')).toBeInTheDocument();
    expect(screen.getByText('Milk Requests')).toBeInTheDocument();
    expect(screen.getByText('Manage Users')).toBeInTheDocument();
    expect(screen.getByText('Audits')).toBeInTheDocument();

    // Verify Notification Alert
    expect(screen.getByText('System Status Online')).toBeInTheDocument();
    expect(screen.getByText('Database Synced')).toBeInTheDocument();

    // Verify Profile Info
    expect(screen.getByTestId('profile-name')).toHaveTextContent('Alice May Miller');
    expect(screen.getByTestId('profile-id')).toHaveTextContent('2024102114');
    expect(screen.getByTestId('logout-btn')).toBeInTheDocument();

    // Verify Header Notification Button
    const headerNotifBtn = screen.getByTestId('header-notification-btn');
    expect(headerNotifBtn).toBeInTheDocument();
    expect(headerNotifBtn).toHaveAttribute('href', '/work/notification');
  });

  it('renders all metrics cards with values and changes', () => {
    render(<StaffDashboard />);

    // Total PHMB
    expect(screen.getByTestId('metric-total-phmb')).toBeInTheDocument();
    expect(screen.getByText('1203mL')).toBeInTheDocument();

    // Total Dispensed
    expect(screen.getByTestId('metric-total-dispensed')).toBeInTheDocument();
    expect(screen.getByText('103mL')).toBeInTheDocument();

    // Buffer Card
    expect(screen.getByTestId('metric-buffer')).toBeInTheDocument();
    expect(screen.getByText('800 ml')).toBeInTheDocument();
    expect(screen.getByText(/\+30% from yesterday/i)).toBeInTheDocument();

    // Active Donors
    const donorsCard = screen.getByTestId('metric-donors');
    expect(donorsCard).toBeInTheDocument();
    expect(donorsCard).toHaveTextContent('100');
    expect(donorsCard).toHaveTextContent('-1% from last month');

    // Active Beneficiaries
    const beneficiariesCard = screen.getByTestId('metric-beneficiaries');
    expect(beneficiariesCard).toBeInTheDocument();
    expect(beneficiariesCard).toHaveTextContent('67');
    expect(beneficiariesCard).toHaveTextContent('-1% from last month');
  });

  it('renders Collection chart with labels, y-axis, and bars', () => {
    render(<StaffDashboard />);

    expect(screen.getByTestId('collection-title')).toHaveTextContent('Collection');
    expect(screen.getByText('Breast milk collected per program.')).toBeInTheDocument();

    // Y-axis labels
    expect(screen.getByText('800')).toBeInTheDocument();
    expect(screen.getByText('600')).toBeInTheDocument();
    expect(screen.getByText('400')).toBeInTheDocument();
    expect(screen.getByText('200')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();

    // Chart X-axis bars
    expect(screen.getByTestId('bar-wi')).toBeInTheDocument();
    expect(screen.getByTestId('bar-ma')).toBeInTheDocument();
    expect(screen.getByTestId('bar-mw')).toBeInTheDocument();
    expect(screen.getByTestId('bar-st')).toBeInTheDocument();
  });

  it('toggles collapsible sub-menus when header is clicked', () => {
    render(<StaffDashboard />);

    // Verify sub-menus are initially open and display options
    const donorsSub = screen.getByTestId('nav-sub-donors');
    expect(donorsSub).toBeInTheDocument();
    expect(donorsSub).toHaveAttribute('href', '/work/donor');
    
    expect(screen.getByTestId('nav-sub-applicants')).toBeInTheDocument();
    expect(screen.getByTestId('nav-sub-applicants')).toHaveAttribute('href', '/work/applicant-donor');
    expect(screen.getByText('Beneficiaries')).toBeInTheDocument();

    // Click Donors header to collapse
    const donorsToggle = screen.getByTestId('nav-donors-toggle');
    fireEvent.click(donorsToggle);
    expect(screen.queryByTestId('nav-sub-donors')).not.toBeInTheDocument();

    // Click Beneficiaries header to collapse
    const beneficiariesToggle = screen.getByTestId('nav-beneficiaries-toggle');
    fireEvent.click(beneficiariesToggle);
    expect(screen.queryByText('Beneficiaries')).not.toBeInTheDocument();

    // Toggle them open again
    fireEvent.click(donorsToggle);
    expect(screen.getByTestId('nav-sub-donors')).toBeInTheDocument();
  });

  it('auto-dismisses the sidebar notification banner after 2 seconds', () => {
    jest.useFakeTimers();
    render(<StaffDashboard />);

    // Initially visible
    expect(screen.getByTestId('sidebar-notification')).toBeInTheDocument();

    // Advance time by 2 seconds
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    // Now it should be gone
    expect(screen.queryByTestId('sidebar-notification')).not.toBeInTheDocument();

    jest.useRealTimers();
  });
});
