import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import HospitalAdminNav
  from '../components/HospitalAdminNav';

import {
  getHospitalAdminHospital,
  getHospitalPersonnel,
  createHospitalPersonnel,
  updateHospitalPersonnel,
  updatePersonnelStatus,
} from '../services/hospitalAdminApi';

import '../styles/newPages.css';


const PERMISSIONS = [
  {
    code: 'MANAGE_DONORS',
    label: 'Manage Donors',
  },
  {
    code: 'MANAGE_APPOINTMENTS',
    label: 'Manage Appointments',
  },
  {
    code: 'RECORD_DONATIONS',
    label: 'Record Donations',
  },
  {
    code: 'MANAGE_INVENTORY',
    label: 'Manage Inventory',
  },
  {
    code:
      'PROCESS_BLOOD_REQUESTS',
    label:
      'Process Blood Requests',
  },
  {
    code: 'SEND_NOTIFICATIONS',
    label: 'Send Notifications',
  },
];


function getPersonnelDetails(
  form
) {
  const values =
    new FormData(form);

  return {
    full_name:
      values
        .get('full_name')
        .trim(),

    email:
      values
        .get('email')
        .trim()
        .toLowerCase(),

    phone:
      values
        .get('phone')
        .trim(),

    job_title:
      values
        .get('job_title')
        .trim(),

    staff_number:
      values
        .get('staff_number')
        .trim(),

    permissions:
      values.getAll(
        'permissions'
      ),
  };
}


