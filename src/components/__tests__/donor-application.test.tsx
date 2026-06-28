/// <reference types="jest" />
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DonorApplication from '../donor-application';
import { api } from '../../utils/api';

// Mock next/link to prevent issues in Jest environment
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
});

// Mock api utility
jest.mock('../../utils/api', () => ({
  api: {
    post: jest.fn(() => Promise.resolve({ data: { success: true } })),
  },
}));

describe('DonorApplication Component', () => {
  const mockOnSubmitSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all form section titles and fields by progressing through steps', () => {
    render(<DonorApplication onSubmitSuccess={mockOnSubmitSuccess} />);

    // Verify main page title
    expect(screen.getByText('Donor Program', { selector: 'h1' })).toBeInTheDocument();

    // Verify section title for Step 1
    expect(screen.getByText('Personal Information')).toBeInTheDocument();

    // Verify text inputs for Step 1
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/home address/i)).toBeInTheDocument();

    // Verify Suffix drop-down option select
    const suffixSelect = screen.getByLabelText(/suffix/i);
    expect(suffixSelect).toBeInTheDocument();

    // Go to Step 2
    const nextBtn = screen.getByRole('button', { name: /next/i });
    fireEvent.click(nextBtn);

    // Verify section titles for Step 2
    expect(screen.getByText('Traveling Information')).toBeInTheDocument();
    expect(screen.getByText('Donation Information')).toBeInTheDocument();

    // Go to Step 3
    fireEvent.click(nextBtn);

    // Verify Medical Questionnaire Questions
    expect(screen.getByText('Medical History Questionnaire')).toBeInTheDocument();
    expect(screen.getByText(/Tuberculosis/i)).toBeInTheDocument();
    expect(screen.getByText(/Hepatitis B/i)).toBeInTheDocument();
    expect(screen.getByText(/Do you smoke\?/i)).toBeInTheDocument();
    expect(screen.getByText(/breast implant/i)).toBeInTheDocument();

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

    // Go to step 3
    const nextBtn = screen.getByRole('button', { name: /next/i });
    fireEvent.click(nextBtn); // Step 2
    fireEvent.click(nextBtn); // Step 3

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

    // Go to step 3
    const nextBtn = screen.getByRole('button', { name: /next/i });
    fireEvent.click(nextBtn); // Step 2
    fireEvent.click(nextBtn); // Step 3

    // Submit
    const submitBtn = screen.getByRole('button', { name: /submit application/i });
    fireEvent.click(submitBtn);

    // Assert it shows submittting state
    expect(screen.getByText(/submitting/i)).toBeInTheDocument();

    // Wait for mock API response
    await waitFor(
      () => {
        expect(screen.getByText(/submitted successfully/i)).toBeInTheDocument();
      },
      { timeout: 2000 }
    );

    // Verify API is called with normalized data
    expect(api.post).toHaveBeenCalledTimes(1);
    expect(api.post).toHaveBeenCalledWith(
      '/api/donors/public-register',
      expect.objectContaining({
        name: 'Maria Lopez',
        email: 'maria@example.com',
        phone: '+639123456789',
        birth_date: '1995-05-15',
        profile: expect.objectContaining({
          personal_information: expect.objectContaining({
            home_address: 'Makati City',
          }),
        }),
      })
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
