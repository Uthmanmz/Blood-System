import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router';
import { ROLES } from '../config/roles';
import { getCurrentUser } from '../services/authApi';
import { getPersonnelPermissions } from '../services/personnelApi';

function PersonnelRouteGuard({ permission, children }) {
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState([]);

  useEffect(() => {
    let active = true;

    async function checkAccess() {
      try {
        const [userResponse, permissionResponse] =
          await Promise.all([
            getCurrentUser(),
            getPersonnelPermissions(),
          ]);

        if (!active) return;

        setUser(userResponse.data.user);
        setPermissions(
          permissionResponse.data.permissions || []
        );
      } catch {
        if (!active) return;

        setUser(null);
        setPermissions([]);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    checkAccess();

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user || user.role !== ROLES.PERSONNEL) {
    return (
      <Navigate
        to="/personnel-login"
        replace
        state={{
          from: location.pathname,
        }}
      />
    );
  }

  if (
    permission &&
    !permissions.includes(permission)
  ) {
    return (
      <Navigate
        to="/personnel-dashboard"
        replace
        state={{
          personnelMessage:
            'You do not have permission to access that area.',
        }}
      />
    );
  }

  return children;
}

export default PersonnelRouteGuard;