import {
  useEffect,
  useState,
} from 'react';

import DonorSidebar from '../components/DonorSidebar';
import DonorHospitalStatus from '../components/DonorHospitalStatus';

import {
  getDonorProfile,
  updateDonorProfile,
} from '../services/donorApi';

import '../styles/donorDashboard.css';
import '../styles/newPages.css';


function DonorProfile() {
  const [donor, setDonor] =
    useState(null);

  const [formData, setFormData] =
    useState({
      full_name: '',
      phone: '',
      address: '',
    });

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
      setMessage('');

      const response =
        await getDonorProfile();

      const profile =
        response.data.donor;

      setDonor(profile);

      setFormData({
        full_name:
          profile.full_name || '',

        phone:
          profile.phone || '',

        address:
          profile.address || '',
      });
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }


  function handleChange(event) {
    const { name, value } =
      event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  }


  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setMessage('');

      await updateDonorProfile(
        formData
      );

      await loadProfile();

      setMessage(
        'Profile updated successfully.'
      );
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  }


  if (loading) {
    return (
      <main className="donor-dashboard">
        <DonorSidebar />

        <section className="donor-main">
          <p>Loading profile...</p>
        </section>
      </main>
    );
  }


  return (
    <main className="donor-dashboard">
      <DonorSidebar />

      <section className="donor-main">
        <h1>My Profile</h1>

        {message && (
          <p
            className="application-message"
            role="status"
          >
            {message}
          </p>
        )}

        {!donor ? (
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

            <form
              className="workspace-panel"
              onSubmit={handleSubmit}
            >
              <div className="application-grid">
                <label className="application-field">
                  Full Name

                  <input
                    name="full_name"
                    value={
                      formData.full_name
                    }
                    onChange={
                      handleChange
                    }
                    required
                  />
                </label>

                <label className="application-field">
                  Phone Number

                  <input
                    name="phone"
                    type="tel"
                    value={
                      formData.phone
                    }
                    onChange={
                      handleChange
                    }
                    required
                  />
                </label>

                <label className="application-field">
                  Email

                  <input
                    value={
                      donor.email || ''
                    }
                    readOnly
                  />
                </label>

                <label className="application-field">
                  Gender

                  <input
                    value={
                      donor.gender || ''
                    }
                    readOnly
                  />
                </label>

                <label className="application-field">
                  Date of Birth

                  <input
                    value={
                      donor.date_of_birth ||
                      ''
                    }
                    readOnly
                  />
                </label>

                <label className="application-field">
                  Blood Group

                  <input
                    value={
                      donor.blood_group ||
                      ''
                    }
                    readOnly
                  />
                </label>

                <label className="application-field">
                  Genotype

                  <input
                    value={
                      donor.genotype || ''
                    }
                    readOnly
                  />
                </label>

                <label className="application-field">
                  Registered Hospital

                  <input
                    value={
                      donor.hospital_name ||
                      ''
                    }
                    readOnly
                  />
                </label>
              </div>

              <label className="application-field">
                Address

                <textarea
                  name="address"
                  value={
                    formData.address
                  }
                  onChange={
                    handleChange
                  }
                  rows={3}
                  required
                />
              </label>

              <button
                className="application-button"
                type="submit"
                disabled={saving}
              >
                {saving
                  ? 'Saving...'
                  : 'Save Profile'}
              </button>
            </form>
          </>
        )}
      </section>
    </main>
  );
}

export default DonorProfile;