import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import AdminSidebar
  from '../components/AdminSidebar';

import {
  getOrganisationHospitals,
  createOrganisationHospital,
  changeOrganisationHospitalStatus,
  createHospitalAdmin,
} from '../services/organisationApi';

import '../styles/adminDashboard.css';
import '../styles/newPages.css';


const emptyHospital = {
  name: '',
  address: '',
  state: '',
  city: '',
  email: '',
  phone: '',
  contact_name: '',
  contact_email: '',
};


function formatDate(value) {
  if (!value) {
    return 'Not recorded';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}


function ManageHospitals() {
  const [hospitals, setHospitals] =
    useState([]);

  const [search, setSearch] =
    useState('');

  const [statusFilter, setStatusFilter] =
    useState('');

  const [message, setMessage] =
    useState('');

  const [loading, setLoading] =
    useState(true);

  const [working, setWorking] =
    useState(false);

  const [openId, setOpenId] =
    useState(null);

  const [
    hospitalForm,
    setHospitalForm,
  ] = useState(emptyHospital);


  useEffect(() => {
    loadHospitals();
  }, []);


  async function loadHospitals() {
    try {
      setLoading(true);

      const response =
        await getOrganisationHospitals();

      setHospitals(
        response.data.hospitals || []
      );
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }


  const filteredHospitals =
    useMemo(() => {
      const term =
        search.trim().toLowerCase();

      return hospitals.filter(
        (hospital) => {
          const matchesSearch =
            !term ||
            [
              hospital.name,
              hospital.city,
              hospital.state,
              hospital.email,
            ]
              .join(' ')
              .toLowerCase()
              .includes(term);

          const matchesStatus =
            !statusFilter ||
            hospital.status ===
              statusFilter;

          return (
            matchesSearch &&
            matchesStatus
          );
        }
      );
    }, [
      hospitals,
      search,
      statusFilter,
    ]);


  function handleHospitalChange(event) {
    const {
      name,
      value,
    } = event.target;

    setHospitalForm(
      (current) => ({
        ...current,
        [name]: value,
      })
    );
  }


  async function registerHospital(
    event
  ) {
    event.preventDefault();

    try {
      setWorking(true);
      setMessage('');

      const response =
        await createOrganisationHospital(
          hospitalForm
        );

      setMessage(response.message);

      setHospitalForm(
        emptyHospital
      );

      await loadHospitals();

    } catch (error) {
      setMessage(error.message);
    } finally {
      setWorking(false);
    }
  }


  async function changeStatus(
    hospital,
    newStatus
  ) {
    let reason = '';

    if (
      newStatus === 'Rejected' ||
      newStatus === 'Suspended'
    ) {
      reason =
        window.prompt(
          newStatus === 'Rejected'
            ? `Enter rejection reason for ${hospital.name}:`
            : `Enter suspension reason for ${hospital.name}:`
        )?.trim() || '';

      if (!reason) {
        setMessage(
          'A reason is required.'
        );

        return;
      }
    }


    const confirmed =
      window.confirm(
        `Change ${hospital.name} from ${hospital.status} to ${newStatus}?`
      );

    if (!confirmed) {
      return;
    }


    try {
      setWorking(true);
      setMessage('');

      const response =
        await changeOrganisationHospitalStatus(
          hospital.id,
          newStatus,
          reason
        );

      setMessage(response.message);

      await loadHospitals();

    } catch (error) {
      setMessage(error.message);
    } finally {
      setWorking(false);
    }
  }


  async function handleAdminCreation(
    event,
    hospital
  ) {
    event.preventDefault();

    const form =
      event.currentTarget;

    const values =
      new FormData(form);


    try {
      setWorking(true);
      setMessage('');

      const response =
        await createHospitalAdmin({
          hospital_id:
            hospital.id,

          full_name:
            values
              .get('full_name')
              .trim(),

          email:
            values
              .get('email')
              .trim(),

          phone:
            values
              .get('phone')
              .trim(),

          password:
            values.get(
              'password'
            ),
        });


      setMessage(
        response.message
      );

      form.reset();

    } catch (error) {
      setMessage(error.message);
    } finally {
      setWorking(false);
    }
  }


  return (
    <main className="admin-layout">

      <AdminSidebar />


      <section className="admin-main">

        <div className="admin-header">

          <div>
            <p>
              ORGANISATION ADMINISTRATION
            </p>

            <h1>
              Hospital Management
            </h1>

            <span>
              Register hospitals,
              manage participation
              status and create
              Hospital Admin accounts.
            </span>
          </div>

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
            Participating Hospitals
          </h2>


          <div className="management-filters">

            <input
              type="search"
              placeholder="Search hospital, city or state"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
            />


            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
            >
              <option value="">
                All Statuses
              </option>

              <option value="Pending">
                Pending
              </option>

              <option value="Approved">
                Approved
              </option>

              <option value="Rejected">
                Rejected
              </option>

              <option value="Suspended">
                Suspended
              </option>

            </select>

          </div>


          {loading ? (
            <p>
              Loading hospitals...
            </p>
          ) : filteredHospitals.length ===
            0 ? (
            <p className="workspace-empty">
              No matching hospitals.
            </p>
          ) : (
            <div className="hospital-list">

              {filteredHospitals.map(
                (hospital) => {

                  const isOpen =
                    openId ===
                    hospital.id;


                  return (
                    <article
                      className="workspace-panel"
                      key={hospital.id}
                    >

                      <div className="management-heading">

                        <div>
                          <h2>
                            {hospital.name}
                          </h2>

                          <p>
                            {hospital.city},{' '}
                            {hospital.state}
                          </p>
                        </div>


                        <span className="management-badge">
                          {hospital.status}
                        </span>

                      </div>


                      <div className="management-actions">

                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() =>
                            setOpenId(
                              isOpen
                                ? null
                                : hospital.id
                            )
                          }
                        >
                          {isOpen
                            ? 'Hide Details'
                            : 'View Details'}
                        </button>


                        {hospital.status ===
                          'Pending' && (
                          <>
                            <button
                              type="button"
                              className="application-button"
                              disabled={
                                working
                              }
                              onClick={() =>
                                changeStatus(
                                  hospital,
                                  'Approved'
                                )
                              }
                            >
                              Approve
                            </button>

                            <button
                              type="button"
                              className="secondary-button"
                              disabled={
                                working
                              }
                              onClick={() =>
                                changeStatus(
                                  hospital,
                                  'Rejected'
                                )
                              }
                            >
                              Reject
                            </button>
                          </>
                        )}


                        {hospital.status ===
                          'Approved' && (
                          <button
                            type="button"
                            className="secondary-button"
                            disabled={
                              working
                            }
                            onClick={() =>
                              changeStatus(
                                hospital,
                                'Suspended'
                              )
                            }
                          >
                            Suspend
                          </button>
                        )}


                        {hospital.status ===
                          'Suspended' && (
                          <button
                            type="button"
                            className="application-button"
                            disabled={
                              working
                            }
                            onClick={() =>
                              changeStatus(
                                hospital,
                                'Approved'
                              )
                            }
                          >
                            Reactivate
                          </button>
                        )}


                        {hospital.status ===
                          'Rejected' && (
                          <button
                            type="button"
                            className="application-button"
                            disabled={
                              working
                            }
                            onClick={() =>
                              changeStatus(
                                hospital,
                                'Approved'
                              )
                            }
                          >
                            Approve Hospital
                          </button>
                        )}

                      </div>


                      {isOpen && (
                        <div className="record-details">

                          <div className="detail-grid">

                            <p>
                              <strong>
                                Address
                              </strong>
                              <br />
                              {
                                hospital.address
                              }
                            </p>

                            <p>
                              <strong>
                                Hospital Email
                              </strong>
                              <br />
                              {
                                hospital.email
                              }
                            </p>

                            <p>
                              <strong>
                                Hospital Phone
                              </strong>
                              <br />
                              {
                                hospital.phone
                              }
                            </p>

                            <p>
                              <strong>
                                Contact Person
                              </strong>
                              <br />
                              {
                                hospital.contact_name
                              }
                              <br />
                              {
                                hospital.contact_email
                              }
                            </p>

                            <p>
                              <strong>
                                Registered
                              </strong>
                              <br />
                              {formatDate(
                                hospital.created_at
                              )}
                            </p>

                            <p>
                              <strong>
                                Reviewed
                              </strong>
                              <br />
                              {formatDate(
                                hospital.reviewed_at
                              )}
                            </p>

                          </div>


                          {hospital.rejection_reason && (
                            <p>
                              <strong>
                                Rejection Reason:
                              </strong>{' '}
                              {
                                hospital.rejection_reason
                              }
                            </p>
                          )}


                          {hospital.suspension_reason && (
                            <p>
                              <strong>
                                Suspension Reason:
                              </strong>{' '}
                              {
                                hospital.suspension_reason
                              }
                            </p>
                          )}


                          {hospital.status ===
                            'Approved' && (
                            <form
                              className="admin-assignment"
                              onSubmit={(
                                event
                              ) =>
                                handleAdminCreation(
                                  event,
                                  hospital
                                )
                              }
                            >

                              <h3>
                                Create Hospital Admin
                              </h3>

                              <p>
                                Create the login
                                account responsible
                                for this hospital.
                              </p>


                              <div className="application-grid">

                                <label className="application-field">
                                  Full Name

                                  <input
                                    name="full_name"
                                    required
                                  />
                                </label>


                                <label className="application-field">
                                  Email Address

                                  <input
                                    type="email"
                                    name="email"
                                    required
                                  />
                                </label>


                                <label className="application-field">
                                  Phone Number

                                  <input
                                    type="tel"
                                    name="phone"
                                    required
                                  />
                                </label>


                                <label className="application-field">
                                  Password

                                  <input
                                    type="password"
                                    name="password"
                                    minLength="8"
                                    required
                                  />
                                </label>

                              </div>


                              <button
                                type="submit"
                                className="application-button"
                                disabled={
                                  working
                                }
                              >
                                Create Hospital Admin
                              </button>

                            </form>
                          )}

                        </div>
                      )}

                    </article>
                  );
                }
              )}

            </div>
          )}

        </section>


        <section className="workspace-panel management-section">

          <h2>
            Register Hospital Directly
          </h2>

          <p>
            Hospitals registered here
            become Approved immediately.
          </p>


          <form
            onSubmit={registerHospital}
          >

            <div className="application-grid">

              <label className="application-field">
                Hospital Name

                <input
                  name="name"
                  value={
                    hospitalForm.name
                  }
                  onChange={
                    handleHospitalChange
                  }
                  required
                />
              </label>


              <label className="application-field">
                Hospital Email

                <input
                  type="email"
                  name="email"
                  value={
                    hospitalForm.email
                  }
                  onChange={
                    handleHospitalChange
                  }
                  required
                />
              </label>


              <label className="application-field">
                Hospital Phone

                <input
                  type="tel"
                  name="phone"
                  value={
                    hospitalForm.phone
                  }
                  onChange={
                    handleHospitalChange
                  }
                  required
                />
              </label>


              <label className="application-field">
                Address

                <input
                  name="address"
                  value={
                    hospitalForm.address
                  }
                  onChange={
                    handleHospitalChange
                  }
                  required
                />
              </label>


              <label className="application-field">
                City

                <input
                  name="city"
                  value={
                    hospitalForm.city
                  }
                  onChange={
                    handleHospitalChange
                  }
                  required
                />
              </label>


              <label className="application-field">
                State

                <input
                  name="state"
                  value={
                    hospitalForm.state
                  }
                  onChange={
                    handleHospitalChange
                  }
                  required
                />
              </label>


              <label className="application-field">
                Contact Person

                <input
                  name="contact_name"
                  value={
                    hospitalForm.contact_name
                  }
                  onChange={
                    handleHospitalChange
                  }
                  required
                />
              </label>


              <label className="application-field">
                Contact Email

                <input
                  type="email"
                  name="contact_email"
                  value={
                    hospitalForm.contact_email
                  }
                  onChange={
                    handleHospitalChange
                  }
                  required
                />
              </label>

            </div>


            <button
              type="submit"
              className="application-button"
              disabled={working}
            >
              {working
                ? 'Saving...'
                : 'Register Hospital'}
            </button>

          </form>

        </section>

      </section>

    </main>
  );
}


export default ManageHospitals;