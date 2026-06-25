import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import StaffReports from '../staff-reports';

// Mock next/link to prevent issues in Jest environment
jest.mock('next/link', () => {
  const MockLink = ({ children, href, ...rest }: { children: React.ReactNode; href: string; [key: string]: any }) => {
    return <a href={href} {...rest}>{children}</a>;
  };
  MockLink.displayName = 'MockLink';
  return MockLink;
});

// Mock window.print and URL methods to prevent errors in jsdom environment
beforeAll(() => {
  window.print = jest.fn();
  window.URL.createObjectURL = jest.fn(() => 'mock-url');
  window.URL.revokeObjectURL = jest.fn();
});

// Mock api utility to prevent actual network calls in tests.
// We intentionally keep data fetching pending so the component renders with its
// built-in default reportData (12 collection records → 2 pages).
jest.mock('../../utils/api', () => ({
  api: {
    get: jest.fn((url) => {
      if (url.includes('/export')) {
        return Promise.resolve({ data: new Blob() });
      }
      // Never resolves → component uses its default reportData state (12 records, 2 pages)
      return new Promise(() => {});
    }),
  },
}));

// The default collection reportData has 12 records and RECORDS_PER_PAGE = 10
// → totalPages = Math.ceil(12 / 10) = 2
const TOTAL_PAGES = 2;

describe('StaffReports Component', () => {
  it('renders sidebar, document outline, toolbar, and the first PDF page canvas', () => {
    render(<StaffReports />);

    // Verify sidebar layout and active Reports page link
    expect(screen.getByText('MHMB')).toBeInTheDocument();
    expect(screen.getByTestId('nav-dashboard')).toBeInTheDocument();
    expect(screen.getByTestId('nav-reports')).toBeInTheDocument();
    expect(screen.getByTestId('nav-reports')).toHaveAttribute('href', '/work/reports');

    // Verify document outline buttons (2 pages from default 12-record dataset)
    expect(screen.getByTestId('outline-page-1')).toBeInTheDocument();
    expect(screen.getByTestId('outline-page-2')).toBeInTheDocument();
    expect(screen.queryByTestId('outline-page-3')).not.toBeInTheDocument();

    // Verify PDF toolbar actions
    expect(screen.getByTestId('zoom-out-btn')).toBeInTheDocument();
    expect(screen.getByTestId('zoom-val')).toHaveTextContent('100%');
    expect(screen.getByTestId('zoom-in-btn')).toBeInTheDocument();
    expect(screen.getByTestId('page-val')).toHaveTextContent(`1 / ${TOTAL_PAGES}`);
    expect(screen.getByTestId('prev-page-btn')).toBeInTheDocument();
    expect(screen.getByTestId('next-page-btn')).toBeInTheDocument();
    expect(screen.getByTestId('rotate-btn')).toBeInTheDocument();
    expect(screen.getByTestId('download-btn')).toBeInTheDocument();
    expect(screen.getByTestId('print-btn')).toBeInTheDocument();

    // Verify Page 1 details are visible initially (collection report is the default)
    expect(screen.getByTestId('pdf-page-1')).toBeInTheDocument();
    expect(screen.getByText('Makati Human Milk Bank Collection Report')).toBeInTheDocument();
    expect(screen.getByText(/Total Volume Collected/)).toBeInTheDocument();
  });

  it('navigates pages via next and prev buttons', () => {
    render(<StaffReports />);

    // Initially Page 1
    expect(screen.getByTestId('page-val')).toHaveTextContent(`1 / ${TOTAL_PAGES}`);
    expect(screen.getByTestId('pdf-page-1')).toBeInTheDocument();
    expect(screen.getByText('Jun 22, 2026')).toBeInTheDocument();
    expect(screen.queryByText('Jun 11, 2026')).not.toBeInTheDocument();

    // Click Next Page
    const nextBtn = screen.getByTestId('next-page-btn');
    fireEvent.click(nextBtn);

    // Page 2
    expect(screen.getByTestId('page-val')).toHaveTextContent(`2 / ${TOTAL_PAGES}`);
    expect(screen.queryByTestId('pdf-page-1')).toBeInTheDocument(); // same testid, different content
    // Page 2 shows the pagination subtitle for the collection table
    expect(screen.getByText(`Milk Collections Records (Page 2 of ${TOTAL_PAGES})`)).toBeInTheDocument();

    // Click Prev Page
    const prevBtn = screen.getByTestId('prev-page-btn');
    fireEvent.click(prevBtn);

    // Back to Page 1
    expect(screen.getByTestId('page-val')).toHaveTextContent(`1 / ${TOTAL_PAGES}`);
    expect(screen.getByTestId('pdf-page-1')).toBeInTheDocument();
    expect(screen.getByText('Makati Human Milk Bank Collection Report')).toBeInTheDocument();
  });

  it('jumps directly to pages via document outline previews', () => {
    render(<StaffReports />);

    // Click Outline Page 2 (last page with default data)
    const page2Btn = screen.getByTestId('outline-page-2');
    fireEvent.click(page2Btn);

    // Page 2 — same pdf-page-1 testid, but page-val and content differ
    expect(screen.getByTestId('page-val')).toHaveTextContent(`2 / ${TOTAL_PAGES}`);
    expect(screen.getByTestId('pdf-page-1')).toBeInTheDocument();
    expect(screen.getByText(`Milk Collections Records (Page 2 of ${TOTAL_PAGES})`)).toBeInTheDocument();
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

  it('rotates the PDF canvas and triggers download and print actions', async () => {
    jest.useFakeTimers();
    render(<StaffReports />);

    // Click Rotate
    const rotateBtn = screen.getByTestId('rotate-btn');
    fireEvent.click(rotateBtn);

    // Check style transform contains rotation (rotation is now 90)
    const canvas = screen.getByTestId('pdf-canvas');
    expect(canvas.style.transform).toContain('rotate(90deg)');

    // Click Download — downloading banner appears immediately (state set sync)
    const downloadBtn = screen.getByTestId('download-btn');
    fireEvent.click(downloadBtn);
    expect(screen.getByText('Downloading PDF report...')).toBeInTheDocument();

    // The download is async (Promise-based); wait for the finally-block to clear the banner
    await waitFor(() =>
      expect(screen.queryByText('Downloading PDF report...')).not.toBeInTheDocument()
    );

    // Click Print
    const printBtn = screen.getByTestId('print-btn');
    fireEvent.click(printBtn);

    // Advance time for printing mock trigger
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    expect(window.print).toHaveBeenCalled();

    jest.useRealTimers();
  });

  it('allows switching report type and range, updating layout and filename', () => {
    render(<StaffReports />);

    // Selector for Report Type — default is 'collection'
    const select = screen.getByTestId('report-type-select');
    expect(select).toHaveValue('collection');

    // Switch to processing report
    fireEvent.change(select, { target: { value: 'processing' } });
    expect(select).toHaveValue('processing');

    // Expect the file name toolbar text to change
    expect(screen.getByText('mhmb-processing-report-month.pdf')).toBeInTheDocument();

    // Switch range to week
    const weekBtn = screen.getByTestId('range-btn-week');
    fireEvent.click(weekBtn);

    // Expect file name to change
    expect(screen.getByText('mhmb-processing-report-week.pdf')).toBeInTheDocument();
  });
});
