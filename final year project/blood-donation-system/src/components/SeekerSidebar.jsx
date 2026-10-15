import {
  useEffect,
  useState,
} from 'react';

import {
  NavLink,
} from 'react-router';

import {
  apiGet,
} from '../services/api';

import LogoutButton from './LogoutButton';

import '../styles/donorDashboard.css';


function SeekerSidebar() {
  const [unread, setUnread] =
    useState(0);

  useEffect(() => {
  loadUnreadCount();

  function refreshUnread() {
    loadUnreadCount();
  }

  window.addEventListener(
    'notifications-updated',
    refreshUnread
  );

  window.addEventListener(
    'focus',
    refreshUnread
  );

  return () => {
    window.removeEventListener(
      'notifications-updated',
      refreshUnread
    );

    window.removeEventListener(
      'focus',
      refreshUnread
    );
  };
}, []);


  async function loadUnreadCount() {
    try {
      const response =
        await apiGet(
          '/notifications/unread-count.php'
        );

      setUnread(
        response.data?.unread_count || 0
      );
    } catch {
      setUnread(0);
    }
  }


  return (
    <aside className="donor-sidebar">

      <div className="sidebar-title">

        <h2>
          Blood Network
        </h2>

        <p>
          Seeker Portal
        </p>

      </div>


      <nav className="sidebar-menu">

        <NavLink to="/seeker-dashboard">
          Dashboard
        </NavLink>

        <NavLink to="/find-blood">
          Find Blood
        </NavLink>

        <NavLink to="/request-blood">
          Request Blood
        </NavLink>

        <NavLink to="/track-request">
          Track Requests
        </NavLink>

        <NavLink to="/seeker-notifications">
          Notifications

          {unread > 0 && (
            <span className="notification-unread-badge">
              {unread}
            </span>
          )}
        </NavLink>

      </nav>


      <LogoutButton
        className="donor-logout-btn"
        loginPath="/seeker-login"
      />

    </aside>
  );
}


export default SeekerSidebar;