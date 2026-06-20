import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import StaffNotifications from '../staff-notifications';

// Mock next/link to prevent issues in Jest environment
jest.mock('next/link', () => {
  const MockLink = ({ children, href, ...rest }: { children: React.ReactNode; href: string; [key: string]: any }) => {
    return <a href={href} {...rest}>{children}</a>;
  };
  MockLink.displayName = 'MockLink';
  return MockLink;
});

describe('StaffNotifications Component', () => {
  it('renders sidebar, header, back button, and grouped notifications list', () => {
    render(<StaffNotifications />);

    // Verify layout and header title
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

    // Verify back button to dashboard
    const backBtn = screen.getByTestId('back-btn');
    expect(backBtn).toBeInTheDocument();
    expect(backBtn).toHaveAttribute('href', '/work/dashboard');

    // Verify groups exist
    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.getByText('Yesterday')).toBeInTheDocument();
    expect(screen.getByText('Earlier')).toBeInTheDocument();

    // Verify specific notification items render within their container cards
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

    // Verify unread badge count (initially 2 unread items: Donor App & Low Buffer Warning)
    expect(screen.getByTestId('unread-badge')).toHaveTextContent('2 new');
  });

  it('marks a single notification as read when clicked', () => {
    render(<StaffNotifications />);

    // Check that unread dot for notification card 1 exists
    const unreadDot = screen.getByTestId('unread-dot-1');
    expect(unreadDot).toBeInTheDocument();

    // Click the notification card to mark it as read
    const card = screen.getByTestId('notification-card-1');
    fireEvent.click(card);

    // Unread dot should be gone
    expect(screen.queryByTestId('unread-dot-1')).not.toBeInTheDocument();
    // Unread badge count should drop to 1
    expect(screen.getByTestId('unread-badge')).toHaveTextContent('1 new');
  });

  it('marks all notifications as read when clicking mark all read button', () => {
    render(<StaffNotifications />);

    // Initially 2 new
    expect(screen.getByTestId('unread-badge')).toHaveTextContent('2 new');

    // Click mark all read button
    const markAllBtn = screen.getByTestId('mark-all-read-btn');
    fireEvent.click(markAllBtn);

    // Unread dots should be gone
    expect(screen.queryByTestId('unread-dot-1')).not.toBeInTheDocument();
    expect(screen.queryByTestId('unread-dot-2')).not.toBeInTheDocument();

    // Unread badge is removed since all are read
    expect(screen.queryByTestId('unread-badge')).not.toBeInTheDocument();
    expect(screen.queryByTestId('mark-all-read-btn')).not.toBeInTheDocument();
  });

  it('auto-dismisses the sidebar notification banner after 2 seconds', () => {
    jest.useFakeTimers();
    render(<StaffNotifications />);

    // Initially visible
    expect(screen.getByTestId('sidebar-notification')).toBeInTheDocument();

    // Advance time by 2 seconds
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    // Now it should be gone
    expect(screen.queryByTestId('sidebar-notification')).not.toBeInTheDocument();

    jest.useRealTimers();
  });
});
