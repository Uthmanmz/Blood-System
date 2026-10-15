import { useEffect, useState } from 'react';

import {
  getHospitalBloodUnits,
  getHospitalDonations,
  addHospitalBloodUnit,
  changeHospitalBloodUnitStatus,
  subscribeToDemoChanges,
} from '../services/demoStore';

import '../styles/newPages.css';
import '../styles/inventoryManagement.css';

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const statuses = [
  'Awaiting Screening',
  'Available',
  'Reserved',
  'Issued',
  'Expired',
  'Discarded',
];

function BloodInventoryPanel({ hospitalId, canManage = false }) {
  const [units, setUnits] = useState(() =>
    getHospitalBloodUnits(hospitalId)
  );

  const [donations, setDonations] = useState(() =>
    getHospitalDonations(hospitalId)
  );

  const [bloodGroup, setBloodGroup] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState('');
  const [action, setAction] = useState(null);
  const [historyUnitId, setHistoryUnitId] = useState('');

  useEffect(() => subscribeToDemoChanges(() => {
    setUnits(getHospitalBloodUnits(hospitalId));
    setDonations(getHospitalDonations(hospitalId));
  }), [hospitalId]);

  const filteredUnits = units.filter(
    (unit) =>
      `${unit.unitCode} ${unit.donorName || ''} ${unit.donationId || ''}`.toLowerCase().includes(search.trim().toLowerCase()) &&
      (!bloodGroup || unit.bloodGroup === bloodGroup) &&
      (!status || unit.status === status)
  );
  const pageSize = 8;
  const pageCount = Math.max(1, Math.ceil(filteredUnits.length / pageSize));
  const visibleUnits = filteredUnits.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => setPage(1), [bloodGroup, status, search]);

  function refreshUnits() {
    setUnits(getHospitalBloodUnits(hospitalId));
  }

  function handleAdd(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const values = new FormData(form);

    try {
      addHospitalBloodUnit({
        hospitalId,
        donationId: values.get('donationId'),
        expiryDate: values.get('expiryDate'),
      });

      refreshUnits();
      form.reset();

      setMessage(
        'Unit recorded. It is not available for use until authorised release is confirmed. The donor’s donation count has not changed.'
      );
    } catch (error) {
      setMessage(error.message);
    }
  }

  function handleStatusChange(event) {
    event.preventDefault();

    const values = new FormData(event.currentTarget);

    try {
      changeHospitalBloodUnitStatus({
        hospitalId,
        unitId: action.unit.id,
        nextStatus: action.nextStatus,
        note: values.get('note') || '',
        releaseConfirmed: values.get('releaseConfirmed') === 'on',
      });

      refreshUnits();
      setAction(null);
      setMessage('Unit status updated in the browser preview.');
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <>
      <div className="inventory-summary">
        {statuses.map((label) => (
          <article key={label}>
            <p>{label}</p>
            <strong>
              {units.filter((unit) => unit.status === label).length}
            </strong>
          </article>
        ))}
      </div>

      {message && (
        <p className="application-message" role="status">
          {message}
        </p>
      )}

      {canManage && (
        <details className="workspace-panel management-section">
          <summary>Record a Blood Unit</summary>

          <form className="management-section" onSubmit={handleAdd}>
            <label className="application-field">
              Source Donation
              <select
                className="organisation-select"
                name="donationId"
                defaultValue=""
                required
              >
                <option value="">Select Completed Donation</option>

                {donations.map((donation) => (
                  <option key={donation.id} value={donation.id}>
                    {donation.donorName} - {donation.bloodGroup}
                    {' - '}{donation.donationDate}
                  </option>
                ))}
              </select>
            </label>

            <label className="application-field">
              Expiry Date
              <input name="expiryDate" type="date" required />
            </label>

            <p>
              Blood group and collection date come from the selected
              donation. Use sample data only.
            </p>

            <button
              className="application-button"
              type="submit"
              disabled={donations.length === 0}
            >
              Record Unit
            </button>

            {donations.length === 0 && (
              <p>Record a completed donation at this hospital first.</p>
            )}
          </form>
        </details>
      )}

      <div className="inventory-filters">
        <input aria-label="Search blood units" placeholder="Search unit, donor or donation" value={search} onChange={(event) => setSearch(event.target.value)} />
        <select
          aria-label="Filter by blood group"
          value={bloodGroup}
          onChange={(event) => setBloodGroup(event.target.value)}
        >
          <option value="">All Blood Groups</option>

          {bloodGroups.map((group) => (
            <option key={group}>{group}</option>
          ))}
        </select>

        <select
          aria-label="Filter by status"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="">All Statuses</option>

          {statuses.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </div>

      <section className="workspace-panel">
        <h2>Blood Unit Records</h2>

        {filteredUnits.length === 0 ? (
          <p>No units match the selected filters.</p>
        ) : (
          <div className="management-table-wrapper">
            <table className="management-table">
              <thead>
                <tr>
                  <th>Unit ID</th>
                  <th>Group</th>
                  <th>Donor / Source</th>
                  <th>Collected</th>
                  <th>Expiry</th>
                  <th>Status</th>
                  {canManage && <th>Actions</th>}
                </tr>
              </thead>

              <tbody>
                {visibleUnits.map((unit) => (
                  <tr key={unit.id}>
                    <td>
                      <span className="unit-code">{unit.unitCode}</span>
                      <button
                        className="table-link-button"
                        type="button"
                        onClick={() => setHistoryUnitId(unit.id)}
                      >
                        View History
                      </button>
                    </td>
                    <td>{unit.bloodGroup}</td>
                    <td>{unit.donorName || donations.find((item) => item.id === unit.donationId)?.donorName || 'Unavailable'}<br /><small>{unit.donationId}</small></td>
                    <td>{unit.collectionDate}</td>
                    <td>{unit.expiryDate}</td>
                    <td>
                      <span
                        className={`unit-status unit-status--${unit.status.toLowerCase().replaceAll(' ', '-')}`}
                      >
                        {unit.status}
                      </span>
                    </td>

                    {canManage && (
                      <td>
                        <div className="management-actions">
                          {unit.status === 'Awaiting Screening' && (
                            <button
                              className="application-button"
                              type="button"
                              onClick={() =>
                                setAction({
                                  unit,
                                  nextStatus: 'Available',
                                })
                              }
                            >
                              Review Release
                            </button>
                          )}

                          {[
                            'Awaiting Screening',
                            'Available',
                            'Expired',
                          ].includes(unit.status) && (
                            <button
                              className="secondary-button"
                              type="button"
                              onClick={() =>
                                setAction({
                                  unit,
                                  nextStatus: 'Discarded',
                                })
                              }
                            >
                              Discard
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {filteredUnits.length > pageSize && <nav className="pagination" aria-label="Inventory pages"><button type="button" className="secondary-button" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>Previous</button><span>Page {page} of {pageCount}</span><button type="button" className="secondary-button" disabled={page === pageCount} onClick={() => setPage((value) => value + 1)}>Next</button></nav>}

      {historyUnitId && (() => {
        const unit = units.find((item) => item.id === historyUnitId);
        if (!unit) return null;
        return (
          <section className="workspace-panel management-section">
            <div className="management-heading">
              <div><h2>Unit History</h2><p className="unit-code">{unit.unitCode}</p></div>
              <button className="secondary-button" type="button" onClick={() => setHistoryUnitId('')}>Close</button>
            </div>
            <p><strong>Current allocation:</strong> {unit.requestId ? `Reserved for request ${unit.requestId}` : 'Not allocated to a request'}</p>
            {(unit.history || []).length === 0 ? <p>No history entries.</p> : (
              <ol className="timeline-list">
                {unit.history.map((entry, index) => (
                  <li key={`${entry.changedAt}-${index}`}>
                    <strong>{entry.status}</strong>
                    <span>{entry.changedAt ? new Date(entry.changedAt).toLocaleString() : 'Date unavailable'}</span>
                    {entry.requestId && <p>Request: {entry.requestId}</p>}
                    {entry.note && <p>{entry.note}</p>}
                  </li>
                ))}
              </ol>
            )}
          </section>
        );
      })()}

      {canManage && action && (
        <form
          key={`${action.unit.id}:${action.nextStatus}`}
          className="workspace-panel inventory-action-form"
          onSubmit={handleStatusChange}
        >
          <h2>
            {action.nextStatus === 'Available'
              ? 'Confirm Authorised Release'
              : 'Discard Blood Unit'}
          </h2>

          <p className="unit-code">{action.unit.unitCode}</p>

          {action.nextStatus === 'Available' && (
            <fieldset className="permission-options">
              <legend>Release Confirmation</legend>

              <label>
                <input
                  type="checkbox"
                  name="releaseConfirmed"
                  required
                />
                I confirm that authorised personnel have completed the
                required checks and approved release.
              </label>
            </fieldset>
          )}

          <label className="application-field">
            {action.nextStatus === 'Discarded'
              ? 'Reason for Discarding'
              : 'Release Note'}
            <textarea
              name="note"
              rows={3}
              required
            />
          </label>

          <div className="management-actions">
            <button className="application-button" type="submit">
              Confirm
            </button>

            <button
              className="secondary-button"
              type="button"
              onClick={() => setAction(null)}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </>
  );
}

export default BloodInventoryPanel;
