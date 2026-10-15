import { useEffect, useState } from 'react';
import { NavLink } from 'react-router';

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
  ],
  [
    '/personnel-inventory',
    'Blood Inventory',
    PERSONNEL_PERMISSIONS.INVENTORY,
  ],
  [
    '/personnel-requests',
    'Blood Requests',
    PERSONNEL_PERMISSIONS.REQUESTS,
  ],
  [
    '/personnel-appointments',
    'Appointments',
    PERSONNEL_PERMISSIONS.APPOINTMENTS,
  ],
  [
    '/personnel-completed-donations',
    'Completed Donations',
    PERSONNEL_PERMISSIONS.DONATIONS,
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
          Dashboard
        </NavLink>

        {links
          .filter(([, , permission]) =>
            permissions.includes(permission)
          )
          .map(([to, label]) => (
            <NavLink key={to} to={to}>
              {label}
            </NavLink>
          ))}

        {permissions.includes(
          PERSONNEL_PERMISSIONS.NOTIFICATIONS
        ) && (
          <NavLink to="/personnel-notifications">
            Notifications
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