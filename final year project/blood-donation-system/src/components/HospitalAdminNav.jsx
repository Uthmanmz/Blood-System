import {
  useEffect,
  useState,
} from 'react';

import {
  Link,
  NavLink,
  useNavigate,
} from 'react-router';

import {
  getHospitalAdminHospital,
} from '../services/hospitalAdminApi';

import {
  logoutUser,
} from '../services/authApi';


const links = [
  [
    '/hospital-dashboard',
    'Overview',
  ],
  [
    '/hospital-details',
    'Hospital Details',
  ],
  [
    '/hospital-personnel',
    'Personnel',
  ],
  [
    '/hospital-donors',
    'Donors',
  ],
  [
    '/hospital-appointments',
    'Appointments',
  ],
  [
    '/hospital-donations',
    'Donations',
  ],
  [
    '/hospital-inventory',
    'Inventory',
  ],
  [
    '/hospital-requests',
    'Requests',
  ],
  [
    '/hospital-notifications',
    '🔔 Messages',
  ],
  [
    '/hospital-reports',
    'Reports',
  ],
];


function HospitalAdminNav() {
  const navigate = useNavigate();

  const [hospital, setHospital] =
    useState(null);

  const [loggingOut, setLoggingOut] =
    useState(false);


  useEffect(() => {
    loadHospital();
  }, []);


  async function loadHospital() {
    try {
      const response =
        await getHospitalAdminHospital();

      setHospital(
        response.data.hospital
      );
    } catch {
      setHospital(null);
    }
  }


  async function handleLogout() {
    try {
      setLoggingOut(true);

      await logoutUser();
    } finally {
      navigate(
        '/hospital-login',
        {
          replace: true,
        }
      );
    }
  }


  return (
    <aside className="hospital-sidebar">

      <div className="hospital-sidebar-heading">
        <span>
          HOSPITAL ADMIN
        </span>

        <h2>
          {hospital?.name ||
            'Hospital Portal'}
        </h2>
      </div>


      <nav
        aria-label="Hospital administration"
      >
        {links.map(
          ([path, label]) => (
            <NavLink
              key={path}
              to={path}
              end
              className={({
                isActive,
              }) =>
                isActive
                  ? 'hospital-menu-link active'
                  : 'hospital-menu-link'
              }
            >
              <span>
                {label}
              </span>
            </NavLink>
          )
        )}
      </nav>


      <div className="hospital-sidebar-bottom">

        <Link
          className="sidebar-public-action"
          to="/"
        >
          Public Website
        </Link>

        <button
          type="button"
          className="sidebar-login-action"
          onClick={handleLogout}
          disabled={loggingOut}
        >
          {loggingOut
            ? 'Logging out...'
            : 'Logout'}
        </button>

      </div>

    </aside>
  );
}

export default HospitalAdminNav;