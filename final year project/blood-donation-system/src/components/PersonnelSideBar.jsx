import { useEffect, useState } from 'react';
import { NavLink } from 'react-router';

import {
  BadgeCheck,
  Bell,
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  Package,
  Users,
} from 'lucide-react';

import LogoutButton from './LogoutButton';

import {
  getMyHospital,
  getPersonnelPermissions,
  PERSONNEL_PERMISSIONS,
} from '../services/personnelApi';

import '../styles/personnelDashboard.css';

const links = [
  [
    '/personnel-donors',
    'Manage Donors',
    PERSONNEL_PERMISSIONS.DONORS,
    Users,
  ],
  [
    '/personnel-inventory',
    'Blood Inventory',
    PERSONNEL_PERMISSIONS.INVENTORY,
    Package,
  ],
  [
    '/personnel-requests',
    'Blood Requests',
    PERSONNEL_PERMISSIONS.REQUESTS,
    ClipboardList,
  ],
  [
    '/personnel-appointments',
    'Appointments',
    PERSONNEL_PERMISSIONS.APPOINTMENTS,
    CalendarDays,
  ],
  [
    '/personnel-completed-donations',
    'Completed Donations',
    PERSONNEL_PERMISSIONS.DONATIONS,
    BadgeCheck,
  ],
];

function PersonnelSidebar() {
  const [hospital, setHospital] = useState(null);
  const [permissions, setPermissions] = useState([]);

  useEffect(() => {
    async function loadSidebar() {
      try {
        const [
          hospitalResponse,
          permissionResponse,
        ] = await Promise.all([
          getMyHospital(),
          getPersonnelPermissions(),
        ]);

        setHospital(
          hospitalResponse.data.hospital
        );

        setPermissions(
          permissionResponse.data.permissions || []
        );
      } catch {
        setHospital(null);
        setPermissions([]);
      }
    }

    loadSidebar();
  }, []);

  return (
    <aside className="personnel-sidebar">
      <div className="personnel-sidebar-title">
        <h2>
          {hospital?.name || 'Hospital Portal'}
        </h2>

        <p>Personnel Portal</p>
      </div>

      <nav
        className="personnel-sidebar-menu"
        aria-label="Personnel navigation"
      >
        <NavLink to="/personnel-dashboard">
          <LayoutDashboard
            size={18}
            aria-hidden="true"
          />
          <span>Dashboard</span>
        </NavLink>

        {links
          .filter(([, , permission]) =>
            permissions.includes(permission)
          )
          .map(([to, label, , Icon]) => (
            <NavLink key={to} to={to}>
              <Icon size={18} aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}

        {permissions.includes(
          PERSONNEL_PERMISSIONS.NOTIFICATIONS
        ) && (
          <NavLink to="/personnel-notifications">
            <Bell size={18} aria-hidden="true" />
            <span>Notifications</span>
          </NavLink>
        )}
      </nav>

      <LogoutButton
        className="personnel-logout-btn"
        loginPath="/personnel-login"
      />
    </aside>
  );
}

export default PersonnelSidebar;