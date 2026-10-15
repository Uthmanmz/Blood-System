import {
  useEffect,
  useState,
} from 'react';

import DonorSidebar from '../components/DonorSidebar';
import DonorHospitalStatus from '../components/DonorHospitalStatus';

import {
  getDonorProfile,
  updateDonorAvailability,
} from '../services/donorApi';

import '../styles/donorDashboard.css';
import '../styles/newPages.css';


function DonorAvailability() {
  const [donor, setDonor] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState('');


  useEffect(() => {
    loadProfile();
  }, []);


  async function loadProfile() {
    try {
      setLoading(true);

      const response =
        await getDonorProfile();

      setDonor(
        response.data.donor
      );
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }


  async function saveAvailability(
    available
  ) {
    try {
      setSaving(true);
      setMessage('');

      await updateDonorAvailability(
        available
      );

      await loadProfile();

      setMessage(
        available
          ? 'You are now marked as available for donation.'
          : 'You are now marked as not available for donation.'
      );
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  }


  return (
    <main className="donor-dashboard">
      <DonorSidebar />

      <section className="donor-main">
        <h1>Donation Availability</h1>

        {loading ? (
          <p>Loading availability...</p>
        ) : !donor ? (
          <p>
            Donor profile unavailable.
          </p>
        ) : (
          <>
            <DonorHospitalStatus
              status={
                donor.hospital_status
              }
            />

            <section className="workspace-panel">
              <h2>
                {donor.full_name}
              </h2>

              <p>
                Registered Hospital:{' '}
                <strong>
                  {donor.hospital_name}
                </strong>
              </p>

              <p>
                Current Preference:{' '}
                <strong>
                  {donor.available_for_donation
                    ? 'Available to donate'
                    : 'Not currently available'}
                </strong>
              </p>

              <p>
                This setting represents
                your willingness to donate.
                Final medical eligibility
                is determined separately
                by authorised personnel.
              </p>

              <div className="management-actions">
                <button
                  className="application-button"
                  type="button"
                  disabled={saving}
                  onClick={() =>
                    saveAvailability(
                      true
                    )
                  }
                >
                  Mark Available
                </button>

                <button
                  className="secondary-button"
                  type="button"
                  disabled={saving}
                  onClick={() =>
                    saveAvailability(
                      false
                    )
                  }
                >
                  Mark Not Available
                </button>
              </div>

              {message && (
                <p
                  className="application-message"
                  role="status"
                >
                  {message}
                </p>
              )}
            </section>
          </>
        )}
      </section>
    </main>
  );
}

export default DonorAvailability;