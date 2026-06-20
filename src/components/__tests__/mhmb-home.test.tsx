import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MHMBHome from '../mhmb-home';

// Mock next/link to prevent issues in Jest environment
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
});

describe('Makati Human Milk Bank Homepage', () => {
  it('renders the main heading in the Hero section', () => {
    render(<MHMBHome />);
    
    // Assert the main hero heading is in the document
    const heading = screen.getByRole('heading', { name: /makati human milk bank/i });
    expect(heading).toBeInTheDocument();
  });

  it('renders all main sections: About, Donor Program, Beneficiary, Contact, and Footer', () => {
    render(<MHMBHome />);

    // Verify About section elements
    expect(screen.getByText(/about/i, { selector: 'h2' })).toBeInTheDocument();
    expect(screen.getByText(/The Makati Human Milk Bank \(MHMB\) is a specialized medical facility/i)).toBeInTheDocument();

    // Verify Donor Program section elements
    expect(screen.getByText(/donor program/i, { selector: 'h2' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /SUPSUP Todo/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Milkyway/i })).toBeInTheDocument();

    // Verify Beneficiary section elements
    expect(screen.getByText(/beneficiary/i, { selector: 'h2' })).toBeInTheDocument();
    expect(screen.getByText(/Reduces the Risk of Necrotizing Enterocolitis/i)).toBeInTheDocument();

    // Verify Contact Us section elements
    expect(screen.getByText(/contact us/i, { selector: 'h2' })).toBeInTheDocument();
    expect(screen.getByText(/\+63 960 446 3974/i)).toBeInTheDocument();
    expect(screen.getByText(/4th floor of Bangkal Primary Health Care Center/i)).toBeInTheDocument();

    // Verify Footer elements
    expect(screen.getByText(/by why we clash/i)).toBeInTheDocument();
  });

  it('renders the Navbar with standard links and Apply button', () => {
    render(<MHMBHome />);

    // Verify Navbar links
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('About', { selector: 'a' })).toBeInTheDocument();
    expect(screen.getByText('Services')).toBeInTheDocument();
    expect(screen.getByText('Contact', { selector: 'a' })).toBeInTheDocument();
    expect(screen.getByText('Apply Now')).toBeInTheDocument();
  });

  it('toggles mobile menu when Menu/X button is clicked', () => {
    render(<MHMBHome />);

    // Get the mobile menu button (by its label)
    const toggleButton = screen.getByLabelText(/toggle menu/i);
    expect(toggleButton).toBeInTheDocument();

    // Initially, the mobile dropdown elements shouldn't be visible on screen
    // (Wait, they only render when isOpen is true in our implementation)
    expect(screen.queryByRole('navigation', { name: /mobile/i })).not.toBeInTheDocument();

    // Click the button to open mobile menu
    fireEvent.click(toggleButton);

    // After clicking, the mobile dropdown links should render
    const mobileLinks = screen.getAllByRole('link', { name: /about/i });
    expect(mobileLinks.length).toBeGreaterThan(1); // One in desktop, one in mobile
  });
});
