import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import PersonnelSidebar from '../components/PersonnelSideBar';

import {
  getNotificationRecipients,
  getMyNotifications,
  sendNotification,
  markNotificationRead,
  markAllNotificationsRead,
} from '../services/notificationApi';

import '../styles/personnelDashboard.css';
import '../styles/newPages.css';


const TYPES = [
  'Donation Invitation',
  'Appointment Update',
  'Donation Update',
  'Appreciation',
  'Blood Request Update',
  'Seasonal Greeting',
  'General',
];


function PersonnelNotifications() {
  const [donors, setDonors] =
    useState([]);

  const [seekers, setSeekers] =
    useState([]);

  const [notifications, setNotifications] =
    useState([]);

  const [unreadCount, setUnreadCount] =
    useState(0);

  const [recipientType, setRecipientType] =
    useState('donor');

  const [recipientId, setRecipientId] =
    useState('');

  const [notificationType, setNotificationType] =
    useState('General');

  const [deliveryChannel, setDeliveryChannel] =
    useState('Email');

  const [subject, setSubject] =
    useState('');

  const [body, setBody] =
    useState('');

  const [search, setSearch] =
    useState('');

  const [loading, setLoading] =
    useState(true);

  const [sending, setSending] =
    useState(false);

  const [message, setMessage] =
    useState('');

  const [deliveryResult, setDeliveryResult] =
    useState(null);


  useEffect(() => {
    loadPage();
  }, []);


  async function loadPage() {
    try {
      setLoading(true);

      const [
        recipientResponse,
        notificationResponse,
      ] = await Promise.all([
        getNotificationRecipients(),
        getMyNotifications(),
      ]);

      setDonors(
        recipientResponse.data.donors || []
      );

      setSeekers(
        recipientResponse.data.seekers || []
      );

      setNotifications(
        notificationResponse.data
          .notifications || []
      );

      setUnreadCount(
        notificationResponse.data
          .unread_count || 0
      );
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }


  const recipients =
    recipientType === 'donor'
      ? donors
      : seekers;


  const filteredRecipients =
    useMemo(() => {
      const query = search
        .trim()
        .toLowerCase();

      if (!query) {
        return recipients;
      }

      return recipients.filter(
        (recipient) =>
          [
            recipient.full_name,
            recipient.email,
            recipient.phone,
            recipient.blood_group,
          ]
            .join(' ')
            .toLowerCase()
            .includes(query)
      );
    }, [
      recipients,
      search,
    ]);


  async function handleSend(event) {
    event.preventDefault();

    if (!recipientId) {
      setMessage(
        'Select a notification recipient.'
      );
      return;
    }

    try {
      setSending(true);
      setMessage('');
      setDeliveryResult(null);

      const response =
        await sendNotification({
          recipient_user_id:
            Number(recipientId),

          notification_type:
            notificationType,

          subject:
            subject.trim(),

          message:
            body.trim(),

          delivery_channel:
            deliveryChannel,
        });

      setMessage(
        response.message
      );

      setDeliveryResult(
        response.data
      );

      setSubject('');
      setBody('');
      setRecipientId('');

      await loadPage();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSending(false);
    }
  }


  async function handleRead(notification) {
    if (Number(notification.is_read) === 1) {
      return;
    }

    try {
      await markNotificationRead(
        notification.id
      );

      await loadPage();
    } catch (error) {
      setMessage(error.message);
    }
  }


  async function handleReadAll() {
    try {
      await markAllNotificationsRead();

      await loadPage();

      setMessage(
        'All notifications marked as read.'
      );
    } catch (error) {
      setMessage(error.message);
    }
  }


  return (
    <main className="personnel-layout">
      <PersonnelSidebar />

      <section className="personnel-main">

        <h1>Notifications</h1>

        <p>
          Send hospital notifications using
          email, SMS, or both.
        </p>


        {message && (
          <p
            className="application-message"
            role="status"
          >
            {message}
          </p>
        )}


        <section className="workspace-panel">

          <h2>
            Send Notification
          </h2>

          <form
            className="management-form"
            onSubmit={handleSend}
          >

            <label>
              Recipient Type

              <select
                value={recipientType}
                onChange={(event) => {
                  setRecipientType(
                    event.target.value
                  );

                  setRecipientId('');
                }}
              >
                <option value="donor">
                  Donor
                </option>

                <option value="seeker">
                  Seeker
                </option>
              </select>
            </label>


            <label>
              Search Recipient

              <input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search name, email, phone or blood group"
              />
            </label>


            <label>
              Recipient

              <select
                value={recipientId}
                onChange={(event) =>
                  setRecipientId(
                    event.target.value
                  )
                }
                required
              >
                <option value="">
                  Select recipient
                </option>

                {filteredRecipients.map(
                  (recipient) => (
                    <option
                      key={
                        recipient.user_id
                      }
                      value={
                        recipient.user_id
                      }
                    >
                      {
                        recipient.full_name
                      }
                      {' - '}
                      {
                        recipient.email
                      }

                      {recipient.blood_group
                        ? ` - ${recipient.blood_group}`
                        : ''}
                    </option>
                  )
                )}
              </select>
            </label>


            <label>
              Notification Type

              <select
                value={notificationType}
                onChange={(event) =>
                  setNotificationType(
                    event.target.value
                  )
                }
              >
                {TYPES.map(
                  (type) => (
                    <option
                      key={type}
                      value={type}
                    >
                      {type}
                    </option>
                  )
                )}
              </select>
            </label>


            <label>
              Delivery Channel

              <select
                value={deliveryChannel}
                onChange={(event) =>
                  setDeliveryChannel(
                    event.target.value
                  )
                }
              >
                <option value="Email">
                  Email Only
                </option>

                <option value="SMS">
                  SMS Only
                </option>

                <option value="Both">
                  Email + SMS
                </option>
              </select>
            </label>


            <label>
              Subject

              <input
                value={subject}
                onChange={(event) =>
                  setSubject(
                    event.target.value
                  )
                }
                required
                placeholder="Notification subject"
              />
            </label>


            <label>
              Message

              <textarea
                value={body}
                onChange={(event) =>
                  setBody(
                    event.target.value
                  )
                }
                required
                placeholder="Write notification message"
              />
            </label>


            <button
              type="submit"
              className="application-button"
              disabled={sending}
            >
              {sending
                ? 'Sending...'
                : 'Send Notification'}
            </button>

          </form>


          {deliveryResult && (
            <div className="management-section">

              <h3>
                Delivery Result
              </h3>

              <p>
                <strong>
                  Recipient:
                </strong>{' '}
                {
                  deliveryResult.recipient_name
                }
              </p>

              <p>
                <strong>
                  Channel:
                </strong>{' '}
                {
                  deliveryResult.delivery_channel
                }
              </p>

              <p>
                <strong>
                  Email:
                </strong>{' '}
                {
                  deliveryResult.email_status
                }
              </p>

              {deliveryResult.email_error && (
                <p>
                  {
                    deliveryResult.email_error
                  }
                </p>
              )}

              <p>
                <strong>
                  SMS:
                </strong>{' '}
                {
                  deliveryResult.sms_status
                }
              </p>

              {deliveryResult.sms_error && (
                <p>
                  {
                    deliveryResult.sms_error
                  }
                </p>
              )}

            </div>
          )}

        </section>


        <section className="workspace-panel management-section">

          <div className="management-heading">

            <div>
              <h2>
                My Notifications
              </h2>

              <p>
                Unread: {unreadCount}
              </p>
            </div>


            {unreadCount > 0 && (
              <button
                type="button"
                className="secondary-button"
                onClick={
                  handleReadAll
                }
              >
                Mark All Read
              </button>
            )}

          </div>


          {loading ? (
            <p>
              Loading notifications...
            </p>
          ) : notifications.length === 0 ? (
            <p className="workspace-empty">
              You currently have no personal
              notifications.
            </p>
          ) : (
            <div className="management-table-wrapper">

              <table className="management-table">

                <thead>
                  <tr>
                    <th>
                      Type
                    </th>

                    <th>
                      Subject
                    </th>

                    <th>
                      Message
                    </th>

                    <th>
                      Channel
                    </th>

                    <th>
                      Delivery
                    </th>

                    <th>
                      Date
                    </th>

                    <th>
                      Status
                    </th>
                  </tr>
                </thead>


                <tbody>

                  {notifications.map(
                    (notification) => (
                      <tr
                        key={
                          notification.id
                        }
                      >

                        <td>
                          {
                            notification.notification_type
                          }
                        </td>

                        <td>
                          {
                            notification.subject
                          }
                        </td>

                        <td>
                          {
                            notification.message
                          }
                        </td>

                        <td>
                          {
                            notification.delivery_channel
                          }
                        </td>

                        <td>
                          Email:{' '}
                          {
                            notification.email_status
                          }

                          <br />

                          SMS:{' '}
                          {
                            notification.sms_status
                          }
                        </td>

                        <td>
                          {
                            notification.created_at
                          }
                        </td>

                        <td>

                          {Number(
                            notification.is_read
                          ) === 1 ? (
                            'Read'
                          ) : (
                            <button
                              type="button"
                              className="secondary-button"
                              onClick={() =>
                                handleRead(
                                  notification
                                )
                              }
                            >
                              Mark Read
                            </button>
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

export default PersonnelNotifications;