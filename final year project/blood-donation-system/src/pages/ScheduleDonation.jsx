import {
  useEffect,
  useState,
} from 'react';

import DonorSidebar from '../components/DonorSidebar';
import DonorHospitalStatus from '../components/DonorHospitalStatus';

import {
  getDonorProfile,
} from '../services/donorApi';

import {
  getMyAppointments,
  bookDonationAppointment,
  cancelMyAppointment,
} from '../services/appointmentApi';

import '../styles/donorDashboard.css';
import '../styles/newPages.css';


function localToday() {
  const now = new Date();

  return [
    now.getFullYear(),
    String(
      now.getMonth() + 1
    ).padStart(2, '0'),
    String(
      now.getDate()
    ).padStart(2, '0'),
  ].join('-');
}


function ScheduleDonation() {
  const [donor, setDonor] =
    useState(null);

  const [appointments, setAppointments] =
    useState([]);

  const [date, setDate] =
    useState('');

  const [time, setTime] =
    useState('');

  const [note, setNote] =
    useState('');

  const [
    deliveryChannel,
    setDeliveryChannel,
  ] = useState('Both');

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState('');


  useEffect(() => {
    loadPage();
  }, []);


  async function loadPage() {
    try {
      setLoading(true);
      setMessage('');

      const [
        profileResponse,
        appointmentsResponse,
      ] = await Promise.all([
        getDonorProfile(),
        getMyAppointments(),
      ]);

      setDonor(
        profileResponse.data.donor
      );

      setAppointments(
        appointmentsResponse.data
          .appointments || []
      );
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }


  async function handleSubmit(event) {
    event.preventDefault();

    if (saving) {
      return;
    }

    try {
      setSaving(true);
      setMessage('');

      await bookDonationAppointment({
        appointment_date: date,
        appointment_time: time,
        note,
        delivery_channel:
          deliveryChannel,
      });

      setDate('');
      setTime('');
      setNote('');

      await loadPage();

      setMessage(
        'Appointment booked successfully.'
      );
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  }


  async function cancelAppointment(
    appointment
  ) {
    const confirmed =
      window.confirm(
        `Cancel your appointment on ${appointment.appointment_date} at ${appointment.appointment_time}?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setSaving(true);
      setMessage('');

      await cancelMyAppointment(
        appointment.id
      );

      await loadPage();

      setMessage(
        'Appointment cancelled successfully.'
      );
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  }


  const canBook =
    donor?.hospital_status ===
    'Approved';


  return (
    <main className="donor-dashboard">
      <DonorSidebar />

      <section className="donor-main">
        <h1>
          Book a Donation Appointment
        </h1>

        <p>
          Appointments are available
          between 7:00 AM and 10:00 PM.
        </p>

        {message && (
          <p
            className="application-message"
            role="status"
          >
            {message}
          </p>
        )}

        {loading ? (
          <p>Loading appointments...</p>
        ) : !donor ? (
          <p>
            Donor profile unavailable.
          </p>
        ) : (
          <>
            <DonorHospitalStatus
              status={
                donor.hospital_status
              }
            />

            <section className="workspace-panel">
              <p>
                Donor:{' '}
                <strong>
                  {donor.full_name}
                </strong>
              </p>

              <p>
                Registered Hospital:{' '}
                <strong>
                  {donor.hospital_name}
                </strong>
              </p>

              <p>
                Blood Group:{' '}
                <strong>
                  {donor.blood_group}
                </strong>
              </p>

              <form onSubmit={handleSubmit}>
                <fieldset
                  disabled={
                    !canBook || saving
                  }
                >
                  <div className="application-grid">
                    <label className="application-field">
                      Appointment Date

                      <input
                        type="date"
                        min={localToday()}
                        value={date}
                        onChange={(event) =>
                          setDate(
                            event.target.value
                          )
                        }
                        required
                      />
                    </label>

                    <label className="application-field">
                      Appointment Time

                      <input
                        type="time"
                        min="07:00"
                        max="22:00"
                        step="60"
                        value={time}
                        onChange={(event) =>
                          setTime(
                            event.target.value
                          )
                        }
                        required
                      />

                      <small>
                        Select a time from
                        07:00 to 22:00.
                      </small>
                    </label>

                    <label className="application-field">
                      Notification Channel

                      <select
                        value={
                          deliveryChannel
                        }
                        onChange={(event) =>
                          setDeliveryChannel(
                            event.target.value
                          )
                        }
                      >
                        <option value="Email">
                          Email
                        </option>

                        <option value="SMS">
                          SMS
                        </option>

                        <option value="Both">
                          Email & SMS
                        </option>
                      </select>
                    </label>
                  </div>

                  <label className="application-field">
                    Additional Note

                    <textarea
                      rows={3}
                      value={note}
                      onChange={(event) =>
                        setNote(
                          event.target.value
                        )
                      }
                    />
                  </label>

                  <button
                    className="application-button"
                    type="submit"
                  >
                    {saving
                      ? 'Booking...'
                      : 'Book Appointment'}
                  </button>
                </fieldset>
              </form>

              {!canBook && (
                <p
                  className="application-message"
                  role="alert"
                >
                  New appointments are
                  unavailable while your
                  registered hospital is
                  not approved.
                </p>
              )}
            </section>

            <section className="workspace-panel management-section">
              <h2>My Appointments</h2>

              {appointments.length === 0 ? (
                <p className="workspace-empty">
                  No appointments booked
                  yet.
                </p>
              ) : (
                <div className="management-table-wrapper">
                  <table className="management-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Time</th>
                        <th>Hospital</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>

                    <tbody>
                      {appointments.map(
                        (appointment) => {
                          const appointmentTime =
                            new Date(
                              `${appointment.appointment_date}T${appointment.appointment_time}`
                            );

                          const future =
                            !Number.isNaN(
                              appointmentTime.getTime()
                            ) &&
                            appointmentTime >
                              new Date();

                          const canCancel =
                            appointment.status ===
                              'Scheduled' &&
                            future;

                          return (
                            <tr
                              key={
                                appointment.id
                              }
                            >
                              <td>
                                {
                                  appointment.appointment_date
                                }
                              </td>

                              <td>
                                {
                                  appointment.appointment_time
                                }
                              </td>

                              <td>
                                {
                                  appointment.hospital_name
                                }
                              </td>

                              <td>
                                <span
                                  className={`status-badge status-badge--${appointment.status
                                    .toLowerCase()
                                    .replaceAll(
                                      ' ',
                                      '-'
                                    )}`}
                                >
                                  {
                                    appointment.status
                                  }
                                </span>
                              </td>

                              <td>
                                {canCancel ? (
                                  <button
                                    className="secondary-button"
                                    type="button"
                                    disabled={
                                      saving
                                    }
                                    onClick={() =>
                                      cancelAppointment(
                                        appointment
                                      )
                                    }
                                  >
                                    Cancel Appointment
                                  </button>
                                ) : (
                                  'No action available'
                                )}
                              </td>
                            </tr>
                          );
                        }
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </section>
    </main>
  );
}

export default ScheduleDonation;