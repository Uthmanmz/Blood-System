import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import HospitalAdminNav
  from '../components/HospitalAdminNav';

import {
  getHospitalAdminDashboard,
  getHospitalPersonnel,
} from '../services/hospitalAdminApi';

import {
  getHospitalDonors,
} from '../services/donorApi';

import {
  getHospitalAppointments,
} from '../services/appointmentApi';

import {
  getHospitalDonations,
} from '../services/donationApi';

import {
  getInventory,
} from '../services/inventoryApi';

import {
  getHospitalBloodRequests,
} from '../services/bloodRequestApi';

import '../styles/newPages.css';


function MetricBars({
  title,
  values,
}) {
  const maximum = Math.max(
    0,
    ...values.map(
      (item) => item.value
    )
  );

  return (
    <section className="workspace-panel">

      <h2>{title}</h2>

      {maximum === 0 ? (
        <p className="workspace-empty">
          No data available.
        </p>
      ) : (
        <div className="metric-bars">

          {values.map(
            (item) => (
              <div
                className="metric-row"
                key={item.label}
              >
                <span>
                  {item.label}
                </span>

                <div>
                  {item.value > 0 && (
                    <i
                      style={{
                        width:
                          `${
                            (
                              item.value /
                              maximum
                            ) * 100
                          }%`,
                      }}
                    />
                  )}
                </div>

                <strong>
                  {item.value}
                </strong>

              </div>
            )
          )}

        </div>
      )}

    </section>
  );
}


function groupByDate(
  records,
  field
) {
  const totals = {};

  records.forEach((record) => {
    const date =
      String(
        record[field] || ''
      ).slice(0, 10);

    if (date) {
      totals[date] =
        (totals[date] || 0) + 1;
    }
  });

  return Object.entries(totals)
    .sort(
      ([a], [b]) =>
        a.localeCompare(b)
    )
    .map(
      ([label, value]) => ({
        label,
        value,
      })
    );
}


