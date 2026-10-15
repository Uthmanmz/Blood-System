import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { apiGet } from '../services/api';
import '../styles/newPages.css';

function Hospitals() {
  const [query, setQuery] = useState('');
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadHospitals() {
      try {
        setLoading(true);
        setError('');

        const result = await apiGet(
          '/hospitals/approved-list.php'
        );

        if (!active) return;

        setHospitals(result.data?.hospitals || []);
      } catch (err) {
        if (!active) return;

        setError(
          err.message ||
            'Unable to load participating hospitals.'
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadHospitals();

    return () => {
      active = false;
    };
  }, []);

  const filteredHospitals = useMemo(() => {
    const search = query.trim().toLowerCase();

    if (!search) {
      return hospitals;
    }

    return hospitals.filter((hospital) => {
      const searchableText = [
        hospital.name,
        hospital.address,
        hospital.city,
        hospital.state,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchableText.includes(search);
    });
  }, [hospitals, query]);

  return (
    <main className="application-page">
      <div className="directory-container">
        <header className="application-heading">
          <p className="workspace-label">
            PARTICIPATING FACILITIES
          </p>

          <h1>Hospital Directory</h1>

          <p>
            Browse approved hospitals participating in the
            blood donation network.
          </p>
        </header>

        <div className="management-filters">
          <input
            aria-label="Search participating hospitals"
            placeholder="Search hospital, city or state"
            value={query}
            onChange={(event) =>
              setQuery(event.target.value)
            }
          />
        </div>

        {loading && (
          <section className="workspace-panel">
            <p className="workspace-empty">
              Loading participating hospitals...
            </p>
          </section>
        )}

        {!loading && error && (
          <section className="workspace-panel">
            <p className="workspace-empty">
              {error}
            </p>
          </section>
        )}

        {!loading &&
          !error &&
          filteredHospitals.length === 0 && (
            <section className="workspace-panel">
              <p className="workspace-empty">
                No approved hospitals match your search.
              </p>
            </section>
          )}

        {!loading &&
          !error &&
          filteredHospitals.length > 0 && (
            <div className="directory-grid">
              {filteredHospitals.map((hospital) => (
                <article
                  className="workspace-panel"
                  key={hospital.id}
                >
                  <div className="management-heading">
                    <h2>{hospital.name}</h2>
                  </div>

                  {hospital.address && (
                    <p>{hospital.address}</p>
                  )}

                  <p>
                    {[hospital.city, hospital.state]
                      .filter(Boolean)
                      .join(', ')}
                  </p>

                  {hospital.phone && (
                    <p>{hospital.phone}</p>
                  )}

                  {hospital.email && (
                    <p>{hospital.email}</p>
                  )}

                  <div className="management-actions">
                    <Link
                      className="secondary-button"
                      to={`/become-donor?hospitalId=${encodeURIComponent(
                        hospital.id
                      )}`}
                    >
                      Register as Donor
                    </Link>

                    <Link
                      className="application-button"
                      to="/find-blood"
                    >
                      Search Blood
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
      </div>
    </main>
  );
}

export default Hospitals;