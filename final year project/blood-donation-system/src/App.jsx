import { useEffect, useState } from 'react';
import { Navigate, Routes, Route, useLocation } from 'react-router';
import { ROLES } from './config/roles';
import { getCurrentUser } from './services/authApi';
import { PERSONNEL_PERMISSIONS, } from './services/personnelApi';
import PersonnelRouteGuard from './components/PersonnelRouteGuard';

import Navbar from './components/Navbar';
import Footer from './components/Footer';

import Home from './pages/Home';
import About from './pages/About';
import FindBlood from './pages/FindBlood';
import RequestBlood from './pages/RequestBlood';
import BecomeDonor from './pages/BecomeDonor';
import Feedback from './pages/Feedback';
import Login from './pages/Login';
import TrackRequest from './pages/TrackRequest';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import NotFound from './pages/NotFound';
import Hospitals from './pages/Hospitals';

import DonorDashboard from './pages/DonorDashboard';
import DonorProfile from './pages/DonorProfile';
import DonorAvailability from './pages/DonorAvailability';
import ScheduleDonation from './pages/ScheduleDonation';
import DonationHistory from './pages/DonationHistory';
import DonorNotifications from './pages/DonorNotifications';

import PersonnelDashboard from './pages/PersonnelDashboard';
import ManageDonors from './pages/ManageDonors';
import BloodInventory from './pages/BloodInventory';
import ManageBloodRequests from './pages/ManageBloodRequests';
import DonationAppointments from './pages/DonationAppointments';
import CompletedDonations from './pages/CompletedDonations';
import PersonnelNotifications from './pages/PersonnelNotifications';

import AdminDashboard from './pages/AdminDashboard';
import ManageUsers from './pages/ManageUsers';
import AdminFeedback from './pages/AdminFeedback';
import AdminNotifications from './pages/AdminNotifications';
import AdminReports from './pages/AdminReports';

import HospitalDashboard from './pages/HospitalDashboard';
import HospitalRegister from './pages/HospitalRegister';
import SeekerDashboard from './pages/SeekerDashboard';
import SeekerRegister from './pages/SeekerRegister';

import ManageHospitals from './pages/ManageHospitals';
import HospitalPersonnel from './pages/HospitalPersonnel';
import HospitalNotifications from './pages/HospitalNotifications';
import HospitalInventory from './pages/HospitalInventory';
import HospitalRequests from './pages/HospitalRequests';
import SeekerNotifications from './pages/SeekerNotifications';
import HospitalDetails from './pages/HospitalDetails';
import HospitalReports from './pages/HospitalReports';
import {
  HospitalDonors,
  HospitalAppointments,
  HospitalDonations,
} from './pages/HospitalRecords';

const publicPages = [
  ['/', Home],
  ['/about', About],
  ['/hospitals', Hospitals],
  ['/find-blood', FindBlood],
  ['/become-donor', BecomeDonor],
  ['/feedback', Feedback],
  ['/forgot-password', ForgotPassword],
  ['/reset-password', ResetPassword],
  ['/hospital-register', HospitalRegister],
  ['/seeker-register', SeekerRegister],
];

const loginPages = [
  ['/login', ROLES.DONOR],
  ['/donor-login', ROLES.DONOR],
  ['/admin-login', ROLES.ORGANISATION_ADMIN],
  ['/hospital-login', ROLES.HOSPITAL_ADMIN],
  ['/personnel-login', ROLES.PERSONNEL],
  ['/seeker-login', ROLES.SEEKER],
];

const dashboardPages = [
  ['/donor-dashboard', DonorDashboard],
  ['/donor-profile', DonorProfile],
  ['/donor-availability', DonorAvailability],
  ['/schedule-donation', ScheduleDonation],
  ['/donation-history', DonationHistory],
  ['/donor-notifications', DonorNotifications],

  ['/personnel-dashboard', PersonnelDashboard],
  ['/personnel-donors', ManageDonors],
  ['/personnel-inventory', BloodInventory],
  ['/personnel-requests', ManageBloodRequests],
  ['/personnel-appointments', DonationAppointments],
  ['/personnel-completed-donations', CompletedDonations],
  ['/personnel-notifications', PersonnelNotifications],

  ['/admin-dashboard', AdminDashboard],
  ['/admin-users', ManageUsers],
  ['/admin-feedback', AdminFeedback],
  ['/admin-notifications', AdminNotifications],
  ['/admin-reports', AdminReports],
  ['/hospital-dashboard', HospitalDashboard],
  ['/seeker-dashboard', SeekerDashboard],
  ['/request-blood', RequestBlood],
  ['/track-request', TrackRequest],
  ['/admin-hospitals', ManageHospitals],
  ['/hospital-personnel', HospitalPersonnel],
  ['/hospital-notifications', HospitalNotifications],
  ['/hospital-inventory', HospitalInventory],
  ['/hospital-requests', HospitalRequests],
  ['/hospital-details', HospitalDetails],
  ['/hospital-donors', HospitalDonors],
  ['/hospital-appointments', HospitalAppointments],
  ['/hospital-donations', HospitalDonations],
  ['/hospital-reports', HospitalReports],
  ['/seeker-notifications', SeekerNotifications],
];

