import { NavLink, Link, useNavigate, } from 'react-router';
import {
  BarChart3,
  Building2,
  LayoutDashboard,
  Mail,
  MessageSquare,
  UserCog,
} from 'lucide-react';
import { logoutUser, } from '../services/authApi';
import '../styles/newPages.css';

const menuItems = [
  ['/admin-dashboard', 'Dashboard', LayoutDashboard],
  ['/admin-hospitals', 'Manage Hospitals', Building2],
  ['/admin-users', 'Hospital Administrators', UserCog],
  ['/admin-notifications', 'Hospital Notices', Mail],
  ['/admin-reports', 'Hospital Reports', BarChart3],
  ['/admin-feedback', 'Public Feedback', MessageSquare],
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
        {menuItems.map(([path, label, Icon]) => (
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
            <Icon size={18} aria-hidden="true" />
            <span>{label}</span>
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
