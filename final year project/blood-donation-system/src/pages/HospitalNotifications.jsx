import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import HospitalAdminNav
  from '../components/HospitalAdminNav';

import {
  getOrganisationHospitalNotices,
  markOrganisationHospitalNoticeRead,
} from '../services/hospitalAdminApi';

import {
  getNotificationRecipients,
  sendNotification,
} from '../services/notificationApi';

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


function HospitalNotifications() {
  const [notices, setNotices] =
    useState([]);

  const [donors, setDonors] =
    useState([]);

  const [seekers, setSeekers] =
    useState([]);

  const [recipientType, setRecipientType] =
    useState('donor');

  const [recipientId, setRecipientId] =
    useState('');

  const [
    notificationType,
    setNotificationType,
  ] = useState('General');

  const [
    deliveryChannel,
    setDeliveryChannel,
  ] = useState('Email');

  const [subject, setSubject] =
    useState('');

  const [body, setBody] =
    useState('');

  const [search, setSearch] =
    useState('');

  const [message, setMessage] =
    useState('');

  const [sending, setSending] =
    useState(false);

  const [
    deliveryResult,
    setDeliveryResult,
  ] = useState(null);


  useEffect(() => {
    loadPage();
  }, []);


  async function loadPage() {
    try {
      const [
        noticeResponse,
        recipientResponse,
      ] = await Promise.all([
        getOrganisationHospitalNotices(),
        getNotificationRecipients(),
      ]);

      setNotices(
        noticeResponse.data.notices || []
      );

      setDonors(
        recipientResponse.data.donors ||
        []
      );

      setSeekers(
        recipientResponse.data.seekers ||
        []
      );
    } catch (error) {
      setMessage(error.message);
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


  const unreadCount =
    notices.filter(
      (notice) =>
        Number(notice.is_read) === 0
    ).length;


  async function handleNoticeRead(
    notice
  ) {
    if (
      Number(notice.is_read) === 1
    ) {
      return;
    }

    try {
      const response =
        await markOrganisationHospitalNoticeRead(
          notice.id
        );

      setMessage(response.message);

      await loadPage();
    } catch (error) {
      setMessage(error.message);
    }
  }


  async function handleSend(event) {
    event.preventDefault();

    if (!recipientId) {
      setMessage(
        'Select a recipient.'
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

      setDeliveryResult(
        response.data
      );

      setMessage(
        response.message
      );

      setRecipientId('');
      setSubject('');
      setBody('');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSending(false);
    }
  }


  return (
    <main className="workspace-page">

      <header className="workspace-header">
        <div>
          <span className="workspace-label">
            HOSPITAL ADMINISTRATION
          </span>

          <h1>
            Hospital Messages
          </h1>

          <p>
            Organisation notices and
            hospital communication.
          </p>
        </div>
      </header>


      <HospitalAdminNav />


      <section className="workspace-content">

        {message && (
          <p
            className="application-message"
            role="status"
          >
            {message}
          </p>
        )}


        <section className="workspace-panel">

          <div className="management-heading">
            <div>
              <h2>
                Organisation Notices
              </h2>

              <p>
                Unread: {unreadCount}
              </p>
            </div>
          </div>


          {notices.length === 0 ? (
            <p className="workspace-empty">
              No organisation notices.
            </p>
          ) : (
            <div className="management-table-wrapper">

              <table className="management-table">

                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Title</th>
                    <th>Message</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>

                  {notices.map(
                    (notice) => (
                      <tr key={notice.id}>

                        <td>
                          {
                            notice.notice_type
                          }
                        </td>

                        <td>
                          <strong>
                            {notice.title}
                          </strong>
                        </td>

                        <td>
                          {notice.message}
                        </td>

                        <td>
                          {
                            notice.created_at
                          }
                        </td>

                        <td>
                          {Number(
                            notice.is_read
                          ) === 1 ? (
                            'Read'
                          ) : (
                            <button
                              type="button"
                              className="secondary-button"
                              onClick={() =>
                                handleNoticeRead(
                                  notice
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


        <section className="workspace-panel management-section">

          <h2>
            Send Notification
          </h2>

          <p>
            Send a message to a donor
            registered with this hospital or
            a seeker who has requested blood
            from this hospital.
          </p>


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
              Search

              <input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Name, email, phone or blood group"
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
                      {recipient.email}

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
                Recipient:{' '}
                <strong>
                  {
                    deliveryResult
                      .recipient_name
                  }
                </strong>
              </p>

              <p>
                Email:{' '}
                <strong>
                  {
                    deliveryResult
                      .email_status
                  }
                </strong>
              </p>

              <p>
                SMS:{' '}
                <strong>
                  {
                    deliveryResult
                      .sms_status
                  }
                </strong>
              </p>

              {deliveryResult.email_error && (
                <p>
                  {
                    deliveryResult
                      .email_error
                  }
                </p>
              )}

              {deliveryResult.sms_error && (
                <p>
                  {
                    deliveryResult
                      .sms_error
                  }
                </p>
              )}

            </div>
          )}

        </section>

      </section>

    </main>
  );
}

export default HospitalNotifications;