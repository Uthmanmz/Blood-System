import { Link } from 'react-router';
import '../styles/notFound.css';

function NotFound() {
  return (
    <main className="not-found-page">
      <div className="not-found-panel">
        <p className="not-found-code">404</p>

        <h2>Page Not Found</h2>

        <p>
          The page you are looking for does not exist.
        </p>

        <Link className="not-found-link" to="/">
          Return Home
        </Link>
      </div>
    </main>
  );
}

export default NotFound;
