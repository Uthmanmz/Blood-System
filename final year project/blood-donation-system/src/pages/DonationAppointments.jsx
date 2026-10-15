import { useEffect, useMemo, useState } from 'react';

import PersonnelSidebar from '../components/PersonnelSideBar';

import {
  getHospitalAppointments,
  completeHospitalAppointment,
  cancelHospitalAppointment,
} from '../services/appointmentApi';

import '../styles/personnelDashboard.css';
import '../styles/newPages.css';

function DonationAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState(null);

  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    loadAppointments();
  }, []);

  async function loadAppointments() {
    try {
      setLoading(true);
      setMessage('');

      const response =
        await getHospitalAppointments();

      setAppointments(
        response.data.appointments || []
      );
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  const filteredAppointments = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    return appointments.filter((appointment) => {
      const matchesSearch =
        !query ||
        [
          appointment.donor_name,
          appointment.donor_email,
          appointment.donor_phone,
          appointment.blood_group,
          appointment.genotype,
        ]
          .join(' ')
          .toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === 'All' ||
        appointment.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [
    appointments,
    search,
    statusFilter,
  ]);

  async function handleComplete(appointment) {
    const confirmed = window.confirm(
      `Mark ${appointment.donor_name}'s appointment as completed?\n\nThis confirms the appointment attendance only. The donation record will be handled separately.`
    );

    if (!confirmed) return;

    try {
      setWorkingId(appointment.id);
      setMessage('');

      await completeHospitalAppointment(
        appointment.id
      );

      setMessage(
        'Appointment completed successfully.'
      );

      await loadAppointments();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setWorkingId(null);
    }
  }

  async function handleCancel(appointment) {
    const confirmed = window.confirm(
      `Cancel the appointment for ${appointment.donor_name}?`
    );

    if (!confirmed) return;

    try {
      setWorkingId(appointment.id);
      setMessage('');

      await cancelHospitalAppointment(
        appointment.id
      );

      setMessage(
        'Appointment cancelled successfully.'
      );

      await loadAppointments();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setWorkingId(null);
    }
  }

  return (
    <main className="personnel-layout">
      <PersonnelSidebar />

      <section className="personnel-main">
        <h1>Donation Appointments</h1>

        <p>
          Manage donation appointments for your
          hospital.
        </p>

        {message && (
          <p
            className="application-message"
            role="status"
          >
            {message}
          </p>
        )}

        <div className="management-filters">
          <input
            aria-label="Search appointments"
            placeholder="Search donor, phone, email or blood group"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value
              )
            }
          >
            <option value="All">
              All Statuses
            </option>

            <option value="Scheduled">
              Scheduled
            </option>

            <option value="Completed">
              Completed
            </option>

            <option value="Cancelled">
              Cancelled
            </option>
          </select>
        </div>

        <section className="workspace-panel">
          {loading ? (
            <p>Loading appointments...</p>
          ) : filteredAppointments.length === 0 ? (
            <p className="workspace-empty">
              No matching appointments found.
            </p>
          ) : (
            <div className="management-table-wrapper">
              <table className="management-table">
                <thead>
                  <tr>
                    <th>Donor</th>
                    <th>Blood</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Contact</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredAppointments.map(
                    (appointment) => (
                      <tr key={appointment.id}>
                        <td>
                          <strong>
                            {appointment.donor_name}
                          </strong>

                          <br />

                          <small>
                            {appointment.genotype}
                          </small>
                        </td>

                        <td>
                          {appointment.blood_group}
                        </td>

                        <td>
                          {appointment.appointment_date}
                        </td>

                        <td>
                          {appointment.appointment_time}
                        </td>

                        <td>
                          {appointment.donor_phone}

                          <br />

                          <small>
                            {appointment.donor_email}
                          </small>
                        </td>

                        <td>
                          <span
                            className={`status-badge status-badge--${appointment.status
                              .toLowerCase()
                              .replaceAll(' ', '-')}`}
                          >
                            {appointment.status}
                          </span>
                        </td>

                        <td>
                          {appointment.status ===
                          'Scheduled' ? (
                            <div className="management-actions">
                              <button
                                type="button"
                                className="application-button"
                                disabled={
                                  workingId ===
                                  appointment.id
                                }
                                onClick={() =>
                                  handleComplete(
                                    appointment
                                  )
                                }
                              >
                                {workingId ===
                                appointment.id
                                  ? 'Processing...'
                                  : 'Mark Completed'}
                              </button>

                              <button
                                type="button"
                                className="secondary-button"
                                disabled={
                                  workingId ===
                                  appointment.id
                                }
                                onClick={() =>
                                  handleCancel(
                                    appointment
                                  )
                                }
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <span>
                              No pending action
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

export default DonationAppointments;