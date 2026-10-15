import { useNavigate } from 'react-router';
import { logoutUser } from '../services/authApi';

function LogoutButton({
  className,
  loginPath = '/login',
}) {
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await logoutUser();
    } catch {
      // Even if the server session has already expired,
      // return the user to login.
    }

    navigate(loginPath, {
      replace: true,
    });
  }

  return (
    <button
      type="button"
      className={className}
      onClick={handleLogout}
    >
      Logout
    </button>
  );
}

export default LogoutButton;