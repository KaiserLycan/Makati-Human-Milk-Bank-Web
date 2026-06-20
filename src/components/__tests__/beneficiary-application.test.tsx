import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BeneficiaryApplication from '../beneficiary-application';

// Mock next/link to prevent issues in Jest environment
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
});

describe('BeneficiaryApplication Component', () => {
  const mockOnSubmitSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all form headings, inputs, and file upload zones', () => {
    render(<BeneficiaryApplication onSubmitSuccess={mockOnSubmitSuccess} />);

    // Verify main headers
    expect(screen.getByText('Beneficiary Program', { selector: 'h1' })).toBeInTheDocument();
    expect(screen.getByText('Infant’s Information')).toBeInTheDocument();
    expect(screen.getByText('Parent/Guardian Information')).toBeInTheDocument();

    // Verify infant text inputs
    expect(screen.getByPlaceholderText('eg. 2500')).toBeInTheDocument(); // Weight
    expect(screen.getByPlaceholderText('eg. 150ml/day')).toBeInTheDocument(); // Feeding Requirement

    // Verify parent inputs
    expect(screen.getByPlaceholderText('Phone Number')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();

    // Verify file upload zones
    expect(screen.getByText('Prescription Details')).toBeInTheDocument();
    expect(screen.getByText('Clinical Abstract')).toBeInTheDocument();
    expect(screen.getAllByText('Click to upload or drag & drop').length).toBe(2);

    // Verify Submit button
    expect(screen.getByRole('button', { name: /submit application/i })).toBeInTheDocument();
  });

  it('allows text field input updates', () => {
    render(<BeneficiaryApplication onSubmitSuccess={mockOnSubmitSuccess} />);

    const infantFirstNameInput = screen.getAllByPlaceholderText('First Name')[0] as HTMLInputElement;
    fireEvent.change(infantFirstNameInput, { target: { value: 'Baby' } });
    expect(infantFirstNameInput.value).toBe('Baby');

    const weightInput = screen.getByPlaceholderText('eg. 2500') as HTMLInputElement;
    fireEvent.change(weightInput, { target: { value: '3100' } });
    expect(weightInput.value).toBe('3100');
  });

  it('handles prescription and clinical abstract file selections and removals', async () => {
    render(<BeneficiaryApplication onSubmitSuccess={mockOnSubmitSuccess} />);

    // Mock prescription file
    const prescriptionFile = new File(['hello'], 'prescription.pdf', { type: 'application/pdf' });
    const prescriptionInput = screen.getByTestId('prescription-input') as HTMLInputElement;
    
    // Simulate file select
    fireEvent.change(prescriptionInput, { target: { files: [prescriptionFile] } });
    
    // Check if filename appears
    expect(screen.getByText('prescription.pdf')).toBeInTheDocument();

    // Mock clinical abstract file
    const abstractFile = new File(['abstract'], 'abstract.jpg', { type: 'image/jpeg' });
    const abstractInput = screen.getByTestId('abstract-input') as HTMLInputElement;
    
    // Simulate file select
    fireEvent.change(abstractInput, { target: { files: [abstractFile] } });
    expect(screen.getByText('abstract.jpg')).toBeInTheDocument();

    // Test removing prescription file
    const removePrescriptionBtn = screen.getByTestId('prescription-remove-btn');
    fireEvent.click(removePrescriptionBtn);
    
    expect(screen.queryByText('prescription.pdf')).not.toBeInTheDocument();
  });

  it('validates required fields and calls onSubmitSuccess upon successful submission', async () => {
    render(<BeneficiaryApplication onSubmitSuccess={mockOnSubmitSuccess} />);

    // Fill out required text inputs
    // Infant info
    const infantFirstName = screen.getAllByPlaceholderText('First Name')[0];
    const infantLastName = screen.getAllByPlaceholderText('Last Name')[0];
    const dob = screen.getByLabelText(/date of birth/i);
    const weight = screen.getByPlaceholderText('eg. 2500');
    const req = screen.getByPlaceholderText('eg. 150ml/day');

    fireEvent.change(infantFirstName, { target: { value: 'Leo' } });
    fireEvent.change(infantLastName, { target: { value: 'Garcia' } });
    fireEvent.change(dob, { target: { value: '2026-05-10' } });
    fireEvent.change(weight, { target: { value: '2800' } });
    fireEvent.change(req, { target: { value: '200ml/day' } });

    // Parent info
    const parentFirstName = screen.getAllByPlaceholderText('First Name')[1];
    const parentLastName = screen.getAllByPlaceholderText('Last Name')[1];
    const addr = screen.getByPlaceholderText('Home Address');
    const phone = screen.getByPlaceholderText('Phone Number');
    const email = screen.getByPlaceholderText('Email');

    fireEvent.change(parentFirstName, { target: { value: 'Julia' } });
    fireEvent.change(parentLastName, { target: { value: 'Garcia' } });
    fireEvent.change(addr, { target: { value: 'Makati, Manila' } });
    fireEvent.change(phone, { target: { value: '09876543210' } });
    fireEvent.change(email, { target: { value: 'julia@gmail.com' } });

    // Select files (required in HTML5 input tag but let's mock it)
    const prescriptionFile = new File(['prescription'], 'rx.pdf', { type: 'application/pdf' });
    const prescriptionInput = screen.getByTestId('prescription-input');
    fireEvent.change(prescriptionInput, { target: { files: [prescriptionFile] } });

    const abstractFile = new File(['abstract'], 'abstract.pdf', { type: 'application/pdf' });
    const abstractInput = screen.getByTestId('abstract-input');
    fireEvent.change(abstractInput, { target: { files: [abstractFile] } });

    // Submit
    const submitBtn = screen.getByRole('button', { name: /submit application/i });
    fireEvent.click(submitBtn);

    // Verify submitting state
    expect(screen.getByText(/submitting/i)).toBeInTheDocument();

    // Wait for submission message
    await waitFor(
      () => {
        expect(screen.getByText(/submitted successfully/i)).toBeInTheDocument();
      },
      { timeout: 2000 }
    );

    expect(mockOnSubmitSuccess).toHaveBeenCalledTimes(1);
    expect(mockOnSubmitSuccess).toHaveBeenCalledWith(
      expect.objectContaining({
        infantFirstName: 'Leo',
        infantLastName: 'Garcia',
        parentFirstName: 'Julia',
        parentLastName: 'Garcia',
        prescriptionFileName: 'rx.pdf',
        clinicalAbstractFileName: 'abstract.pdf',
      })
    );
  });
});
