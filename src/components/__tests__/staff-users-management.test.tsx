import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import StaffUsersManagement from '../staff-users-management';
import { loadProfile, UserProfile } from '../../utils/storage';
import { api } from '../../utils/api';

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: mockPush,
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
    };
  },
  usePathname() {
    return '';
  },
}));

// Mock storage
jest.mock('../../utils/storage', () => {
  return {
    loadProfile: jest.fn(),
    saveProfile: jest.fn(),
  };
});

// Mock api
jest.mock('../../utils/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
  },
}));

// Mock next/link to forward props in Jest environment
jest.mock('next/link', () => {
  const MockLink = ({ children, href, ...rest }: { children: React.ReactNode; href: string;[key: string]: any }) => {
    return <a href={href} {...rest}>{children}</a>;
  };
  MockLink.displayName = 'MockLink';
  return MockLink;
});

describe('StaffUsersManagement Component (API Integrated)', () => {
  const mockManagerProfile: UserProfile = {
    id: 'U-UUID-001',
    name: 'Alice May Miller',
    email: 'staff@mhmb.gov',
    role: 'manager',
  };

  const mockStaffProfile: UserProfile = {
    id: 'U-UUID-002',
    name: 'John Smith',
    email: 'smith.j@mhmb.gov',
    role: 'staff',
  };

  const mockUsersList = [
    { user_id: 'U-UUID-001', name: 'Alice May Miller', email: 'staff@mhmb.gov', role: 'manager', status: 'active', phone: '+639171234567' },
    { user_id: 'U-UUID-002', name: 'John Smith', email: 'smith.j@mhmb.gov', role: 'staff', status: 'active', phone: '+639171234567' },
    { user_id: 'U-UUID-003', name: 'Dr. Bob Jones', email: 'bob.jones@mhmb.gov', role: 'staff', status: 'active', phone: '+639171234567' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    if (typeof window !== 'undefined') {
      localStorage.setItem('mhmb_logged_in', 'true');
      localStorage.setItem('mhmb_profile', JSON.stringify(mockManagerProfile));
      window.confirm = jest.fn(() => true);
    }
    (api.get as jest.Mock).mockImplementation((url, config) => {
      if (url === '/api/users') {
        const queryStatus = config?.params?.status;
        const filteredList = queryStatus
          ? mockUsersList.filter((u) => u.status === queryStatus)
          : mockUsersList;
        return Promise.resolve({
          data: {
            success: true,
            data: {
              data: filteredList,
              meta: {
                total: filteredList.length,
                page: 1,
                limit: config?.params?.limit || 5,
                totalPages: 1,
              },
            },
          },
        });
      }
      return Promise.reject(new Error('not found'));
    });
  });

  it('restricts access to managers only and shows access denied to staff', async () => {
    (loadProfile as jest.Mock).mockReturnValue(mockStaffProfile);

    await act(async () => {
      render(<StaffUsersManagement />);
    });

    expect(screen.getByText('Access Denied')).toBeInTheDocument();
    expect(screen.getByText(/You do not have manager permissions/i)).toBeInTheDocument();
    expect(screen.queryByTestId('add-user-btn')).not.toBeInTheDocument();
  });

  it('renders correctly for managers showing the users list and add button', async () => {
    (loadProfile as jest.Mock).mockReturnValue(mockManagerProfile);

    await act(async () => {
      render(<StaffUsersManagement />);
    });

    expect(screen.getByRole('heading', { name: 'Manage Users' })).toBeInTheDocument();
    expect(screen.getByTestId('add-user-btn')).toBeInTheDocument();
    expect(screen.getByText('John Smith')).toBeInTheDocument();
    expect(screen.getByText('Dr. Bob Jones')).toBeInTheDocument();
  });

  it('allows the manager to add a new user via API', async () => {
    (loadProfile as jest.Mock).mockReturnValue(mockManagerProfile);
    (api.post as jest.Mock).mockResolvedValue({
      data: {
        success: true,
        data: {
          user_id: 'U-UUID-004',
          name: 'Charlie Brown',
          email: 'charlie@mhmb.gov',
          role: 'staff',
          status: 'active',
        },
      },
    });

    await act(async () => {
      render(<StaffUsersManagement />);
    });

    // Open add user modal
    const addBtn = screen.getByTestId('add-user-btn');
    fireEvent.click(addBtn);

    expect(screen.getByTestId('add-modal')).toBeInTheDocument();

    // Fill in form details
    fireEvent.change(screen.getByTestId('add-user-name'), { target: { value: 'Charlie Brown' } });
    fireEvent.change(screen.getByTestId('add-user-email'), { target: { value: 'charlie@mhmb.gov' } });
    fireEvent.change(screen.getByTestId('add-user-password'), { target: { value: 'securepassword123' } });

    // Select role via custom dropdown clicks
    fireEvent.click(screen.getByTestId('add-user-role'));
    fireEvent.click(screen.getByTestId('option-staff'));

    // Submit form
    await act(async () => {
      fireEvent.submit(screen.getByTestId('submit-add-user-btn'));
    });

    // Modal should close and api.post should be called with FormData
    expect(screen.queryByTestId('add-modal')).not.toBeInTheDocument();
    expect(api.post).toHaveBeenCalled();
    const [url, formData, config] = (api.post as jest.Mock).mock.calls[0];
    expect(url).toBe('/api/users');
    expect(formData).toBeInstanceOf(FormData);
    expect(formData.get('name')).toBe('Charlie Brown');
    expect(formData.get('email')).toBe('charlie@mhmb.gov');
    expect(formData.get('password')).toBe('securepassword123');
    expect(formData.get('role')).toBe('staff');
    expect(formData.get('status')).toBe('active');
    expect(formData.get('phone')).toBe('+639171234567');
    expect(config.headers['Content-Type']).toBe('multipart/form-data');
  });

  it('allows manager to view user details, update user information via API', async () => {
    (loadProfile as jest.Mock).mockReturnValue(mockManagerProfile);
    (api.put as jest.Mock).mockResolvedValue({
      data: {
        success: true,
        data: {
          user_id: 'U-UUID-002',
          name: 'Johnathan Smith',
          email: 'john.smith@mhmb.gov',
          role: 'manager',
          status: 'active',
          phone: '+639171234567',
        },
      },
    });

    await act(async () => {
      render(<StaffUsersManagement />);
    });

    // Click John Smith row using test ID
    fireEvent.click(screen.getByTestId('row-U-UUID-002'));

    expect(screen.getByTestId('detail-modal')).toBeInTheDocument();

    // Click edit info button
    fireEvent.click(screen.getByTestId('edit-user-btn'));

    // Modify details
    fireEvent.change(screen.getByTestId('edit-user-name'), { target: { value: 'Johnathan Smith' } });
    fireEvent.change(screen.getByTestId('edit-user-email'), { target: { value: 'john.smith@mhmb.gov' } });

    // Select role via custom dropdown clicks
    fireEvent.click(screen.getByTestId('edit-user-role'));
    fireEvent.click(screen.getByTestId('option-manager'));

    // Submit edit form
    await act(async () => {
      fireEvent.submit(screen.getByTestId('submit-edit-user-btn'));
    });

    // Accept the custom role change modal
    expect(screen.getByTestId('role-confirm-modal')).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(screen.getByTestId('confirm-role-confirm-btn'));
    });

    expect(api.put).toHaveBeenCalledWith('/api/users/U-UUID-002', {
      name: 'Johnathan Smith',
      email: 'john.smith@mhmb.gov',
      role: 'manager',
      phone: '+639171234567',
    });
  });

  it('allows manager to deactivate/activate a user status via API', async () => {
    (loadProfile as jest.Mock).mockReturnValue(mockManagerProfile);
    (api.patch as jest.Mock).mockResolvedValue({
      data: {
        success: true,
        data: {
          user_id: 'U-UUID-002',
          status: 'inactive',
        },
      },
    });

    await act(async () => {
      render(<StaffUsersManagement />);
    });

    // Open detail modal for John Smith
    fireEvent.click(screen.getByText('John Smith'));

    const toggleBtn = screen.getByTestId('toggle-status-btn');
    expect(toggleBtn).toHaveTextContent('Deactivate');

    await act(async () => {
      fireEvent.click(toggleBtn);
    });

    expect(api.patch).toHaveBeenCalledWith('/api/users/status/U-UUID-002');
  });

  it("allows manager to reset someone else's password via API without redirecting", async () => {
    jest.useFakeTimers();
    (loadProfile as jest.Mock).mockReturnValue(mockManagerProfile); // Manager is U-UUID-001
    (api.patch as jest.Mock).mockResolvedValue({
      data: {
        success: true,
      },
    });

    await act(async () => {
      render(<StaffUsersManagement />);
    });

    // Open detail modal for John Smith (U-UUID-002) using specific row test ID
    fireEvent.click(screen.getByTestId('row-U-UUID-002'));

    // Click Reset Password
    fireEvent.click(screen.getByTestId('reset-password-btn'));

    // Fill reset password form
    const resetInput = screen.getByTestId('reset-password-input');
    const confirmInput = screen.getByTestId('confirm-reset-password-input');
    fireEvent.change(resetInput, { target: { value: 'newpassword789' } });
    fireEvent.change(confirmInput, { target: { value: 'newpassword789' } });

    await act(async () => {
      fireEvent.submit(screen.getByTestId('submit-reset-password-btn'));
    });

    expect(api.patch).toHaveBeenCalledWith('/api/users/reset-password/U-UUID-002', {
      new_password: 'newpassword789',
    });

    // Advance fake timers
    await act(async () => {
      jest.advanceTimersByTime(2000);
    });

    // Verify it DID NOT trigger logout or redirect
    expect(api.post).not.toHaveBeenCalledWith('/api/auth/logout');
    expect(mockPush).not.toHaveBeenCalledWith('/work');

    jest.useRealTimers();
  });

  it('allows manager to reset their own password via API and handles redirect/logout', async () => {
    jest.useFakeTimers();
    (loadProfile as jest.Mock).mockReturnValue(mockManagerProfile); // Manager is U-UUID-001
    (api.patch as jest.Mock).mockResolvedValue({
      data: {
        success: true,
      },
    });
    (api.post as jest.Mock).mockResolvedValue({
      data: {
        success: true,
      },
    });

    await act(async () => {
      render(<StaffUsersManagement />);
    });

    // Open detail modal for Alice May Miller (U-UUID-001 - currently logged in manager)
    fireEvent.click(screen.getByTestId('row-U-UUID-001'));

    // Click Reset Password
    fireEvent.click(screen.getByTestId('reset-password-btn'));

    // Fill reset password form
    const resetInput = screen.getByTestId('reset-password-input');
    const confirmInput = screen.getByTestId('confirm-reset-password-input');
    fireEvent.change(resetInput, { target: { value: 'newpassword123' } });
    fireEvent.change(confirmInput, { target: { value: 'newpassword123' } });

    await act(async () => {
      fireEvent.submit(screen.getByTestId('submit-reset-password-btn'));
    });

    expect(api.patch).toHaveBeenCalledWith('/api/users/reset-password/U-UUID-001', {
      new_password: 'newpassword123',
    });

    // Advance fake timers to trigger the redirect
    await act(async () => {
      jest.advanceTimersByTime(2000);
    });

    // Verify logout and redirect via router.push
    expect(api.post).toHaveBeenCalledWith('/api/auth/logout');
    expect(mockPush).toHaveBeenCalledWith('/work');

    jest.useRealTimers();
  });

  it('shows validation error when reset passwords do not match', async () => {
    (loadProfile as jest.Mock).mockReturnValue(mockManagerProfile);

    await act(async () => {
      render(<StaffUsersManagement />);
    });

    // Open detail modal for John Smith
    fireEvent.click(screen.getByTestId('row-U-UUID-002'));

    // Click Reset Password
    fireEvent.click(screen.getByTestId('reset-password-btn'));

    // Fill mismatched password details
    const resetInput = screen.getByTestId('reset-password-input');
    const confirmInput = screen.getByTestId('confirm-reset-password-input');
    fireEvent.change(resetInput, { target: { value: 'pass123' } });
    fireEvent.change(confirmInput, { target: { value: 'pass456' } });

    await act(async () => {
      fireEvent.submit(screen.getByTestId('submit-reset-password-btn'));
    });

    // Verify error is shown and patch was NOT called
    expect(screen.getByTestId('reset-password-error')).toHaveTextContent('Passwords do not match.');
    expect(api.patch).not.toHaveBeenCalled();
  });

  it('formats backend validation errors to be user friendly', async () => {
    (loadProfile as jest.Mock).mockReturnValue(mockManagerProfile);
    (api.patch as jest.Mock).mockRejectedValue({
      response: {
        data: {
          message: 'Invalid request data: new_password: New password must be at least 8 characters',
        },
      },
    });

    await act(async () => {
      render(<StaffUsersManagement />);
    });

    // Open detail modal for John Smith
    fireEvent.click(screen.getByTestId('row-U-UUID-002'));

    // Click Reset Password
    fireEvent.click(screen.getByTestId('reset-password-btn'));

    // Fill valid length mismatched or matched details
    const resetInput = screen.getByTestId('reset-password-input');
    const confirmInput = screen.getByTestId('confirm-reset-password-input');
    fireEvent.change(resetInput, { target: { value: 'password123' } });
    fireEvent.change(confirmInput, { target: { value: 'password123' } });

    await act(async () => {
      fireEvent.submit(screen.getByTestId('submit-reset-password-btn'));
    });

    // Verify formatted error is shown
    expect(screen.getByTestId('reset-password-error')).toHaveTextContent('New password must be at least 8 characters');
  });

  it('allows manager to toggle column sorting and queries API with correct parameters', async () => {
    (loadProfile as jest.Mock).mockReturnValue(mockManagerProfile);

    await act(async () => {
      render(<StaffUsersManagement />);
    });

    // Verify initial load queries both active and inactive users
    expect(api.get).toHaveBeenCalledWith('/api/users', {
      params: {
        page: 1,
        limit: 100,
        status: 'active',
      },
    });
    expect(api.get).toHaveBeenCalledWith('/api/users', {
      params: {
        page: 1,
        limit: 100,
        status: 'inactive',
      },
    });

    // Clear call history
    (api.get as jest.Mock).mockClear();

    // Click on Full Name header to sort by name
    await act(async () => {
      fireEvent.click(screen.getByTestId('th-name'));
    });

    // Verify it queries both active/inactive with limit 100
    expect(api.get).toHaveBeenCalledWith('/api/users', {
      params: {
        page: 1,
        limit: 100,
        status: 'active',
      },
    });
    expect(api.get).toHaveBeenCalledWith('/api/users', {
      params: {
        page: 1,
        limit: 100,
        status: 'inactive',
      },
    });
  });

  it('asks the manager to confirm when changing a user access role and blocks update if cancelled', async () => {
    (loadProfile as jest.Mock).mockReturnValue(mockManagerProfile);
    (api.put as jest.Mock).mockResolvedValue({ data: { success: true, data: {} } });

    await act(async () => {
      render(<StaffUsersManagement />);
    });

    // Open detail modal for John Smith (staff)
    fireEvent.click(screen.getByTestId('row-U-UUID-002'));

    // Click edit info button
    fireEvent.click(screen.getByTestId('edit-user-btn'));

    // Select manager role
    fireEvent.click(screen.getByTestId('edit-user-role'));
    fireEvent.click(screen.getByTestId('option-manager'));

    // Submit edit form
    await act(async () => {
      fireEvent.submit(screen.getByTestId('submit-edit-user-btn'));
    });

    // Verify custom modal is opened and displays the correct message
    expect(screen.getByTestId('role-confirm-modal')).toBeInTheDocument();
    expect(screen.getByTestId('role-confirm-msg')).toHaveTextContent(
      "Are you sure to change John Smith's role from Staff to Manager?"
    );

    // Click Cancel
    await act(async () => {
      fireEvent.click(screen.getByTestId('cancel-role-confirm-btn'));
    });

    // Verify modal closes and API was NOT called
    expect(screen.queryByTestId('role-confirm-modal')).not.toBeInTheDocument();
    expect(api.put).not.toHaveBeenCalled();

    // Re-submit the form
    await act(async () => {
      fireEvent.submit(screen.getByTestId('submit-edit-user-btn'));
    });

    // Verify modal is open again and click Confirm
    expect(screen.getByTestId('role-confirm-modal')).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(screen.getByTestId('confirm-role-confirm-btn'));
    });

    // Verify modal closes and API was successfully called
    expect(screen.queryByTestId('role-confirm-modal')).not.toBeInTheDocument();
    expect(api.put).toHaveBeenCalled();
  });
});
