import { useState } from 'react';
import { Link, useNavigate } from 'react-router';

import {
  ROLES,
  ROLE_LABELS,
} from '../config/roles';

import {
  loginUser,
  logoutUser,
} from '../services/authApi';

import '../styles/login.css';


const roleDetails = {
  [ROLES.ORGANISATION_ADMIN]: {
    description:
      'Manage participating hospitals and organisation activities.',
    dashboard: '/admin-dashboard',
    mark: 'OA',
  },

  [ROLES.HOSPITAL_ADMIN]: {
    description:
      'Manage your hospital and its blood bank personnel.',
    dashboard: '/hospital-dashboard',
    mark: 'HA',
  },

  [ROLES.PERSONNEL]: {
    description:
      'Manage your hospital’s donors, donations and blood requests.',
    dashboard: '/personnel-dashboard',
    mark: 'P',
  },

  [ROLES.DONOR]: {
    description:
      'Manage your profile, appointments and donation records.',
    dashboard: '/donor-dashboard',
    mark: 'D',
  },

  [ROLES.SEEKER]: {
    description:
      'Submit blood requests and follow their progress.',
    dashboard: '/seeker-dashboard',
    mark: 'S',
  },
};


// Keeps existing route names working.
const previousRoleNames = {
  Admin: ROLES.ORGANISATION_ADMIN,
  Personnel: ROLES.PERSONNEL,
  Donor: ROLES.DONOR,
};


function Login({
  expectedRole = ROLES.DONOR,
}) {
  const navigate = useNavigate();

  const role =
    previousRoleNames[expectedRole] ||
    expectedRole;

  const details =
    roleDetails[role];

  const roleLabel =
    ROLE_LABELS[role];

  const [formData, setFormData] =
    useState({
      email: '',
      password: '',
    });

  const [message, setMessage] =
    useState('');

  const [loading, setLoading] =
    useState(false);


  const isStaff = [
    ROLES.ORGANISATION_ADMIN,
    ROLES.HOSPITAL_ADMIN,
    ROLES.PERSONNEL,
  ].includes(role);


  function handleChange(event) {
    const {
      name,
      value,
    } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));

    setMessage('');
  }


  async function handleSubmit(event) {
    event.preventDefault();

    setMessage('');
    setLoading(true);

    try {
      const response =
        await loginUser(
          formData.email,
          formData.password
        );

      const user =
        response?.data?.user;


      if (!user) {
        throw new Error(
          'Login succeeded but user information was not returned.'
        );
      }


      /*
       * IMPORTANT:
       * A user must only log in through
       * the portal belonging to their role.
       */
      if (user.role !== role) {
        /*
         * login.php already created a PHP
         * session, so immediately destroy
         * that session before showing the
         * error.
         */
        try {
          await logoutUser();
        } catch {
          // Ignore logout error here.
        }

        throw new Error(
          `This account is not authorised for the ${roleLabel} portal.`
        );
      }


      navigate(
        details.dashboard,
        {
          replace: true,
        }
      );

    } catch (error) {
      setMessage(
        error.message ||
        'Login failed.'
      );
    } finally {
      setLoading(false);
    }
  }


  if (!details) {
    return (
      <main className="login-page">

        <div className="login-container">

          <h1>
            Login page unavailable
          </h1>

          <Link to="/">
            Return to Home
          </Link>

        </div>

      </main>
    );
  }


  return (
    <main
      className={
        `login-page login-page--${
          isStaff
            ? 'staff'
            : role
        }`
      }
    >

      <div className="login-container">

        <div className="login-heading">

          <div
            className="login-brand-mark"
            aria-hidden="true"
          >
            {details.mark}
          </div>


          <p>
            {roleLabel.toUpperCase()}
          </p>

          <h1>
            {roleLabel} Login
          </h1>

          <span>
            {details.description}
          </span>

        </div>


        <form
          className="login-form"
          onSubmit={handleSubmit}
        >

          <div className="login-form-group">

            <label htmlFor="email">
              Email Address
            </label>

            <input
              type="email"
              id="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              autoComplete="username"
              required
            />

          </div>


          <div className="login-form-group">

            <label htmlFor="password">
              Password
            </label>

            <input
              type="password"
              id="password"
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              autoComplete="current-password"
              required
            />

          </div>


          <div className="forgot-password-link">

            <Link to="/forgot-password">
              Forgot Password?
            </Link>

          </div>


          <button
            type="submit"
            className="login-submit-btn"
            disabled={loading}
          >
            {loading
              ? 'Signing In...'
              : 'Sign In'}
          </button>


          {message && (
            <p
              className="login-message"
              role="status"
            >
              {message}
            </p>
          )}

        </form>


        {role === ROLES.DONOR && (
          <div className="login-register">

            <p>
              New donor?{' '}

              <Link to="/become-donor">
                Create an Account
              </Link>
            </p>

          </div>
        )}


        {role === ROLES.SEEKER && (
          <div className="login-register">

            <p>
              Need an account?{' '}

              <Link to="/seeker-register">
                Become a Seeker
              </Link>
            </p>

          </div>
        )}

      </div>

    </main>
  );
}


export default Login;