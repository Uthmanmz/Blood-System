import {
  useEffect,
  useState,
} from 'react';

import {
  Link,
} from 'react-router';

import AdminSidebar
  from '../components/AdminSidebar';

import {
  getOrganisationAnalytics,
  getOrganisationHospitals,
} from '../services/organisationApi';

import '../styles/adminDashboard.css';
import '../styles/newPages.css';


function AdminDashboard() {
  const [analytics, setAnalytics] =
    useState(null);

  const [hospitals, setHospitals] =
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

      const [
        analyticsResponse,
        hospitalResponse,
      ] = await Promise.all([
        getOrganisationAnalytics(),
        getOrganisationHospitals(),
      ]);

      setAnalytics(
        analyticsResponse.data
      );

      setHospitals(
        hospitalResponse.data.hospitals ||
        []
      );
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }


  const pendingHospitals =
    hospitals.filter(
      (hospital) =>
        hospital.status === 'Pending'
    );


  return (
    <main className="admin-layout">

      <AdminSidebar />

      <section className="admin-main">

        <header className="admin-header">
          <div>
            <p>
              ORGANISATION ADMINISTRATION
            </p>

            <h1>
              Organisation Dashboard
            </h1>

            <span>
              Monitor participating
              hospitals and organisation-wide
              activity.
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
              Loading organisation
              dashboard...
            </p>
          </section>
        ) : analytics ? (
          <>
            <div className="admin-stat-grid">

              <article className="admin-stat-card">
                <p>Total Hospitals</p>
                <h2>
                  {
                    analytics.hospitals
                      .total
                  }
                </h2>
              </article>


              <article className="admin-stat-card">
                <p>Approved Hospitals</p>
                <h2>
                  {
                    analytics.hospitals
                      .approved
                  }
                </h2>
              </article>


              <article className="admin-stat-card">
                <p>Pending Hospitals</p>
                <h2>
                  {
                    analytics.hospitals
                      .pending
                  }
                </h2>
              </article>


              <article className="admin-stat-card">
                <p>Suspended Hospitals</p>
                <h2>
                  {
                    analytics.hospitals
                      .suspended
                  }
                </h2>
              </article>


              <article className="admin-stat-card">
                <p>Total Donations</p>
                <h2>
                  {
                    analytics.donations
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
                    analytics.donations
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


            <section className="workspace-panel management-section">

              <h2>
                Quick Actions
              </h2>

              <div className="management-actions">

                <Link
                  className="application-button"
                  to="/admin-hospitals"
                >
                  Manage Hospitals
                </Link>

                <Link
                  className="application-button"
                  to="/admin-users"
                >
                  Hospital Administrators
                </Link>

                <Link
                  className="application-button"
                  to="/admin-notifications"
                >
                  Send Hospital Notice
                </Link>

              </div>

            </section>


            <section className="workspace-panel management-section">

              <h2>
                Applications Awaiting Review
              </h2>


              {pendingHospitals.length ===
              0 ? (
                <p>
                  No hospital applications
                  are currently awaiting
                  review.
                </p>
              ) : (
                <div className="hospital-list">

                  {pendingHospitals.map(
                    (hospital) => (
                      <article
                        key={hospital.id}
                      >
                        <strong>
                          {hospital.name}
                        </strong>

                        <p>
                          {hospital.city},{' '}
                          {hospital.state}
                        </p>

                        <Link
                          className="secondary-button"
                          to="/admin-hospitals"
                        >
                          Review Hospital
                        </Link>
                      </article>
                    )
                  )}

                </div>
              )}

            </section>

          </>
        ) : null}

      </section>

    </main>
  );
}

export default AdminDashboard;