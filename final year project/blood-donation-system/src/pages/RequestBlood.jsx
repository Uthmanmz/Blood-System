import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Link,
  useSearchParams,
} from 'react-router';

import SeekerSidebar
  from '../components/SeekerSidebar';

import {
  apiGet,
  apiPost,
} from '../services/api';

import '../styles/newPages.css';
import '../styles/donorDashboard.css';


function RequestBlood() {
  const [searchParams] =
    useSearchParams();

  const requestedHospital =
    searchParams.get('hospitalId') || '';

  const requestedGroup =
    searchParams.get('bloodGroup') || '';


  const [seeker, setSeeker] =
    useState(null);

  const [hospitals, setHospitals] =
    useState([]);

  const [hospitalId, setHospitalId] =
    useState(requestedHospital);

  const [bloodGroup, setBloodGroup] =
    useState(requestedGroup);

  const [loading, setLoading] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [message, setMessage] =
    useState('');

  const [savedRequest, setSavedRequest] =
    useState(null);

  const [copied, setCopied] =
    useState(false);


  useEffect(() => {
    let active = true;

    async function loadPage() {
      try {
        setLoading(true);
        setMessage('');

        const [
          profileResponse,
          hospitalResponse,
        ] = await Promise.all([
          apiGet('/seekers/profile.php'),

          apiGet(
            '/hospitals/approved-list.php'
          ),
        ]);

        if (!active) return;

        const seekerData =
          profileResponse.data?.seeker ||
          null;

        const approvedHospitals =
          hospitalResponse.data?.hospitals ||
          [];

        setSeeker(seekerData);
        setHospitals(approvedHospitals);

        if (requestedHospital) {
          const exists =
            approvedHospitals.some(
              (hospital) =>
                String(hospital.id) ===
                String(requestedHospital)
            );

          if (exists) {
            setHospitalId(
              String(requestedHospital)
            );
          } else {
            setHospitalId('');
          }
        }

      } catch (error) {
        setMessage(
          error.message ||
            'Unable to load blood request form.'
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadPage();

    return () => {
      active = false;
    };
  }, [requestedHospital]);


  const selectedHospital =
    useMemo(
      () =>
        hospitals.find(
          (hospital) =>
            String(hospital.id) ===
            String(hospitalId)
        ) || null,
      [hospitals, hospitalId]
    );


  async function handleSubmit(event) {
    event.preventDefault();

    setMessage('');
    setSavedRequest(null);
    setCopied(false);

    const form =
      event.currentTarget;

    const values =
      new FormData(form);

    const payload = {
      hospital_id:
        Number(hospitalId),

      patient_name:
        values
          .get('patientName')
          .trim(),

      blood_group:
        bloodGroup,

      quantity:
        Number(
          values.get('quantity')
        ),

      urgency:
        values.get('urgency'),

      delivery_channel:
        values.get(
          'deliveryChannel'
        ),

      additional_information:
        values
          .get('additionalInformation')
          .trim(),
    };


    try {
      setSubmitting(true);

      const response =
        await apiPost(
          '/blood-requests/create.php',
          payload
        );

      const requestData =
        response.data || null;

      setSavedRequest(requestData);

      setMessage(
        response.message ||
          'Blood request submitted successfully.'
      );

      form.reset();

      setHospitalId('');
      setBloodGroup('');

    } catch (error) {
      setMessage(
        error.message ||
          'Unable to submit blood request.'
      );
    } finally {
      setSubmitting(false);
    }
  }


  async function copyTrackingNumber() {
    if (
      !savedRequest?.tracking_number
    ) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        savedRequest.tracking_number
      );

      setCopied(true);

    } catch {
      setMessage(
        'Copy was unavailable. Select the tracking number and copy it manually.'
      );
    }
  }


  if (loading) {
    return (
      <main className="donor-dashboard">

        <SeekerSidebar />

        <section className="donor-main">

          <div className="workspace-panel">
            <p>
              Loading blood request form...
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
                Request Blood
              </h1>

              <span>
                Submit a blood request to an
                approved hospital and receive
                a tracking number for monitoring
                its progress.
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


          {!seeker ? (
            <section className="workspace-panel">

              <h2>
                Seeker Login Required
              </h2>

              <p>
                You must be signed in as a
                Seeker before submitting a
                blood request.
              </p>

              <Link
                className="application-button"
                to="/seeker-login"
              >
                Sign In as Seeker
              </Link>

            </section>
          ) : (
            <form
              className="application-form"
              onSubmit={handleSubmit}
            >

              <section className="workspace-panel">

                <p>
                  Requesting as:{' '}

                  <strong>
                    {seeker.full_name}
                  </strong>
                </p>

              </section>


              <label className="application-field">

                Hospital Handling the Request

                <select
                  className="organisation-select"
                  value={hospitalId}
                  onChange={(event) =>
                    setHospitalId(
                      event.target.value
                    )
                  }
                  required
                >
                  <option value="">
                    Select Hospital
                  </option>

                  {hospitals.map(
                    (hospital) => (
                      <option
                        key={hospital.id}
                        value={hospital.id}
                      >
                        {hospital.name}
                        {hospital.city
                          ? ` - ${hospital.city}`
                          : ''}
                      </option>
                    )
                  )}
                </select>

              </label>


              {selectedHospital && (
                <section className="workspace-panel">

                  <strong>
                    {selectedHospital.name}
                  </strong>

                  {selectedHospital.address && (
                    <p>
                      {
                        selectedHospital.address
                      }
                    </p>
                  )}

                  <p>
                    {[
                      selectedHospital.city,
                      selectedHospital.state,
                    ]
                      .filter(Boolean)
                      .join(', ')}
                  </p>

                  {selectedHospital.phone && (
                    <p>
                      {
                        selectedHospital.phone
                      }
                    </p>
                  )}

                </section>
              )}


              <label className="application-field">

                Patient Name

                <input
                  name="patientName"
                  type="text"
                  required
                />

              </label>


              <div className="application-grid">

                <label className="application-field">

                  Blood Group

                  <select
                    className="organisation-select"
                    value={bloodGroup}
                    onChange={(event) =>
                      setBloodGroup(
                        event.target.value
                      )
                    }
                    required
                  >
                    <option value="">
                      Select Blood Group
                    </option>

                    {[
                      'A+',
                      'A-',
                      'B+',
                      'B-',
                      'AB+',
                      'AB-',
                      'O+',
                      'O-',
                    ].map(
                      (group) => (
                        <option
                          key={group}
                          value={group}
                        >
                          {group}
                        </option>
                      )
                    )}
                  </select>

                </label>


                <label className="application-field">

                  Quantity

                  <input
                    name="quantity"
                    type="number"
                    min="1"
                    step="1"
                    required
                  />

                </label>


                <label className="application-field">

                  Urgency

                  <select
                    className="organisation-select"
                    name="urgency"
                    defaultValue="Routine"
                    required
                  >
                    <option value="Routine">
                      Routine
                    </option>

                    <option value="Urgent">
                      Urgent
                    </option>
                  </select>

                </label>


                <label className="application-field">

                  Notification Channel

                  <select
                    className="organisation-select"
                    name="deliveryChannel"
                    defaultValue="Both"
                    required
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

              </div>


              <label className="application-field">

                Additional Information

                <textarea
                  name="additionalInformation"
                  rows={4}
                  placeholder="Optional information about the request"
                />

              </label>


              <button
                className="application-button"
                type="submit"
                disabled={
                  submitting ||
                  !hospitalId ||
                  !bloodGroup
                }
              >
                {submitting
                  ? 'Submitting Request...'
                  : 'Submit Blood Request'}
              </button>

            </form>
          )}


          {savedRequest && (
            <section
              className="workspace-panel tracking-success"
              role="status"
            >

              <h2>
                Request Submitted
              </h2>

              <p>
                Your blood request has been
                successfully sent to:
              </p>

              <strong>
                {
                  savedRequest.hospital_name
                }
              </strong>


              <p>
                Your tracking number is:
              </p>

              <p className="tracking-number">
                <strong>
                  {
                    savedRequest.tracking_number
                  }
                </strong>
              </p>


              <p>
                Status:{' '}

                <strong>
                  {savedRequest.status}
                </strong>
              </p>


              <div className="management-actions">

                <button
                  className="secondary-button"
                  type="button"
                  onClick={
                    copyTrackingNumber
                  }
                >
                  {copied
                    ? 'Copied'
                    : 'Copy Tracking Number'}
                </button>


                <Link
                  className="application-button"
                  to={`/track-request?code=${encodeURIComponent(
                    savedRequest.tracking_number
                  )}`}
                >
                  Track Request
                </Link>

              </div>

            </section>
          )}

        </div>

      </section>

    </main>
  );
}


export default RequestBlood;