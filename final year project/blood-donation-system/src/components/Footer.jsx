import { Link } from 'react-router';
import systemConfig from '../config/systemConfig';
import '../styles/footer.css';

function Footer() {
  return <footer className="footer"><div className="footer-content"><div className="footer-section"><h3>{systemConfig.systemName}</h3><p>A multi-hospital blood donation and request coordination frontend.</p></div><div className="footer-section"><h4>Explore</h4><Link to="/about">About</Link><Link to="/hospitals">Hospitals</Link><Link to="/find-blood">Find Blood</Link><Link to="/feedback">Feedback</Link></div><div className="footer-section"><h4>Take Action</h4><Link to="/become-donor">Become a Donor</Link><Link to="/seeker-register">Become a Seeker</Link><Link to="/seeker-login">Seeker Login</Link></div><div className="footer-section"><h4>Contact</h4><p>Contact an approved hospital through the participating-hospitals directory for real service information.</p></div></div><div className="footer-bottom"><p>© 2026 {systemConfig.systemName}</p></div></footer>;
}

export default Footer;
