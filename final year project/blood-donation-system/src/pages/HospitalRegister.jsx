import {
  useState,
} from 'react';

import {
  Link,
} from 'react-router';

import {
  apiPost,
} from '../services/api';

import '../styles/newPages.css';


function HospitalRegister() {
  const [message, setMessage] =
    useState('');

  const [success, setSuccess] =
    useState(false);

  const [submitting, setSubmitting] =
    useState(false);


  async function handleSubmit(event) {
    event.preventDefault();

    setMessage('');
    setSuccess(false);

    const form =
      event.currentTarget;

    const values =
      new FormData(form);


    const payload = {
      name:
        values
          .get('hospitalName')
          .trim(),

      address:
        values
          .get('address')
          .trim(),

      state:
        values
          .get('state')
          .trim(),

      city:
        values
          .get('city')
          .trim(),

      email:
        values
          .get('hospitalEmail')
          .trim(),

      phone:
        values
          .get('hospitalPhone')
          .trim(),

      contact_name:
        values
          .get('contactName')
          .trim(),

      contact_email:
        values
          .get('contactEmail')
          .trim(),
    };


    if (
      Object.values(payload)
        .some((value) => !value)
    ) {
      setMessage(
        'Please complete every field.'
      );

      return;
    }


    try {
      setSubmitting(true);

      const response =
        await apiPost(
          '/hospitals/register.php',
          payload
        );


      setSuccess(true);

      setMessage(
        response.message ||
          'Hospital application submitted successfully.'
      );


      form.reset();

    } catch (error) {
      setSuccess(false);

      setMessage(
        error.message ||
          'Unable to submit hospital application.'
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
            HOSPITAL APPLICATION
          </p>

          <h1>
            Register Your Hospital
          </h1>

          <p>
            Apply to participate in the blood
            donation management network.
            Applications are reviewed by the
            Organisation Admin before the
            hospital becomes active.
          </p>

        </header>


        <form
          className="application-form"
          onSubmit={handleSubmit}
          onChange={() => {
            setMessage('');
            setSuccess(false);
          }}
        >

          <div className="application-field">

            <label htmlFor="hospital-name">
              Hospital Name
            </label>

            <input
              id="hospital-name"
              name="hospitalName"
              autoComplete="organization"
              required
            />

          </div>


          <div className="application-field">

            <label htmlFor="hospital-address">
              Hospital Address
            </label>

            <textarea
              id="hospital-address"
              name="address"
              rows={3}
              autoComplete="street-address"
              required
            />

          </div>


          <div className="application-grid">

            <div className="application-field">

              <label htmlFor="hospital-state">
                State
              </label>

              <input
                id="hospital-state"
                name="state"
                autoComplete="address-level1"
                required
              />

            </div>


            <div className="application-field">

              <label htmlFor="hospital-city">
                City / Town
              </label>

              <input
                id="hospital-city"
                name="city"
                autoComplete="address-level2"
                required
              />

            </div>

          </div>


          <div className="application-grid">

            <div className="application-field">

              <label htmlFor="hospital-email">
                Hospital Email
              </label>

              <input
                id="hospital-email"
                name="hospitalEmail"
                type="email"
                required
              />

            </div>


            <div className="application-field">

              <label htmlFor="hospital-phone">
                Hospital Phone Number
              </label>

              <input
                id="hospital-phone"
                name="hospitalPhone"
                type="tel"
                required
              />

            </div>

          </div>


          <div className="application-field">

            <label htmlFor="contact-name">
              Contact Person's Full Name
            </label>

            <input
              id="contact-name"
              name="contactName"
              autoComplete="name"
              required
            />

          </div>


          <div className="application-field">

            <label htmlFor="contact-email">
              Contact Person's Email
            </label>

            <input
              id="contact-email"
              name="contactEmail"
              type="email"
              required
            />

          </div>


          <button
            type="submit"
            className="application-button"
            disabled={submitting}
          >
            {submitting
              ? 'Submitting Application...'
              : 'Submit Application'}
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
            <section className="workspace-panel">

              <strong>
                Application Status:
                Pending
              </strong>

              <p>
                Your application has been
                submitted to the Organisation
                Admin for review.
              </p>

              <p>
                Once approved, a Hospital Admin
                account can be created for your
                hospital.
              </p>

            </section>
          )}


          <p className="application-links">

            Already an approved hospital
            administrator?{' '}

            <Link to="/hospital-login">
              Sign In
            </Link>

          </p>

        </form>

      </div>

    </main>
  );
}


export default HospitalRegister;