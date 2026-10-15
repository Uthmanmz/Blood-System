import {
  useState,
} from 'react';


import {
  submitPublicFeedback,
} from '../services/feedbackApi';

import '../styles/newPages.css';


const initialForm = {
  full_name: '',
  email: '',
  phone: '',
  subject: '',
  message: '',
};


function Feedback() {
  const [form, setForm] =
    useState(initialForm);

  const [statusMessage, setStatusMessage] =
    useState('');

  const [sending, setSending] =
    useState(false);


  function handleChange(event) {
    const {
      name,
      value,
    } = event.target;

    setForm(
      (current) => ({
        ...current,
        [name]: value,
      })
    );

    setStatusMessage('');
  }


  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSending(true);
      setStatusMessage('');

      const response =
        await submitPublicFeedback({
          full_name:
            form.full_name.trim(),

          email:
            form.email.trim(),

          phone:
            form.phone.trim(),

          subject:
            form.subject.trim(),

          message:
            form.message.trim(),
        });


      setStatusMessage(
        response.message
      );

      setForm(
        initialForm
      );

    } catch (error) {
      setStatusMessage(
        error.message
      );
    } finally {
      setSending(false);
    }
  }

  return (
  <main className="application-page">
    <div className="application-container">

      <header className="application-heading">
        <p className="workspace-label">
          CONTACT & FEEDBACK
        </p>

        <h1>
          Share Your Feedback
        </h1>

        <p>
          Your comments help us improve the blood
          donation network and the services provided
          through the system.
        </p>
      </header>

      <section className="workspace-panel">

        <h2>
          Send Us a Message
        </h2>

        <p>
          Name, subject and message are required.
          Email and phone are optional.
        </p>

        {statusMessage && (
          <p
            className="application-message"
            role="status"
          >
            {statusMessage}
          </p>
        )}

        <form
          className="application-form"
          onSubmit={handleSubmit}
        >

          <div className="application-grid">

            <label className="application-field">
              Full Name

              <input
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
                required
              />
            </label>

            <label className="application-field">
              Email Address

              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
              />
            </label>

            <label className="application-field">
              Phone Number

              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
              />
            </label>

            <label className="application-field">
              Subject

              <input
                name="subject"
                value={form.subject}
                onChange={handleChange}
                required
              />
            </label>

          </div>

          <label className="application-field">
            Message

            <textarea
              name="message"
              rows="7"
              value={form.message}
              onChange={handleChange}
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
              : 'Submit Feedback'}
          </button>

        </form>

      </section>

    </div>
  </main>
);
  }


export default Feedback;