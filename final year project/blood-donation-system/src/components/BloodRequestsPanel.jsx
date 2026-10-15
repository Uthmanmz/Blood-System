import { useEffect, useState } from 'react';

import {
  getHospitalRequests,
  getHospitalBloodUnits,
  updateHospitalRequest,
  subscribeToDemoChanges,
} from '../services/demoStore';

import '../styles/newPages.css';

const nextStatuses = {
  Submitted: ['Under Review', 'Rejected', 'Cancelled'],
  'Under Review': ['Approved', 'Rejected', 'Cancelled'],
  Approved: ['Ready for Collection', 'Cancelled'],
  'Ready for Collection': ['Completed', 'Cancelled'],
};

function BloodRequestsPanel({ hospitalId, canProcess = false }) {
  const [requests, setRequests] = useState(() =>
    getHospitalRequests(hospitalId)
  );

  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [urgency, setUrgency] = useState('');
  const [date, setDate] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [nextStatus, setNextStatus] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => subscribeToDemoChanges(() => {
    setRequests(getHospitalRequests(hospitalId));
  }), [hospitalId]);

  const matchingUnits = selected
    ? getHospitalBloodUnits(hospitalId).filter(
        (unit) =>
          unit.status === 'Available' &&
          !unit.requestId &&
          unit.bloodGroup === selected.bloodGroup
      )
    : [];
  const filteredRequests = requests.filter((request) =>
    (!filter || request.status === filter) && (!urgency || request.urgency === urgency) &&
    (!date || request.createdAt?.slice(0, 10) === date) &&
    `${request.patientName} ${request.seekerName} ${request.trackingNumber} ${request.bloodGroup}`.toLowerCase().includes(search.trim().toLowerCase())
  );
  const pageSize = 6;
  const pageCount = Math.max(1, Math.ceil(filteredRequests.length / pageSize));
  const visibleRequests = filteredRequests.slice((page - 1) * pageSize, page * pageSize);
  useEffect(() => setPage(1), [filter, urgency, date, search]);

  function openRequest(request) {
    setSelected(request);
    setNextStatus(nextStatuses[request.status]?.[0] || '');
    setMessage('');
  }

  function handleSubmit(event) {
    event.preventDefault();

    const values = new FormData(event.currentTarget);

    try {
      updateHospitalRequest({
        hospitalId,
        requestId: selected.id,
        nextStatus,
        note: values.get('note'),
        unitIds: values.getAll('unitIds'),
      });

      setRequests(getHospitalRequests(hospitalId));
      setSelected(null);

      setMessage(
        'Request updated. A progress message was added to the seeker’s preview inbox.'
      );
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <>
      <div className="management-filters">
        <input aria-label="Search requests" placeholder="Search patient, seeker, tracking or group" value={search} onChange={(event) => setSearch(event.target.value)} />
        <select
          aria-label="Filter request status"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
        >
          <option value="">All Requests</option>

          {[
            'Submitted',
            'Under Review',
            'Approved',
            'Ready for Collection',
            'Completed',
            'Rejected',
            'Cancelled',
          ].map((status) => <option key={status}>{status}</option>)}
        </select>
        <select aria-label="Filter request urgency" value={urgency} onChange={(event) => setUrgency(event.target.value)}><option value="">All Urgencies</option><option>Routine</option><option>Urgent</option></select>
        <input aria-label="Filter request date" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
      </div>

      {message && (
        <p className="application-message" role="status">
          {message}
        </p>
      )}

      <div className="hospital-list">
        {visibleRequests
          .map((request) => (
            <article className="workspace-panel" key={request.id}>
              <h2>{request.patientName}</h2>

              <p>Seeker: {request.seekerName}</p>
              <p>Hospital: {request.hospitalName}</p>

              <p>
                {request.bloodGroup} · {request.quantity} unit(s)
              </p>

              <p>
                Urgency: {request.urgency} · Status: {request.status}
              </p>

              <p style={{ overflowWrap: 'anywhere' }}>
                {request.trackingNumber}
              </p>

              {request.note && <p>{request.note}</p>}
              <p><strong>Allocated units:</strong> {request.allocatedUnitIds?.length ? request.allocatedUnitIds.map((id) => getHospitalBloodUnits(hospitalId).find((unit) => unit.id === id)?.unitCode || id).join(', ') : 'None'}</p>
              {(request.history || []).length > 0 && <details><summary>Progress history</summary><ol className="timeline-list">{request.history.map((entry, index) => <li key={`${entry.createdAt}-${index}`}><strong>{entry.status}</strong><span>{new Date(entry.createdAt).toLocaleString()}</span><p>{entry.note}</p></li>)}</ol></details>}

              {canProcess && nextStatuses[request.status] && (
                <button
                  className="application-button"
                  type="button"
                  onClick={() => openRequest(request)}
                >
                  Process Request
                </button>
              )}
            </article>
          ))}

        {!filteredRequests.length && (
          <p>No matching requests at this hospital.</p>
        )}
      </div>
      {filteredRequests.length > pageSize && <nav className="pagination" aria-label="Request pages"><button type="button" className="secondary-button" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>Previous</button><span>Page {page} of {pageCount}</span><button type="button" className="secondary-button" disabled={page === pageCount} onClick={() => setPage((value) => value + 1)}>Next</button></nav>}

      {canProcess && selected && (
        <form
          key={selected.id}
          className="workspace-panel management-section"
          onSubmit={handleSubmit}
        >
          <h2>Update Request: {selected.patientName}</h2>

          <label className="application-field">
            Next Status
            <select
              className="organisation-select"
              value={nextStatus}
              onChange={(event) => setNextStatus(event.target.value)}
            >
              {nextStatuses[selected.status].map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </label>

          {nextStatus === 'Approved' && (
            <fieldset className="permission-options">
              <legend>
                Select Exactly {selected.quantity} Available Unit(s)
              </legend>

              {matchingUnits.length === 0 ? (
                <p>No matching available units.</p>
              ) : (
                matchingUnits.map((unit) => (
                  <label key={unit.id}>
                    <input
                      type="checkbox"
                      name="unitIds"
                      value={unit.id}
                    />

                    <span style={{ overflowWrap: 'anywhere' }}>
                      {unit.unitCode} · Expires {unit.expiryDate}
                    </span>
                  </label>
                ))
              )}
            </fieldset>
          )}

          {['Approved', 'Completed'].includes(nextStatus) && (
            <fieldset className="permission-options">
              <legend>Personnel Confirmation</legend>
              <label>
                <input type="checkbox" required />
                {nextStatus === 'Approved'
                  ? 'I confirm the authorised review and unit allocation.'
                  : 'I confirm the reserved units have been issued.'}
              </label>
            </fieldset>
          )}

          <label className="application-field">
            Progress Message for the Seeker
            <textarea name="note" rows={3} required />
          </label>

          <div className="management-actions">
            <button className="application-button" type="submit">
              Save Progress
            </button>

            <button
              className="secondary-button"
              type="button"
              onClick={() => setSelected(null)}
            >
              Close
            </button>
          </div>
        </form>
      )}
    </>
  );
}

export default BloodRequestsPanel;
