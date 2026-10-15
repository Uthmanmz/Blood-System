import AdminSidebar from '../components/AdminSidebar';
import DonorManagement from './ManageDonors';

import '../styles/adminDashboard.css';
import '../styles/manageDonors.css';

function AdminDonors() {
  return (
    <main className="admin-layout">

      <AdminSidebar />

      <section className="admin-main">

        <div className="admin-header">
          <div>
            <p>DONOR MONITORING</p>

            <h1>Registered Donors</h1>

            <span>
              Monitor registered donors and their availability.
            </span>
          </div>
        </div>

        <DonorManagement
          embedded
          canEdit={false}
          canDelete={false}
        />

      </section>

    </main>
  );
}

export default AdminDonors;
