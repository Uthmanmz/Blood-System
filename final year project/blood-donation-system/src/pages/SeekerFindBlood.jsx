import { useState } from 'react';
import { Link } from 'react-router';

import SeekerSidebar from '../components/SeekerSidebar';

import { apiGet } from '../services/api';

import '../styles/newPages.css';
import '../styles/donorDashboard.css';
import '../styles/inventoryManagement.css';


const BLOOD_GROUPS = [
  'A+',
  'A-',
  'B+',
  'B-',
  'AB+',
  'AB-',
  'O+',
  'O-',
];


function SeekerFindBlood() {
  const [results, setResults] =
    useState(null);

  const [bloodGroup, setBloodGroup] =
    useState('');

  const [searchedGroup, setSearchedGroup] =
    useState('');

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState('');


  async function handleSearch(event) {
    event.preventDefault();

    if (!bloodGroup) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      setResults(null);
      setSearchedGroup(bloodGroup);

      const result = await apiGet(
        `/blood-availability/search.php?blood_group=${encodeURIComponent(
          bloodGroup
        )}`
      );

      setResults(
        result.data?.hospitals || []
      );

    } catch (err) {
      setError(
        err.message ||
          'Unable to check blood availability.'
      );

      setResults([]);

    } finally {
      setLoading(false);
    }
  }


  return (
    <main className="donor-dashboard">

      <SeekerSidebar />

      <section className="donor-main">

        <div className="application-container">

          <header className="dashboard-header">

            <div>

              <p className="workspace-label">
                SEEKER PORTAL
              </p>

              <h1>
                Find Blood
              </h1>

              <span>
                Check current blood availability
                across approved hospitals in the
                network.
              </span>

            </div>

          </header>


          <form
            className="application-form"
            onSubmit={handleSearch}
          >

            <label className="application-field">
              Blood Group

              <select
                className="organisation-select"
                value={bloodGroup}
                onChange={(event) =>
                  setBloodGroup(
                    event.target.value
                  )
                }
                required
              >

                <option value="">
                  Select Blood Group
                </option>

                {BLOOD_GROUPS.map((group) => (
                  <option
                    key={group}
                    value={group}
                  >
                    {group}
                  </option>
                ))}

              </select>

            </label>


            <button
              className="application-button"
              type="submit"
              disabled={loading}
            >
              {loading
                ? 'Checking...'
                : 'Search Hospitals'}
            </button>

          </form>


          {error && (
            <section className="workspace-panel">

              <p className="workspace-empty">
                {error}
              </p>

            </section>
          )}


          {results !== null && !error && (
            <section className="management-section">

              <h2>
                Availability for {searchedGroup}
              </h2>


              {results.length === 0 ? (
                <div className="workspace-panel">

                  <p className="workspace-empty">
                    No available {searchedGroup}{' '}
                    blood units were found at
                    approved hospitals.
                  </p>

                </div>
              ) : (
                <div className="hospital-list">

                  {results.map((hospital) => (
                    <article
                      className="workspace-panel availability-result"
                      key={hospital.hospital_id}
                    >

                      <div>

                        <h3>
                          {hospital.hospital_name}
                        </h3>

                        {hospital.address && (
                          <p>
                            {hospital.address}
                          </p>
                        )}

                        <p>
                          {[
                            hospital.city,
                            hospital.state,
                          ]
                            .filter(Boolean)
                            .join(', ')}
                        </p>

                        {hospital.phone && (
                          <p>
                            {hospital.phone}
                          </p>
                        )}

                      </div>


                      <div>

                        <strong className="unit-status unit-status--available">
                          Available
                        </strong>

                        <p>
                          Available units:{' '}
                          {hospital.available_units}
                        </p>

                      </div>


                      <Link
                        className="application-button"
                        to={`/request-blood?hospitalId=${encodeURIComponent(
                          hospital.hospital_id
                        )}&bloodGroup=${encodeURIComponent(
                          searchedGroup
                        )}`}
                      >
                        Request Blood
                      </Link>

                    </article>
                  ))}

                </div>
              )}

            </section>
          )}

        </div>

      </section>

    </main>
  );
}


export default SeekerFindBlood;
