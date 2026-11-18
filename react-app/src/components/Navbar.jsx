import { useState } from 'react';
import { NavLink } from 'react-router-dom';

const LINKS = [
  { to: '/', label: 'Home' },
  { to: '/prediction', label: 'Predict' },
  { to: '/model-performance', label: 'Model Performance' },
  { to: '/features', label: 'Features' },
  { to: '/about', label: 'About Us' },
  { to: '/profile', label: 'History & Profile' },
  { to: '/feedback', label: 'Feedback' },
  { to: '/contact', label: 'Contact' },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className="navbar">
      <div className="nav-container">
        <NavLink to="/" className="nav-logo" onClick={closeMenu}>
          🏠 House Price Prediction
        </NavLink>

        <button
          type="button"
          className={`nav-toggle-btn${menuOpen ? ' open' : ''}`}
          aria-label="Open menu"
          onClick={() => setMenuOpen((o) => !o)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <ul className={`nav-links${menuOpen ? ' open' : ''}`}>
          {LINKS.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                onClick={closeMenu}
                className={({ isActive }) => (isActive ? 'active' : undefined)}
              >
                {link.label}
              </NavLink>
            </li>
          ))}
          <li>
            <NavLink to="/login" className="nav-cta" onClick={closeMenu}>
              Login / Sign Up
            </NavLink>
          </li>
        </ul>
      </div>
    </nav>
  );
}
