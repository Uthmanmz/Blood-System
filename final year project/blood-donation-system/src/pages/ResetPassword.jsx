import { useState } from 'react';
import '../styles/login.css';
import systemConfig from '../config/systemConfig';

function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  function handleSubmit(event) {
  event.preventDefault();
  if (isUpdating) return;
  if (password !== confirmPassword) {
    setMessage('Passwords do not match.');
    return;
  }

  setIsUpdating(true);
  setMessage('Demo mode: connect this form to your PHP password-reset API to update the password.');
  setIsUpdating(false);
}

  return (
    <main className="login-page">

      <div className="login-container">

        <div className="login-heading">
          <p>{systemConfig.systemName.toUpperCase()}</p>

          <h1>Reset Password</h1>

          <span>
            Enter and confirm your new password.
          </span>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>

          <div className="login-form-group">
            <label htmlFor="password">New Password</label>

            <input
              type="password"
              id="password"
              placeholder="Enter new password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength="8"
              required
            />
          </div>

          <div className="login-form-group">
            <label htmlFor="confirmPassword">
              Confirm New Password
            </label>

            <input
              type="password"
              id="confirmPassword"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(event.target.value)
              }
              minLength="8"
              required
            />
          </div>

          <button
            type="submit"
            className="login-submit-btn"
            disabled={isUpdating}
          >
            {isUpdating ? 'Updating...' : 'Update Password'}
          </button>

          {message && (
            <p className="login-message">
              {message}
            </p>
          )}

        </form>

      </div>

    </main>
  );
}

export default ResetPassword;
