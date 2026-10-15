import {
  useEffect,
  useState,
} from 'react';

import {
  NavLink,
} from 'react-router';

import {
  Bell,
  CalendarCheck,
  CalendarPlus,
  History,
  LayoutDashboard,
  User,
} from 'lucide-react';

import {
  getDonorProfile,
} from '../services/donorApi';

import LogoutButton from './LogoutButton';

import '../styles/donorDashboard.css';


function DonorSidebar() {
  const [hospitalName, setHospitalName] =
    useState('Hospital Portal');


  useEffect(() => {
    loadHospital();
  }, []);


  async function loadHospital() {
    try {
      const response =
        await getDonorProfile();

      const name =
        response.data?.donor
          ?.hospital_name;

      if (name) {
        setHospitalName(name);
      }
    } catch {
      setHospitalName(
        'Hospital Portal'
      );
    }
  }


  return (
    <aside className="donor-sidebar">
      <div className="sidebar-title">
        <h2>{hospitalName}</h2>

        <p>Donor Portal</p>
      </div>

      <nav className="sidebar-menu">
        <NavLink to="/donor-dashboard">
          <LayoutDashboard
            size={18}
            aria-hidden="true"
          />
          <span>Dashboard</span>
        </NavLink>

        <NavLink to="/donor-profile">
          <User size={18} aria-hidden="true" />
          <span>My Profile</span>
        </NavLink>

        <NavLink to="/donor-availability">
          <CalendarCheck
            size={18}
            aria-hidden="true"
          />
          <span>Availability</span>
        </NavLink>

        <NavLink to="/schedule-donation">
          <CalendarPlus
            size={18}
            aria-hidden="true"
          />
          <span>Schedule Donation</span>
        </NavLink>

        <NavLink to="/donation-history">
          <History size={18} aria-hidden="true" />
          <span>Donation History</span>
        </NavLink>

        <NavLink to="/donor-notifications">
          <Bell size={18} aria-hidden="true" />
          <span>Notifications</span>
        </NavLink>
      </nav>

      <LogoutButton
        className="donor-logout-btn"
      />
    </aside>
  );
}

export default DonorSidebar;
