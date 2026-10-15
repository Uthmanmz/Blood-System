import {
  useEffect,
  useState,
} from 'react';

import SeekerSidebar
  from '../components/SeekerSidebar';

import {
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../services/notificationApi';

import '../styles/newPages.css';
import '../styles/donorDashboard.css';


function SeekerNotifications() {
  const [notifications, setNotifications] =
    useState([]);

  const [unreadCount, setUnreadCount] =
    useState(0);

  const [openedId, setOpenedId] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [markingAll, setMarkingAll] =
    useState(false);

  const [error, setError] =
    useState('');

  const [message, setMessage] =
    useState('');


  async function loadNotifications() {
    try {
      setLoading(true);
      setError('');

      const response =
        await getMyNotifications();

      setNotifications(
        response.data?.notifications || []
      );

      setUnreadCount(
        Number(
          response.data?.unread_count || 0
        )
      );

    } catch (err) {
      setError(
        err.message ||
          'Unable to load notifications.'
      );
    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    loadNotifications();
  }, []);


  async function openNotification(
    notification
  ) {
    /*
     * If the currently opened message
     * is clicked again, simply close it.
     */
    if (
      String(openedId) ===
      String(notification.id)
    ) {
      setOpenedId(null);
      return;
    }


    /*
     * Open the message immediately.
     */
    setOpenedId(notification.id);
    setMessage('');


    /*
     * Only call the backend if this
     * notification has not already been read.
     */
    if (
      Number(notification.is_read) === 1
    ) {
      return;
    }


    try {
      await markNotificationRead(
        notification.id
      );


      /*
       * Update this notification locally.
       */
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


      /*
       * Reduce unread count immediately.
       */
      setUnreadCount(
        (current) =>
          Math.max(0, current - 1)
      );


      /*
       * Tell SeekerSidebar and any other
       * notification counters to refresh.
       */
      window.dispatchEvent(
        new Event(
          'notifications-updated'
        )
      );

    } catch (err) {
      setError(
        err.message ||
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
      setError('');
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

      setUnreadCount(0);

      setMessage(
        response.message ||
          'All notifications marked as read.'
      );


      window.dispatchEvent(
        new Event(
          'notifications-updated'
        )
      );

    } catch (err) {
      setError(
        err.message ||
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


  function deliveryLabel(
    notification
  ) {
    const channel =
      notification.delivery_channel;

    if (channel === 'Both') {
      return 'Email + SMS';
    }

    if (channel === 'Email') {
      return 'Email';
    }

    if (channel === 'SMS') {
      return 'SMS';
    }

    return channel || 'In-app';
  }


  if (loading) {
    return (
      <main className="donor-dashboard">

        <SeekerSidebar />

        <section className="donor-main">

          <div className="workspace-panel">
            <p>
              Loading notifications...
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
                Notifications
              </h1>

              <span>
                View updates about your
                blood requests and other
                messages sent to your
                Seeker account.
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


          <section className="workspace-content">

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


            {error && (
              <p
                className="application-message"
                role="alert"
              >
                {error}
              </p>
            )}


            {message && (
              <p
                className="application-message"
                role="status"
              >
                {message}
              </p>
            )}


            {notifications.length === 0 ? (
              <section className="workspace-panel">

                <div className="workspace-empty">

                  <h2>
                    No Notifications
                  </h2>

                  <p>
                    You do not have any
                    notifications yet.
                  </p>

                </div>

              </section>
            ) : (
              <div className="hospital-list">

                {notifications.map(
                  (notification) => {
                    const isRead =
                      Number(
                        notification.is_read
                      ) === 1;

                    const isOpen =
                      String(openedId) ===
                      String(
                        notification.id
                      );

                    return (
                      <article
                        key={
                          notification.id
                        }
                        className={
                          isRead
                            ? 'workspace-panel notification-item'
                            : 'workspace-panel notification-item notification-item--unread'
                        }
                      >

                        <button
                          type="button"
                          className="notification-toggle"
                          aria-expanded={
                            isOpen
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
                                  isRead
                                    ? 'notification-status notification-status--read'
                                    : 'notification-status notification-status--unread'
                                }
                              >
                                {isRead
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


                        {isOpen && (
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
                                  {deliveryLabel(
                                    notification
                                  )}
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


                              {notification.read_at && (
                                <div>

                                  <strong>
                                    Read At
                                  </strong>

                                  <p>
                                    {formatDate(
                                      notification.read_at
                                    )}
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

          </section>

        </div>

      </section>

    </main>
  );
}


export default SeekerNotifications;