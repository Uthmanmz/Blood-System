import { Link } from 'react-router';
import systemConfig from '../config/systemConfig';
import '../styles/home.css';

function Home() {
  return (
    <main>

      <section className="hero">
        <div className="hero-content">
          <p className="hero-small-text">
            GIVE BLOOD. SUPPORT CARE.
          </p>

          <h1>
            A shared network for{' '}
            <span>blood donation coordination</span>
          </h1>

          <p className="hero-description">
            {systemConfig.systemName} connects participating hospitals,
            donors, and blood seekers through one coordinated blood
            donation management system.
          </p>

          <div className="hero-buttons">
            <Link
              to="/become-donor"
              className="donor-btn"
            >
              Become a Donor
            </Link>

            <Link
              to="/seeker-register"
              className="find-btn"
            >
              Become a Seeker
            </Link>
          </div>
        </div>

        <div className="hero-visual">
          <div
            className="blood-drop"
            aria-hidden="true"
          >
            ♥
          </div>

          <h3>Every Donation Matters</h3>

          <p>
            Register with a participating hospital,
            schedule donations, and help make blood
            available when it is needed.
          </p>
        </div>
      </section>

      <section className="availability-section">
        <div className="section-heading">
          <p>BLOOD AVAILABILITY</p>

          <h2>Find Blood at Participating Hospitals</h2>

          <span>
            Check available blood by blood group across
            approved hospitals in the network.
          </span>
        </div>

        <div className="home-action-panel">
          <Link
            className="application-button"
            to="/find-blood"
          >
            Find Blood
          </Link>

          <Link
            className="secondary-button"
            to="/hospitals"
          >
            View Participating Hospitals
          </Link>
        </div>
      </section>

      <section className="information-grid">
        <article>
          <h2>Before donating</h2>

          <p>
            Eat normally, drink enough water, carry
            suitable identification, and follow your
            hospital's donation instructions.
          </p>
        </article>

        <article>
          <h2>After donating</h2>

          <p>
            Rest briefly, take refreshments, and contact
            your hospital if you feel unwell after
            donating.
          </p>
        </article>

        <article>
          <h2>Need blood?</h2>

          <p>
            Check blood availability, create a seeker
            account, submit a request, and track its
            progress through the system.
          </p>
        </article>
      </section>

      <section className="cta-section">
        <div className="cta-content">
          <h2>Choose Your Next Step</h2>

          <p>
            Join the network as a donor or create a
            seeker account to request blood.
          </p>

          <div className="cta-buttons">
            <Link
              to="/become-donor"
              className="cta-donor"
            >
              Become a Donor
            </Link>

            <Link
              to="/seeker-register"
              className="cta-request"
            >
              Become a Seeker
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Home;