import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext.jsx';
import { isValidEmail } from '../utils/validators.js';

export default function Login() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!isValidEmail(email)) {
      showToast('Please enter a valid email address.', 'error');
      return;
    }
    if (!password) {
      showToast('Password is required.', 'error');
      return;
    }

    showToast('Logged in successfully!', 'success');
    navigate('/profile');
  };

  return (
    <div className="auth-page">
      <div className="auth-visual">
        <div className="auth-visual-content">
          <span className="auth-badge">🏠 California Housing Dataset</span>
          <h2>Smart predictions. Better decisions.</h2>
          <p>
            Log in to save your property evaluations, review historical predictions, and explore model metrics.
          </p>
          <div className="auth-visual-stats">
            <div>
              <strong>20,640</strong>
              <span>Homes analyzed</span>
            </div>
            <div>
              <strong>9</strong>
              <span>Predictive features</span>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-form-side">
        <div className="card auth-card slide-up">
          <div className="auth-logo">🏠</div>
          <h1>Welcome Back</h1>
          <p className="subtitle">Login to predict your dream home's price</p>

          <form onSubmit={handleSubmit} noValidate>
            <div className="input-group" style={{ marginBottom: '18px' }}>
              <label htmlFor="login-email">Email Address *</label>
              <input
                type="email"
                id="login-email"
                name="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="input-group" style={{ marginBottom: '18px' }}>
              <label htmlFor="login-password">Password *</label>
              <input
                type="password"
                id="login-password"
                name="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
                fontSize: '13px',
              }}
            >
              <label className="checkbox-row" style={{ margin: 0 }}>
                <input type="checkbox" defaultChecked />
                Remember me
              </label>
              <a
                href="#forgot-password"
                style={{ color: 'var(--primary)', fontWeight: 600 }}
                onClick={(e) => {
                  e.preventDefault();
                  showToast('Password reset link sent to registered email.', 'info');
                }}
              >
                Forgot Password?
              </a>
            </div>

            <button type="submit" className="btn btn-primary btn-block">
              Login to Account
            </button>
          </form>

          <p className="auth-link">
            Don't have an account? <Link to="/signup">Sign up for free</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
