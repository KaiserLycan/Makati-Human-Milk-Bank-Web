import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import StaffReports from '../staff-reports';

// Mock next/link to prevent issues in Jest environment
jest.mock('next/link', () => {
  const MockLink = ({ children, href, ...rest }: { children: React.ReactNode; href: string; [key: string]: any }) => {
    return <a href={href} {...rest}>{children}</a>;
  };
  MockLink.displayName = 'MockLink';
  return MockLink;
});

// Mock window.print to prevent errors in jsdom environment
beforeAll(() => {
  window.print = jest.fn();
});

describe('StaffReports Component', () => {
  it('renders sidebar, document outline, toolbar, and the first PDF page canvas', () => {
    render(<StaffReports />);

    // Verify sidebar layout and active Reports page link
    expect(screen.getByText('MHMB')).toBeInTheDocument();
    expect(screen.getByTestId('nav-dashboard')).toBeInTheDocument();
    expect(screen.getByTestId('nav-reports')).toBeInTheDocument();
    expect(screen.getByTestId('nav-reports')).toHaveAttribute('href', '/work/reports');

    // Verify document outline buttons
    expect(screen.getByTestId('outline-page-1')).toBeInTheDocument();
    expect(screen.getByTestId('outline-page-2')).toBeInTheDocument();
    expect(screen.getByTestId('outline-page-3')).toBeInTheDocument();

    // Verify PDF toolbar actions
    expect(screen.getByTestId('zoom-out-btn')).toBeInTheDocument();
    expect(screen.getByTestId('zoom-val')).toHaveTextContent('100%');
    expect(screen.getByTestId('zoom-in-btn')).toBeInTheDocument();
    expect(screen.getByTestId('page-val')).toHaveTextContent('1 / 3');
    expect(screen.getByTestId('prev-page-btn')).toBeInTheDocument();
    expect(screen.getByTestId('next-page-btn')).toBeInTheDocument();
    expect(screen.getByTestId('rotate-btn')).toBeInTheDocument();
    expect(screen.getByTestId('download-btn')).toBeInTheDocument();
    expect(screen.getByTestId('print-btn')).toBeInTheDocument();

    // Verify Page 1 details are visible initially
    expect(screen.getByTestId('pdf-page-1')).toBeInTheDocument();
    expect(screen.getByText('Makati Human Milk Bank monthly summary report')).toBeInTheDocument();
    expect(screen.getByText('1. Executive Summary')).toBeInTheDocument();
    expect(screen.getByText('Total PHMB In Stock')).toBeInTheDocument();
  });

  it('navigates pages via next and prev buttons', () => {
    render(<StaffReports />);

    // Initially Page 1
    expect(screen.getByTestId('page-val')).toHaveTextContent('1 / 3');
    expect(screen.getByTestId('pdf-page-1')).toBeInTheDocument();

    // Click Next Page
    const nextBtn = screen.getByTestId('next-page-btn');
    fireEvent.click(nextBtn);

    // Page 2
    expect(screen.getByTestId('page-val')).toHaveTextContent('2 / 3');
    expect(screen.queryByTestId('pdf-page-1')).not.toBeInTheDocument();
    expect(screen.getByTestId('pdf-page-2')).toBeInTheDocument();
    expect(screen.getByText('3. Collection Program Analytics')).toBeInTheDocument();

    // Click Prev Page
    const prevBtn = screen.getByTestId('prev-page-btn');
    fireEvent.click(prevBtn);

    // Back to Page 1
    expect(screen.getByTestId('page-val')).toHaveTextContent('1 / 3');
    expect(screen.getByTestId('pdf-page-1')).toBeInTheDocument();
  });

  it('jumps directly to pages via document outline previews', () => {
    render(<StaffReports />);

    // Click Outline Page 3
    const page3Btn = screen.getByTestId('outline-page-3');
    fireEvent.click(page3Btn);

    // Page 3
    expect(screen.getByTestId('page-val')).toHaveTextContent('3 / 3');
    expect(screen.getByTestId('pdf-page-3')).toBeInTheDocument();
    expect(screen.getByText('4. Quality Screening & Audit Checks')).toBeInTheDocument();
  });

  it('updates zoom percentage when clicking zoom in and zoom out', () => {
    render(<StaffReports />);

    const zoomVal = screen.getByTestId('zoom-val');
    const zoomInBtn = screen.getByTestId('zoom-in-btn');
    const zoomOutBtn = screen.getByTestId('zoom-out-btn');

    expect(zoomVal).toHaveTextContent('100%');

    // Zoom In
    fireEvent.click(zoomInBtn);
    expect(zoomVal).toHaveTextContent('110%');

    // Zoom Out
    fireEvent.click(zoomOutBtn);
    expect(zoomVal).toHaveTextContent('100%');

    // Zoom Out again
    fireEvent.click(zoomOutBtn);
    expect(zoomVal).toHaveTextContent('90%');
  });

  it('rotates the PDF canvas and triggers download and print actions', () => {
    jest.useFakeTimers();
    render(<StaffReports />);

    // Click Rotate
    const rotateBtn = screen.getByTestId('rotate-btn');
    fireEvent.click(rotateBtn);

    // Check style transform contains rotation (rotation is now 90)
    const canvas = screen.getByTestId('pdf-canvas');
    expect(canvas.style.transform).toContain('rotate(90deg)');

    // Click Download
    const downloadBtn = screen.getByTestId('download-btn');
    fireEvent.click(downloadBtn);
    expect(screen.getByText('Downloading PDF report...')).toBeInTheDocument();

    // Advance time to clear downloading state
    act(() => {
      jest.advanceTimersByTime(1500);
    });
    expect(screen.queryByText('Downloading PDF report...')).not.toBeInTheDocument();

    // Click Print
    const printBtn = screen.getByTestId('print-btn');
    fireEvent.click(printBtn);

    // Advance time for printing mock trigger
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(window.print).toHaveBeenCalled();

    jest.useRealTimers();
  });
});
