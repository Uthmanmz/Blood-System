import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import { Link } from 'react-router';

import SeekerSidebar
  from '../components/SeekerSidebar';

import {
  apiGet,
} from '../services/api';

import '../styles/newPages.css';
import '../styles/donorDashboard.css';


const finishedStatuses = [
  'Completed',
  'Rejected',
  'Cancelled',
];


function SeekerDashboard() {
  const [seeker, setSeeker] =
    useState(null);

  const [requests, setRequests] =
    useState([]);

  const [unread, setUnread] =
    useState(0);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');


  const loadDashboard = useCallback(
    async () => {
      try {
        setLoading(true);
        setError('');

        const [
          profileResponse,
          requestsResponse,
          unreadResponse,
        ] = await Promise.all([
          apiGet('/seekers/profile.php'),

          apiGet(
            '/blood-requests/my-requests.php'
          ),

          apiGet(
            '/notifications/unread-count.php'
          ),
        ]);

        setSeeker(
          profileResponse.data?.seeker ||
            null
        );

        setRequests(
          requestsResponse.data?.requests ||
            []
        );

        setUnread(
          unreadResponse.data
            ?.unread_count || 0
        );

      } catch (err) {
        setError(
          err.message ||
            'Unable to load seeker dashboard.'
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );


  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);


  useEffect(() => {
    function handleFocus() {
      apiGet(
        '/notifications/unread-count.php'
      )
        .then((response) => {
          setUnread(
            response.data
              ?.unread_count || 0
          );
        })
        .catch(() => {});
    }

    window.addEventListener(
      'focus',
      handleFocus
    );

    return () => {
      window.removeEventListener(
        'focus',
        handleFocus
      );
    };
  }, []);


  const activeRequests =
    requests.filter(
      (request) =>
        !finishedStatuses.includes(
          request.status
        )
    );


  const completedRequests =
    requests.filter(
      (request) =>
        request.status === 'Completed'
    );


  const recentRequests = [
    ...requests,
  ]
    .sort(
      (a, b) =>
        new Date(b.created_at) -
        new Date(a.created_at)
    )
    .slice(0, 3);


  if (loading) {
    return (
      <main className="donor-dashboard">

        <SeekerSidebar />

        <section className="donor-main">

          <div className="workspace-panel">
            <p>
              Loading seeker dashboard...
            </p>
          </div>

        </section>

      </main>
    );
  }


  return (
    <main className="donor-dashboard">

      <SeekerSidebar />

      <section className="donor-main">

        <header className="dashboard-header">

          <div>

            <p className="workspace-label">
              SEEKER PORTAL
            </p>

            <h1>
              {seeker
                ? `Welcome, ${seeker.full_name}`
                : 'Seeker Dashboard'}
            </h1>

            <span>
              Manage your blood requests,
              tracking information and
              notifications.
            </span>

          </div>

        </header>


        <section className="workspace-content">

          {error && (
            <section className="workspace-panel">

              <p
                className="application-message"
                role="alert"
              >
                {error}
              </p>

              <button
                type="button"
                className="application-button"
                onClick={loadDashboard}
              >
                Try Again
              </button>

            </section>
          )}


          {!error && !seeker && (
            <section className="workspace-panel">

              <h2>
                Seeker Account Unavailable
              </h2>

              <p>
                Your seeker profile could
                not be loaded. Please sign
                in again.
              </p>

              <Link
                className="application-button"
                to="/seeker-login"
              >
                Seeker Login
              </Link>

            </section>
          )}


          {!error && seeker && (
            <>

              <div className="workspace-grid">

                <article className="workspace-card">
                  <p>
                    Total Requests
                  </p>

                  <strong>
                    {requests.length}
                  </strong>
                </article>


                <article className="workspace-card">
                  <p>
                    Active Requests
                  </p>

                  <strong>
                    {activeRequests.length}
                  </strong>
                </article>


                <article className="workspace-card">
                  <p>
                    Completed Requests
                  </p>

                  <strong>
                    {
                      completedRequests.length
                    }
                  </strong>
                </article>


                <article className="workspace-card">
                  <p>
                    Unread Notifications
                  </p>

                  <strong>
                    {unread}
                  </strong>
                </article>

              </div>


              <section
                className="
                  workspace-panel
                  management-section
                "
              >

                <div className="management-heading">

                  <div>

                    <h2>
                      Recent Request Progress
                    </h2>

                    <p>
                      Your most recent blood
                      requests and their
                      current hospital status.
                    </p>

                  </div>


                  <Link
                    className="secondary-button"
                    to="/track-request"
                  >
                    Track Requests
                  </Link>

                </div>


                {recentRequests.length === 0 ? (
                  <div className="workspace-empty">

                    <p>
                      You have not submitted
                      any blood requests yet.
                    </p>

                    <Link
                      className="application-button"
                      to="/request-blood"
                    >
                      Create Blood Request
                    </Link>

                  </div>
                ) : (
                  <div className="management-table-wrapper">

                    <table className="management-table">

                      <thead>
                        <tr>
                          <th>
                            Tracking Number
                          </th>

                          <th>
                            Hospital
                          </th>

                          <th>
                            Patient
                          </th>

                          <th>
                            Blood
                          </th>

                          <th>
                            Quantity
                          </th>

                          <th>
                            Status
                          </th>

                          <th>
                            Action
                          </th>
                        </tr>
                      </thead>


                      <tbody>

                        {recentRequests.map(
                          (request) => (
                            <tr
                              key={request.id}
                            >

                              <td>
                                {
                                  request
                                    .tracking_number
                                }
                              </td>

                              <td>
                                {
                                  request
                                    .hospital_name
                                }
                              </td>

                              <td>
                                {
                                  request
                                    .patient_name
                                }
                              </td>

                              <td>
                                {
                                  request
                                    .blood_group
                                }
                              </td>

                              <td>
                                {
                                  request
                                    .quantity
                                }
                              </td>

                              <td>
                                {
                                  request
                                    .status
                                }
                              </td>

                              <td>
                                <Link
                                  to={`/track-request?code=${encodeURIComponent(
                                    request
                                      .tracking_number
                                  )}`}
                                >
                                  View
                                </Link>
                              </td>

                            </tr>
                          )
                        )}

                      </tbody>

                    </table>

                  </div>
                )}

              </section>


              <section className="workspace-panel">

                <h2>
                  Seeker Account
                </h2>

                <div className="application-grid">

                  <div>
                    <strong>
                      Full Name
                    </strong>

                    <p>
                      {seeker.full_name}
                    </p>
                  </div>


                  <div>
                    <strong>
                      Email
                    </strong>

                    <p>
                      {seeker.email}
                    </p>
                  </div>


                  <div>
                    <strong>
                      Phone
                    </strong>

                    <p>
                      {seeker.phone}
                    </p>
                  </div>


                  <div>
                    <strong>
                      Address
                    </strong>

                    <p>
                      {seeker.address ||
                        'Not provided'}
                    </p>
                  </div>

                </div>

              </section>

            </>
          )}

        </section>

      </section>

    </main>
  );
}


export default SeekerDashboard;