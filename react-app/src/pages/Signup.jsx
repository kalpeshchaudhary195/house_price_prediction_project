import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext.jsx';
import { isValidEmail, isValidPhone, passwordStrength } from '../utils/validators.js';

export default function Signup() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: '',
    terms: false,
  });

  const strength = passwordStrength(form.password);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      showToast('Full name is required.', 'error');
      return;
    }
    if (!isValidEmail(form.email)) {
      showToast('Please enter a valid email address.', 'error');
      return;
    }
    if (!isValidPhone(form.phone)) {
      showToast('Please enter a valid phone number (10-15 digits).', 'error');
      return;
    }
    if (form.password.length < 8) {
      showToast('Password must be at least 8 characters long.', 'error');
      return;
    }
    if (form.password !== form.confirm_password) {
      showToast('Passwords do not match.', 'error');
      return;
    }
    if (!form.terms) {
      showToast('Please agree to the Terms & Conditions and Privacy Policy.', 'error');
      return;
    }

    localStorage.setItem(
      'user-profile',
      JSON.stringify({
        name: form.name,
        email: form.email,
        phone: form.phone,
        location: 'Ahmedabad, India',
      })
    );

    showToast('Account created successfully! Welcome to House Price Prediction.', 'success');
    navigate('/login');
  };

  return (
    <div className="auth-page">
      <div className="auth-visual">
        <div className="auth-visual-content">
          <span className="auth-badge">✨ Real Estate Intelligence</span>
          <h2>Join smart homebuyers and real estate analysts.</h2>
          <p>
            Create your account to evaluate property values, track prediction history, and access genuine Machine Learning insights.
          </p>
          <div className="auth-visual-stats">
            <div>
              <strong>ML</strong>
              <span>Random Forest Regression</span>
            </div>
            <div>
              <strong>5</strong>
              <span>Ocean proximity zones</span>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-form-side">
        <div className="card auth-card slide-up">
          <div className="auth-logo">🏠</div>
          <h1>Create Account</h1>
          <p className="subtitle">Start predicting house prices today</p>

          <form onSubmit={handleSubmit} noValidate>
            <div className="input-group" style={{ marginBottom: '16px' }}>
              <label htmlFor="su-name">Full Name *</label>
              <input
                type="text"
                id="su-name"
                name="name"
                placeholder="Enter your full name"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="input-group" style={{ marginBottom: '16px' }}>
              <label htmlFor="su-email">Email Address *</label>
              <input
                type="email"
                id="su-email"
                name="email"
                placeholder="Enter your email"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="input-group" style={{ marginBottom: '16px' }}>
              <label htmlFor="su-phone">Phone Number *</label>
              <input
                type="tel"
                id="su-phone"
                name="phone"
                placeholder="Enter your phone (e.g. +91 9876543210)"
                value={form.phone}
                onChange={handleChange}
                required
              />
            </div>

            <div className="input-group" style={{ marginBottom: '8px' }}>
              <label htmlFor="su-password">Password *</label>
              <input
                type="password"
                id="su-password"
                name="password"
                placeholder="Create a password"
                value={form.password}
                onChange={handleChange}
                required
              />

              {form.password && (
                <div
                  className={`password-strength-wrap active ${
                    strength.score <= 1
                      ? 'strength-weak'
                      : strength.score === 2
                      ? 'strength-medium'
                      : 'strength-strong'
                  }`}
                >
                  <div className="password-strength-bars">
                    <div className="password-strength-bar" />
                    <div className="password-strength-bar" />
                    <div className="password-strength-bar" />
                  </div>
                  <div className="password-strength-text">Password strength: {strength.label}</div>
                </div>
              )}

              <ul className="password-requirements">
                <li className={strength.hasMinLen ? 'valid' : ''}>At least 8 characters</li>
                <li className={strength.hasUpper ? 'valid' : ''}>One uppercase letter</li>
                <li className={strength.hasNumber ? 'valid' : ''}>One number</li>
              </ul>
            </div>

            <div className="input-group" style={{ margin: '16px 0' }}>
              <label htmlFor="su-confirm">Confirm Password *</label>
              <input
                type="password"
                id="su-confirm"
                name="confirm_password"
                placeholder="Confirm your password"
                value={form.confirm_password}
                onChange={handleChange}
                required
              />
            </div>

            <label className="checkbox-row" style={{ marginBottom: '20px' }}>
              <input
                type="checkbox"
                id="su-terms"
                name="terms"
                checked={form.terms}
                onChange={handleChange}
                required
              />
              <span>
                I agree to the{' '}
                <Link to="/terms" style={{ color: 'var(--primary)', fontWeight: 700 }}>
                  Terms &amp; Conditions
                </Link>{' '}
                and{' '}
                <Link to="/privacy" style={{ color: 'var(--primary)', fontWeight: 700 }}>
                  Privacy Policy
                </Link>
              </span>
            </label>

            <button type="submit" className="btn btn-primary btn-block">
              Create Account
            </button>
          </form>

          <p className="auth-link">
            Already have an account? <Link to="/login">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
