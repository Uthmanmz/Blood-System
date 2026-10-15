import { Link } from 'react-router';
import systemConfig from '../config/systemConfig';
import '../styles/about.css';

function About() {
  return (
    <main className="about-page">
      <section className="about-header">
        <p>
          ABOUT {systemConfig.systemName.toUpperCase()}
        </p>

        <h1>
          Connecting hospitals, donors, and blood seekers
        </h1>

        <span>
          A multi-hospital blood donation management
          system designed to support coordinated blood
          donation and request services.
        </span>
      </section>

      <section className="about-content">
        <div className="about-text">
          <h2>About the System</h2>

          <p>
            {systemConfig.systemName} provides a central
            platform through which participating hospitals
            can manage donors, donation appointments,
            blood inventory, blood requests, personnel,
            and notifications.
          </p>

          <p>
            Each hospital manages its own operational
            records while the organisation administrator
            coordinates participating hospitals across the
            network.
          </p>

          <p>
            Donors can register with an approved hospital,
            manage their donation activities and receive
            notifications. Blood seekers can create an
            account, search for blood, submit requests,
            and monitor the progress of those requests.
          </p>
        </div>

        <div className="about-card">
          <h3>Our Purpose</h3>

          <p>
            Improve coordination between blood donors,
            hospitals and people requesting blood while
            maintaining clear hospital-level management
            and blood availability information.
          </p>

          <Link
            to="/hospitals"
            className="about-donor-btn"
          >
            Browse Hospitals
          </Link>
        </div>
      </section>
    </main>
  );
}

export default About;