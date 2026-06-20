import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import StaffSidebar from '../ui/staff-sidebar';
import * as storage from '../../utils/storage';
import { reloadWindow } from '../../utils/navigation';

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

  it('opens staff profile modal and allows role toggling', () => {
    (storage.loadProfile as jest.Mock).mockReturnValue({
      name: 'Alice May Miller',
      id: '2024102114',
      email: 'staff@mhmb.gov',
      role: 'manager',
    });
    (storage.loadUsers as jest.Mock).mockReturnValue([]);

    render(<StaffSidebar activeItem="dashboard" />);

    // Click profile card to open modal
    const profileTrigger = screen.getByTestId('profile-trigger');
    fireEvent.click(profileTrigger);

    // Profile modal should be in the document
    expect(screen.getByTestId('profile-modal')).toBeInTheDocument();
    expect(screen.getByTestId('profile-modal-name')).toHaveTextContent('Alice May Miller');

    // Change role from manager to staff
    const roleSelector = screen.getByTestId('role-selector');
    fireEvent.change(roleSelector, { target: { value: 'staff' } });

    // Profile should save and trigger a reload
    expect(storage.saveProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        role: 'staff',
      })
    );
    expect(reloadWindow).toHaveBeenCalled();
  });
});