function HospitalReports() {
  const [dashboard, setDashboard] =
    useState(null);

  const [personnel, setPersonnel] =
    useState([]);

  const [donors, setDonors] =
    useState([]);

  const [appointments, setAppointments] =
    useState([]);

  const [donations, setDonations] =
    useState([]);

  const [units, setUnits] =
    useState([]);

  const [requests, setRequests] =
    useState([]);

  const [from, setFrom] =
    useState('');

  const [to, setTo] =
    useState('');

  const [loading, setLoading] =
    useState(true);

  const [message, setMessage] =
    useState('');


  useEffect(() => {
    loadReport();
  }, []);


  async function loadReport() {
    try {
      setLoading(true);

      const [
        dashboardResponse,
        personnelResponse,
        donorResponse,
        appointmentResponse,
        donationResponse,
        inventoryResponse,
        requestResponse,
      ] = await Promise.all([
        getHospitalAdminDashboard(),
        getHospitalPersonnel(),
        getHospitalDonors(),
        getHospitalAppointments(),
        getHospitalDonations(),
        getInventory(),
        getHospitalBloodRequests(),
      ]);

      setDashboard(
        dashboardResponse.data
      );

      setPersonnel(
        personnelResponse.data
          .personnel || []
      );

      setDonors(
        donorResponse.data.donors ||
        []
      );

      setAppointments(
        appointmentResponse.data
          .appointments || []
      );

      setDonations(
        donationResponse.data
          .donations || []
      );

      setUnits(
        inventoryResponse.data.units ||
        []
      );

      setRequests(
        requestResponse.data.requests ||
        []
      );
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }


  const invalidRange =
    Boolean(
      from &&
      to &&
      from > to
    );


  function inRange(dateValue) {
    const date =
      String(
        dateValue || ''
      ).slice(0, 10);

    if (!date || invalidRange) {
      return false;
    }

    return (
      (!from || date >= from) &&
      (!to || date <= to)
    );
  }


  const report = useMemo(() => {
    const filteredDonations =
      donations.filter(
        (item) =>
          inRange(
            item.donation_date
          )
      );

    const filteredAppointments =
      appointments.filter(
        (item) =>
          inRange(
            item.appointment_date
          )
      );

    const filteredRequests =
      requests.filter(
        (item) =>
          inRange(
            item.created_at
          )
      );


    return {
      donations:
        filteredDonations,

      appointments:
        filteredAppointments,

      requests:
        filteredRequests,
    };
  }, [
    donations,
    appointments,
    requests,
    from,
    to,
    invalidRange,
  ]);


  const requestStatuses = [
    'Submitted',
    'Under Review',
    'Approved',
    'Ready for Collection',
    'Completed',
    'Rejected',
    'Cancelled',
  ];


  const inventoryStatuses = [
    'Awaiting Screening',
    'Available',
    'Reserved',
    'Issued',
    'Expired',
    'Discarded',
  ];


  return (
    <main className="workspace-page">

      <header className="workspace-header">
        <div>
          <span className="workspace-label">
            HOSPITAL ADMINISTRATION
          </span>

          <h1>
            Activity Reports
          </h1>

          <p>
            Hospital operational
            summaries and activity trends.
          </p>
        </div>
      </header>


      <HospitalAdminNav />


      <section className="workspace-content">

        {message && (
          <p className="application-message">
            {message}
          </p>
        )}


        {loading ? (
          <section className="workspace-panel">
            <p>
              Loading report...
            </p>
          </section>
        ) : (
          <>

            <div className="workspace-grid">

              <article className="workspace-card">
                <p>Personnel</p>
                <strong>
                  {personnel.length}
                </strong>
              </article>

              <article className="workspace-card">
                <p>Donors</p>
                <strong>
                  {donors.length}
                </strong>
              </article>

              <article className="workspace-card">
                <p>Total Donations</p>
                <strong>
                  {
                    dashboard
                      ?.donations
                      ?.total || 0
                  }
                </strong>
              </article>

              <article className="workspace-card">
                <p>Total Blood Units</p>
                <strong>
                  {
                    dashboard
                      ?.inventory
                      ?.total || 0
                  }
                </strong>
              </article>

              <article className="workspace-card">
                <p>Total Requests</p>
                <strong>
                  {
                    dashboard
                      ?.blood_requests
                      ?.total || 0
                  }
                </strong>
              </article>

            </div>


            <section className="workspace-panel">

              <h2>
                Report Period
              </h2>

              <div className="management-filters">

                <label>
                  From

                  <input
                    type="date"
                    value={from}
                    onChange={(event) =>
                      setFrom(
                        event.target.value
                      )
                    }
                  />
                </label>


                <label>
                  To

                  <input
                    type="date"
                    min={from}
                    value={to}
                    onChange={(event) =>
                      setTo(
                        event.target.value
                      )
                    }
                  />
                </label>


                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    setFrom('');
                    setTo('');
                  }}
                >
                  Clear Filters
                </button>

              </div>


              {invalidRange && (
                <p className="application-message">
                  Start date must not be
                  after end date.
                </p>
              )}

            </section>


            {!invalidRange && (
              <div className="report-grid">

                <MetricBars
                  title="Completed Donations Over Time"
                  values={
                    groupByDate(
                      report.donations,
                      'donation_date'
                    )
                  }
                />


                <MetricBars
                  title="Appointments Over Time"
                  values={
                    groupByDate(
                      report.appointments,
                      'appointment_date'
                    )
                  }
                />


                <MetricBars
                  title="Blood Requests Over Time"
                  values={
                    groupByDate(
                      report.requests,
                      'created_at'
                    )
                  }
                />


                <MetricBars
                  title="Request Status Totals"
                  values={
                    requestStatuses.map(
                      (status) => ({
                        label: status,

                        value:
                          report.requests.filter(
                            (request) =>
                              request.status ===
                              status
                          ).length,
                      })
                    )
                  }
                />


                <MetricBars
                  title="Current Inventory Status"
                  values={
                    inventoryStatuses.map(
                      (status) => ({
                        label: status,

                        value:
                          units.filter(
                            (unit) =>
                              unit.status ===
                              status
                          ).length,
                      })
                    )
                  }
                />

              </div>
            )}

          </>
        )}

      </section>

    </main>
  );
}

export default HospitalReports;