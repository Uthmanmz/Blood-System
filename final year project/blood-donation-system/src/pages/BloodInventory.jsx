import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import PersonnelSidebar from '../components/PersonnelSideBar';

import {
  getInventory,
  getInventorySummary,
  releaseBloodUnit,
  discardBloodUnit,
} from '../services/inventoryApi';

import '../styles/personnelDashboard.css';
import '../styles/newPages.css';


function BloodInventory() {
  const [units, setUnits] = useState([]);
  const [summary, setSummary] = useState(null);

  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState(null);

  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] =
    useState('All');


  useEffect(() => {
    loadInventory();
  }, []);


  async function loadInventory() {
    try {
      setLoading(true);

      const [
        inventoryResponse,
        summaryResponse,
      ] = await Promise.all([
        getInventory(),
        getInventorySummary(),
      ]);

      setUnits(
        inventoryResponse.data.units || []
      );

      setSummary(
        summaryResponse.data.summary || null
      );
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }


  const filteredUnits = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    return units.filter((unit) => {
      const matchesSearch =
        !query ||
        [
          unit.unit_code,
          unit.blood_group,
          unit.donation_reference,
          unit.donor_name,
          unit.donor_phone,
          unit.status,
        ]
          .join(' ')
          .toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === 'All' ||
        unit.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [
    units,
    search,
    statusFilter,
  ]);


  async function handleRelease(unit) {
    const confirmed = window.confirm(
      `Release ${unit.unit_code} after successful screening?\n\nThe unit will become Available for blood requests.`
    );

    if (!confirmed) return;

    try {
      setWorkingId(unit.id);
      setMessage('');

      await releaseBloodUnit(unit.id);

      setMessage(
        `${unit.unit_code} released successfully and is now Available.`
      );

      await loadInventory();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setWorkingId(null);
    }
  }


  async function handleDiscard(unit) {
    const reason = window.prompt(
      `Enter the reason for discarding ${unit.unit_code}:`
    );

    if (reason === null) {
      return;
    }

    if (!reason.trim()) {
      setMessage(
        'A discard reason is required.'
      );
      return;
    }

    try {
      setWorkingId(unit.id);
      setMessage('');

      await discardBloodUnit(
        unit.id,
        reason.trim()
      );

      setMessage(
        `${unit.unit_code} discarded successfully.`
      );

      await loadInventory();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setWorkingId(null);
    }
  }


  const cards = summary
    ? [
        ['Total Units', summary.total_units],
        [
          'Awaiting Screening',
          summary.awaiting_screening,
        ],
        ['Available', summary.available],
        ['Reserved', summary.reserved],
        ['Issued', summary.issued],
        ['Expired', summary.expired],
        ['Discarded', summary.discarded],
      ]
    : [];


  return (
    <main className="personnel-layout">
      <PersonnelSidebar />

      <section className="personnel-main">
        <h1>Blood Inventory</h1>

        <p>
          Manage whole-blood units belonging
          to your hospital.
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
          {cards.map(([label, value]) => (
            <article
              className="workspace-card"
              key={label}
            >
              <p>{label}</p>
              <strong>{value}</strong>
            </article>
          ))}
        </div>


        <section className="workspace-panel">
          <div className="management-heading">
            <div>
              <h2>Blood Units</h2>

              <p>
                Screening, availability and
                issue status of recorded units.
              </p>
            </div>

            <div className="management-filters">
              <input
                placeholder="Search unit, donor, blood group or reference"
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
                <option value="All">
                  All Statuses
                </option>

                <option value="Awaiting Screening">
                  Awaiting Screening
                </option>

                <option value="Available">
                  Available
                </option>

                <option value="Reserved">
                  Reserved
                </option>

                <option value="Issued">
                  Issued
                </option>

                <option value="Expired">
                  Expired
                </option>

                <option value="Discarded">
                  Discarded
                </option>
              </select>
            </div>
          </div>


          {loading ? (
            <p>Loading inventory...</p>
          ) : filteredUnits.length === 0 ? (
            <p className="workspace-empty">
              No matching blood units found.
            </p>
          ) : (
            <div className="management-table-wrapper">
              <table className="management-table">
                <thead>
                  <tr>
                    <th>Unit Code</th>
                    <th>Donor</th>
                    <th>Blood</th>
                    <th>Collection</th>
                    <th>Expiry</th>
                    <th>Status</th>
                    <th>Donation</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredUnits.map((unit) => (
                    <tr key={unit.id}>
                      <td>
                        <strong>
                          {unit.unit_code}
                        </strong>
                      </td>

                      <td>
                        {unit.donor_name}

                        <br />

                        <small>
                          {unit.donor_phone}
                        </small>
                      </td>

                      <td>
                        {unit.blood_group}
                      </td>

                      <td>
                        {unit.collection_date}
                      </td>

                      <td>
                        {unit.expiry_date}
                      </td>

                      <td>
                        <span className="status-badge">
                          {unit.status}
                        </span>
                      </td>

                      <td>
                        {unit.donation_reference}
                      </td>

                      <td>
                        <div className="management-actions">

                          {unit.status ===
                            'Awaiting Screening' && (
                            <button
                              type="button"
                              className="application-button"
                              disabled={
                                workingId === unit.id
                              }
                              onClick={() =>
                                handleRelease(unit)
                              }
                            >
                              {workingId === unit.id
                                ? 'Processing...'
                                : 'Release'}
                            </button>
                          )}

                          {[
                            'Awaiting Screening',
                            'Available',
                          ].includes(
                            unit.status
                          ) && (
                            <button
                              type="button"
                              className="secondary-button"
                              disabled={
                                workingId === unit.id
                              }
                              onClick={() =>
                                handleDiscard(unit)
                              }
                            >
                              Discard
                            </button>
                          )}

                          {![
                            'Awaiting Screening',
                            'Available',
                          ].includes(
                            unit.status
                          ) && (
                            <span>
                              No manual action
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

export default BloodInventory;