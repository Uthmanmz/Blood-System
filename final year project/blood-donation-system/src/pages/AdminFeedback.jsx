import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import AdminSidebar
  from '../components/AdminSidebar';

import {
  getAdminFeedback,
  updateAdminFeedback,
} from '../services/feedbackApi';

import '../styles/adminDashboard.css';
import '../styles/newPages.css';


function formatDate(value) {
  if (!value) {
    return 'Not yet reviewed';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}


function AdminFeedback() {
  const [feedback, setFeedback] =
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
    useState('');

  const [openId, setOpenId] =
    useState(null);

  const [notes, setNotes] =
    useState({});


  useEffect(() => {
    loadFeedback();
  }, []);


  async function loadFeedback() {
    try {
      setLoading(true);
      setMessage('');

      const response =
        await getAdminFeedback();

      const rows =
        response.data.feedback || [];

      setFeedback(rows);

      const noteValues = {};

      rows.forEach((item) => {
        noteValues[item.id] =
          item.admin_note || '';
      });

      setNotes(noteValues);

    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }


  const counts = useMemo(() => {
    return {
      total: feedback.length,

      new: feedback.filter(
        (item) =>
          item.status === 'New'
      ).length,

      reviewed: feedback.filter(
        (item) =>
          item.status === 'Reviewed'
      ).length,

      resolved: feedback.filter(
        (item) =>
          item.status === 'Resolved'
      ).length,
    };
  }, [feedback]);


  const filteredFeedback =
    useMemo(() => {
      const term =
        search
          .trim()
          .toLowerCase();

      return feedback.filter(
        (item) => {
          const matchesSearch =
            !term ||
            [
              item.full_name,
              item.email,
              item.phone,
              item.subject,
              item.message,
            ]
              .filter(Boolean)
              .join(' ')
              .toLowerCase()
              .includes(term);

          const matchesStatus =
            !statusFilter ||
            item.status ===
              statusFilter;

          return (
            matchesSearch &&
            matchesStatus
          );
        }
      );
    }, [
      feedback,
      search,
      statusFilter,
    ]);


  async function handleStatusUpdate(
    item,
    status
  ) {
    try {
      setWorkingId(item.id);
      setMessage('');

      const response =
        await updateAdminFeedback(
          item.id,
          status,
          notes[item.id] || ''
        );

      setMessage(
        response.message
      );

      await loadFeedback();

    } catch (error) {
      setMessage(error.message);
    } finally {
      setWorkingId(null);
    }
  }


  return (
    <main className="admin-layout">

      <AdminSidebar />


      <section className="admin-main">

        <header className="admin-header">

          <div>

            <p>
              PUBLIC COMMUNICATION
            </p>

            <h1>
              Public Feedback
            </h1>

            <span>
              Review feedback submitted
              through the public website
              and track how each message
              is handled.
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


        <div className="admin-stat-grid">

          <article className="admin-stat-card">
            <p>
              Total Feedback
            </p>

            <h2>
              {counts.total}
            </h2>
          </article>


          <article className="admin-stat-card">
            <p>
              New
            </p>

            <h2>
              {counts.new}
            </h2>
          </article>


          <article className="admin-stat-card">
            <p>
              Reviewed
            </p>

            <h2>
              {counts.reviewed}
            </h2>
          </article>


          <article className="admin-stat-card">
            <p>
              Resolved
            </p>

            <h2>
              {counts.resolved}
            </h2>
          </article>

        </div>


        <section
          className="workspace-panel"
          style={{
            marginTop: '24px',
          }}
        >

          <div className="management-heading">

            <div>
              <h2>
                Feedback Inbox
              </h2>

              <p>
                New feedback appears
                first.
              </p>
            </div>

          </div>


          <div className="management-filters">

            <input
              type="search"
              placeholder="Search feedback"
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

              <option value="">
                All Statuses
              </option>

              <option value="New">
                New
              </option>

              <option value="Reviewed">
                Reviewed
              </option>

              <option value="Resolved">
                Resolved
              </option>

            </select>

          </div>


          {loading ? (

            <p>
              Loading public feedback...
            </p>

          ) : filteredFeedback.length === 0 ? (

            <p className="workspace-empty">
              No feedback found.
            </p>

          ) : (

            <div className="hospital-list">

              {filteredFeedback.map(
                (item) => {

                  const isOpen =
                    openId === item.id;

                  const isWorking =
                    workingId === item.id;


                  return (
                    <article
                      key={item.id}
                      className="workspace-panel"
                    >

                      <div className="management-heading">

                        <div>

                          <h3>
                            {item.subject}
                          </h3>

                          <p>
                            {item.full_name}
                            {' • '}
                            {
                              formatDate(
                                item.created_at
                              )
                            }
                          </p>

                        </div>


                        <span className="management-badge">
                          {item.status}
                        </span>

                      </div>


                      <p>
                        {item.message}
                      </p>


                      <div className="management-actions">

                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() =>
                            setOpenId(
                              isOpen
                                ? null
                                : item.id
                            )
                          }
                        >
                          {isOpen
                            ? 'Hide Details'
                            : 'Review'}
                        </button>

                      </div>


                      {isOpen && (

                        <div className="record-details">

                          <div className="detail-grid">

                            <p>
                              <strong>
                                Name
                              </strong>
                              <br />
                              {
                                item.full_name
                              }
                            </p>


                            <p>
                              <strong>
                                Email
                              </strong>
                              <br />
                              {
                                item.email ||
                                'Not provided'
                              }
                            </p>


                            <p>
                              <strong>
                                Phone
                              </strong>
                              <br />
                              {
                                item.phone ||
                                'Not provided'
                              }
                            </p>


                            <p>
                              <strong>
                                Reviewed By
                              </strong>
                              <br />
                              {
                                item
                                  .reviewed_by_name ||
                                'Not yet reviewed'
                              }
                            </p>


                            <p>
                              <strong>
                                Reviewed At
                              </strong>
                              <br />
                              {
                                formatDate(
                                  item.reviewed_at
                                )
                              }
                            </p>

                          </div>


                          <label className="application-field">

                            Admin Note

                            <textarea
                              rows="4"
                              value={
                                notes[item.id] ||
                                ''
                              }
                              onChange={(event) =>
                                setNotes(
                                  (current) => ({
                                    ...current,

                                    [item.id]:
                                      event
                                        .target
                                        .value,
                                  })
                                )
                              }
                              placeholder="Optional internal note"
                            />

                          </label>


                          <div className="management-actions">

                            <button
                              type="button"
                              className="secondary-button"
                              disabled={
                                isWorking
                              }
                              onClick={() =>
                                handleStatusUpdate(
                                  item,
                                  'New'
                                )
                              }
                            >
                              Mark New
                            </button>


                            <button
                              type="button"
                              className="secondary-button"
                              disabled={
                                isWorking
                              }
                              onClick={() =>
                                handleStatusUpdate(
                                  item,
                                  'Reviewed'
                                )
                              }
                            >
                              Mark Reviewed
                            </button>


                            <button
                              type="button"
                              className="application-button"
                              disabled={
                                isWorking
                              }
                              onClick={() =>
                                handleStatusUpdate(
                                  item,
                                  'Resolved'
                                )
                              }
                            >
                              {isWorking
                                ? 'Saving...'
                                : 'Resolve'}
                            </button>

                          </div>

                        </div>
                      )}

                    </article>
                  );
                }
              )}

            </div>
          )}

        </section>

      </section>

    </main>
  );
}


export default AdminFeedback;