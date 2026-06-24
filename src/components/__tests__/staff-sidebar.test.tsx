import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import StaffSidebar from '../ui/staff-sidebar';
import * as storage from '../../utils/storage';
import { reloadWindow } from '../../utils/navigation';
import { api } from '../../utils/api';

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
    loadProfile: jest.fn(),
    saveProfile: jest.fn(),
    loadUsers: jest.fn(),
  };
});

// Mock navigation utility
jest.mock('../../utils/navigation', () => ({
  reloadWindow: jest.fn(),
}));

jest.mock("../../utils/api", () => ({
  api:{
    post: jest.fn(),
  },
}));


describe('StaffSidebar Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders standard navigation links for staff and manager users', () => {
    // Setup staff profile
    (storage.loadProfile as jest.Mock).mockReturnValue({
      name: 'Alice May Miller',
      id: '2024102114',
      email: 'staff@mhmb.gov',
      role: 'staff',
    });
    (storage.loadUsers as jest.Mock).mockReturnValue([]);

    render(<StaffSidebar activeItem="dashboard" />);

    expect(screen.getByText('MHMB')).toBeInTheDocument();
    expect(screen.getByTestId('nav-dashboard')).toBeInTheDocument();
    expect(screen.getByTestId('nav-reports')).toBeInTheDocument();
    expect(screen.getByTestId('nav-collection')).toBeInTheDocument();
    expect(screen.getByTestId('nav-pool')).toBeInTheDocument();
    expect(screen.getByTestId('nav-inventory')).toBeInTheDocument();
    expect(screen.getByTestId('nav-requests')).toBeInTheDocument();

    // Manager only links should NOT be present
    expect(screen.queryByTestId('nav-users')).not.toBeInTheDocument();
    expect(screen.queryByTestId('nav-audits')).not.toBeInTheDocument();
  });

  it('renders manager-only navigation links for manager users', () => {
    // Setup manager profile
    (storage.loadProfile as jest.Mock).mockReturnValue({
      name: 'Alice May Miller',
      id: '2024102114',
      email: 'staff@mhmb.gov',
      role: 'manager',
    });
    (storage.loadUsers as jest.Mock).mockReturnValue([]);

    render(<StaffSidebar activeItem="dashboard" />);

    expect(screen.getByTestId('nav-users')).toBeInTheDocument();
    expect(screen.getByTestId('nav-audits')).toBeInTheDocument();
  });

  it('opens staff profile modal and displays details', () => {
    (storage.loadProfile as jest.Mock).mockReturnValue({
      name: 'Alice May Miller',
      id: '2024102114',
      email: 'staff@mhmb.gov',
      role: 'manager',
      phone: '1234567890',
    });
    (storage.loadUsers as jest.Mock).mockReturnValue([]);

    render(<StaffSidebar activeItem="dashboard" />);

    // Click profile card to open modal
    const profileTrigger = screen.getByTestId('profile-trigger');
    fireEvent.click(profileTrigger);

    // Profile modal should be in the document
    expect(screen.getByTestId('profile-modal')).toBeInTheDocument();
    expect(screen.getByTestId('profile-modal-name')).toHaveTextContent('Alice May Miller');
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('1234567890')).toBeInTheDocument();
    expect(screen.queryByTestId('role-selector')).not.toBeInTheDocument();
  });

  it('opens logout confirmation modal when logout button is clicked', () => {
    (storage.loadProfile as jest.Mock).mockReturnValue({
      name: 'Alice May Miller',
      id: '2024102114',
      email: 'staff@mhmb.gov',
      role: 'manager',
    });
    (storage.loadUsers as jest.Mock).mockReturnValue([]);

    render(<StaffSidebar activeItem="dashboard" />);

    // Logout modal should not be visible initially
    expect(screen.queryByTestId('logout-modal')).not.toBeInTheDocument();

    // Click logout button
    fireEvent.click(screen.getByTestId('logout-btn'));

    // Logout modal should now be visible
    expect(screen.getByTestId('logout-modal')).toBeInTheDocument();
    expect(screen.getByTestId('confirm-logout-btn')).toBeInTheDocument();
    expect(screen.getByTestId('cancel-logout-btn')).toBeInTheDocument();
  });

  it('closes logout modal when cancel button is clicked', () => {
    (storage.loadProfile as jest.Mock).mockReturnValue({
      name: 'Alice May Miller',
      id: '2024102114',
      email: 'staff@mhmb.gov',
      role: 'manager',
    });
    (storage.loadUsers as jest.Mock).mockReturnValue([]);

    render(<StaffSidebar activeItem="dashboard" />);

    // Open modal
    fireEvent.click(screen.getByTestId('logout-btn'));
    expect(screen.getByTestId('logout-modal')).toBeInTheDocument();

    // Click cancel
    fireEvent.click(screen.getByTestId('cancel-logout-btn'));

    // Modal should be gone
    expect(screen.queryByTestId('logout-modal')).not.toBeInTheDocument();
  });

  it('closes logout modal when X button is clicked', () => {
    (storage.loadProfile as jest.Mock).mockReturnValue({
      name: 'Alice May Miller',
      id: '2024102114',
      email: 'staff@mhmb.gov',
      role: 'manager',
    });
    (storage.loadUsers as jest.Mock).mockReturnValue([]);

    render(<StaffSidebar activeItem="dashboard" />);

    // Open modal
    fireEvent.click(screen.getByTestId('logout-btn'));
    expect(screen.getByTestId('logout-modal')).toBeInTheDocument();

    // Click X button
    fireEvent.click(screen.getByTestId('close-logout-btn'));

    // Modal should be gone
    expect(screen.queryByTestId('logout-modal')).not.toBeInTheDocument();
  });

  it('calls logout API and redirects to / on success', async () => {
    (storage.loadProfile as jest.Mock).mockReturnValue({
      name: 'Alice May Miller',
      id: '2024102114',
      email: 'staff@mhmb.gov',
      role: 'manager',
    });
    (storage.loadUsers as jest.Mock).mockReturnValue([]);
    (api.post as jest.Mock).mockResolvedValue({ data: {} });

    const { waitFor } = await import('@testing-library/react');

    render(<StaffSidebar activeItem="dashboard" />);

    fireEvent.click(screen.getByTestId('logout-btn'));
    fireEvent.click(screen.getByTestId('confirm-logout-btn'));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/api/auth/logout');
    });

    // Confirm button is disabled while logging out
    expect(screen.getByTestId('confirm-logout-btn')).toBeDisabled();
  });

  it('shows error message in modal if logout API fails', async () => {
    (storage.loadProfile as jest.Mock).mockReturnValue({
      name: 'Alice May Miller',
      id: '2024102114',
      email: 'staff@mhmb.gov',
      role: 'manager',
    });
    (storage.loadUsers as jest.Mock).mockReturnValue([]);
    (api.post as jest.Mock).mockRejectedValue({
      response: { data: { error: 'Session Expired.'} },
    });

    render(<StaffSidebar activeItem="dashboard" />);

    // Open modal and confirm
    fireEvent.click(screen.getByTestId('logout-btn'));
    fireEvent.click(screen.getByTestId('confirm-logout-btn'));

    // Wait for error to appear
    const errorEl = await screen.findByTestId('logout-error');
    expect(errorEl).toHaveTextContent('Session Expired.');

    // Modal should still be open
    expect(screen.getByTestId('logout-modal')).toBeInTheDocument();
  });
});