function HospitalPersonnel() {
  const [hospital, setHospital] =
    useState(null);

  const [personnel, setPersonnel] =
    useState([]);

  const [message, setMessage] =
    useState('');

  const [search, setSearch] =
    useState('');

  const [editing, setEditing] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const editHeading = useRef(null);


  useEffect(() => {
    loadPage();
  }, []);


  useEffect(() => {
    if (editing) {
      editHeading.current
        ?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });

      editHeading.current
        ?.focus();
    }
  }, [editing]);


  async function loadPage() {
    try {
      setLoading(true);

      const [
        hospitalResponse,
        personnelResponse,
      ] = await Promise.all([
        getHospitalAdminHospital(),
        getHospitalPersonnel(),
      ]);

      setHospital(
        hospitalResponse.data.hospital
      );

      setPersonnel(
        personnelResponse.data
          .personnel || []
      );
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }


  const filteredPersonnel =
    useMemo(() => {
      const query = search
        .trim()
        .toLowerCase();

      return personnel.filter(
        (person) =>
          !query ||
          [
            person.full_name,
            person.email,
            person.phone,
            person.staff_number,
            person.job_title,
            person.account_status,
          ]
            .join(' ')
            .toLowerCase()
            .includes(query)
      );
    }, [
      personnel,
      search,
    ]);


  async function submitAdd(
    event
  ) {
    event.preventDefault();

    const form =
      event.currentTarget;

    const details =
      getPersonnelDetails(form);

    const password =
      new FormData(form)
        .get('password')
        .trim();


    if (
      details.permissions
        .length === 0
    ) {
      setMessage(
        'Select at least one personnel permission.'
      );

      return;
    }


    if (
      password.length < 8
    ) {
      setMessage(
        'Password must contain at least 8 characters.'
      );

      return;
    }


    try {
      setSaving(true);
      setMessage('');

      const response =
        await createHospitalPersonnel({
          ...details,
          password,
        });

      setMessage(
        response.message
      );

      form.reset();

      await loadPage();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  }


  async function submitEdit(
    event
  ) {
    event.preventDefault();

    if (!editing) {
      return;
    }

    const details =
      getPersonnelDetails(
        event.currentTarget
      );


    if (
      details.permissions
        .length === 0
    ) {
      setMessage(
        'Select at least one personnel permission.'
      );

      return;
    }


    try {
      setSaving(true);
      setMessage('');

      const response =
        await updateHospitalPersonnel(
          editing.id,
          details
        );

      setMessage(
        response.message
      );

      setEditing(null);

      await loadPage();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  }


  async function changeStatus(
    person
  ) {
    const nextStatus =
      person.account_status ===
      'Active'
        ? 'Disabled'
        : 'Active';

    const confirmed =
      window.confirm(
        `${nextStatus === 'Disabled'
          ? 'Disable'
          : 'Activate'
        } ${person.full_name}?`
      );

    if (!confirmed) {
      return;
    }


    try {
      setMessage('');

      const response =
        await updatePersonnelStatus(
          person.id,
          nextStatus
        );

      setMessage(
        response.message
      );

      await loadPage();
    } catch (error) {
      setMessage(error.message);
    }
  }


  function permissionNames(
    codes = []
  ) {
    return codes
      .map(
        (code) =>
          PERMISSIONS.find(
            (permission) =>
              permission.code ===
              code
          )?.label || code
      )
      .join(', ');
  }


  return (
    <main className="workspace-page">

      <header className="workspace-header">
        <div>
          <span className="workspace-label">
            HOSPITAL ADMINISTRATION
          </span>

          <h1>
            Manage Personnel
          </h1>

          <p>
            {hospital?.name ||
              'Hospital'}
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


        <section className="workspace-panel">

          <h2>
            Add Personnel
          </h2>

          <p>
            Create a personnel account
            for this hospital and assign
            only the permissions required
            for their job.
          </p>


          <form
            className="management-form"
            onSubmit={submitAdd}
          >

            <label>
              Full Name

              <input
                name="full_name"
                required
              />
            </label>


            <label>
              Email Address

              <input
                type="email"
                name="email"
                required
              />
            </label>


            <label>
              Phone Number

              <input
                type="tel"
                name="phone"
                required
              />
            </label>


            <label>
              Staff Number

              <input
                name="staff_number"
                placeholder="Optional"
              />
            </label>


            <label>
              Job Title

              <input
                name="job_title"
                required
                placeholder="e.g. Blood Bank Personnel"
              />
            </label>


            <label>
              Temporary Password

              <input
                type="password"
                name="password"
                required
                minLength="8"
              />
            </label>


            <fieldset className="permission-options">

              <legend>
                Assigned Permissions
              </legend>

              {PERMISSIONS.map(
                (permission) => (
                  <label
                    key={
                      permission.code
                    }
                  >
                    <input
                      type="checkbox"
                      name="permissions"
                      value={
                        permission.code
                      }
                    />

                    {
                      permission.label
                    }
                  </label>
                )
              )}

            </fieldset>


            <button
              type="submit"
              className="application-button"
              disabled={saving}
            >
              {saving
                ? 'Creating...'
                : 'Create Personnel'}
            </button>

          </form>

        </section>


        {editing && (
          <section className="workspace-panel management-section">

            <h2
              ref={editHeading}
              tabIndex="-1"
            >
              Edit Personnel:{' '}
              {editing.full_name}
            </h2>


            <form
              key={editing.id}
              className="management-form"
              onSubmit={submitEdit}
            >

              <label>
                Full Name

                <input
                  name="full_name"
                  defaultValue={
                    editing.full_name
                  }
                  required
                />
              </label>


              <label>
                Email Address

                <input
                  type="email"
                  name="email"
                  defaultValue={
                    editing.email
                  }
                  required
                />
              </label>


              <label>
                Phone Number

                <input
                  type="tel"
                  name="phone"
                  defaultValue={
                    editing.phone
                  }
                  required
                />
              </label>


              <label>
                Staff Number

                <input
                  name="staff_number"
                  defaultValue={
                    editing.staff_number ||
                    ''
                  }
                />
              </label>


              <label>
                Job Title

                <input
                  name="job_title"
                  defaultValue={
                    editing.job_title ||
                    ''
                  }
                  required
                />
              </label>


              <fieldset className="permission-options">

                <legend>
                  Assigned Permissions
                </legend>

                {PERMISSIONS.map(
                  (permission) => (
                    <label
                      key={
                        permission.code
                      }
                    >
                      <input
                        type="checkbox"
                        name="permissions"
                        value={
                          permission.code
                        }
                        defaultChecked={
                          (
                            editing.permissions ||
                            []
                          ).includes(
                            permission.code
                          )
                        }
                      />

                      {
                        permission.label
                      }
                    </label>
                  )
                )}

              </fieldset>


              <div className="management-actions">

                <button
                  type="submit"
                  className="application-button"
                  disabled={saving}
                >
                  {saving
                    ? 'Saving...'
                    : 'Save Changes'}
                </button>

                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    setEditing(null)
                  }
                >
                  Cancel
                </button>

              </div>

            </form>

          </section>
        )}


        <section className="workspace-panel management-section">

          <div className="management-heading">

            <div>
              <h2>
                Hospital Personnel
              </h2>

              <p>
                {personnel.length}{' '}
                personnel account(s)
              </p>
            </div>


            <div className="management-filters">

              <input
                aria-label="Search personnel"
                placeholder="Search personnel"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
              />

            </div>

          </div>


          {loading ? (
            <p>
              Loading personnel...
            </p>
          ) : filteredPersonnel.length ===
            0 ? (
            <p className="workspace-empty">
              No matching personnel
              records.
            </p>
          ) : (
            <div className="management-table-wrapper">

              <table className="management-table">

                <thead>
                  <tr>
                    <th>
                      Personnel
                    </th>

                    <th>
                      Staff No.
                    </th>

                    <th>
                      Job Title
                    </th>

                    <th>
                      Contact
                    </th>

                    <th>
                      Permissions
                    </th>

                    <th>
                      Status
                    </th>

                    <th>
                      Actions
                    </th>
                  </tr>
                </thead>


                <tbody>

                  {filteredPersonnel.map(
                    (person) => (
                      <tr
                        key={person.id}
                      >

                        <td>
                          <strong>
                            {
                              person.full_name
                            }
                          </strong>
                        </td>

                        <td>
                          {
                            person.staff_number ||
                            '-'
                          }
                        </td>

                        <td>
                          {
                            person.job_title ||
                            '-'
                          }
                        </td>

                        <td>
                          {
                            person.email
                          }

                          <br />

                          <small>
                            {
                              person.phone
                            }
                          </small>
                        </td>

                        <td>
                          {
                            permissionNames(
                              person.permissions
                            ) ||
                            'None'
                          }
                        </td>

                        <td>
                          <span className="status-badge">
                            {
                              person.account_status
                            }
                          </span>
                        </td>

                        <td>
                          <div className="management-actions">

                            <button
                              type="button"
                              className="secondary-button"
                              onClick={() =>
                                setEditing(
                                  person
                                )
                              }
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              className="secondary-button"
                              onClick={() =>
                                changeStatus(
                                  person
                                )
                              }
                            >
                              {person.account_status ===
                              'Active'
                                ? 'Disable'
                                : 'Activate'}
                            </button>

                          </div>
                        </td>

                      </tr>
                    )
                  )}

                </tbody>

              </table>

            </div>
          )}

        </section>

      </section>

    </main>
  );
}

export default HospitalPersonnel;