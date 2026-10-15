import AdminSidebar from '../components/AdminSidebar';
import BloodInventoryPanel from '../components/BloodInventoryPanel';
import '../styles/adminDashboard.css';
import '../styles/bloodInventory.css';
import systemConfig from '../config/systemConfig';

function AdminInventory() {
  return (
    <main className="admin-layout">

      <AdminSidebar />

      <section className="admin-main">

        <div className="admin-header">

          <div>
            <p>INVENTORY MONITORING</p>

            <h1>Blood Inventory</h1>

            <span>
              Monitor the current blood inventory in {systemConfig.systemName}.
            </span>
          </div>

        </div>

        <BloodInventoryPanel canManage={false} />

      </section>

    </main>
  );
}

export default AdminInventory;
