export default function About() {
  return (
    <>
      <header className="page-header">
        <div className="container">
          <h1 style={{ fontSize: '34px' }}>About House Price Prediction</h1>
          <p className="section-subtitle center">
            Our platform uses Machine Learning to estimate house prices based on
            important housing and geographical features.
          </p>
        </div>
      </header>

      <div className="container">
        <section className="section">
          <div className="about-grid">
            <div className="card slide-up">
              <h2 style={{ fontSize: '20px', marginBottom: '12px' }}>Who We Are</h2>
              <p style={{ color: 'var(--text-muted)', lineHeight: 1.7 }}>
                House Price Prediction is a Machine Learning based project that
                estimates property values using the California Housing Dataset. It
                combines a clean, modern interface with a regression model to
                demonstrate how data-driven predictions can support real-world
                real-estate decisions.
              </p>
            </div>

            <div className="card slide-up slide-up-delay-1">
              <h2 style={{ fontSize: '20px', marginBottom: '12px' }}>Our Mission</h2>
              <p style={{ color: 'var(--text-muted)', lineHeight: 1.7 }}>
                "To make property price estimation simple, accessible and
                intelligent." We believe anyone should be able to get a quick,
                informed sense of a property's value without needing to be a data
                scientist.
              </p>
            </div>
          </div>
        </section>

        <section className="section" style={{ paddingTop: 0 }}>
          <span className="section-eyebrow">Process</span>
          <h2 className="section-title">How It Works</h2>
          <p className="section-subtitle">
            From raw inputs to an estimated price in four simple steps.
          </p>

          <div className="process-track">
            <div className="card process-step">
              <div className="step-number">1</div>
              <h3>Enter Property Details</h3>
              <p>Provide income, rooms, location and other housing details.</p>
            </div>

            <div className="card process-step">
              <div className="step-number">2</div>
              <h3>Analyze Features</h3>
              <p>The platform organizes your inputs into model-ready features.</p>
            </div>

            <div className="card process-step">
              <div className="step-number">3</div>
              <h3>Apply Machine Learning</h3>
              <p>
                A regression model trained on the California Housing Dataset runs
                the estimate.
              </p>
            </div>

            <div className="card process-step">
              <div className="step-number">4</div>
              <h3>Get Estimated Price</h3>
              <p>View your prediction in a clear, dashboard-style summary.</p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
