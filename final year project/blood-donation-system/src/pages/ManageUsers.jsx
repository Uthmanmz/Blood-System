import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import AdminSidebar from '../components/AdminSidebar';
import { getHospitalAdmins } from '../services/organisationApi';

import '../styles/adminDashboard.css';
import '../styles/newPages.css';

function ManageUsers() {
  const [administrators, setAdministrators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let active = true;

    getHospitalAdmins()
      .then((response) => {
        if (active) {
          setAdministrators(response.data.administrators || []);
          setError('');
        }
      })
      .catch((requestError) => {
        if (active) {
          setError(
            requestError.message ||
              'Unable to load hospital administrators'
          );
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const assignments = administrators.filter((administrator) => {
    const searchableText = [
      administrator.hospital_name,
      administrator.full_name,
      administrator.email,
    ]
      .join(' ')
      .toLowerCase();

    return searchableText.includes(search.toLowerCase());
  });

  return (
    <main className="admin-layout">
      <AdminSidebar />

      <section className="admin-main">
        <h1>Hospital Administrators</h1>

        {error && (
          <p className="workspace-notice">{error}</p>
        )}

        <div className="management-filters">
          <input
            aria-label="Search hospital administrators"
            placeholder="Search hospital, administrator or email"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <section className="workspace-panel">
          {loading ? (
            <p className="workspace-empty">
              Loading hospital administrators...
            </p>
          ) : assignments.length === 0 ? (
            <p className="workspace-empty">
              No matching administrator assignments.
            </p>
          ) : (
            <div className="management-table-wrapper">
              <table className="management-table">
                <thead>
                  <tr>
                    <th>Administrator</th>
                    <th>Email</th>
                    <th>Hospital</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {assignments.map((administrator) => (
                    <tr key={administrator.id}>
                      <td>{administrator.full_name}</td>
                      <td>{administrator.email}</td>
                      <td>{administrator.hospital_name}</td>
                      <td>{administrator.hospital_status}</td>
                      <td>
                        <Link className="secondary-button" to="/admin-hospitals">
                          Manage Assignment
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

export default ManageUsers;
