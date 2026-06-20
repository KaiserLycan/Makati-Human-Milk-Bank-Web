import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DonorApplication from '../donor-application';

// Mock next/link to prevent issues in Jest environment
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
});

describe('DonorApplication Component', () => {
  const mockOnSubmitSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all form section titles and fields', () => {
    render(<DonorApplication onSubmitSuccess={mockOnSubmitSuccess} />);

    // Verify main page title
    expect(screen.getByText('Donor Program', { selector: 'h1' })).toBeInTheDocument();

    // Verify section titles
    expect(screen.getByText('Personal Information')).toBeInTheDocument();
    expect(screen.getByText('Traveling Information')).toBeInTheDocument();
    expect(screen.getByText('Donation Information')).toBeInTheDocument();
    expect(screen.getByText('Medical History Questionnaire')).toBeInTheDocument();

    // Verify text inputs
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/home address/i)).toBeInTheDocument();

    // Verify Suffix drop-down option select
    const suffixSelect = screen.getByLabelText(/suffix/i);
    expect(suffixSelect).toBeInTheDocument();

    // Verify Medical Questionnaire Questions
    expect(screen.getByText('Tuberculosis')).toBeInTheDocument();
    expect(screen.getByText('Hepatitis B')).toBeInTheDocument();
    expect(screen.getByText('Do you smoke?')).toBeInTheDocument();
    expect(screen.getByText('Was a breast implant placed?')).toBeInTheDocument();

    // Verify Submit button
    expect(screen.getByRole('button', { name: /submit application/i })).toBeInTheDocument();
  });

  it('allows user to fill out the form fields and change medical history radio buttons', () => {
    render(<DonorApplication onSubmitSuccess={mockOnSubmitSuccess} />);

    // Fill personal info
    const firstNameInput = screen.getByLabelText(/first name/i) as HTMLInputElement;
    fireEvent.change(firstNameInput, { target: { value: 'Jane' } });
    expect(firstNameInput.value).toBe('Jane');

    const lastNameInput = screen.getByLabelText(/last name/i) as HTMLInputElement;
    fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
    expect(lastNameInput.value).toBe('Doe');

    // Click Tuberculosis YES radio button
    const tbYesRadio = screen.getByTestId('tuberculosis-yes') as HTMLInputElement;
    expect(tbYesRadio.checked).toBe(false);
    fireEvent.click(tbYesRadio);
    expect(tbYesRadio.checked).toBe(true);

    // Click Tuberculosis NO radio button
    const tbNoRadio = screen.getByTestId('tuberculosis-no') as HTMLInputElement;
    expect(tbNoRadio.checked).toBe(false);
    fireEvent.click(tbNoRadio);
    expect(tbNoRadio.checked).toBe(true);
    expect(tbYesRadio.checked).toBe(false);
  });

  it('triggers onSubmitSuccess when form is successfully submitted after validation', async () => {
    render(<DonorApplication onSubmitSuccess={mockOnSubmitSuccess} />);

    // Fill all required fields
    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'Maria' } });
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Lopez' } });
    fireEvent.change(screen.getByLabelText(/date of birth/i), { target: { value: '1995-05-15' } });
    fireEvent.change(screen.getByLabelText(/phone number/i), { target: { value: '+639123456789' } });
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'maria@example.com' } });
    fireEvent.change(screen.getByLabelText(/home address/i), { target: { value: 'Makati City' } });

    // Submit
    const submitBtn = screen.getByRole('button', { name: /submit application/i });
    fireEvent.click(submitBtn);

    // Assert it shows submittting state
    expect(screen.getByText(/submitting/i)).toBeInTheDocument();

    // Wait for mock API response (1500ms in component, Jest timeout handles this)
    await waitFor(
      () => {
        expect(screen.getByText(/submitted successfully/i)).toBeInTheDocument();
      },
      { timeout: 2000 }
    );

    expect(mockOnSubmitSuccess).toHaveBeenCalledTimes(1);
    expect(mockOnSubmitSuccess).toHaveBeenCalledWith(
      expect.objectContaining({
        firstName: 'Maria',
        lastName: 'Lopez',
        dateOfBirth: '1995-05-15',
        phoneNumber: '+639123456789',
        emailAddress: 'maria@example.com',
        homeAddress: 'Makati City',
      })
    );
  });
});
