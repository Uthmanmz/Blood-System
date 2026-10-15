import { NavLink, Link, useNavigate, } from 'react-router';
import { logoutUser, } from '../services/authApi';
import '../styles/newPages.css';

const menuItems = [
  ['/admin-dashboard', 'Dashboard'],
  ['/admin-hospitals', 'Manage Hospitals'],
  ['/admin-users', 'Hospital Administrators'],
  ['/admin-notifications', 'Hospital Notices'],
  ['/admin-reports', 'Hospital Reports'],
  ['/admin-feedback', 'Public Feedback'],
];

function AdminSidebar() {
  const navigate = useNavigate();

async function handleLogout() {
  try {
    await logoutUser();
  } catch (error) {
    console.error(error);
  } finally {
    navigate('/admin-login', {
      replace: true,
    });
  }
}
  return (
    <aside className="organisation-sidebar">
      <div className="organisation-sidebar-heading">
        <span>ORGANISATION</span>
        <h2>Administration</h2>
      </div>

      <nav aria-label="Organisation administration">
        {menuItems.map(([path, label]) => (
          <NavLink
            key={path}
            to={path}
            end
            className={({ isActive }) =>
              isActive
                ? 'organisation-menu-link active'
                : 'organisation-menu-link'
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="organisation-sidebar-bottom">
        <Link className="sidebar-public-action" to="/">Public Website</Link>
        <button type="button" className="sidebar-login-action" onClick={handleLogout} > 
          Logout
          </button>
      </div>
    </aside>
  );
}

export default AdminSidebar;
