import {
  useEffect,
  useState,
} from 'react';

import AdminSidebar
  from '../components/AdminSidebar';

import {
  createOrganisationNotice,
  getOrganisationHospitals,
} from '../services/organisationApi';

import '../styles/adminDashboard.css';
import '../styles/newPages.css';


const NOTICE_TYPES = [
  'General',
  'Important',
  'Policy',
  'Operational',
];


function AdminNotifications() {
  const [hospitals, setHospitals] =
    useState([]);

  const [recipientMode, setRecipientMode] =
    useState('all');

  const [message, setMessage] =
    useState('');

  const [sending, setSending] =
    useState(false);

  const [lastResult, setLastResult] =
    useState(null);


  useEffect(() => {
    loadHospitals();
  }, []);


  async function loadHospitals() {
    try {
      const response =
        await getOrganisationHospitals();

      setHospitals(
        (
          response.data.hospitals ||
          []
        ).filter(
          (hospital) =>
            hospital.status ===
            'Approved'
        )
      );
    } catch (error) {
      setMessage(error.message);
    }
  }


  async function handleSubmit(event) {
    event.preventDefault();

    const form =
      event.currentTarget;

    const values =
      new FormData(form);

    const hospitalIds =
      recipientMode === 'selected'
        ? values
            .getAll('hospital_ids')
            .map(Number)
        : [];


    if (
      recipientMode === 'selected' &&
      hospitalIds.length === 0
    ) {
      setMessage(
        'Select at least one hospital.'
      );

      return;
    }


    try {
      setSending(true);
      setMessage('');
      setLastResult(null);

      const response =
        await createOrganisationNotice({
          title:
            values
              .get('title')
              .trim(),

          message:
            values
              .get('message')
              .trim(),

          notice_type:
            values.get(
              'notice_type'
            ),

          send_to_all:
            recipientMode === 'all',

          hospital_ids:
            hospitalIds,
        });


      setMessage(
        response.message
      );

      setLastResult(
        response.data
      );

      form.reset();
      setRecipientMode('all');

    } catch (error) {
      setMessage(error.message);
    } finally {
      setSending(false);
    }
  }


  return (
    <main className="admin-layout">

      <AdminSidebar />

      <section className="admin-main">

        <div className="admin-header">
          <p>
            ORGANISATION COMMUNICATION
          </p>

          <h1>
            Hospital Notices
          </h1>

          <span>
            Send notices to participating
            hospitals.
          </span>
        </div>


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
            Compose Notice
          </h2>


          <form
            className="management-form"
            onSubmit={handleSubmit}
          >

            <label>
              Notice Title

              <input
                name="title"
                required
                maxLength="200"
              />
            </label>


            <label>
              Notice Type

              <select
                name="notice_type"
                defaultValue="General"
              >
                {NOTICE_TYPES.map(
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
              Recipients

              <select
                value={recipientMode}
                onChange={(event) =>
                  setRecipientMode(
                    event.target.value
                  )
                }
              >
                <option value="all">
                  All Approved Hospitals
                </option>

                <option value="selected">
                  Selected Hospitals
                </option>
              </select>
            </label>


            {recipientMode ===
              'selected' && (
              <fieldset className="permission-options">

                <legend>
                  Select Hospitals
                </legend>

                {hospitals.map(
                  (hospital) => (
                    <label
                      key={hospital.id}
                    >
                      <input
                        type="checkbox"
                        name="hospital_ids"
                        value={hospital.id}
                      />

                      {hospital.name}
                    </label>
                  )
                )}

              </fieldset>
            )}


            <label>
              Message

              <textarea
                name="message"
                rows="7"
                required
              />
            </label>


            <button
              type="submit"
              className="application-button"
              disabled={
                sending ||
                hospitals.length === 0
              }
            >
              {sending
                ? 'Sending...'
                : 'Send Notice'}
            </button>

          </form>


          {lastResult && (
            <div className="management-section">

              <h3>
                Notice Sent
              </h3>

              <p>
                <strong>
                  Title:
                </strong>{' '}
                {lastResult.title}
              </p>

              <p>
                <strong>
                  Type:
                </strong>{' '}
                {
                  lastResult.notice_type
                }
              </p>

              <p>
                <strong>
                  Recipient Hospitals:
                </strong>{' '}
                {
                  lastResult
                    .recipient_hospitals
                }
              </p>

            </div>
          )}

        </section>

      </section>

    </main>
  );
}

export default AdminNotifications;