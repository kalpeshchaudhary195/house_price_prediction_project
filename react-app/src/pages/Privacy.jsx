import { Link } from 'react-router-dom';

export default function Privacy() {
  return (
    <>
      <header className="page-header">
        <div className="container">
          <h1 style={{ fontSize: '34px' }}>Privacy Policy</h1>
          <p className="section-subtitle center">
            How House Price Prediction handles information across this project.
          </p>
        </div>
      </header>

      <div className="container">
        <section className="section">
          <div className="legal-content">
            <div className="card legal-card">
              <h2>Information We Process</h2>
              <p>
                Property parameters (such as rooms, median income, and geographical coordinates) are transmitted
                to our local machine learning service to compute regression estimates. Predictions are recorded
                to your private history table.
              </p>
            </div>

            <div className="card legal-card">
              <h2>How We Use Information</h2>
              <p>Information submitted through forms is used strictly to:</p>
              <ul style={{ listStyle: 'disc', paddingLeft: '20px', marginTop: '8px' }}>
                <li>Perform instant machine learning house valuation calculations</li>
                <li>Display your personal property calculation history in your profile</li>
                <li>Improve model accuracy through controlled dataset retraining</li>
                <li>Process inquiries and customer feedback</li>
              </ul>
            </div>

            <div className="card legal-card">
              <h2>Data Security &amp; Credentials</h2>
              <p>
                All database credentials and connection parameters are securely isolated in environment variables.
                Client inputs are sanitized against out-of-boundary values and mathematical anomalies before inference.
              </p>
            </div>

            <div className="card legal-card">
              <h2>Storage &amp; Preferences</h2>
              <p>
                We use browser localStorage for preserving your chosen UI theme (dark/light mode) and profile preferences,
                and persistent database storage for saving completed property estimates.
              </p>
            </div>

            <div className="card legal-card">
              <h2>Contact Information</h2>
              <p>
                Questions about this policy can be directed to{' '}
                <a href="mailto:support@houseprediction.com" style={{ color: 'var(--primary)', fontWeight: 700 }}>
                  support@houseprediction.com
                </a>{' '}
                or through the <Link to="/contact" style={{ color: 'var(--primary)', fontWeight: 700 }}>Contact page</Link>.
              </p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
