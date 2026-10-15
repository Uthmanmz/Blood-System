import { useState } from 'react';
import { Link } from 'react-router';
import AdminSidebar from '../components/AdminSidebar';
import { readDemoData } from '../services/demoStore';

import '../styles/adminDashboard.css';
import '../styles/newPages.css';

function ManageUsers() {
  const [data] = useState(readDemoData);
  const [search, setSearch] = useState('');

  const assignments = data.hospitals.filter((hospital) => {
    const hasAdministrator =
      hospital.status === 'Approved' &&
      hospital.adminName &&
      hospital.adminEmail;

    const searchableText = [
      hospital.name,
      hospital.adminName || '',
      hospital.adminEmail || '',
    ].join(' ').toLowerCase();

    return (
      hasAdministrator &&
      searchableText.includes(search.toLowerCase())
    );
  });

  return (
    <main className="admin-layout">
      <AdminSidebar />

      <section className="admin-main">
        <h1>Hospital Administrators</h1>

        <p className="workspace-notice">
          These are administrator assignments saved in the frontend
          preview. Real login accounts have not been created.
        </p>

        <div className="management-filters">
          <input
            aria-label="Search hospital administrators"
            placeholder="Search hospital, administrator or email"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <section className="workspace-panel">
          {assignments.length === 0 ? (
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
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {assignments.map((hospital) => (
                    <tr key={hospital.id}>
                      <td>{hospital.adminName}</td>
                      <td>{hospital.adminEmail}</td>
                      <td>{hospital.name}</td>
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
