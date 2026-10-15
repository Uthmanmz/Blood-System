import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router';

import PersonnelSidebar from '../components/PersonnelSideBar';

import {
  getPersonnelDashboard,
  getPersonnelPermissions,
  getMyHospital,
  PERSONNEL_PERMISSIONS,
} from '../services/personnelApi';

import '../styles/personnelDashboard.css';
import '../styles/newPages.css';

const actions = [
  [
    '/personnel-donors',
    'Donor Records',
    PERSONNEL_PERMISSIONS.DONORS,
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
    '/personnel-notifications',
    'Messages',
    PERSONNEL_PERMISSIONS.NOTIFICATIONS,
  ],
];

function PersonnelDashboard() {
  const location = useLocation();

  const [hospital, setHospital] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [permissions, setPermissions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);

        const [
          hospitalResponse,
          dashboardResponse,
          permissionResponse,
        ] = await Promise.all([
          getMyHospital(),
          getPersonnelDashboard(),
          getPersonnelPermissions(),
        ]);

        setHospital(
          hospitalResponse.data.hospital
        );

        setDashboard(
          dashboardResponse.data
        );

        setPermissions(
          permissionResponse.data.permissions || []
        );
      } catch (error) {
        setMessage(error.message);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <main className="personnel-layout">
        <PersonnelSidebar />

        <section className="personnel-main">
          <p>Loading personnel dashboard...</p>
        </section>
      </main>
    );
  }

  const statistics = dashboard
    ? [
        [
          'Registered Donors',
          dashboard.donors.total,
        ],
        [
          'Completed Donations',
          dashboard.donations.completed,
        ],
        [
          'Scheduled Appointments',
          dashboard.appointments.scheduled,
        ],
        [
          'Available Blood Units',
          dashboard.inventory.available,
        ],
        [
          'Awaiting Screening',
          dashboard.inventory.awaiting_screening,
        ],
      ]
    : [];

  return (
    <main className="personnel-layout">
      <PersonnelSidebar />

      <section className="personnel-main">
        <h1>Blood Bank Personnel</h1>

        <p>
          {hospital?.name || 'Hospital'}
        </p>

        {location.state?.personnelMessage && (
          <p
            className="application-message"
            role="alert"
          >
            {location.state.personnelMessage}
          </p>
        )}

        {message && (
          <p
            className="application-message"
            role="alert"
          >
            {message}
          </p>
        )}

        <div className="workspace-grid">
          {statistics.map(([label, value]) => (
            <article
              className="workspace-card"
              key={label}
            >
              <p>{label}</p>
              <strong>{value}</strong>
            </article>
          ))}
        </div>

        <section className="workspace-panel">
          <h2>Daily Activities</h2>

          <div className="management-actions">
            {actions
              .filter(([, , permission]) =>
                permissions.includes(permission)
              )
              .map(([to, label]) => (
                <Link
                  key={to}
                  className="application-button"
                  to={to}
                >
                  {label}
                </Link>
              ))}
          </div>
        </section>
      </section>
    </main>
  );
}

export default PersonnelDashboard;