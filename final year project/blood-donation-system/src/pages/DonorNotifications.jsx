import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import DonorSidebar
  from '../components/DonorSidebar';

import DonorHospitalStatus
  from '../components/DonorHospitalStatus';

import NotificationBell
  from '../components/NotificationBell';

import {
  getDonorProfile,
} from '../services/donorApi';

import {
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../services/notificationApi';

import '../styles/donorDashboard.css';
import '../styles/newPages.css';


function DonorNotifications() {
  const [donor, setDonor] =
    useState(null);

  const [
    notifications,
    setNotifications,
  ] = useState([]);

  const [filter, setFilter] =
    useState('All');

  const [page, setPage] =
    useState(1);

  const [openedId, setOpenedId] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [markingAll, setMarkingAll] =
    useState(false);

  const [message, setMessage] =
    useState('');


  useEffect(() => {
    loadInbox();
  }, []);


  useEffect(() => {
    setPage(1);
  }, [filter]);


  async function loadInbox() {
    try {
      setLoading(true);
      setMessage('');

      const [
        profileResponse,
        notificationResponse,
      ] = await Promise.all([
        getDonorProfile(),
        getMyNotifications(),
      ]);

      setDonor(
        profileResponse.data?.donor ||
          null
      );

      setNotifications(
        notificationResponse.data
          ?.notifications || []
      );

    } catch (error) {
      setMessage(
        error.message ||
          'Unable to load notifications.'
      );
    } finally {
      setLoading(false);
    }
  }


  function isRead(notification) {
    return (
      Number(notification.is_read) ===
        1 ||
      Boolean(notification.read_at)
    );
  }


  const unreadCount =
    useMemo(
      () =>
        notifications.filter(
          (notification) =>
            !isRead(notification)
        ).length,
      [notifications]
    );


  const filtered =
    useMemo(() => {
      if (filter === 'Read') {
        return notifications.filter(
          isRead
        );
      }

      if (filter === 'Unread') {
        return notifications.filter(
          (notification) =>
            !isRead(notification)
        );
      }

      return notifications;
    }, [notifications, filter]);


  const pageSize = 8;

  const pageCount = Math.max(
    1,
    Math.ceil(
      filtered.length / pageSize
    )
  );


  useEffect(() => {
    if (page > pageCount) {
      setPage(pageCount);
    }
  }, [page, pageCount]);


  const visible =
    filtered.slice(
      (page - 1) * pageSize,
      page * pageSize
    );


  async function openNotification(
    notification
  ) {
    if (
      String(openedId) ===
      String(notification.id)
    ) {
      setOpenedId(null);
      return;
    }

    setOpenedId(notification.id);
    setMessage('');


    if (isRead(notification)) {
      return;
    }


    try {
      await markNotificationRead(
        notification.id
      );

      setNotifications(
        (current) =>
          current.map((item) =>
            String(item.id) ===
            String(notification.id)
              ? {
                  ...item,
                  is_read: 1,
                  read_at:
                    new Date()
                      .toISOString(),
                }
              : item
          )
      );


      window.dispatchEvent(
        new Event(
          'notifications-updated'
        )
      );

    } catch (error) {
      setMessage(
        error.message ||
          'Unable to mark notification as read.'
      );
    }
  }


  async function handleMarkAllRead() {
    if (
      unreadCount === 0 ||
      markingAll
    ) {
      return;
    }

    try {
      setMarkingAll(true);
      setMessage('');

      const response =
        await markAllNotificationsRead();


      setNotifications(
        (current) =>
          current.map(
            (notification) => ({
              ...notification,
              is_read: 1,

              read_at:
                notification.read_at ||
                new Date()
                  .toISOString(),
            })
          )
      );


      setMessage(
        response.message ||
          'All notifications marked as read.'
      );


      window.dispatchEvent(
        new Event(
          'notifications-updated'
        )
      );

    } catch (error) {
      setMessage(
        error.message ||
          'Unable to mark all notifications as read.'
      );
    } finally {
      setMarkingAll(false);
    }
  }


  function formatDate(value) {
    if (!value) {
      return '';
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return value;
    }

    return date.toLocaleString();
  }


  return (
    <main className="donor-dashboard">

      <DonorSidebar />

      <section className="donor-main">

        <header className="dashboard-header">

          <div>

            <p className="workspace-label">
              DONOR PORTAL
            </p>

            <h1>
              My Notifications
            </h1>

            <span>
              View hospital messages,
              donation reminders and other
              notifications sent to your
              donor account.
            </span>

          </div>


          <button
            type="button"
            className="secondary-button"
            onClick={
              handleMarkAllRead
            }
            disabled={
              unreadCount === 0 ||
              markingAll
            }
          >
            {markingAll
              ? 'Marking...'
              : 'Mark All as Read'}
          </button>

        </header>


        {message && (
          <p
            className="application-message"
            role="status"
          >
            {message}
          </p>
        )}


        {loading ? (
          <section className="workspace-panel">

            <p>
              Loading notifications...
            </p>

          </section>
        ) : (
          <>

            <DonorHospitalStatus
              status={
                donor?.hospital_status
              }
            />


            <div className="workspace-grid">

              <article className="workspace-card">

                <p>
                  Total Notifications
                </p>

                <strong>
                  {notifications.length}
                </strong>

              </article>


              <article className="workspace-card">

                <p>
                  Unread Notifications
                </p>

                <strong>
                  {unreadCount}
                </strong>

              </article>

            </div>


            <div className="management-section">

              <NotificationBell />

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
                    {donor?.full_name
                      ? `${donor.full_name}'s Inbox`
                      : 'Notification Inbox'}
                  </h2>

                  <p>
                    Open a message to read it.
                    Unread messages are marked
                    automatically after opening.
                  </p>

                </div>

              </div>


              <div className="management-filters">

                <label>

                  Show

                  <select
                    value={filter}
                    onChange={(event) =>
                      setFilter(
                        event.target.value
                      )
                    }
                  >
                    <option value="All">
                      All
                    </option>

                    <option value="Unread">
                      Unread
                    </option>

                    <option value="Read">
                      Read
                    </option>
                  </select>

                </label>

              </div>


              {filtered.length === 0 ? (
                <p className="workspace-empty">

                  No{' '}
                  {filter.toLowerCase()}{' '}
                  notifications.

                </p>
              ) : (
                <div className="hospital-list">

                  {visible.map(
                    (notification) => {
                      const read =
                        isRead(
                          notification
                        );

                      const opened =
                        String(
                          openedId
                        ) ===
                        String(
                          notification.id
                        );

                      return (
                        <article
                          className={
                            read
                              ? 'workspace-panel notification-item'
                              : 'workspace-panel notification-item notification-item--unread'
                          }
                          key={
                            notification.id
                          }
                        >

                          <button
                            className="notification-toggle"
                            type="button"
                            aria-expanded={
                              opened
                            }
                            onClick={() =>
                              openNotification(
                                notification
                              )
                            }
                          >

                            <div className="notification-heading">

                              <div>

                                <span
                                  className={
                                    read
                                      ? 'notification-status notification-status--read'
                                      : 'notification-status notification-status--unread'
                                  }
                                >
                                  {read
                                    ? 'Read'
                                    : 'Unread'}
                                </span>


                                <strong>
                                  {
                                    notification.subject
                                  }
                                </strong>

                              </div>


                              <span>
                                {formatDate(
                                  notification.created_at
                                )}
                              </span>

                            </div>

                          </button>


                          {opened && (
                            <div className="notification-body">

                              <p>
                                {
                                  notification.message
                                }
                              </p>


                              <div className="application-grid">

                                <div>

                                  <strong>
                                    Type
                                  </strong>

                                  <p>
                                    {
                                      notification.notification_type ||
                                      'General'
                                    }
                                  </p>

                                </div>


                                <div>

                                  <strong>
                                    Delivery Channel
                                  </strong>

                                  <p>
                                    {
                                      notification.delivery_channel ||
                                      'In-app'
                                    }
                                  </p>

                                </div>


                                {(notification.delivery_channel ===
                                  'Email' ||
                                  notification.delivery_channel ===
                                    'Both') && (
                                  <div>

                                    <strong>
                                      Email Status
                                    </strong>

                                    <p>
                                      {
                                        notification.email_status ||
                                        'Pending'
                                      }
                                    </p>

                                  </div>
                                )}


                                {(notification.delivery_channel ===
                                  'SMS' ||
                                  notification.delivery_channel ===
                                    'Both') && (
                                  <div>

                                    <strong>
                                      SMS Status
                                    </strong>

                                    <p>
                                      {
                                        notification.sms_status ||
                                        'Pending'
                                      }
                                    </p>

                                  </div>
                                )}

                              </div>

                            </div>
                          )}

                        </article>
                      );
                    }
                  )}

                </div>
              )}


              {filtered.length >
                pageSize && (
                <nav
                  className="pagination"
                  aria-label="Notification pages"
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
                      page === pageCount
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


export default DonorNotifications;