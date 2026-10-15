import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Link,
  useSearchParams,
} from 'react-router';

import SeekerSidebar
  from '../components/SeekerSidebar';

import {
  apiGet,
} from '../services/api';

import '../styles/newPages.css';
import '../styles/donorDashboard.css';


function TrackRequest() {
  const [searchParams] =
    useSearchParams();

  const codeFromUrl =
    searchParams.get('code') || '';

  const [requests, setRequests] =
    useState([]);

  const [searchCode, setSearchCode] =
    useState(codeFromUrl);

  const [selectedRequestId, setSelectedRequestId] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');


  useEffect(() => {
    let active = true;

    async function loadRequests() {
      try {
        setLoading(true);
        setError('');

        const response =
          await apiGet(
            '/blood-requests/my-requests.php'
          );

        if (!active) return;

        const requestData =
          response.data?.requests || [];

        setRequests(requestData);

        if (codeFromUrl) {
          const matchingRequest =
            requestData.find(
              (request) =>
                String(
                  request.tracking_number
                ).toLowerCase() ===
                String(
                  codeFromUrl
                ).toLowerCase()
            );

          if (matchingRequest) {
            setSelectedRequestId(
              matchingRequest.id
            );
          }
        }

      } catch (err) {
        setError(
          err.message ||
            'Unable to load your blood requests.'
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadRequests();

    return () => {
      active = false;
    };
  }, [codeFromUrl]);


  const searchedRequest =
    useMemo(() => {
      const code =
        searchCode.trim().toLowerCase();

      if (!code) {
        return null;
      }

      return requests.find(
        (request) =>
          String(
            request.tracking_number
          ).toLowerCase() === code
      ) || null;
    }, [requests, searchCode]);


  const selectedRequest =
    useMemo(
      () =>
        requests.find(
          (request) =>
            String(request.id) ===
            String(selectedRequestId)
        ) || searchedRequest,
      [
        requests,
        selectedRequestId,
        searchedRequest,
      ]
    );


  function handleSearch(event) {
    event.preventDefault();

    const request =
      searchedRequest;

    if (request) {
      setSelectedRequestId(
        request.id
      );

      setError('');
    } else {
      setSelectedRequestId(null);

      setError(
        'No blood request was found with that tracking number.'
      );
    }
  }


  function getStatusStep(status) {
    const steps = [
      'Submitted',
      'Under Review',
      'Approved',
      'Ready for Collection',
      'Completed',
    ];

    const index =
      steps.indexOf(status);

    if (status === 'Rejected') {
      return -1;
    }

    return index;
  }


  if (loading) {
    return (
      <main className="donor-dashboard">

        <SeekerSidebar />

        <section className="donor-main">

          <div className="workspace-panel">
            <p>
              Loading your blood requests...
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

        <div className="application-container">

          <header className="dashboard-header">

            <div>

              <p className="workspace-label">
                SEEKER PORTAL
              </p>

              <h1>
                Track Blood Requests
              </h1>

              <span>
                View your submitted blood
                requests, tracking numbers and
                current hospital status.
              </span>

            </div>

          </header>


          <section className="workspace-panel">

            <h2>
              Search Tracking Number
            </h2>

            <form
              className="application-form"
              onSubmit={handleSearch}
            >

              <label className="application-field">

                Tracking Number

                <input
                  type="text"
                  value={searchCode}
                  onChange={(event) => {
                    setSearchCode(
                      event.target.value
                    );

                    setError('');
                  }}
                  placeholder="Example: BR-20261004-XXXXXX"
                />

              </label>


              <button
                type="submit"
                className="application-button"
                disabled={
                  !searchCode.trim()
                }
              >
                Track Request
              </button>

            </form>

          </section>


          {error && (
            <p
              className="application-message"
              role="alert"
            >
              {error}
            </p>
          )}


          {selectedRequest && (
            <section className="workspace-panel">

              <div className="management-heading">

                <div>

                  <p className="workspace-label">
                    REQUEST DETAILS
                  </p>

                  <h2>
                    {
                      selectedRequest
                        .tracking_number
                    }
                  </h2>

                </div>

                <strong>
                  {selectedRequest.status}
                </strong>

              </div>


              <div className="application-grid">

                <div>
                  <strong>
                    Patient
                  </strong>

                  <p>
                    {
                      selectedRequest
                        .patient_name
                    }
                  </p>
                </div>


                <div>
                  <strong>
                    Hospital
                  </strong>

                  <p>
                    {
                      selectedRequest
                        .hospital_name
                    }
                  </p>
                </div>


                <div>
                  <strong>
                    Blood Group
                  </strong>

                  <p>
                    {
                      selectedRequest
                        .blood_group
                    }
                  </p>
                </div>


                <div>
                  <strong>
                    Quantity
                  </strong>

                  <p>
                    {
                      selectedRequest
                        .quantity
                    }
                  </p>
                </div>


                <div>
                  <strong>
                    Urgency
                  </strong>

                  <p>
                    {
                      selectedRequest
                        .urgency
                    }
                  </p>
                </div>


                <div>
                  <strong>
                    Notification Channel
                  </strong>

                  <p>
                    {
                      selectedRequest
                        .delivery_channel
                    }
                  </p>
                </div>


                <div>
                  <strong>
                    Submitted
                  </strong>

                  <p>
                    {
                      selectedRequest
                        .created_at
                    }
                  </p>
                </div>


                <div>
                  <strong>
                    Current Status
                  </strong>

                  <p>
                    {
                      selectedRequest
                        .status
                    }
                  </p>
                </div>

              </div>


              {selectedRequest
                .additional_information && (
                <div className="application-field">

                  <strong>
                    Additional Information
                  </strong>

                  <p>
                    {
                      selectedRequest
                        .additional_information
                    }
                  </p>

                </div>
              )}


              {selectedRequest.status ===
                'Rejected' ? (
                <div className="workspace-panel">

                  <strong>
                    Request Rejected
                  </strong>

                  <p>
                    This request was not
                    approved by the hospital.
                  </p>

                </div>
              ) : (
                <div className="request-progress">

                  {[
                    'Submitted',
                    'Under Review',
                    'Approved',
                    'Ready for Collection',
                    'Completed',
                  ].map(
                    (status, index) => {
                      const currentStep =
                        getStatusStep(
                          selectedRequest.status
                        );

                      const reached =
                        index <= currentStep;

                      return (
                        <div
                          key={status}
                          className={
                            reached
                              ? 'request-progress-step request-progress-step--active'
                              : 'request-progress-step'
                          }
                        >
                          <span>
                            {index + 1}
                          </span>

                          <p>
                            {status}
                          </p>
                        </div>
                      );
                    }
                  )}

                </div>
              )}

            </section>
          )}


          <section
            className="
              workspace-panel
              management-section
            "
          >

            <div className="management-heading">

              <div>

                <h2>
                  My Blood Requests
                </h2>

                <p>
                  All blood requests submitted
                  through your Seeker account.
                </p>

              </div>


              <Link
                className="application-button"
                to="/request-blood"
              >
                New Request
              </Link>

            </div>


            {requests.length === 0 ? (
              <div className="workspace-empty">

                <p>
                  You have not submitted any
                  blood requests yet.
                </p>

                <Link
                  className="application-button"
                  to="/request-blood"
                >
                  Request Blood
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
                        Qty
                      </th>

                      <th>
                        Urgency
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

                    {requests.map(
                      (request) => (
                        <tr key={request.id}>

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
                                .urgency
                            }
                          </td>

                          <td>
                            {
                              request
                                .status
                            }
                          </td>

                          <td>
                            <button
                              type="button"
                              className="secondary-button"
                              onClick={() => {
                                setSelectedRequestId(
                                  request.id
                                );

                                setSearchCode(
                                  request
                                    .tracking_number
                                );

                                setError('');

                                window.scrollTo({
                                  top: 0,
                                  behavior:
                                    'smooth',
                                });
                              }}
                            >
                              View
                            </button>
                          </td>

                        </tr>
                      )
                    )}

                  </tbody>

                </table>

              </div>
            )}

          </section>

        </div>

      </section>

    </main>
  );
}


export default TrackRequest;