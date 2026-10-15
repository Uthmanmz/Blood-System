import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import HospitalAdminNav
  from '../components/HospitalAdminNav';

import {
  getInventory,
  getInventorySummary,
} from '../services/inventoryApi';

import '../styles/newPages.css';


function HospitalInventory() {
  const [units, setUnits] =
    useState([]);

  const [summary, setSummary] =
    useState(null);

  const [search, setSearch] =
    useState('');

  const [status, setStatus] =
    useState('All');

  const [loading, setLoading] =
    useState(true);

  const [message, setMessage] =
    useState('');


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
        inventoryResponse.data.units ||
        []
      );

      setSummary(
        summaryResponse.data.summary ||
        null
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

      return units.filter(
        (unit) => {
          const matchesSearch =
            !query ||
            [
              unit.unit_code,
              unit.blood_group,
              unit.donor_name,
              unit.donation_reference,
              unit.status,
            ]
              .join(' ')
              .toLowerCase()
              .includes(query);

          const matchesStatus =
            status === 'All' ||
            unit.status === status;

          return (
            matchesSearch &&
            matchesStatus
          );
        }
      );
    }, [
      units,
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
            Hospital Blood Inventory
          </h1>

          <p>
            Monitor blood units belonging
            to your hospital.
          </p>
        </div>
      </header>


      <HospitalAdminNav />


      <section className="workspace-content">

        {message && (
          <p className="application-message">
            {message}
          </p>
        )}


        {summary && (
          <div className="workspace-grid">

            {[
              [
                'Total Units',
                summary.total_units,
              ],
              [
                'Awaiting Screening',
                summary.awaiting_screening,
              ],
              [
                'Available',
                summary.available,
              ],
              [
                'Reserved',
                summary.reserved,
              ],
              [
                'Issued',
                summary.issued,
              ],
              [
                'Expired',
                summary.expired,
              ],
              [
                'Discarded',
                summary.discarded,
              ],
            ].map(
              ([label, value]) => (
                <article
                  className="workspace-card"
                  key={label}
                >
                  <p>{label}</p>
                  <strong>
                    {value}
                  </strong>
                </article>
              )
            )}

          </div>
        )}


        <section className="workspace-panel">

          <div className="management-heading">

            <div>
              <h2>
                Blood Units
              </h2>

              <p>
                Operational changes are
                performed by authorised
                Personnel.
              </p>
            </div>


            <div className="management-filters">

              <input
                placeholder="Search inventory"
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
            <p>
              Loading inventory...
            </p>
          ) : filtered.length === 0 ? (
            <p className="workspace-empty">
              No matching blood units.
            </p>
          ) : (
            <div className="management-table-wrapper">

              <table className="management-table">

                <thead>
                  <tr>
                    <th>Unit</th>
                    <th>Donor</th>
                    <th>Blood</th>
                    <th>Collection</th>
                    <th>Expiry</th>
                    <th>Donation</th>
                    <th>Status</th>
                  </tr>
                </thead>


                <tbody>

                  {filtered.map(
                    (unit) => (
                      <tr key={unit.id}>

                        <td>
                          <strong>
                            {
                              unit.unit_code
                            }
                          </strong>
                        </td>

                        <td>
                          {
                            unit.donor_name
                          }

                          <br />

                          <small>
                            {
                              unit.donor_phone
                            }
                          </small>
                        </td>

                        <td>
                          {
                            unit.blood_group
                          }
                        </td>

                        <td>
                          {
                            unit.collection_date
                          }
                        </td>

                        <td>
                          {
                            unit.expiry_date
                          }
                        </td>

                        <td>
                          {
                            unit
                              .donation_reference
                          }
                        </td>

                        <td>
                          <span className="status-badge">
                            {
                              unit.status
                            }
                          </span>
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

export default HospitalInventory;