import {
  useEffect,
  useState,
} from 'react';

import { Link } from 'react-router';

import DonorSidebar from '../components/DonorSidebar';
import DonorHospitalStatus from '../components/DonorHospitalStatus';

import {
  getDonorProfile,
  getDonorDonationHistory,
} from '../services/donorApi';

import {
  getMyAppointments,
} from '../services/appointmentApi';

import '../styles/donorDashboard.css';
import '../styles/newPages.css';


function DonorDashboard() {
  const [donor, setDonor] =
    useState(null);

  const [donationCount, setDonationCount] =
    useState(0);

  const [appointments, setAppointments] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [message, setMessage] =
    useState('');


  useEffect(() => {
    loadDashboard();
  }, []);


  async function loadDashboard() {
    try {
      setLoading(true);
      setMessage('');

      const [
        profileResponse,
        donationResponse,
        appointmentResponse,
      ] = await Promise.all([
        getDonorProfile(),
        getDonorDonationHistory(),
        getMyAppointments(),
      ]);

      setDonor(
        profileResponse.data.donor
      );

      setDonationCount(
        Number(
          donationResponse.data
            .total_donations || 0
        )
      );

      setAppointments(
        appointmentResponse.data
          .appointments || []
      );
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }


  const nextAppointment =
    appointments
      .filter((appointment) => {
        if (
          appointment.status !==
          'Scheduled'
        ) {
          return false;
        }

        const dateTime = new Date(
          `${appointment.appointment_date}T${appointment.appointment_time}`
        );

        return (
          !Number.isNaN(
            dateTime.getTime()
          ) &&
          dateTime > new Date()
        );
      })
      .sort((a, b) => {
        const first =
          `${a.appointment_date}T${a.appointment_time}`;

        const second =
          `${b.appointment_date}T${b.appointment_time}`;

        return first.localeCompare(
          second
        );
      })[0];


  return (
    <main className="donor-dashboard">
      <DonorSidebar />

      <section className="donor-main">
        {loading ? (
          <p>Loading donor dashboard...</p>
        ) : message ? (
          <p
            className="application-message"
            role="alert"
          >
            {message}
          </p>
        ) : donor ? (
          <>
            <h1>
              Welcome, {donor.full_name}
            </h1>

            <p>
              {donor.hospital_name}
            </p>

            <DonorHospitalStatus
              status={
                donor.hospital_status
              }
            />

            <div className="workspace-grid">
              <article className="workspace-card">
                <p>Blood Group</p>

                <strong>
                  {donor.blood_group}
                </strong>
              </article>

              <article className="workspace-card">
                <p>Genotype</p>

                <strong>
                  {donor.genotype}
                </strong>
              </article>

              <article className="workspace-card">
                <p>
                  Completed Donations
                </p>

                <strong>
                  {donationCount}
                </strong>
              </article>

              <article className="workspace-card">
                <p>Availability</p>

                <strong>
                  {donor.available_for_donation
                    ? 'Available'
                    : 'Not Available'}
                </strong>
              </article>
            </div>

            <section className="workspace-panel">
              <h2>
                Next Scheduled Appointment
              </h2>

              <p>
                {nextAppointment
                  ? `${nextAppointment.appointment_date} at ${nextAppointment.appointment_time}`
                  : 'No upcoming appointment.'}
              </p>

              <div className="management-actions">
                <Link
                  className="application-button"
                  to="/schedule-donation"
                >
                  Book an Appointment
                </Link>

                <Link
                  className="application-button"
                  to="/donation-history"
                >
                  View Donation History
                </Link>

                <Link
                  className="secondary-button"
                  to="/donor-notifications"
                >
                  Notifications
                </Link>
              </div>
            </section>
          </>
        ) : (
          <p>
            Donor profile unavailable.
          </p>
        )}
      </section>
    </main>
  );
}

export default DonorDashboard;