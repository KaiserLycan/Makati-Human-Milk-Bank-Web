import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SelectProgram from '../select-program';

// Mock next/link to prevent issues in Jest environment
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
});

const mockPush = jest.fn();
jest.mock('next/navigation', () => {
  return {
    useRouter: () => ({
      push: mockPush,
    }),
  };
});

describe('SelectProgram Component', () => {
  const mockOnSelectDonor = jest.fn();
  const mockOnSelectBeneficiary = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the layout headers, cards, and description text', () => {
    render(
      <SelectProgram
        onSelectDonor={mockOnSelectDonor}
        onSelectBeneficiary={mockOnSelectBeneficiary}
      />
    );

    // Verify main page headers
    expect(screen.getByText('Choose Your Pathway')).toBeInTheDocument();

    // Verify Donor Program Card details
    expect(screen.getByText('Donor Program', { selector: 'h2' })).toBeInTheDocument();
    expect(
      screen.getByText(/lactating mothers must complete a health history screening/i)
    ).toBeInTheDocument();
    expect(screen.getByText('Learn more.')).toBeInTheDocument();

    // Verify Beneficiary Program Card details
    expect(screen.getByText('Beneficiary Program', { selector: 'h2' })).toBeInTheDocument();
    expect(
      screen.getByText(/To qualify as a beneficiary, an infant must have an immediate medical need/i)
    ).toBeInTheDocument();

    // Verify image with correct alt text is present
    const heroImg = screen.getByRole('img', {
      name: /a smiling mother lifting up her happy baby/i,
    });
    expect(heroImg).toBeInTheDocument();
    expect(heroImg).toHaveAttribute('src', '/images/select_hero.png');
  });

  it('calls onSelectDonor when the Donor Apply button is clicked', () => {
    render(
      <SelectProgram
        onSelectDonor={mockOnSelectDonor}
        onSelectBeneficiary={mockOnSelectBeneficiary}
      />
    );

    const donorApplyButton = screen.getByTestId('apply-donor-btn');
    expect(donorApplyButton).toBeInTheDocument();

    fireEvent.click(donorApplyButton);
    expect(mockOnSelectDonor).toHaveBeenCalledTimes(1);
    expect(mockOnSelectBeneficiary).not.toHaveBeenCalled();
  });

  it('calls onSelectBeneficiary when the Beneficiary Apply button is clicked', () => {
    render(
      <SelectProgram
        onSelectDonor={mockOnSelectDonor}
        onSelectBeneficiary={mockOnSelectBeneficiary}
      />
    );

    const beneficiaryApplyButton = screen.getByTestId('apply-beneficiary-btn');
    expect(beneficiaryApplyButton).toBeInTheDocument();

    fireEvent.click(beneficiaryApplyButton);
    expect(mockOnSelectBeneficiary).toHaveBeenCalledTimes(1);
    expect(mockOnSelectDonor).not.toHaveBeenCalled();
  });

  it('navigates to /apply/donor when Donor Apply is clicked and no callback is provided', () => {
    render(<SelectProgram />);

    const donorApplyButton = screen.getByTestId('apply-donor-btn');
    fireEvent.click(donorApplyButton);

    expect(mockPush).toHaveBeenCalledWith('/apply/donor');
  });

  it('navigates to /apply/beneficiary when Beneficiary Apply is clicked and no callback is provided', () => {
    render(<SelectProgram />);

    const beneficiaryApplyButton = screen.getByTestId('apply-beneficiary-btn');
    fireEvent.click(beneficiaryApplyButton);

    expect(mockPush).toHaveBeenCalledWith('/apply/beneficiary');
  });
});
