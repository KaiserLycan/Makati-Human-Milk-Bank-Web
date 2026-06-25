import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import StaffNotifications from '../staff-notifications';

// Mock next/link
jest.mock('next/link', () => {
  const MockLink = ({ children, href, ...rest }: { children: React.ReactNode; href: string; [key: string]: any }) => (
    <a href={href} {...rest}>{children}</a>
  );
  MockLink.displayName = 'MockLink';
  return MockLink;
});

// ── Mock the API module ──────────────────────────────────────────────────────
// Return 5 hardcoded notifications that match the original mock data shape so
// existing test assertions still pass.
const mockNotifications = [
  {
    nid: 1,
    title: 'New Donor Application',
    message: 'Sarah Jenkins has submitted a donor application for the Walk-In (WI) program.',
    is_read: false,
    created_at: new Date().toISOString(), // today → "Today" group
    notification_type: 'new_application',
    entity_type: 'donor',
  },
  {
    nid: 2,
    title: 'Low Buffer Warning',
    message: 'O-Negative milk buffer is currently at 800 ml (below threshold of 1000 ml).',
    is_read: false,
    created_at: new Date().toISOString(), // today
    notification_type: 'buffer_alert',
    entity_type: 'inventory',
  },
  {
    nid: 3,
    title: 'New Milk Request',
    message: 'Makati Medical Center requested 250ml of pasteurized breast milk.',
    is_read: true,
    created_at: (() => { const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString(); })(), // yesterday
    notification_type: 'request',
    entity_type: 'beneficiary',
  },
  {
    nid: 4,
    title: 'System Backup Success',
    message: 'Daily database backup and replication completed successfully at 03:00 AM.',
    is_read: true,
    created_at: (() => { const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString(); })(), // yesterday
    notification_type: 'system',
    entity_type: 'system',
  },
  {
    nid: 5,
    title: 'Donor Approved',
    message: "Maria Santos's application has been approved by Dr. Alice May Miller.",
    is_read: true,
    created_at: (() => { const d = new Date(); d.setDate(d.getDate() - 10); return d.toISOString(); })(), // past 7 days → "Past Month" / "Past 7 Days"
    notification_type: 'approval',
    entity_type: 'donor',
  },
];

jest.mock('../../utils/api', () => ({
  api: {
    get: jest.fn(() =>
      Promise.resolve({ data: { data: mockNotifications } })
    ),
    patch: jest.fn(() => Promise.resolve({ data: {} })),
  },
}));

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Wait for the loading skeleton to disappear and real cards to appear. */
const waitForLoaded = async () => {
  await waitFor(() => {
    expect(screen.queryByTestId('notification-card-1')).toBeInTheDocument();
  });
};

// ── Tests ────────────────────────────────────────────────────────────────────

