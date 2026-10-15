import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import HospitalAdminNav
  from '../components/HospitalAdminNav';

import {
  getHospitalBloodRequests,
} from '../services/bloodRequestApi';

import '../styles/newPages.css';


const STATUSES = [
  'All',
  'Submitted',
  'Under Review',
  'Approved',
  'Ready for Collection',
  'Completed',
  'Rejected',
  'Cancelled',
];


function HospitalRequests() {
  const [requests, setRequests] =
    useState([]);

  const [search, setSearch] =
    useState('');

  const [status, setStatus] =
    useState('All');

  const [loading, setLoading] =
    useState(true);

  const [message, setMessage] =
    useState('');


  useEffect(() => {
    loadRequests();
  }, []);


  async function loadRequests() {
    try {
      setLoading(true);
      setMessage('');

      const response =
        await getHospitalBloodRequests();

      setRequests(
        response.data.requests || []
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

      return requests.filter(
        (request) => {
          const matchesSearch =
            !query ||
            [
              request.tracking_number,
              request.patient_name,
              request.blood_group,
              request.seeker_name,
              request.seeker_email,
              request.seeker_phone,
            ]
              .join(' ')
              .toLowerCase()
              .includes(query);

          const matchesStatus =
            status === 'All' ||
            request.status === status;

          return (
            matchesSearch &&
            matchesStatus
          );
        }
      );
    }, [
      requests,
      search,
      status,
    ]);


  return (
    <main className="workspace-page">

      <header className="workspace-header">
        <div>
          <span className="workspace-label">
            HOSPITAL ADMINISTRATION
          </span>

          <h1>
            Hospital Blood Requests
          </h1>

          <p>
            Monitor blood requests
            submitted to your hospital.
          </p>
        </div>
      </header>


      <HospitalAdminNav />


      <section className="workspace-content">

        {message && (
          <p
            className="application-message"
            role="status"
          >
            {message}
          </p>
        )}


        <div className="workspace-grid">

          {[
            'Submitted',
            'Under Review',
            'Approved',
            'Ready for Collection',
            'Completed',
          ].map(
            (requestStatus) => (
              <article
                className="workspace-card"
                key={requestStatus}
              >
                <p>
                  {requestStatus}
                </p>

                <strong>
                  {
                    requests.filter(
                      (request) =>
                        request.status ===
                        requestStatus
                    ).length
                  }
                </strong>
              </article>
            )
          )}

        </div>


        <section className="workspace-panel">

          <div className="management-heading">

            <div>
              <h2>
                Blood Requests
              </h2>

              <p>
                Total: {requests.length}
              </p>
            </div>


            <div className="management-filters">

              <input
                placeholder="Search patient, seeker, tracking number or blood group"
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
                {STATUSES.map(
                  (value) => (
                    <option
                      key={value}
                      value={value}
                    >
                      {value}
                    </option>
                  )
                )}
              </select>

            </div>

          </div>


          {loading ? (
            <p>
              Loading blood requests...
            </p>
          ) : filtered.length === 0 ? (
            <p className="workspace-empty">
              No matching blood requests.
            </p>
          ) : (
            <div className="management-table-wrapper">

              <table className="management-table">

                <thead>
                  <tr>
                    <th>Tracking</th>
                    <th>Patient</th>
                    <th>Blood</th>
                    <th>Qty</th>
                    <th>Urgency</th>
                    <th>Seeker</th>
                    <th>Channel</th>
                    <th>Status</th>
                    <th>Information</th>
                  </tr>
                </thead>


                <tbody>

                  {filtered.map(
                    (request) => (
                      <tr key={request.id}>

                        <td>
                          <strong>
                            {
                              request
                                .tracking_number
                            }
                          </strong>

                          <br />

                          <small>
                            {request.created_at}
                          </small>
                        </td>


                        <td>
                          {
                            request.patient_name
                          }
                        </td>


                        <td>
                          {
                            request.blood_group
                          }
                        </td>


                        <td>
                          {request.quantity}
                        </td>


                        <td>
                          {request.urgency}
                        </td>


                        <td>
                          {
                            request.seeker_name
                          }

                          <br />

                          <small>
                            {
                              request.seeker_phone
                            }
                          </small>
                        </td>


                        <td>
                          {
                            request
                              .delivery_channel
                          }
                        </td>


                        <td>
                          <span className="status-badge">
                            {
                              request.status
                            }
                          </span>

                          {request.rejection_reason && (
                            <>
                              <br />

                              <small>
                                Reason:{' '}
                                {
                                  request
                                    .rejection_reason
                                }
                              </small>
                            </>
                          )}

                          {request.cancellation_reason && (
                            <>
                              <br />

                              <small>
                                Reason:{' '}
                                {
                                  request
                                    .cancellation_reason
                                }
                              </small>
                            </>
                          )}
                        </td>


                        <td>
                          {
                            request
                              .additional_information ||
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

export default HospitalRequests;