import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import DonorSidebar from '../components/DonorSidebar';
import DonorHospitalStatus from '../components/DonorHospitalStatus';

import {
  getDonorProfile,
  getDonorDonationHistory,
} from '../services/donorApi';

import '../styles/donorDashboard.css';
import '../styles/newPages.css';


function DonationHistory() {
  const [donor, setDonor] =
    useState(null);

  const [donations, setDonations] =
    useState([]);

  const [from, setFrom] =
    useState('');

  const [to, setTo] =
    useState('');

  const [order, setOrder] =
    useState('newest');

  const [page, setPage] =
    useState(1);

  const [loading, setLoading] =
    useState(true);

  const [message, setMessage] =
    useState('');


  useEffect(() => {
    loadHistory();
  }, []);


  useEffect(() => {
    setPage(1);
  }, [from, to, order]);


  async function loadHistory() {
    try {
      setLoading(true);
      setMessage('');

      const [
        profileResponse,
        historyResponse,
      ] = await Promise.all([
        getDonorProfile(),
        getDonorDonationHistory(),
      ]);

      setDonor(
        profileResponse.data.donor
      );

      setDonations(
        historyResponse.data
          .donations || []
      );
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }


  const history = useMemo(() => {
    return [...donations]
      .filter((donation) => {
        if (
          donation.status !==
          'Completed'
        ) {
          return false;
        }

        if (
          from &&
          donation.donation_date <
            from
        ) {
          return false;
        }

        if (
          to &&
          donation.donation_date >
            to
        ) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (order === 'oldest') {
          return a.donation_date.localeCompare(
            b.donation_date
          );
        }

        return b.donation_date.localeCompare(
          a.donation_date
        );
      });
  }, [
    donations,
    from,
    to,
    order,
  ]);


  const pageSize = 8;

  const pageCount = Math.max(
    1,
    Math.ceil(
      history.length / pageSize
    )
  );

  const visible =
    history.slice(
      (page - 1) * pageSize,
      page * pageSize
    );


  return (
    <main className="donor-dashboard">
      <DonorSidebar />

      <section className="donor-main">
        <h1>Donation History</h1>

        {message && (
          <p
            className="application-message"
            role="alert"
          >
            {message}
          </p>
        )}

        {loading ? (
          <p>
            Loading donation history...
          </p>
        ) : (
          <>
            <DonorHospitalStatus
              status={
                donor?.hospital_status
              }
            />

            <section className="workspace-panel management-section">
              <h2>
                {donor?.full_name ||
                  'Donor'}
              </h2>

              <p>
                Registered Hospital:{' '}
                <strong>
                  {donor?.hospital_name ||
                    '-'}
                </strong>
              </p>

              <p>
                <strong>
                  Total completed
                  donations:{' '}
                  {donations.filter(
                    (item) =>
                      item.status ===
                      'Completed'
                  ).length}
                </strong>
              </p>

              <div className="management-filters">
                <label>
                  From

                  <input
                    type="date"
                    value={from}
                    onChange={(event) =>
                      setFrom(
                        event.target.value
                      )
                    }
                  />
                </label>

                <label>
                  To

                  <input
                    type="date"
                    value={to}
                    onChange={(event) =>
                      setTo(
                        event.target.value
                      )
                    }
                  />
                </label>

                <label>
                  Sort

                  <select
                    value={order}
                    onChange={(event) =>
                      setOrder(
                        event.target.value
                      )
                    }
                  >
                    <option value="newest">
                      Newest first
                    </option>

                    <option value="oldest">
                      Oldest first
                    </option>
                  </select>
                </label>
              </div>

              {history.length === 0 ? (
                <p className="workspace-empty">
                  No completed donations
                  match this date range.
                </p>
              ) : (
                <div className="management-table-wrapper">
                  <table className="management-table">
                    <thead>
                      <tr>
                        <th>Reference</th>
                        <th>Date</th>
                        <th>
                          Blood Group
                        </th>
                        <th>Entry</th>
                        <th>Unit Code</th>
                        <th>
                          Unit Status
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {visible.map(
                        (donation) => (
                          <tr
                            key={
                              donation.id
                            }
                          >
                            <td>
                              {
                                donation.donation_reference
                              }
                            </td>

                            <td>
                              {
                                donation.donation_date
                              }
                            </td>

                            <td>
                              {
                                donation.blood_group
                              }
                            </td>

                            <td>
                              {
                                donation.entry_method
                              }
                            </td>

                            <td>
                              {donation.unit_code ||
                                '-'}
                            </td>

                            <td>
                              {donation.inventory_status ||
                                '-'}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {history.length >
                pageSize && (
                <nav
                  className="pagination"
                  aria-label="Donation history pages"
                >
                  <button
                    className="secondary-button"
                    type="button"
                    disabled={
                      page === 1
                    }
                    onClick={() =>
                      setPage(
                        (current) =>
                          current - 1
                      )
                    }
                  >
                    Previous
                  </button>

                  <span>
                    Page {page} of{' '}
                    {pageCount}
                  </span>

                  <button
                    className="secondary-button"
                    type="button"
                    disabled={
                      page ===
                      pageCount
                    }
                    onClick={() =>
                      setPage(
                        (current) =>
                          current + 1
                      )
                    }
                  >
                    Next
                  </button>
                </nav>
              )}
            </section>
          </>
        )}
      </section>
    </main>
  );
}

export default DonationHistory;