describe('StaffNotifications Component', () => {
  it('renders sidebar, header, back button, and grouped notifications list', async () => {
    render(<StaffNotifications />);
    await waitForLoaded();

    // Layout & sidebar
    expect(screen.getByText('MHMB')).toBeInTheDocument();
    expect(screen.getByTestId('nav-dashboard')).toBeInTheDocument();
    const reportsLink = screen.getByTestId('nav-reports');
    expect(reportsLink).toBeInTheDocument();
    expect(reportsLink).toHaveAttribute('href', '/work/reports');
    expect(screen.getByTestId('nav-sub-donors')).toBeInTheDocument();
    expect(screen.getByTestId('nav-sub-donors')).toHaveAttribute('href', '/work/donor');
    expect(screen.getByTestId('nav-sub-applicants')).toBeInTheDocument();
    expect(screen.getByTestId('nav-sub-applicants')).toHaveAttribute('href', '/work/applicant-donor');
    expect(screen.getByText('Notifications')).toBeInTheDocument();

    // Back button
    const backBtn = screen.getByTestId('back-btn');
    expect(backBtn).toBeInTheDocument();
    expect(backBtn).toHaveAttribute('href', '/work/dashboard');

    // Groups — Today and Yesterday are guaranteed by our mock data
    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.getByText('Yesterday')).toBeInTheDocument();

    // Notification cards
    const card1 = screen.getByTestId('notification-card-1');
    expect(card1).toBeInTheDocument();
    expect(card1).toHaveTextContent('New Donor Application');

    const card2 = screen.getByTestId('notification-card-2');
    expect(card2).toBeInTheDocument();
    expect(card2).toHaveTextContent('Low Buffer Warning');

    const card3 = screen.getByTestId('notification-card-3');
    expect(card3).toBeInTheDocument();
    expect(card3).toHaveTextContent('New Milk Request');

    const card4 = screen.getByTestId('notification-card-4');
    expect(card4).toBeInTheDocument();
    expect(card4).toHaveTextContent('System Backup Success');

    const card5 = screen.getByTestId('notification-card-5');
    expect(card5).toBeInTheDocument();
    expect(card5).toHaveTextContent('Donor Approved');

    // 2 unread (nid 1 & 2)
    expect(screen.getByTestId('unread-badge')).toHaveTextContent('2 new');
  });

  it('marks a single notification as read when clicked', async () => {
    render(<StaffNotifications />);
    await waitForLoaded();

    // Unread dot for card 1 exists
    expect(screen.getByTestId('unread-dot-1')).toBeInTheDocument();

    // Click to mark read
    const card = screen.getByTestId('notification-card-1');
    await act(async () => { fireEvent.click(card); });

    // Dot should be gone, badge drops to 1
    expect(screen.queryByTestId('unread-dot-1')).not.toBeInTheDocument();
    expect(screen.getByTestId('unread-badge')).toHaveTextContent('1 new');
  });

  it('marks all notifications as read when clicking mark all read button', async () => {
    render(<StaffNotifications />);
    await waitForLoaded();

    expect(screen.getByTestId('unread-badge')).toHaveTextContent('2 new');

    const markAllBtn = screen.getByTestId('mark-all-read-btn');
    await act(async () => { fireEvent.click(markAllBtn); });

    expect(screen.queryByTestId('unread-dot-1')).not.toBeInTheDocument();
    expect(screen.queryByTestId('unread-dot-2')).not.toBeInTheDocument();
    expect(screen.queryByTestId('unread-badge')).not.toBeInTheDocument();
    expect(screen.queryByTestId('mark-all-read-btn')).not.toBeInTheDocument();
  });

  it('filters notifications to only unread when toggling Unread only', async () => {
    render(<StaffNotifications />);
    await waitForLoaded();

    // All 5 cards visible initially
    expect(screen.getByTestId('notification-card-1')).toBeInTheDocument();
    expect(screen.getByTestId('notification-card-3')).toBeInTheDocument();

    // Toggle unread only
    const filterBtn = screen.getByTestId('unread-filter-btn');
    fireEvent.click(filterBtn);

    // Only unread cards (1 & 2) should remain
    expect(screen.getByTestId('notification-card-1')).toBeInTheDocument();
    expect(screen.getByTestId('notification-card-2')).toBeInTheDocument();
    expect(screen.queryByTestId('notification-card-3')).not.toBeInTheDocument();
    expect(screen.queryByTestId('notification-card-4')).not.toBeInTheDocument();
    expect(screen.queryByTestId('notification-card-5')).not.toBeInTheDocument();
  });

  it('filters notifications by search query', async () => {
    render(<StaffNotifications />);
    await waitForLoaded();

    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: 'donor' } });

    // Cards 1 and 5 match "donor" (title or description)
    expect(screen.getByTestId('notification-card-1')).toBeInTheDocument();
    expect(screen.getByTestId('notification-card-5')).toBeInTheDocument();
    // Cards 2, 3, 4 should not match
    expect(screen.queryByTestId('notification-card-2')).not.toBeInTheDocument();
    expect(screen.queryByTestId('notification-card-3')).not.toBeInTheDocument();
    expect(screen.queryByTestId('notification-card-4')).not.toBeInTheDocument();
  });

  it('shows the pagination toolbar with correct counter', async () => {
    render(<StaffNotifications />);
    await waitForLoaded();

    // Default page size is 10, 5 items total → "1–5 of 5"
    const counter = screen.getByTestId('page-counter');
    expect(counter).toHaveTextContent('1–5 of 5');
  });
});
