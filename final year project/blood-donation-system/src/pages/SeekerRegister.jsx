import { useState } from 'react';
import { Link } from 'react-router';

import { apiPost } from '../services/api';

import '../styles/newPages.css';

function SeekerRegister() {
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    setMessage('');
    setSuccess(false);

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

      address: values
        .get('address')
        .trim(),
    };

    try {
      setSubmitting(true);

      const result = await apiPost(
        '/seekers/register.php',
        payload
      );

      setSuccess(true);

      setMessage(
        result.message ||
          'Seeker account created successfully.'
      );

      form.reset();
    } catch (error) {
      setSuccess(false);

      setMessage(
        error.message ||
          'Unable to create seeker account.'
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
            SEEKER REGISTRATION
          </p>

          <h1>Become a Seeker</h1>

          <p>
            Create an account to request blood and
            track the progress of your requests.
          </p>
        </header>

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

          <button
            className="application-button"
            type="submit"
            disabled={submitting}
          >
            {submitting
              ? 'Creating Account...'
              : 'Create Seeker Account'}
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
              Registration completed. You can now
              sign in and submit a blood request.
            </p>
          )}

          <p className="application-links">
            Already registered?{' '}

            <Link
              className="secondary-button"
              to="/seeker-login"
            >
              Sign In as Seeker
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}

export default SeekerRegister;