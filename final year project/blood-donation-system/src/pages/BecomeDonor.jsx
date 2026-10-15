import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';

import { apiGet, apiPost } from '../services/api';

import '../styles/newPages.css';

function BecomeDonor() {
  const [searchParams] = useSearchParams();

  const hospitalFromUrl =
    searchParams.get('hospitalId') || '';

  const [hospitals, setHospitals] = useState([]);
  const [hospitalId, setHospitalId] =
    useState(hospitalFromUrl);

  const [loadingHospitals, setLoadingHospitals] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadHospitals() {
      try {
        setLoadingHospitals(true);
        setMessage('');

        const result = await apiGet(
          '/hospitals/approved-list.php'
        );
console.log('DONOR HOSPITAL RESPONSE:', result);
        if (!active) return;

        const approvedHospitals =
          result.data?.hospitals || [];
        console.log(
          'APPROVED HOSPITALS:',
          approvedHospitals
        );
        setHospitals(approvedHospitals);

        if (hospitalFromUrl) {
          const exists = approvedHospitals.some(
            (hospital) =>
              String(hospital.id) ===
              String(hospitalFromUrl)
          );

          if (exists) {
            setHospitalId(
              String(hospitalFromUrl)
            );
          } else {
            setHospitalId('');

            setMessage(
              'The selected hospital is not available for donor registration.'
            );
          }
        }
      } catch (error) {
        if (!active) return;

        setMessage(
          error.message ||
            'Unable to load approved hospitals.'
        );
      } finally {
        if (active) {
          setLoadingHospitals(false);
        }
      }
    }

    loadHospitals();

    return () => {
      active = false;
    };
  }, [hospitalFromUrl]);

  const selectedHospital = useMemo(
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
    setSuccess(false);

    if (!hospitalId) {
      setMessage(
        'Please select an approved hospital.'
      );
      return;
    }

    const form = event.currentTarget;
    const values = new FormData(form);

    const password = values.get('password');
    const confirmPassword =
      values.get('confirmPassword');

    if (password !== confirmPassword) {
      setMessage('Passwords do not match.');
      return;
    }

    const payload = {
      full_name: values
        .get('fullName')
        .trim(),

      email: values
        .get('email')
        .trim(),

      phone: values
        .get('phone')
        .trim(),

      password,

      gender: values.get('gender'),

      date_of_birth:
        values.get('dateOfBirth'),

      blood_group:
        values.get('bloodGroup'),

      genotype:
        values.get('genotype'),

      address: values
        .get('address')
        .trim(),

      hospital_id:
        Number(hospitalId),

      available_for_donation:
        values.get('available') === 'on',
    };

    try {
      setSubmitting(true);

      const result = await apiPost(
        '/donors/register.php',
        payload
      );

      setSuccess(true);

      setMessage(
        result.message ||
          'Donor registered successfully.'
      );

      form.reset();

      setHospitalId(
        String(hospitalId)
      );
    } catch (error) {
      setSuccess(false);

      setMessage(
        error.message ||
          'Unable to create donor account.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="application-page">
      <div className="application-container">
        <header className="application-heading">
          <p className="workspace-label">
            DONOR REGISTRATION
          </p>

          <h1>Become a Donor</h1>

          <p>
            Create a donor account and register
            with one approved hospital in the
            blood donation network.
          </p>
        </header>

        <section className="workspace-panel">
          <h2>Registration Hospital</h2>

          <label className="application-field">
            Select Hospital

            <select
              className="organisation-select"
              value={hospitalId}
              onChange={(event) => {
                setHospitalId(
                  event.target.value
                );

                setMessage('');
              }}
              disabled={loadingHospitals}
              required
            >
              <option value="">
                {loadingHospitals
                  ? 'Loading hospitals...'
                  : 'Select Hospital'}
              </option>

              {hospitals.map(
                (hospital) => (
                  <option
                    key={hospital.id}
                    value={hospital.id}
                  >
                    {hospital.name}
                  </option>
                )
              )}
            </select>
          </label>

          {selectedHospital && (
            <div className="registration-hospital-summary">
              <strong>
                {selectedHospital.name}
              </strong>

              {selectedHospital.address && (
                <p>
                  {selectedHospital.address}
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

              <p>
                This hospital will become your
                permanent registration hospital
                for donation appointments.
              </p>
            </div>
          )}
        </section>

        <form
          className="application-form"
          onSubmit={handleSubmit}
        >
          <div className="application-grid">
            <label className="application-field">
              Full Name

              <input
                name="fullName"
                type="text"
                required
              />
            </label>

            <label className="application-field">
              Email Address

              <input
                name="email"
                type="email"
                required
              />
            </label>

            <label className="application-field">
              Phone Number

              <input
                name="phone"
                type="tel"
                required
              />
            </label>

            <label className="application-field">
              Date of Birth

              <input
                name="dateOfBirth"
                type="date"
                required
              />
            </label>

            <label className="application-field">
              Gender

              <select
                name="gender"
                className="organisation-select"
                required
              >
                <option value="">
                  Select Gender
                </option>

                <option value="Male">
                  Male
                </option>

                <option value="Female">
                  Female
                </option>
              </select>
            </label>

            <label className="application-field">
              Blood Group

              <select
                name="bloodGroup"
                className="organisation-select"
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
                ].map((group) => (
                  <option
                    key={group}
                    value={group}
                  >
                    {group}
                  </option>
                ))}
              </select>
            </label>

            <label className="application-field">
              Genotype

              <select
                name="genotype"
                className="organisation-select"
                required
              >
                <option value="">
                  Select Genotype
                </option>

                {[
                  'AA',
                  'AS',
                  'AC',
                  'SS',
                  'SC',
                ].map((genotype) => (
                  <option
                    key={genotype}
                    value={genotype}
                  >
                    {genotype}
                  </option>
                ))}
              </select>
            </label>

            <label className="application-field">
              Password

              <input
                name="password"
                type="password"
                minLength={8}
                autoComplete="new-password"
                required
              />
            </label>

            <label className="application-field">
              Confirm Password

              <input
                name="confirmPassword"
                type="password"
                minLength={8}
                autoComplete="new-password"
                required
              />
            </label>
          </div>

          <label className="application-field">
            Address

            <textarea
              name="address"
              rows={3}
              required
            />
          </label>

          <fieldset className="permission-options">
            <legend>
              Donation Availability
            </legend>

            <label>
              <input
                name="available"
                type="checkbox"
                defaultChecked
              />

              I am available to be contacted
              about donating blood.
            </label>
          </fieldset>

          <p>
            Availability indicates your
            willingness to donate. Medical
            eligibility is determined separately
            by the hospital.
          </p>

          {selectedHospital && (
            <fieldset className="permission-options">
              <legend>
                Registration Confirmation
              </legend>

              <label>
                <input
                  type="checkbox"
                  required
                />

                I confirm that I am registering
                with {selectedHospital.name}.
              </label>
            </fieldset>
          )}

          <p className="registration-submit-hospital">
            Registering with:{' '}
            <strong>
              {selectedHospital?.name ||
                'No hospital selected'}
            </strong>
          </p>

          <button
            className="application-button"
            type="submit"
            disabled={
              !hospitalId ||
              loadingHospitals ||
              submitting
            }
          >
            {submitting
              ? 'Creating Account...'
              : 'Create Donor Account'}
          </button>

          {message && (
            <p
              className="application-message"
              role="status"
            >
              {message}
            </p>
          )}

          {success && (
            <p className="application-links">
              Registration completed. You can
              now sign in to your donor account.
            </p>
          )}

          <p className="application-links">
            Already registered?{' '}

            <Link
              className="secondary-button"
              to="/donor-login"
            >
              Sign In as Donor
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}

export default BecomeDonor;