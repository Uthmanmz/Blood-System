import AdminSidebar from '../components/AdminSidebar';
import BloodRequestsPanel from '../components/BloodRequestsPanel';
import '../styles/adminDashboard.css';
import '../styles/manageBloodRequests.css';
import systemConfig from '../config/systemConfig';

function AdminRequests() {
  return (
    <main className="admin-layout">

      <AdminSidebar />

      <section className="admin-main">

        <div className="admin-header">
          <div>
            <p>REQUEST MONITORING</p>

            <h1>Blood Requests</h1>

            <span>
              Monitor blood requests submitted through {systemConfig.systemName}.
            </span>
          </div>
        </div>

        <BloodRequestsPanel canProcess={false} />

      </section>

    </main>
  );
}

export default AdminRequests;
