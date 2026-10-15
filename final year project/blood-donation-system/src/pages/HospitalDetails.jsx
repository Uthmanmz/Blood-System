import {
  useEffect,
  useState,
} from 'react';

import HospitalAdminNav
  from '../components/HospitalAdminNav';

import {
  getHospitalAdminHospital,
  updateOwnHospital,
} from '../services/hospitalAdminApi';

import '../styles/newPages.css';


function HospitalDetails() {
  const [hospital, setHospital] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState('');


  useEffect(() => {
    loadHospital();
  }, []);


  async function loadHospital() {
    try {
      setLoading(true);

      const response =
        await getHospitalAdminHospital();

      setHospital(
        response.data.hospital
      );
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }


  async function handleSubmit(event) {
    event.preventDefault();

    const formData =
      new FormData(event.currentTarget);

    try {
      setSaving(true);
      setMessage('');

      const response =
        await updateOwnHospital({
          name:
            formData.get('name').trim(),

          address:
            formData.get('address').trim(),

          state:
            formData.get('state').trim(),

          city:
            formData.get('city').trim(),

          email:
            formData.get('email').trim(),

          phone:
            formData.get('phone').trim(),

          contact_name:
            formData
              .get('contact_name')
              .trim(),

          contact_email:
            formData
              .get('contact_email')
              .trim(),
        });

      setHospital(
        response.data.hospital
      );

      setMessage(
        response.message
      );
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
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
            Hospital Details
          </h1>

          <p>
            Manage your hospital's
            registered contact information.
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


        {loading ? (
          <section className="workspace-panel">
            <p>
              Loading hospital details...
            </p>
          </section>
        ) : hospital ? (
          <form
            className="workspace-panel"
            onSubmit={handleSubmit}
          >

            <div className="management-form">

              <label>
                Hospital Name

                <input
                  name="name"
                  defaultValue={
                    hospital.name
                  }
                  required
                />
              </label>


              <label>
                Hospital Email

                <input
                  type="email"
                  name="email"
                  defaultValue={
                    hospital.email
                  }
                  required
                />
              </label>


              <label>
                Hospital Phone

                <input
                  name="phone"
                  defaultValue={
                    hospital.phone
                  }
                  required
                />
              </label>


              <label>
                Address

                <input
                  name="address"
                  defaultValue={
                    hospital.address
                  }
                  required
                />
              </label>


              <label>
                City

                <input
                  name="city"
                  defaultValue={
                    hospital.city
                  }
                  required
                />
              </label>


              <label>
                State

                <input
                  name="state"
                  defaultValue={
                    hospital.state
                  }
                  required
                />
              </label>


              <label>
                Contact Name

                <input
                  name="contact_name"
                  defaultValue={
                    hospital.contact_name
                  }
                  required
                />
              </label>


              <label>
                Contact Email

                <input
                  type="email"
                  name="contact_email"
                  defaultValue={
                    hospital.contact_email
                  }
                  required
                />
              </label>


              <label>
                Participation Status

                <input
                  value={
                    hospital.status
                  }
                  readOnly
                />
              </label>

            </div>


            <p className="workspace-notice">
              Hospital participation status is
              controlled by the Organisation
              Admin and cannot be changed here.
            </p>


            <button
              className="application-button"
              type="submit"
              disabled={saving}
            >
              {saving
                ? 'Saving...'
                : 'Save Hospital Details'}
            </button>

          </form>
        ) : (
          <section className="workspace-panel">
            Hospital record unavailable.
          </section>
        )}

      </section>

    </main>
  );
}

export default HospitalDetails;