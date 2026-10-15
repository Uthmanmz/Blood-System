import {
  useEffect,
  useState,
} from 'react';

import {
  Link,
} from 'react-router';

import HospitalAdminNav
  from '../components/HospitalAdminNav';

import {
  getHospitalAdminHospital,
  getHospitalAdminDashboard,
  getHospitalPersonnel,
} from '../services/hospitalAdminApi';

import '../styles/newPages.css';


function HospitalDashboard() {
  const [hospital, setHospital] =
    useState(null);

  const [dashboard, setDashboard] =
    useState(null);

  const [personnel, setPersonnel] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [message, setMessage] =
    useState('');


  useEffect(() => {
    loadDashboard();
  }, []);


  async function loadDashboard() {
    try {
      setLoading(true);
      setMessage('');

      const [
        hospitalResponse,
        dashboardResponse,
        personnelResponse,
      ] = await Promise.all([
        getHospitalAdminHospital(),
        getHospitalAdminDashboard(),
        getHospitalPersonnel(),
      ]);

      setHospital(
        hospitalResponse.data.hospital
      );

      setDashboard(
        dashboardResponse.data
      );

      setPersonnel(
        personnelResponse.data
          .personnel || []
      );
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }


  const activePersonnel =
    personnel.filter(
      (person) =>
        person.account_status ===
        'Active'
    ).length;


  const statistics =
    dashboard
      ? [
          [
            'Active Personnel',
            activePersonnel,
          ],
          [
            'Registered Donors',
            dashboard.donors.total,
          ],
          [
            'Completed Donations',
            dashboard.donations
              .completed,
          ],
          [
            'Scheduled Appointments',
            dashboard.appointments
              .scheduled,
          ],
          [
            'Available Blood Units',
            dashboard.inventory
              .available,
          ],
          [
            'Submitted Requests',
            dashboard.blood_requests
              .submitted,
          ],
          [
            'Requests Under Review',
            dashboard.blood_requests
              .under_review,
          ],
          [
            'Completed Requests',
            dashboard.blood_requests
              .completed,
          ],
        ]
      : [];


  return (
    <main className="workspace-page">

      <header className="workspace-header">
        <div>
          <span className="workspace-label">
            HOSPITAL ADMINISTRATION
          </span>

          <h1>
            {hospital?.name ||
              'Hospital Dashboard'}
          </h1>

          <p>
            Manage your hospital's
            blood donation operations.
          </p>
        </div>
      </header>


      <HospitalAdminNav />


      <section className="workspace-content">

        {message && (
          <p
            className="application-message"
            role="status"
          >
            {message}
          </p>
        )}


        {loading ? (
          <section className="workspace-panel">
            <p>
              Loading hospital
              dashboard...
            </p>
          </section>
        ) : (
          <>
            <div className="workspace-grid">

              {statistics.map(
                ([label, value]) => (
                  <article
                    className="workspace-card"
                    key={label}
                  >
                    <p>
                      {label}
                    </p>

                    <strong>
                      {value}
                    </strong>
                  </article>
                )
              )}

            </div>


            <div className="workspace-grid">

              <section className="workspace-panel">

                <h2>
                  Personnel Management
                </h2>

                <p>
                  Create personnel accounts,
                  assign permissions and
                  control staff access.
                </p>

                <p>
                  Total Personnel:{' '}
                  <strong>
                    {personnel.length}
                  </strong>
                </p>

                <p>
                  Active Personnel:{' '}
                  <strong>
                    {activePersonnel}
                  </strong>
                </p>

                <Link
                  className="application-button"
                  to="/hospital-personnel"
                >
                  Manage Personnel
                </Link>

              </section>


              <section className="workspace-panel">

                <h2>
                  Hospital Details
                </h2>

                {hospital && (
                  <>
                    <p>
                      <strong>
                        {hospital.name}
                      </strong>
                    </p>

                    <p>
                      {hospital.address}
                    </p>

                    <p>
                      {hospital.city},{' '}
                      {hospital.state}
                    </p>

                    <p>
                      {hospital.email}
                    </p>

                    <p>
                      {hospital.phone}
                    </p>

                    <p>
                      Contact:{' '}
                      {
                        hospital.contact_name
                      }
                    </p>

                    <p>
                      Participation:{' '}
                      <strong>
                        {hospital.status}
                      </strong>
                    </p>
                  </>
                )}

              </section>


              <section className="workspace-panel">

                <h2>
                  Inventory Overview
                </h2>

                <p>
                  Total Units:{' '}
                  <strong>
                    {
                      dashboard
                        ?.inventory
                        ?.total
                    }
                  </strong>
                </p>

                <p>
                  Awaiting Screening:{' '}
                  <strong>
                    {
                      dashboard
                        ?.inventory
                        ?.awaiting_screening
                    }
                  </strong>
                </p>

                <p>
                  Available:{' '}
                  <strong>
                    {
                      dashboard
                        ?.inventory
                        ?.available
                    }
                  </strong>
                </p>

                <p>
                  Reserved:{' '}
                  <strong>
                    {
                      dashboard
                        ?.inventory
                        ?.reserved
                    }
                  </strong>
                </p>

                <p>
                  Issued:{' '}
                  <strong>
                    {
                      dashboard
                        ?.inventory
                        ?.issued
                    }
                  </strong>
                </p>

              </section>

            </div>
          </>
        )}

      </section>

    </main>
  );
}

export default HospitalDashboard;