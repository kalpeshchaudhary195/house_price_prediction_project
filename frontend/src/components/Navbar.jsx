import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import ThemeToggle from './ThemeToggle.jsx';

const LINKS = [
  { to: '/', label: 'Dashboard' },
  { to: '/prediction', label: 'Predict Price' },
  { to: '/properties', label: 'Properties' },
  { to: '/analytics', label: 'Analytics' },
  { to: '/history', label: 'Prediction History' },
  { to: '/model-performance', label: 'Model Performance' },
  { to: '/settings', label: 'Settings' },
  { to: '/about', label: 'About' },
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ThemeToggle />

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
        </div>

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
              Sign In
            </NavLink>
          </li>
        </ul>
      </div>
    </nav>
  );
}
