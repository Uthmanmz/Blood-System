import {
  useEffect,
  useState,
} from 'react';

import {
  Link,
} from 'react-router';

import {
  getMyNotifications,
} from '../services/notificationApi';


function NotificationBell({
  to = '/donor-notifications',
}) {
  const [unread, setUnread] =
    useState(0);


  useEffect(() => {
    loadUnread();

    const refresh =
      () => loadUnread();

    window.addEventListener(
      'notifications-updated',
      refresh
    );

    window.addEventListener(
      'focus',
      refresh
    );

    return () => {
      window.removeEventListener(
        'notifications-updated',
        refresh
      );

      window.removeEventListener(
        'focus',
        refresh
      );
    };
  }, []);


  async function loadUnread() {
    try {
      const response =
        await getMyNotifications();

      setUnread(
        Number(
          response.data
            ?.unread_count || 0
        )
      );
    } catch {
      setUnread(0);
    }
  }


  return (
    <Link
      className="notification-bell-link"
      to={to}
      aria-label={`Notifications: ${unread} unread`}
    >
      <span aria-hidden="true">
        🔔
      </span>

      <span>Notifications</span>

      {unread > 0 && (
        <span className="notification-unread-badge">
          {unread > 99
            ? '99+'
            : unread}
        </span>
      )}
    </Link>
  );
}

export default NotificationBell;  