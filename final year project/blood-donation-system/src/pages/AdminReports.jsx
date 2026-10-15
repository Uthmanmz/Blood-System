import {
  useEffect,
  useState,
} from 'react';

import AdminSidebar
  from '../components/AdminSidebar';

import {
  getOrganisationAnalytics,
} from '../services/organisationApi';

import '../styles/adminDashboard.css';
import '../styles/newPages.css';


function percentage(value, total) {
  if (!total) return 0;

  return Math.round(
    (Number(value) / Number(total)) * 100
  );
}


function ReportBar({
  label,
  value,
  total,
}) {
  const width =
    percentage(value, total);

  return (
    <div className="report-bar">

      <div className="report-bar-heading">

        <strong>
          {label}
        </strong>

        <span>
          {value} ({width}%)
        </span>

      </div>


      <div className="report-bar-track">

        <div
          className="report-bar-fill"
          style={{
            width: `${width}%`,
          }}
        />

      </div>

    </div>
  );
}


function AdminReports() {
  const [analytics, setAnalytics] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [message, setMessage] =
    useState('');


  useEffect(() => {
    loadReports();
  }, []);


  async function loadReports() {
    try {
      setLoading(true);
      setMessage('');

      const response =
        await getOrganisationAnalytics();

      setAnalytics(
        response.data
      );

    } catch (error) {
      setMessage(
        error.message ||
        'Unable to load organisation reports.'
      );
    } finally {
      setLoading(false);
    }
  }


  return (
    <main className="admin-layout">

      <AdminSidebar />


      <section className="admin-main">

        <header className="admin-header">

          <div>

            <p>
              ORGANISATION ANALYTICS
            </p>

            <h1>
              Reports & Analytics
            </h1>

            <span>
              Organisation-wide summary
              of hospital participation,
              donations and blood requests.
            </span>

          </div>

        </header>


        {message && (
          <p
            className="application-message"
            role="status"
          >
            {message}
          </p>
        )}


        {loading ? (

          <section className="workspace-panel">

            <p>
              Loading reports...
            </p>

          </section>

        ) : analytics ? (

          <>

            {/* =========================
                SUMMARY CARDS
            ========================== */}

            <div className="admin-stat-grid">

              <article className="admin-stat-card">

                <p>
                  Total Hospitals
                </p>

                <h2>
                  {
                    analytics
                      .hospitals
                      .total
                  }
                </h2>

              </article>


              <article className="admin-stat-card">

                <p>
                  Approved Hospitals
                </p>

                <h2>
                  {
                    analytics
                      .hospitals
                      .approved
                  }
                </h2>

              </article>


              <article className="admin-stat-card">

                <p>
                  Total Donations
                </p>

                <h2>
                  {
                    analytics
                      .donations
                      .total
                  }
                </h2>

              </article>


              <article className="admin-stat-card">

                <p>
                  Completed Donations
                </p>

                <h2>
                  {
                    analytics
                      .donations
                      .completed
                  }
                </h2>

              </article>


              <article className="admin-stat-card">

                <p>
                  Total Blood Requests
                </p>

                <h2>
                  {
                    analytics
                      .blood_requests
                      .total
                  }
                </h2>

              </article>


              <article className="admin-stat-card">

                <p>
                  Completed Requests
                </p>

                <h2>
                  {
                    analytics
                      .blood_requests
                      .completed
                  }
                </h2>

              </article>

            </div>


            {/* =========================
                REPORT AREA
            ========================== */}

            <div className="reports-content">

              <div className="report-chart-grid">


                {/* HOSPITAL PARTICIPATION */}

                <section
                  className="
                    workspace-panel
                    report-section
                    report-section--wide
                  "
                >

                  <div className="report-section-heading">

                    <div>

                      <h2>
                        Hospital Participation
                      </h2>

                      <p>
                        Current participation
                        status of hospitals
                        registered under the
                        organisation.
                      </p>

                    </div>

                  </div>


                  <ReportBar
                    label="Approved"
                    value={
                      analytics
                        .hospitals
                        .approved
                    }
                    total={
                      analytics
                        .hospitals
                        .total
                    }
                  />


                  <ReportBar
                    label="Pending"
                    value={
                      analytics
                        .hospitals
                        .pending
                    }
                    total={
                      analytics
                        .hospitals
                        .total
                    }
                  />


                  <ReportBar
                    label="Rejected"
                    value={
                      analytics
                        .hospitals
                        .rejected
                    }
                    total={
                      analytics
                        .hospitals
                        .total
                    }
                  />


                  <ReportBar
                    label="Suspended"
                    value={
                      analytics
                        .hospitals
                        .suspended
                    }
                    total={
                      analytics
                        .hospitals
                        .total
                    }
                  />


                  <p className="report-summary">

                    Total registered
                    hospitals:{' '}

                    <strong>
                      {
                        analytics
                          .hospitals
                          .total
                      }
                    </strong>

                  </p>

                </section>


                {/* DONATION PERFORMANCE */}

                <section
                  className="
                    workspace-panel
                    report-section
                  "
                >

                  <div className="report-section-heading">

                    <div>

                      <h2>
                        Donation Performance
                      </h2>

                      <p>
                        Summary of completed
                        blood donations across
                        participating hospitals.
                      </p>

                    </div>

                  </div>


                  <ReportBar
                    label="Completed Donations"
                    value={
                      analytics
                        .donations
                        .completed
                    }
                    total={
                      analytics
                        .donations
                        .total
                    }
                  />


                  <div className="report-metric">

                    <span>
                      Completed
                    </span>

                    <strong>
                      {
                        analytics
                          .donations
                          .completed
                      }
                    </strong>

                  </div>


                  <div className="report-metric">

                    <span>
                      Total Recorded
                    </span>

                    <strong>
                      {
                        analytics
                          .donations
                          .total
                      }
                    </strong>

                  </div>

                </section>


                {/* BLOOD REQUEST PERFORMANCE */}

                <section
                  className="
                    workspace-panel
                    report-section
                  "
                >

                  <div className="report-section-heading">

                    <div>

                      <h2>
                        Blood Request Performance
                      </h2>

                      <p>
                        Organisation-wide summary
                        of completed blood
                        requests.
                      </p>

                    </div>

                  </div>


                  <ReportBar
                    label="Completed Requests"
                    value={
                      analytics
                        .blood_requests
                        .completed
                    }
                    total={
                      analytics
                        .blood_requests
                        .total
                    }
                  />


                  <div className="report-metric">

                    <span>
                      Completed
                    </span>

                    <strong>
                      {
                        analytics
                          .blood_requests
                          .completed
                      }
                    </strong>

                  </div>


                  <div className="report-metric">

                    <span>
                      Total Requests
                    </span>

                    <strong>
                      {
                        analytics
                          .blood_requests
                          .total
                      }
                    </strong>

                  </div>

                </section>


              </div>

            </div>

          </>

        ) : (

          <section className="workspace-panel">

            <p>
              No report information
              is currently available.
            </p>

          </section>

        )}

      </section>

    </main>
  );
}


export default AdminReports;