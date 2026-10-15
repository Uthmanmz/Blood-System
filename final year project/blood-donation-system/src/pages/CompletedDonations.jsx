import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import PersonnelSidebar from '../components/PersonnelSideBar';

import {
  getHospitalDonors,
} from '../services/donorApi';

import {
  getHospitalAppointments,
} from '../services/appointmentApi';

import {
  getHospitalDonations,
  recordDonationFromAppointment,
  recordManualDonation,
} from '../services/donationApi';

import '../styles/personnelDashboard.css';
import '../styles/newPages.css';


function CompletedDonations() {
  const [donors, setDonors] = useState([]);
  const [appointments, setAppointments] =
    useState([]);
  const [donations, setDonations] =
    useState([]);

  const [loading, setLoading] =
    useState(true);
  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState('');

  const [manualDonorId, setManualDonorId] =
    useState('');

  const [manualNotes, setManualNotes] =
    useState('');

  const [
    appointmentId,
    setAppointmentId,
  ] = useState('');

  const [
    appointmentNotes,
    setAppointmentNotes,
  ] = useState('');

  const [search, setSearch] =
    useState('');


  useEffect(() => {
    loadData();
  }, []);


  async function loadData() {
    try {
      setLoading(true);

      const [
        donorResponse,
        appointmentResponse,
        donationResponse,
      ] = await Promise.all([
        getHospitalDonors(),
        getHospitalAppointments(),
        getHospitalDonations(),
      ]);

      setDonors(
        donorResponse.data.donors || []
      );

      setAppointments(
        appointmentResponse.data
          .appointments || []
      );

      setDonations(
        donationResponse.data.donations || []
      );
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }


  const availableCompletedAppointments =
    useMemo(() => {
      const alreadyRecorded =
        new Set(
          donations
            .filter(
              (donation) =>
                donation.appointment_id
            )
            .map(
              (donation) =>
                Number(
                  donation.appointment_id
                )
            )
        );

      return appointments.filter(
        (appointment) =>
          appointment.status ===
            'Completed' &&
          !alreadyRecorded.has(
            Number(appointment.id)
          )
      );
    }, [
      appointments,
      donations,
    ]);


  const filteredDonations =
    useMemo(() => {
      const query = search
        .trim()
        .toLowerCase();

      if (!query) {
        return donations;
      }

      return donations.filter(
        (donation) =>
          [
            donation.donor_name,
            donation.donor_email,
            donation.donor_phone,
            donation.blood_group,
            donation.donation_reference,
            donation.unit_code,
            donation.entry_method,
            donation.status,
            donation.blood_unit_status,
          ]
            .join(' ')
            .toLowerCase()
            .includes(query)
      );
    }, [
      donations,
      search,
    ]);


  async function handleAppointmentDonation(
    event
  ) {
    event.preventDefault();

    if (!appointmentId) {
      setMessage(
        'Select a completed appointment.'
      );
      return;
    }

    try {
      setSaving(true);
      setMessage('');

      const response =
        await recordDonationFromAppointment(
          Number(appointmentId),
          appointmentNotes
        );

      setMessage(
        `${response.message}. Blood unit ${response.data.unit_code} is awaiting screening.`
      );

      setAppointmentId('');
      setAppointmentNotes('');

      await loadData();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  }


  async function handleManualDonation(
    event
  ) {
    event.preventDefault();

    if (!manualDonorId) {
      setMessage(
        'Select a donor.'
      );
      return;
    }

    const confirmed =
      window.confirm(
        'Confirm that this donor has successfully donated blood? A new blood unit will be created in Awaiting Screening status.'
      );

    if (!confirmed) {
      return;
    }

    try {
      setSaving(true);
      setMessage('');

      const response =
        await recordManualDonation(
          Number(manualDonorId),
          manualNotes
        );

      setMessage(
        `${response.message}. Blood unit ${response.data.unit_code} is awaiting screening.`
      );

      setManualDonorId('');
      setManualNotes('');

      await loadData();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  }


  return (
    <main className="personnel-layout">
      <PersonnelSidebar />

      <section className="personnel-main">
        <h1>Completed Donations</h1>

        <p>
          Record successful donations and
          review completed donation records
          for your hospital.
        </p>

        {message && (
          <p
            className="application-message"
            role="status"
          >
            {message}
          </p>
        )}


        <section className="workspace-panel">
          <h2>
            Record From Completed Appointment
          </h2>

          <p>
            Only completed appointments that
            do not already have a donation
            record are shown.
          </p>

          <form
            className="management-form"
            onSubmit={
              handleAppointmentDonation
            }
          >
            <label>
              Completed Appointment

              <select
                value={appointmentId}
                onChange={(event) =>
                  setAppointmentId(
                    event.target.value
                  )
                }
                required
              >
                <option value="">
                  Select appointment
                </option>

                {availableCompletedAppointments.map(
                  (appointment) => (
                    <option
                      key={appointment.id}
                      value={appointment.id}
                    >
                      {
                        appointment.donor_name
                      }
                      {' - '}
                      {
                        appointment.blood_group
                      }
                      {' - '}
                      {
                        appointment.appointment_date
                      }
                      {' '}
                      {
                        appointment.appointment_time
                      }
                    </option>
                  )
                )}
              </select>
            </label>

            <label>
              Notes

              <textarea
                value={
                  appointmentNotes
                }
                onChange={(event) =>
                  setAppointmentNotes(
                    event.target.value
                  )
                }
                placeholder="Optional donation notes"
              />
            </label>

            <button
              type="submit"
              className="application-button"
              disabled={
                saving ||
                availableCompletedAppointments
                  .length === 0
              }
            >
              {saving
                ? 'Recording...'
                : 'Record Donation'}
            </button>
          </form>

          {availableCompletedAppointments
            .length === 0 && (
            <p className="workspace-empty">
              No completed appointments are
              waiting for donation recording.
            </p>
          )}
        </section>


        <section className="workspace-panel management-section">
          <h2>
            Record Manual Donation
          </h2>

          <p>
            Use this when a completed
            donation was not linked to an
            appointment.
          </p>

          <form
            className="management-form"
            onSubmit={
              handleManualDonation
            }
          >
            <label>
              Hospital Donor

              <select
                value={manualDonorId}
                onChange={(event) =>
                  setManualDonorId(
                    event.target.value
                  )
                }
                required
              >
                <option value="">
                  Select donor
                </option>

                {donors.map(
                  (donor) => (
                    <option
                      key={
                        donor.donor_id
                      }
                      value={
                        donor.donor_id
                      }
                    >
                      {
                        donor.full_name
                      }
                      {' - '}
                      {
                        donor.blood_group
                      }
                    </option>
                  )
                )}
              </select>
            </label>

            <label>
              Notes

              <textarea
                value={manualNotes}
                onChange={(event) =>
                  setManualNotes(
                    event.target.value
                  )
                }
                placeholder="Optional donation notes"
              />
            </label>

            <button
              type="submit"
              className="application-button"
              disabled={
                saving ||
                donors.length === 0
              }
            >
              {saving
                ? 'Recording...'
                : 'Record Manual Donation'}
            </button>
          </form>
        </section>


        <section className="workspace-panel management-section">
          <div className="management-heading">
            <div>
              <h2>
                Donation Records
              </h2>

              <p>
                Total: {donations.length}
              </p>
            </div>

            <div className="management-filters">
              <input
                aria-label="Search donations"
                placeholder="Search donor, reference, unit or blood group"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
              />
            </div>
          </div>


          {loading ? (
            <p>
              Loading donations...
            </p>
          ) : filteredDonations.length ===
            0 ? (
            <p className="workspace-empty">
              No donation records found.
            </p>
          ) : (
            <div className="management-table-wrapper">
              <table className="management-table">
                <thead>
                  <tr>
                    <th>
                      Reference
                    </th>

                    <th>
                      Donor
                    </th>

                    <th>
                      Blood
                    </th>

                    <th>
                      Date
                    </th>

                    <th>
                      Entry Method
                    </th>

                    <th>
                      Donation
                    </th>

                    <th>
                      Blood Unit
                    </th>

                    <th>
                      Expiry
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredDonations.map(
                    (donation) => (
                      <tr
                        key={
                          donation.id
                        }
                      >
                        <td>
                          {
                            donation.donation_reference
                          }
                        </td>

                        <td>
                          <strong>
                            {
                              donation.donor_name
                            }
                          </strong>

                          <br />

                          <small>
                            {
                              donation.donor_phone
                            }
                          </small>
                        </td>

                        <td>
                          {
                            donation.blood_group
                          }
                        </td>

                        <td>
                          {
                            donation.donation_date
                          }
                        </td>

                        <td>
                          {
                            donation.entry_method
                          }
                        </td>

                        <td>
                          <span className="status-badge">
                            {
                              donation.status
                            }
                          </span>
                        </td>

                        <td>
                          {
                            donation.unit_code ||
                            '-'
                          }

                          <br />

                          <small>
                            {
                              donation.blood_unit_status ||
                              '-'
                            }
                          </small>
                        </td>

                        <td>
                          {
                            donation.expiry_date ||
                            '-'
                          }
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

export default CompletedDonations;