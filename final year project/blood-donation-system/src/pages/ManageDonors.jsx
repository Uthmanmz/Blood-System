import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import PersonnelSidebar from '../components/PersonnelSideBar';

import {
  getHospitalDonors,
  updateHospitalDonor,
  updateHospitalDonorAvailability,
  getHospitalDonorDonationHistory,
} from '../services/donorApi';

import '../styles/personnelDashboard.css';
import '../styles/newPages.css';

function ManageDonors() {
  const [donors, setDonors] = useState([]);
  const [search, setSearch] = useState('');

  const [selectedId, setSelectedId] = useState(null);
  const [editing, setEditing] = useState(false);

  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] =
    useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState('');

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    gender: '',
    date_of_birth: '',
    address: '',
  });

  useEffect(() => {
    loadDonors();
  }, []);

  async function loadDonors() {
    try {
      setLoading(true);

      const response =
        await getHospitalDonors();

      setDonors(
        response.data.donors || []
      );
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    if (!query) {
      return donors;
    }

    return donors.filter((donor) =>
      [
        donor.full_name,
        donor.email,
        donor.phone,
        donor.blood_group,
        donor.genotype,
      ]
        .join(' ')
        .toLowerCase()
        .includes(query)
    );
  }, [donors, search]);

  const selected = donors.find(
    (donor) =>
      donor.donor_id === selectedId
  );

  async function openDonor(donor) {
    setSelectedId(donor.donor_id);
    setEditing(false);
    setMessage('');

    setFormData({
      full_name: donor.full_name || '',
      email: donor.email || '',
      phone: donor.phone || '',
      gender: donor.gender || '',
      date_of_birth:
        donor.date_of_birth || '',
      address: donor.address || '',
    });

    try {
      setHistoryLoading(true);

      const response =
        await getHospitalDonorDonationHistory(
          donor.donor_id
        );

      setHistory(
        response.data.donations || []
      );
    } catch (error) {
      setHistory([]);
      setMessage(error.message);
    } finally {
      setHistoryLoading(false);
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

  async function handleSave(event) {
    event.preventDefault();

    if (!selected) {
      return;
    }

    try {
      setSaving(true);
      setMessage('');

      await updateHospitalDonor({
        donor_id: selected.donor_id,
        ...formData,
      });

      await loadDonors();

      setEditing(false);

      setMessage(
        'Donor profile updated successfully.'
      );
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleAvailability() {
    if (!selected) {
      return;
    }

    const current =
      Number(
        selected.available_for_donation
      ) === 1;

    try {
      setSaving(true);
      setMessage('');

      await updateHospitalDonorAvailability(
        selected.donor_id,
        !current
      );

      await loadDonors();

      setMessage(
        `Donor marked ${
          !current
            ? 'Available'
            : 'Not Available'
        }.`
      );
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="personnel-layout">
      <PersonnelSidebar />

      <section className="personnel-main">
        <h1>Hospital Donor Records</h1>

        <p>
          Manage donors registered with your
          hospital.
        </p>

        {message && (
          <p
            className="application-message"
            role="alert"
          >
            {message}
          </p>
        )}

        <div className="management-filters">
          <input
            aria-label="Search donors"
            placeholder="Search donor, email, phone or blood group"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
        </div>

        <section className="workspace-panel">
          {loading ? (
            <p>Loading donors...</p>
          ) : filtered.length === 0 ? (
            <p className="workspace-empty">
              No matching donors found.
            </p>
          ) : (
            <div className="management-table-wrapper">
              <table className="management-table">
                <thead>
                  <tr>
                    <th>Donor</th>
                    <th>Blood Group</th>
                    <th>Genotype</th>
                    <th>Availability</th>
                    <th>Account</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.map((donor) => (
                    <tr key={donor.donor_id}>
                      <td>
                        {donor.full_name}
                        <br />

                        <small>
                          {donor.email}
                        </small>
                      </td>

                      <td>
                        {donor.blood_group}
                      </td>

                      <td>
                        {donor.genotype}
                      </td>

                      <td>
                        {Number(
                          donor.available_for_donation
                        ) === 1
                          ? 'Available'
                          : 'Not Available'}
                      </td>

                      <td>
                        {donor.account_status}
                      </td>

                      <td>
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() =>
                            openDonor(donor)
                          }
                        >
                          View / Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {selected && (
          <section className="workspace-panel management-section">
            <div className="management-heading">
              <div>
                <h2>
                  {selected.full_name}
                </h2>

                <p>
                  Blood Group:{' '}
                  <strong>
                    {selected.blood_group}
                  </strong>
                  {' · '}
                  Genotype:{' '}
                  <strong>
                    {selected.genotype}
                  </strong>
                </p>
              </div>

              <div className="management-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={
                    handleAvailability
                  }
                  disabled={saving}
                >
                  Mark{' '}
                  {Number(
                    selected.available_for_donation
                  ) === 1
                    ? 'Not Available'
                    : 'Available'}
                </button>

                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    setEditing(
                      (current) => !current
                    )
                  }
                >
                  {editing
                    ? 'Cancel Edit'
                    : 'Edit Profile'}
                </button>

                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    setSelectedId(null);
                    setHistory([]);
                    setEditing(false);
                  }}
                >
                  Close
                </button>
              </div>
            </div>

            {!editing ? (
              <div className="detail-grid">
                <p>
                  <strong>
                    Email:
                  </strong>{' '}
                  {selected.email}
                </p>

                <p>
                  <strong>
                    Phone:
                  </strong>{' '}
                  {selected.phone}
                </p>

                <p>
                  <strong>
                    Gender:
                  </strong>{' '}
                  {selected.gender}
                </p>

                <p>
                  <strong>
                    Date of Birth:
                  </strong>{' '}
                  {selected.date_of_birth}
                </p>

                <p>
                  <strong>
                    Address:
                  </strong>{' '}
                  {selected.address}
                </p>

                <p>
                  <strong>
                    Availability:
                  </strong>{' '}
                  {Number(
                    selected.available_for_donation
                  ) === 1
                    ? 'Available'
                    : 'Not Available'}
                </p>

                <p>
                  <strong>
                    Account:
                  </strong>{' '}
                  {selected.account_status}
                </p>
              </div>
            ) : (
              <form
                className="management-form"
                onSubmit={handleSave}
              >
                <label>
                  Full Name
                  <input
                    name="full_name"
                    value={
                      formData.full_name
                    }
                    onChange={handleChange}
                    required
                  />
                </label>

                <label>
                  Email
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </label>

                <label>
                  Phone Number
                  <input
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </label>

                <label>
                  Gender
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    required
                  >
                    <option value="">
                      Select gender
                    </option>
                    <option value="Male">
                      Male
                    </option>
                    <option value="Female">
                      Female
                    </option>
                  </select>
                </label>

                <label>
                  Date of Birth
                  <input
                    type="date"
                    name="date_of_birth"
                    value={
                      formData.date_of_birth
                    }
                    onChange={handleChange}
                    required
                  />
                </label>

                <label>
                  Address
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    required
                  />
                </label>

                <button
                  type="submit"
                  className="application-button"
                  disabled={saving}
                >
                  {saving
                    ? 'Saving...'
                    : 'Save Changes'}
                </button>
              </form>
            )}

            <section className="management-section">
              <h2>Donation History</h2>

              {historyLoading ? (
                <p>
                  Loading donation history...
                </p>
              ) : history.length === 0 ? (
                <p className="workspace-empty">
                  No donation history found.
                </p>
              ) : (
                <div className="management-table-wrapper">
                  <table className="management-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Entry</th>
                      </tr>
                    </thead>

                    <tbody>
                      {history.map(
                        (donation) => (
                          <tr
                            key={
                              donation.id
                            }
                          >
                            <td>
                              {donation.id}
                            </td>

                            <td>
                              {donation.donation_date ||
                                donation.created_at ||
                                '-'}
                            </td>

                            <td>
                              {donation.status ||
                                '-'}
                            </td>

                            <td>
                              {donation.entry_method ||
                                donation.reference ||
                                'Donation'}
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
        )}
      </section>
    </main>
  );
}

export default ManageDonors;