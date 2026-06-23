import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import StaffLogin from '../staff-login';

const mockPush = jest.fn();
jest.mock('next/navigation', () => {
  return {
    useRouter: () => ({
      push: mockPush,
    }),
  };
});

describe('StaffLogin Component', () => {
  const mockOnLoginSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  it('renders all login elements, header text, and inputs', () => {
    render(<StaffLogin onLoginSuccess={mockOnLoginSuccess} />);

    // Verify Title
    expect(screen.getByText('Makati Human Milk Bank', { selector: 'h1' })).toBeInTheDocument();
    expect(
      screen.getByText(/This page is for the Staff of Makati Human Milk Bank/i)
    ).toBeInTheDocument();

    // Verify Input Fields
    expect(screen.getByLabelText('Employee Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();

    // Verify Placeholders
    expect(screen.getByPlaceholderText('staff@mhmb.gov')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();

    // Verify Button
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();

    // Verify footer text
    expect(screen.getByText(/Designed by Why We Clash/i)).toBeInTheDocument();
  });

  it('allows text field input updates', () => {
    render(<StaffLogin onLoginSuccess={mockOnLoginSuccess} />);

    const emailInput = screen.getByTestId('employee-email-input') as HTMLInputElement;
    fireEvent.change(emailInput, { target: { value: 'test@mhmb.gov' } });
    expect(emailInput.value).toBe('test@mhmb.gov');

    const passInput = screen.getByTestId('password-input') as HTMLInputElement;
    fireEvent.change(passInput, { target: { value: 'secret' } });
    expect(passInput.value).toBe('secret');
  });

  it('displays validation error if submitting empty fields', () => {
    render(<StaffLogin onLoginSuccess={mockOnLoginSuccess} />);

    const signInBtn = screen.getByTestId('signin-btn');
    fireEvent.click(signInBtn);

    expect(screen.getByTestId('error-message')).toHaveTextContent('Please fill in all fields.');
    expect(mockOnLoginSuccess).not.toHaveBeenCalled();
  });

  it('displays error message on incorrect credentials submission', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({
        success: false,
        message: 'Invalid Employee Email or Password.',
      }),
    });

    render(<StaffLogin onLoginSuccess={mockOnLoginSuccess} />);

    fireEvent.change(screen.getByTestId('employee-email-input'), { target: { value: 'wrong@mhmb.gov' } });
    fireEvent.change(screen.getByTestId('password-input'), { target: { value: 'wrong_password' } });

    const signInBtn = screen.getByTestId('signin-btn');
    fireEvent.click(signInBtn);

    // Verify loading state
    expect(screen.getByText(/signing in/i)).toBeInTheDocument();

    // Wait for mock response
    await waitFor(
      () => {
        expect(screen.getByTestId('error-message')).toHaveTextContent(
          'Invalid Employee Email or Password.'
        );
      },
      { timeout: 5000 }
    );

    expect(mockOnLoginSuccess).not.toHaveBeenCalled();
  });

  it('displays success message and triggers onLoginSuccess on correct credentials submission', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        message: 'Logged in successfully.',
        data: {
          user_id: 'U001',
          name: 'Alice May Miller',
          email: 'staff@mhmb.gov',
          role: 'manager',
        },
      }),
    });

    render(<StaffLogin onLoginSuccess={mockOnLoginSuccess} />);

    fireEvent.change(screen.getByTestId('employee-email-input'), { target: { value: 'staff@mhmb.gov' } });
    fireEvent.change(screen.getByTestId('password-input'), { target: { value: 'AliceMiller092405' } });

    const signInBtn = screen.getByTestId('signin-btn');
    fireEvent.click(signInBtn);

    await waitFor(
      () => {
        expect(screen.getByTestId('success-message')).toHaveTextContent(
          'Login successful!'
        );
      },
      { timeout: 5000 }
    );

    expect(mockOnLoginSuccess).toHaveBeenCalledTimes(1);
    expect(mockOnLoginSuccess).toHaveBeenCalledWith('staff@mhmb.gov');
  });

  it('toggles password visibility between text and password types when the eye button is clicked', () => {
    render(<StaffLogin onLoginSuccess={mockOnLoginSuccess} />);

    const passInput = screen.getByTestId('password-input') as HTMLInputElement;
    const toggleBtn = screen.getByTestId('password-toggle-btn');

    // Initially type is password
    expect(passInput.type).toBe('password');

    // Click toggle to reveal
    fireEvent.click(toggleBtn);
    expect(passInput.type).toBe('text');

    // Click toggle to unreveal
    fireEvent.click(toggleBtn);
    expect(passInput.type).toBe('password');
  });
});
