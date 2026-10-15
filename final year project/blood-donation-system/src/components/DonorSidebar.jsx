import {
  useEffect,
  useState,
} from 'react';

import {
  NavLink,
} from 'react-router';

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
          Dashboard
        </NavLink>

        <NavLink to="/donor-profile">
          My Profile
        </NavLink>

        <NavLink to="/donor-availability">
          Availability
        </NavLink>

        <NavLink to="/schedule-donation">
          Schedule Donation
        </NavLink>

        <NavLink to="/donation-history">
          Donation History
        </NavLink>

        <NavLink to="/donor-notifications">
          Notifications
        </NavLink>
      </nav>

      <LogoutButton
        className="donor-logout-btn"
      />
    </aside>
  );
}

export default DonorSidebar;