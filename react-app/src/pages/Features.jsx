import { Link } from 'react-router-dom';

const FEATURES = [
  {
    icon: '💵',
    title: '1. Median Income (MedInc)',
    desc: 'Median household income in tens of thousands of USD. The single highest-correlated predictor with house prices in California census blocks.',
    importance: 'Highest (★ ★ ★ ★ ★)',
    unit: '$10,000s / year',
  },
  {
    icon: '⏳',
    title: '2. House Age (HouseAge)',
    desc: 'Median age of structures in the block group in years. Influences depreciation, structural integrity, and architectural heritage.',
    importance: 'Moderate (★ ★ ★)',
    unit: 'Years',
  },
  {
    icon: '🛋️',
    title: '3. Average Rooms (AveRooms)',
    desc: 'Average number of total rooms per household unit. Reflects living space, layout breadth, and overall floor area.',
    importance: 'High (★ ★ ★ ★)',
    unit: 'Rooms / Household',
  },
  {
    icon: '🛏️',
    title: '4. Average Bedrooms (AveBedrms)',
    desc: 'Average number of dedicated bedrooms per home. Evaluates family accommodation capacity vs. living space ratio.',
    importance: 'Moderate (★ ★ ★)',
    unit: 'Bedrooms / Household',
  },
  {
    icon: '👥',
    title: '5. Block Population (Population)',
    desc: 'Total resident count in the census tract block group. Helps detect high-density urban corridors vs quiet suburban zones.',
    importance: 'Moderate (★ ★ ★)',
    unit: 'Residents count',
  },
  {
    icon: '👨‍👩‍👧',
    title: '6. Average Occupancy (AveOccup)',
    desc: 'Average household size. High density per unit typically correlates with rental properties or multi-family residences.',
    importance: 'Moderate (★ ★ ★)',
    unit: 'Persons / Household',
  },
  {
    icon: '📍',
    title: '7. Latitude Coordinate',
    desc: 'North-South coordinate in California (32.0° to 42.5°). Distinguishes Southern California (LA, San Diego) from Northern California (Bay Area).',
    importance: 'High (★ ★ ★ ★)',
    unit: 'Degrees North',
  },
  {
    icon: '🌐',
    title: '8. Longitude Coordinate',
    desc: 'East-West coordinate in California (-124.5° to -114.0°). Captures coastal corridors versus interior desert/valley zones.',
    importance: 'High (★ ★ ★ ★)',
    unit: 'Degrees West',
  },
  {
    icon: '🌊',
    title: '9. Ocean Proximity',
    desc: 'Categorical proximity (NEAR BAY, NEAR OCEAN, 1H OCEAN, INLAND, ISLAND). Premium coastlines command substantial price surges.',
    importance: 'Critical (★ ★ ★ ★ ★)',
    unit: 'Category string',
  },
];

export default function Features() {
  return (
    <>
      <header className="page-header">
        <div className="container">
          <span className="hero-eyebrow">Machine Learning Attributes</span>
          <h1 style={{ fontSize: '34px' }}>Features &amp; Model Architecture</h1>
          <p className="section-subtitle center">
            Discover the 9 key features analyzed by our California Housing regression model to evaluate property values accurately.
          </p>
        </div>
      </header>

      <div className="container">
        <section className="section">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '24px',
            }}
          >
            {FEATURES.map((f, idx) => (
              <div key={idx} className="card slide-up">
                <div style={{ fontSize: '28px', marginBottom: '12px' }}>{f.icon}</div>
                <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>{f.title}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: 1.6 }}>{f.desc}</p>
                <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '700' }}>
                  <span style={{ color: 'var(--primary)' }}>Importance: {f.importance}</span>
                  <span style={{ color: 'var(--text-muted)' }}>Unit: {f.unit}</span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '48px' }}>
            <Link to="/#predict-section" className="btn btn-primary" style={{ padding: '14px 32px', fontSize: '16px' }}>
              🔮 Test the Model on Home Page
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
