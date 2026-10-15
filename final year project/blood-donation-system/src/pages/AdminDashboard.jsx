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
  BadgeCheck,
  Ban,
  Building2,
  CheckCheck,
  Clock,
  Droplets,
  Heart,
  ShieldCheck,
} from 'lucide-react';

import {
  getOrganisationAnalytics,
  getOrganisationHospitals,
} from '../services/organisationApi';

import '../styles/adminDashboard.css';
import '../styles/newPages.css';


function StatCard({
  icon: Icon,
  label,
  value,
}) {
  return (
    <article className="admin-stat-card">

      <span className="admin-stat-icon">
        <Icon
          size={20}
          aria-hidden="true"
        />
      </span>

      <p>{label}</p>

      <h2>{value}</h2>

    </article>
  );
}


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

              <StatCard
                icon={Building2}
                label="Total Hospitals"
                value={
                  analytics.hospitals.total
                }
              />

              <StatCard
                icon={ShieldCheck}
                label="Approved Hospitals"
                value={
                  analytics.hospitals
                    .approved
                }
              />

              <StatCard
                icon={Clock}
                label="Pending Hospitals"
                value={
                  analytics.hospitals
                    .pending
                }
              />

              <StatCard
                icon={Ban}
                label="Suspended Hospitals"
                value={
                  analytics.hospitals
                    .suspended
                }
              />

              <StatCard
                icon={Heart}
                label="Total Donations"
                value={
                  analytics.donations.total
                }
              />

              <StatCard
                icon={BadgeCheck}
                label="Completed Donations"
                value={
                  analytics.donations
                    .completed
                }
              />

              <StatCard
                icon={Droplets}
                label="Total Blood Requests"
                value={
                  analytics.blood_requests
                    .total
                }
              />

              <StatCard
                icon={CheckCheck}
                label="Completed Requests"
                value={
                  analytics.blood_requests
                    .completed
                }
              />

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