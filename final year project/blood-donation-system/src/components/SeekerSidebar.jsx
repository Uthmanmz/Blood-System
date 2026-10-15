import {
  useEffect,
  useState,
} from 'react';

import {
  NavLink,
} from 'react-router';

import {
  Bell,
  Droplet,
  LayoutDashboard,
  PackageSearch,
  Search,
} from 'lucide-react';

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
          <LayoutDashboard
            size={18}
            aria-hidden="true"
          />
          <span>Dashboard</span>
        </NavLink>

        <NavLink to="/seeker-find-blood">
          <Search size={18} aria-hidden="true" />
          <span>Find Blood</span>
        </NavLink>

        <NavLink to="/request-blood">
          <Droplet size={18} aria-hidden="true" />
          <span>Request Blood</span>
        </NavLink>

        <NavLink to="/track-request">
          <PackageSearch
            size={18}
            aria-hidden="true"
          />
          <span>Track Requests</span>
        </NavLink>

        <NavLink to="/seeker-notifications">
          <Bell size={18} aria-hidden="true" />
          <span>Notifications</span>

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