const donorPages = new Set([
  '/donor-dashboard',
  '/donor-profile',
  '/donor-availability',
  '/schedule-donation',
  '/donation-history',
  '/donor-notifications',
]);

const seekerPages = new Set([
  '/seeker-dashboard',
  '/request-blood',
  '/track-request',
  '/seeker-notifications',
]);
const hospitalAdminPages = new Set([
  '/hospital-dashboard',
  '/hospital-details',
  '/hospital-personnel',
  '/hospital-donors',
  '/hospital-appointments',
  '/hospital-donations',
  '/hospital-inventory',
  '/hospital-requests',
  '/hospital-notifications',
  '/hospital-reports',
]);
const organisationAdminPages = new Set([
  '/admin-dashboard',
  '/admin-hospitals',
  '/admin-users',
  '/admin-notifications',
  '/admin-reports',
  '/admin-feedback',
]);

  const personnelPermissions = new Map([
  [
    '/personnel-donors',
    PERSONNEL_PERMISSIONS.DONORS,
  ],
  [
    '/personnel-appointments',
    PERSONNEL_PERMISSIONS.APPOINTMENTS,
  ],
  [
    '/personnel-completed-donations',
    PERSONNEL_PERMISSIONS.DONATIONS,
  ],
  [
    '/personnel-inventory',
    PERSONNEL_PERMISSIONS.INVENTORY,
  ],
  [
    '/personnel-requests',
    PERSONNEL_PERMISSIONS.REQUESTS,
  ],
  [
    '/personnel-notifications',
    PERSONNEL_PERMISSIONS.NOTIFICATIONS,
  ],
]);

function ProtectedRoute({ role, children }) {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    let active = true;

    getCurrentUser()
      .then((response) => {
        if (active) {
          setUser(response.data.user);
        }
      })
      .catch(() => {
        if (active) {
          setUser(null);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  if (user === undefined) {
    return <div>Loading...</div>;
  }

  if (!user || user.role !== role) {
    const loginPaths = {
      [ROLES.DONOR]: '/donor-login',
      [ROLES.SEEKER]: '/seeker-login',
      [ROLES.PERSONNEL]: '/personnel-login',
      [ROLES.HOSPITAL_ADMIN]: '/hospital-login',
      [ROLES.ORGANISATION_ADMIN]: '/admin-login',
    };

    return (
      <Navigate
        to={loginPaths[role] || '/login'}
        replace
      />
    );
  }

  return children;
}

function App() {
  const { pathname } = useLocation();
   
  const isDashboard = dashboardPages.some(
    ([path]) => pathname === path || pathname.startsWith(`${path}/`)
  );

  const isLoginPage = loginPages.some(
    ([path]) => pathname === path || pathname.startsWith(`${path}/`)
  );

  const showPublicLayout = !isDashboard && !isLoginPage;

  return (
    <>
      {showPublicLayout && <Navbar />}

      <Routes>
        {publicPages.map(([path, Page]) => (
          <Route key={path} path={path} element={<Page />} />
        ))}

        {loginPages.map(([path, role]) => (
          <Route
            key={path}
            path={path}
            element={<Login expectedRole={role} />}
          />
        ))}

        {dashboardPages.map(([path, Page]) => {
            const role = donorPages.has(path)
             ? ROLES.DONOR
             : seekerPages.has(path)    
             ? ROLES.SEEKER
             : hospitalAdminPages.has(path)
             ? ROLES.HOSPITAL_ADMIN
             : organisationAdminPages.has(path)
             ? ROLES.ORGANISATION_ADMIN
             : null;
          const page = role
            ? <ProtectedRoute role={role}><Page /></ProtectedRoute>
            : path.startsWith('/personnel-')
              ? <PersonnelRouteGuard permission={personnelPermissions.get(path)}><Page /></PersonnelRouteGuard>
              : <Page />;
          return (
            <Route
              key={path}
              path={path}
              element={page}
            />
          );
        })}

        <Route path="*" element={<NotFound />} />
      </Routes>

      {showPublicLayout && <Footer />}
    </>
  );
}

export default App;
