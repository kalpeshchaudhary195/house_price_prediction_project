import { useTheme } from '../context/ThemeContext.jsx';

export default function Settings() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="container" style={{ paddingBottom: '60px' }}>
      <header className="page-header" style={{ marginBottom: '24px' }}>
        <div className="container">
          <span className="hero-eyebrow">System Configuration</span>
          <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>
            Platform Settings &amp; Data Transparency
          </h1>
          <p className="section-subtitle center" style={{ maxWidth: '750px' }}>
            Inspect underlying architecture configurations, dataset specifications, database
            connection parameters, and interface visual preferences.
          </p>
        </div>
      </header>

      <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Card 1: Appearance */}
        <div className="card" style={{ padding: '24px', borderRadius: '16px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '14px' }}>
            🎨 Interface Appearance
          </h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: '600', color: 'var(--text)' }}>Active Theme Mode</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Switch between modern daylight theme and high-contrast dark theme
              </div>
            </div>
            <button type="button" className="btn btn-outline" onClick={toggleTheme} style={{ padding: '8px 18px', fontSize: '13px' }}>
              {theme === 'dark' ? '☀️ Switch to Light Mode' : '🌙 Switch to Dark Mode'}
            </button>
          </div>
        </div>

        {/* Card 2: Dataset Specifications */}
        <div className="card" style={{ padding: '24px', borderRadius: '16px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '14px' }}>
            📊 Primary Training Dataset Specifications
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', fontSize: '13px' }}>
            <div style={{ padding: '12px', background: 'var(--bg)', borderRadius: '10px' }}>
              <strong style={{ display: 'block', color: 'var(--text-muted)', fontSize: '11px' }}>DATASET FILE</strong>
              <span>housing.csv</span>
            </div>
            <div style={{ padding: '12px', background: 'var(--bg)', borderRadius: '10px' }}>
              <strong style={{ display: 'block', color: 'var(--text-muted)', fontSize: '11px' }}>TOTAL RECORDS</strong>
              <span>20,640 District Block Groups</span>
            </div>
            <div style={{ padding: '12px', background: 'var(--bg)', borderRadius: '10px' }}>
              <strong style={{ display: 'block', color: 'var(--text-muted)', fontSize: '11px' }}>TARGET VARIABLE</strong>
              <span>median_house_value (USD $)</span>
            </div>
            <div style={{ padding: '12px', background: 'var(--bg)', borderRadius: '10px' }}>
              <strong style={{ display: 'block', color: 'var(--text-muted)', fontSize: '11px' }}>CURRENCY STANDARD</strong>
              <span>United States Dollar ($ USD)</span>
            </div>
          </div>
          <div style={{ marginTop: '16px', fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
            ⚠️ <em>Important Limitation Notice:</em> The California Housing dataset records aggregate census district block
            characteristics rather than individual MLS property transactions. Models provide statistical reference valuations.
          </div>
        </div>

        {/* Card 3: Machine Learning Engine */}
        <div className="card" style={{ padding: '24px', borderRadius: '16px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '14px' }}>
            🤖 Active Machine Learning Model
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', fontSize: '13px' }}>
            <div style={{ padding: '12px', background: 'var(--bg)', borderRadius: '10px' }}>
              <strong style={{ display: 'block', color: 'var(--text-muted)', fontSize: '11px' }}>PRODUCTION ALGORITHM</strong>
              <span style={{ color: 'var(--primary)', fontWeight: '700' }}>Random Forest Regressor (100 Trees)</span>
            </div>
            <div style={{ padding: '12px', background: 'var(--bg)', borderRadius: '10px' }}>
              <strong style={{ display: 'block', color: 'var(--text-muted)', fontSize: '11px' }}>VALIDATION R² ACCURACY</strong>
              <span style={{ color: 'var(--success)', fontWeight: '700' }}>81.72% (Champion)</span>
            </div>
            <div style={{ padding: '12px', background: 'var(--bg)', borderRadius: '10px' }}>
              <strong style={{ display: 'block', color: 'var(--text-muted)', fontSize: '11px' }}>AVERAGE ERROR (MAE)</strong>
              <span>$31,628 USD</span>
            </div>
            <div style={{ padding: '12px', background: 'var(--bg)', borderRadius: '10px' }}>
              <strong style={{ display: 'block', color: 'var(--text-muted)', fontSize: '11px' }}>MICROSERVICE RUNTIME</strong>
              <span>Python 3.13 + FastAPI (Port 8000)</span>
            </div>
          </div>
        </div>

        {/* Card 4: PostgreSQL Architecture */}
        <div className="card" style={{ padding: '24px', borderRadius: '16px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '14px' }}>
            🐘 PostgreSQL Database Architecture
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', fontSize: '13px' }}>
            <div style={{ padding: '12px', background: 'var(--bg)', borderRadius: '10px' }}>
              <strong style={{ display: 'block', color: 'var(--text-muted)', fontSize: '11px' }}>DATABASE NAME</strong>
              <span>house_price_prediction_db</span>
            </div>
            <div style={{ padding: '12px', background: 'var(--bg)', borderRadius: '10px' }}>
              <strong style={{ display: 'block', color: 'var(--text-muted)', fontSize: '11px' }}>PORT & HOST</strong>
              <span>localhost:5432</span>
            </div>
            <div style={{ padding: '12px', background: 'var(--bg)', borderRadius: '10px' }}>
              <strong style={{ display: 'block', color: 'var(--text-muted)', fontSize: '11px' }}>CONNECTION POOL</strong>
              <span>node-postgres (pg) Pool (Max 20 clients)</span>
            </div>
            <div style={{ padding: '12px', background: 'var(--bg)', borderRadius: '10px' }}>
              <strong style={{ display: 'block', color: 'var(--text-muted)', fontSize: '11px' }}>STORAGE TABLES</strong>
              <span>predictions, properties, model_training_history</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

