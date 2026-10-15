import { useState } from 'react';
import { Link, NavLink } from 'react-router';
import '../styles/navbar.css';
import logo from '../assets/images/evoltra-logo.png';

function Navbar() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return <nav className="navbar" aria-label="Public website"><Link className="navbar-logo" to="/" onClick={close} aria-label="Evoltra Blood Network home"><img src={logo} alt="Evoltra Blood Network" /></Link><button className="navbar-toggle" type="button" aria-expanded={open} aria-controls="public-navigation" onClick={() => setOpen((value) => !value)}><span aria-hidden="true">☰</span><span className="sr-only">Menu</span></button><div id="public-navigation" className={`navbar-links ${open ? 'open' : ''}`}>{[['/','Home'],['/about','About'],['/hospitals','Hospitals'],['/become-donor','Become a Donor'],['/seeker-register','Become a Seeker'], ['/hospital-register', 'Register Hospital'],['/feedback','Feedback']].map(([path,label]) => <NavLink end={path === '/'} key={path} to={path} onClick={close}>{label}</NavLink>)}<details className="portal-menu"><summary>Role Portals</summary><div>{[['/donor-login','Donor'],['/seeker-login','Seeker'],['/personnel-login','Personnel'],['/hospital-login','Hospital Admin'],['/admin-login','Organisation Admin']].map(([path,label]) => <Link key={path} to={path} onClick={close}>{label}</Link>)}</div></details></div></nav>;
  
}

export default Navbar;
