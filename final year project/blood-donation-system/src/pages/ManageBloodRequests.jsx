import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import PersonnelSidebar from '../components/PersonnelSideBar';

import {
  getHospitalBloodRequests,
  reviewBloodRequest,
  approveBloodRequest,
  readyBloodRequest,
  completeBloodRequest,
  rejectBloodRequest,
  cancelBloodRequest,
} from '../services/bloodRequestApi';

import '../styles/personnelDashboard.css';
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


function ManageBloodRequests() {
  const [requests, setRequests] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [workingId, setWorkingId] =
    useState(null);

  const [message, setMessage] =
    useState('');

  const [search, setSearch] =
    useState('');

  const [statusFilter, setStatusFilter] =
    useState('All');


  useEffect(() => {
    loadRequests();
  }, []);


  async function loadRequests() {
    try {
      setLoading(true);

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


  const filteredRequests =
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
              request.urgency,
            ]
              .join(' ')
              .toLowerCase()
              .includes(query);

          const matchesStatus =
            statusFilter === 'All' ||
            request.status ===
              statusFilter;

          return (
            matchesSearch &&
            matchesStatus
          );
        }
      );
    }, [
      requests,
      search,
      statusFilter,
    ]);


  const counts = useMemo(() => {
    const result = {
      Submitted: 0,
      'Under Review': 0,
      Approved: 0,
      'Ready for Collection': 0,
      Completed: 0,
    };

    requests.forEach((request) => {
      if (
        Object.prototype.hasOwnProperty.call(
          result,
          request.status
        )
      ) {
        result[request.status] += 1;
      }
    });

    return result;
  }, [requests]);


  async function runAction(
    request,
    action
  ) {
    try {
      setWorkingId(request.id);
      setMessage('');

      const response =
        await action(request.id);

      setMessage(response.message);

      await loadRequests();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setWorkingId(null);
    }
  }


  async function handleReview(request) {
    await runAction(
      request,
      reviewBloodRequest
    );
  }


  async function handleApprove(request) {
    const confirmed = window.confirm(
      `Approve request ${request.tracking_number}?\n\nThe system will automatically reserve ${request.quantity} matching ${request.blood_group} blood unit(s).`
    );

    if (!confirmed) return;

    await runAction(
      request,
      approveBloodRequest
    );
  }


  async function handleReady(request) {
    const confirmed = window.confirm(
      `Mark ${request.tracking_number} as Ready for Collection?`
    );

    if (!confirmed) return;

    await runAction(
      request,
      readyBloodRequest
    );
  }


  async function handleComplete(request) {
    const confirmed = window.confirm(
      `Complete ${request.tracking_number}?\n\nThe reserved blood unit(s) will be marked Issued.`
    );

    if (!confirmed) return;

    await runAction(
      request,
      completeBloodRequest
    );
  }


  async function handleReject(request) {
    const reason = window.prompt(
      `Enter rejection reason for ${request.tracking_number}:`
    );

    if (reason === null) return;

    if (!reason.trim()) {
      setMessage(
        'Rejection reason is required.'
      );
      return;
    }

    try {
      setWorkingId(request.id);
      setMessage('');

      const response =
        await rejectBloodRequest(
          request.id,
          reason.trim()
        );

      setMessage(response.message);

      await loadRequests();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setWorkingId(null);
    }
  }


  async function handleCancel(request) {
    const reason = window.prompt(
      `Enter cancellation reason for ${request.tracking_number}:`
    );

    if (reason === null) return;

    if (!reason.trim()) {
      setMessage(
        'Cancellation reason is required.'
      );
      return;
    }

    try {
      setWorkingId(request.id);
      setMessage('');

      const response =
        await cancelBloodRequest(
          request.id,
          reason.trim()
        );

      setMessage(response.message);

      await loadRequests();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setWorkingId(null);
    }
  }


  function renderActions(request) {
    const disabled =
      workingId === request.id;

    if (
      request.status === 'Submitted'
    ) {
      return (
        <div className="management-actions">
          <button
            type="button"
            className="application-button"
            disabled={disabled}
            onClick={() =>
              handleReview(request)
            }
          >
            Under Review
          </button>

          <button
            type="button"
            className="secondary-button"
            disabled={disabled}
            onClick={() =>
              handleReject(request)
            }
          >
            Reject
          </button>

          <button
            type="button"
            className="secondary-button"
            disabled={disabled}
            onClick={() =>
              handleCancel(request)
            }
          >
            Cancel
          </button>
        </div>
      );
    }


    if (
      request.status === 'Under Review'
    ) {
      return (
        <div className="management-actions">
          <button
            type="button"
            className="application-button"
            disabled={disabled}
            onClick={() =>
              handleApprove(request)
            }
          >
            Approve
          </button>

          <button
            type="button"
            className="secondary-button"
            disabled={disabled}
            onClick={() =>
              handleReject(request)
            }
          >
            Reject
          </button>

          <button
            type="button"
            className="secondary-button"
            disabled={disabled}
            onClick={() =>
              handleCancel(request)
            }
          >
            Cancel
          </button>
        </div>
      );
    }


    if (
      request.status === 'Approved'
    ) {
      return (
        <div className="management-actions">
          <button
            type="button"
            className="application-button"
            disabled={disabled}
            onClick={() =>
              handleReady(request)
            }
          >
            Ready for Collection
          </button>

          <button
            type="button"
            className="secondary-button"
            disabled={disabled}
            onClick={() =>
              handleCancel(request)
            }
          >
            Cancel
          </button>
        </div>
      );
    }


    if (
      request.status ===
      'Ready for Collection'
    ) {
      return (
        <div className="management-actions">
          <button
            type="button"
            className="application-button"
            disabled={disabled}
            onClick={() =>
              handleComplete(request)
            }
          >
            Complete
          </button>

          <button
            type="button"
            className="secondary-button"
            disabled={disabled}
            onClick={() =>
              handleCancel(request)
            }
          >
            Cancel
          </button>
        </div>
      );
    }

    return (
      <span>No pending action</span>
    );
  }


  return (
    <main className="personnel-layout">
      <PersonnelSidebar />

      <section className="personnel-main">
        <h1>Blood Requests</h1>

        <p>
          Review and process blood requests
          submitted to your hospital.
        </p>


        {message && (
          <p
            className="application-message"
            role="status"
          >
            {message}
          </p>
        )}


        <div className="workspace-grid">
          <article className="workspace-card">
            <p>Submitted</p>
            <strong>
              {counts.Submitted}
            </strong>
          </article>

          <article className="workspace-card">
            <p>Under Review</p>
            <strong>
              {counts['Under Review']}
            </strong>
          </article>

          <article className="workspace-card">
            <p>Approved</p>
            <strong>
              {counts.Approved}
            </strong>
          </article>

          <article className="workspace-card">
            <p>Ready</p>
            <strong>
              {
                counts[
                  'Ready for Collection'
                ]
              }
            </strong>
          </article>

          <article className="workspace-card">
            <p>Completed</p>
            <strong>
              {counts.Completed}
            </strong>
          </article>
        </div>


        <section className="workspace-panel">
          <div className="management-heading">
            <div>
              <h2>
                Hospital Requests
              </h2>

              <p>
                Total requests:{' '}
                {requests.length}
              </p>
            </div>

            <div className="management-filters">
              <input
                placeholder="Search tracking number, patient, seeker or blood group"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
              />

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value
                  )
                }
              >
                {STATUSES.map(
                  (status) => (
                    <option
                      key={status}
                      value={status}
                    >
                      {status}
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
          ) : filteredRequests.length ===
            0 ? (
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
                    <th>Quantity</th>
                    <th>Urgency</th>
                    <th>Seeker</th>
                    <th>Delivery</th>
                    <th>Status</th>
                    <th>Information</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredRequests.map(
                    (request) => (
                      <tr key={request.id}>
                        <td>
                          <strong>
                            {
                              request.tracking_number
                            }
                          </strong>

                          <br />

                          <small>
                            {
                              request.created_at
                            }
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
                            request.delivery_channel
                          }
                        </td>

                        <td>
                          <span className="status-badge">
                            {request.status}
                          </span>

                          {request.rejection_reason && (
                            <>
                              <br />
                              <small>
                                {
                                  request.rejection_reason
                                }
                              </small>
                            </>
                          )}

                          {request.cancellation_reason && (
                            <>
                              <br />
                              <small>
                                {
                                  request.cancellation_reason
                                }
                              </small>
                            </>
                          )}
                        </td>

                        <td>
                          {
                            request.additional_information ||
                            '-'
                          }
                        </td>

                        <td>
                          {renderActions(
                            request
                          )}
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

export default ManageBloodRequests;