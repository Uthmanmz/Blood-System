import { useState } from 'react';
import { Link } from 'react-router';
import '../styles/login.css';
import systemConfig from '../config/systemConfig';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  function handleSubmit(event) {
  event.preventDefault();
  if (isSending) return;
  setIsSending(true);
  setMessage(`Demo mode: create a PHP password-reset endpoint to send a recovery link to ${email}.`);
  setIsSending(false);
}
  return (
    <main className="login-page">

      <div className="login-container">

        <div className="login-heading">
          <p>{systemConfig.systemName.toUpperCase()}</p>

          <h1>Forgot Password</h1>

          <span>
            Enter your account email to receive a password reset link.
          </span>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>

          <div className="login-form-group">
            <label htmlFor="email">Email Address</label>

            <input
              type="email"
              id="email"
              placeholder="Enter your email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="login-submit-btn"
            disabled={isSending}
          >
            {isSending ? 'Sending...' : 'Send Reset Link'}
          </button>

          {message && (
            <p className="login-message">
              {message}
            </p>
          )}

        </form>

        <div className="login-register">
          <p>
            Remember your password?
            <Link to="/login"> Back to Login</Link>
          </p>
        </div>

      </div>

    </main>
  );
}

export default ForgotPassword;
