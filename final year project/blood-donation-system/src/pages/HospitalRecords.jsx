import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import HospitalAdminNav
  from '../components/HospitalAdminNav';

import {
  getHospitalDonors,
} from '../services/donorApi';

import {
  getHospitalAppointments,
} from '../services/appointmentApi';

import {
  getHospitalDonations,
} from '../services/donationApi';

import '../styles/newPages.css';


function HospitalFrame({
  title,
  description,
  children,
}) {
  return (
    <main className="workspace-page">

      <header className="workspace-header">
        <div>
          <span className="workspace-label">
            HOSPITAL ADMINISTRATION
          </span>

          <h1>{title}</h1>

          {description && (
            <p>{description}</p>
          )}
        </div>
      </header>

      <HospitalAdminNav />

      <section className="workspace-content">
        {children}
      </section>

    </main>
  );
}


export function HospitalDonors() {
  const [donors, setDonors] =
    useState([]);

  const [donations, setDonations] =
    useState([]);

  const [search, setSearch] =
    useState('');

  const [selectedDonor, setSelectedDonor] =
    useState(null);

  const [showHistory, setShowHistory] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [message, setMessage] =
    useState('');


  useEffect(() => {
    loadPage();
  }, []);


  async function loadPage() {
    try {
      setLoading(true);

      const [
        donorResponse,
        donationResponse,
      ] = await Promise.all([
        getHospitalDonors(),
        getHospitalDonations(),
      ]);

      setDonors(
        donorResponse.data.donors || []
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


  const filteredDonors =
    useMemo(() => {
      const query = search
        .trim()
        .toLowerCase();

      return donors.filter(
        (donor) =>
          !query ||
          [
            donor.full_name,
            donor.email,
            donor.phone,
            donor.blood_group,
            donor.genotype,
          ]
            .join(' ')
            .toLowerCase()
            .includes(query)
      );
    }, [donors, search]);


  const donorHistory =
    showHistory
      ? donations.filter(
          (donation) =>
            Number(
              donation.donor_id
            ) ===
            Number(
              showHistory.donor_id
            )
        )
      : [];


  return (
    <HospitalFrame
      title="Hospital Donors"
      description="Monitor donors registered with your hospital."
    >

      {message && (
        <p className="application-message">
          {message}
        </p>
      )}


      <section className="workspace-panel">

        <div className="management-heading">
          <div>
            <h2>
              Registered Donors
            </h2>

            <p>
              Total: {donors.length}
            </p>
          </div>

          <div className="management-filters">
            <input
              placeholder="Search donor"
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
          <p>Loading donors...</p>
        ) : filteredDonors.length === 0 ? (
          <p className="workspace-empty">
            No matching donors found.
          </p>
        ) : (
          <div className="management-table-wrapper">

            <table className="management-table">

              <thead>
                <tr>
                  <th>Name</th>
                  <th>Blood</th>
                  <th>Genotype</th>
                  <th>Contact</th>
                  <th>Availability</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredDonors.map(
                  (donor) => (
                    <tr
                      key={
                        donor.donor_id
                      }
                    >
                      <td>
                        <strong>
                          {
                            donor.full_name
                          }
                        </strong>
                      </td>

                      <td>
                        {
                          donor.blood_group
                        }
                      </td>

                      <td>
                        {
                          donor.genotype
                        }
                      </td>

                      <td>
                        {donor.email}

                        <br />

                        <small>
                          {donor.phone}
                        </small>
                      </td>

                      <td>
                        {Number(
                          donor.available_for_donation
                        ) === 1
                          ? 'Available'
                          : 'Not Available'}
                      </td>

                      <td>
                        <span className="status-badge">
                          {
                            donor.account_status
                          }
                        </span>
                      </td>

                      <td>
                        <div className="management-actions">

                          <button
                            type="button"
                            className="secondary-button"
                            onClick={() => {
                              setSelectedDonor(
                                donor
                              );

                              setShowHistory(
                                null
                              );
                            }}
                          >
                            View
                          </button>

                          <button
                            type="button"
                            className="secondary-button"
                            onClick={() => {
                              setShowHistory(
                                donor
                              );

                              setSelectedDonor(
                                null
                              );
                            }}
                          >
                            History
                          </button>

                        </div>
                      </td>
                    </tr>
                  )
                )}
              </tbody>

            </table>

          </div>
        )}

      </section>


      {selectedDonor && (
        <section className="workspace-panel management-section">

          <div className="management-heading">
            <h2>
              {selectedDonor.full_name}
            </h2>

            <button
              type="button"
              className="secondary-button"
              onClick={() =>
                setSelectedDonor(null)
              }
            >
              Close
            </button>
          </div>


          <div className="detail-grid">

            <p>
              <strong>Email</strong>
              <br />
              {selectedDonor.email}
            </p>

            <p>
              <strong>Phone</strong>
              <br />
              {selectedDonor.phone}
            </p>

            <p>
              <strong>Gender</strong>
              <br />
              {selectedDonor.gender}
            </p>

            <p>
              <strong>Date of Birth</strong>
              <br />
              {
                selectedDonor.date_of_birth
              }
            </p>

            <p>
              <strong>Blood Group</strong>
              <br />
              {
                selectedDonor.blood_group
              }
            </p>

            <p>
              <strong>Genotype</strong>
              <br />
              {selectedDonor.genotype}
            </p>

            <p>
              <strong>Address</strong>
              <br />
              {selectedDonor.address}
            </p>

            <p>
              <strong>
                Donation Availability
              </strong>
              <br />

              {Number(
                selectedDonor
                  .available_for_donation
              ) === 1
                ? 'Available'
                : 'Not Available'}
            </p>

          </div>

        </section>
      )}


      {showHistory && (
        <section className="workspace-panel management-section">

          <div className="management-heading">

            <div>
              <h2>
                Donation History
              </h2>

              <p>
                {showHistory.full_name}
              </p>
            </div>

            <button
              type="button"
              className="secondary-button"
              onClick={() =>
                setShowHistory(null)
              }
            >
              Close
            </button>

          </div>


          {donorHistory.length === 0 ? (
            <p className="workspace-empty">
              No donations recorded.
            </p>
          ) : (
            <div className="management-table-wrapper">

              <table className="management-table">

                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Date</th>
                    <th>Blood</th>
                    <th>Method</th>
                    <th>Status</th>
                    <th>Blood Unit</th>
                  </tr>
                </thead>

                <tbody>
                  {donorHistory.map(
                    (donation) => (
                      <tr
                        key={
                          donation.id
                        }
                      >
                        <td>
                          {
                            donation
                              .donation_reference
                          }
                        </td>

                        <td>
                          {
                            donation
                              .donation_date
                          }
                        </td>

                        <td>
                          {
                            donation
                              .blood_group
                          }
                        </td>

                        <td>
                          {
                            donation
                              .entry_method
                          }
                        </td>

                        <td>
                          {
                            donation.status
                          }
                        </td>

                        <td>
                          {
                            donation.unit_code ||
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
      )}

    </HospitalFrame>
  );
}



function HospitalMonitoringRecords({
  type,
}) {
  const [records, setRecords] =
    useState([]);

  const [search, setSearch] =
    useState('');

  const [status, setStatus] =
    useState('All');

  const [loading, setLoading] =
    useState(true);

  const [message, setMessage] =
    useState('');


  const appointments =
    type === 'appointments';


  useEffect(() => {
    loadRecords();
  }, []);


  async function loadRecords() {
    try {
      setLoading(true);

      const response =
        appointments
          ? await getHospitalAppointments()
          : await getHospitalDonations();

      setRecords(
        appointments
          ? response.data
              .appointments || []
          : response.data
              .donations || []
      );
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }


  const filtered =
    useMemo(() => {
      const query = search
        .trim()
        .toLowerCase();

      return records.filter(
        (record) => {
          const matchesSearch =
            !query ||
            [
              record.donor_name,
              record.donor_email,
              record.donor_phone,
              record.blood_group,
              record.donation_reference,
              record.unit_code,
            ]
              .join(' ')
              .toLowerCase()
              .includes(query);

          const matchesStatus =
            status === 'All' ||
            record.status === status;

          return (
            matchesSearch &&
            matchesStatus
          );
        }
      );
    }, [
      records,
      search,
      status,
    ]);


  return (
    <HospitalFrame
      title={
        appointments
          ? 'Donation Appointments'
          : 'Completed Donations'
      }
      description="Hospital monitoring view."
    >

      {message && (
        <p className="application-message">
          {message}
        </p>
      )}


      <section className="workspace-panel">

        <div className="management-heading">

          <div>
            <h2>
              {appointments
                ? 'Appointments'
                : 'Donation Records'}
            </h2>

            <p>
              Total: {records.length}
            </p>
          </div>


          <div className="management-filters">

            <input
              placeholder="Search records"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
            />

            <select
              value={status}
              onChange={(event) =>
                setStatus(
                  event.target.value
                )
              }
            >
              <option value="All">
                All Statuses
              </option>

              {appointments ? (
                <>
                  <option value="Scheduled">
                    Scheduled
                  </option>

                  <option value="Completed">
                    Completed
                  </option>

                  <option value="Cancelled">
                    Cancelled
                  </option>
                </>
              ) : (
                <option value="Completed">
                  Completed
                </option>
              )}
            </select>

          </div>
        </div>


        {loading ? (
          <p>Loading records...</p>
        ) : filtered.length === 0 ? (
          <p className="workspace-empty">
            No matching records found.
          </p>
        ) : (
          <div className="management-table-wrapper">

            <table className="management-table">

              <thead>
                {appointments ? (
                  <tr>
                    <th>Donor</th>
                    <th>Blood</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Contact</th>
                    <th>Status</th>
                    <th>Note</th>
                  </tr>
                ) : (
                  <tr>
                    <th>Reference</th>
                    <th>Donor</th>
                    <th>Blood</th>
                    <th>Date</th>
                    <th>Method</th>
                    <th>Unit</th>
                    <th>Unit Status</th>
                    <th>Status</th>
                  </tr>
                )}
              </thead>


              <tbody>

                {filtered.map(
                  (record) =>
                    appointments ? (
                      <tr key={record.id}>

                        <td>
                          {
                            record.donor_name
                          }
                        </td>

                        <td>
                          {
                            record.blood_group
                          }
                        </td>

                        <td>
                          {
                            record
                              .appointment_date
                          }
                        </td>

                        <td>
                          {
                            record
                              .appointment_time
                          }
                        </td>

                        <td>
                          {
                            record.donor_phone
                          }

                          <br />

                          <small>
                            {
                              record.donor_email
                            }
                          </small>
                        </td>

                        <td>
                          <span className="status-badge">
                            {record.status}
                          </span>
                        </td>

                        <td>
                          {
                            record.note ||
                            '-'
                          }
                        </td>

                      </tr>
                    ) : (
                      <tr key={record.id}>

                        <td>
                          <strong>
                            {
                              record
                                .donation_reference
                            }
                          </strong>
                        </td>

                        <td>
                          {
                            record.donor_name
                          }
                        </td>

                        <td>
                          {
                            record.blood_group
                          }
                        </td>

                        <td>
                          {
                            record
                              .donation_date
                          }
                        </td>

                        <td>
                          {
                            record
                              .entry_method
                          }
                        </td>

                        <td>
                          {
                            record.unit_code ||
                            '-'
                          }
                        </td>

                        <td>
                          {
                            record
                              .blood_unit_status ||
                            '-'
                          }
                        </td>

                        <td>
                          <span className="status-badge">
                            {record.status}
                          </span>
                        </td>

                      </tr>
                    )
                )}

              </tbody>

            </table>

          </div>
        )}

      </section>

    </HospitalFrame>
  );
}


export function HospitalAppointments() {
  return (
    <HospitalMonitoringRecords
      type="appointments"
    />
  );
}


export function HospitalDonations() {
  return (
    <HospitalMonitoringRecords
      type="donations"
    />
  );
}