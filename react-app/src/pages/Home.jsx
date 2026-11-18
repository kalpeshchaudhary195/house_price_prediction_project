import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';

const SLIDES = [
  {
    badge: '🌊 Near Ocean · California',
    location: '📍 Pacific Palisades, CA',
    title: 'Luxury Seaside Villa with Infinity Pool',
    desc: 'Spacious modern estate with sweeping Pacific ocean views, open floor architecture, and high median household income block rating.',
    meta: ['🛏 5 Bedrooms', '🛁 4 Bathrooms', '📐 3,450 sqft', '📅 Built 2018'],
    price: '$875,000',
    img: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    preset: {
      MedInc: '8.5',
      HouseAge: '12',
      AveRooms: '6.8',
      AveBedrms: '1.2',
      Population: '950',
      AveOccup: '2.8',
      Latitude: '34.04',
      Longitude: '-118.52',
      OceanProximity: 'NEAR OCEAN',
    },
  },
  {
    badge: '🌉 Near Bay · Silicon Valley',
    location: '📍 San Francisco Bay, CA',
    title: 'Contemporary Bay Area Designer Home',
    desc: 'Energy-efficient contemporary home located near top tech campuses with private garden and smart climate systems.',
    meta: ['🛏 4 Bedrooms', '🛁 3 Bathrooms', '📐 2,650 sqft', '📅 Built 2021'],
    price: '$620,000',
    img: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
    preset: {
      MedInc: '6.5',
      HouseAge: '8',
      AveRooms: '5.8',
      AveBedrms: '1.1',
      Population: '1400',
      AveOccup: '2.9',
      Latitude: '37.86',
      Longitude: '-122.25',
      OceanProximity: 'NEAR BAY',
    },
  },
  {
    badge: '🏝️ Island · Waterfront',
    location: '📍 Santa Catalina Island, CA',
    title: 'Private Island Waterfront Sanctuary',
    desc: 'Exclusive island sanctuary boasting private boat slip, panoramic water views, and highest historical appreciation rate.',
    meta: ['🛏 6 Bedrooms', '🛁 5 Bathrooms', '📐 4,200 sqft', '📅 Built 2015'],
    price: '$1,050,000',
    img: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
    preset: {
      MedInc: '7.8',
      HouseAge: '16',
      AveRooms: '7.2',
      AveBedrms: '1.4',
      Population: '750',
      AveOccup: '2.5',
      Latitude: '33.38',
      Longitude: '-118.42',
      OceanProximity: 'ISLAND',
    },
  },
  {
    badge: '🌲 Inland · Countryside',
    location: '📍 Inland Foothills, CA',
    title: 'Tranquil Inland Family Craftsman',
    desc: 'Charming suburban residence surrounded by nature trails, top-rated school districts, and generous acreage.',
    meta: ['🛏 3 Bedrooms', '🛁 2 Bathrooms', '📐 1,980 sqft', '📅 Built 2012'],
    price: '$395,000',
    img: 'https://images.unsplash.com/photo-1576941089067-2de3c901e126?auto=format&fit=crop&w=1200&q=80',
    preset: {
      MedInc: '3.8',
      HouseAge: '22',
      AveRooms: '5.2',
      AveBedrms: '1.0',
      Population: '1850',
      AveOccup: '3.2',
      Latitude: '34.14',
      Longitude: '-117.85',
      OceanProximity: 'INLAND',
    },
  },
];

const INITIAL_FORM = {
  MedInc: '4.5',
  HouseAge: '25',
  AveRooms: '5.2',
  AveBedrms: '1.1',
  Population: '1200',
  AveOccup: '3.0',
  Latitude: '37.88',
  Longitude: '-122.23',
  OceanProximity: 'NEAR BAY',
};

export default function Home() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [slideIdx, setSlideIdx] = useState(0);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [modelSummary, setModelSummary] = useState(null);

  // Auto-play slider
  useEffect(() => {
    const timer = setInterval(() => {
      setSlideIdx((prev) => (prev + 1) % SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  // Fetch model metadata
  useEffect(() => {
    api.getModelInfo()
      .then((data) => {
        if (data && data.metrics) setModelSummary(data);
      })
      .catch(() => {});
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const applyPreset = (preset) => {
    setFormData((prev) => ({ ...prev, ...preset }));
    setErrors({});
    showToast('Applied property preset values to form.', 'info');
    const formEl = document.getElementById('predict-section');
    if (formEl) formEl.scrollIntoView({ behavior: 'smooth' });
  };

  const validate = () => {
    const errs = {};
    const medInc = parseFloat(formData.MedInc);
    if (isNaN(medInc) || medInc <= 0 || medInc > 20) {
      errs.MedInc = 'Median income must be between 0.1 and 20.0 ($10k units).';
    }

    const houseAge = parseFloat(formData.HouseAge);
    if (isNaN(houseAge) || houseAge < 1 || houseAge > 100) {
      errs.HouseAge = 'House age must be between 1 and 100 years.';
    }

    const aveRooms = parseFloat(formData.AveRooms);
    if (isNaN(aveRooms) || aveRooms < 0.5 || aveRooms > 50) {
      errs.AveRooms = 'Average rooms must be between 0.5 and 50.';
    }

    const aveBedrms = parseFloat(formData.AveBedrms);
    if (isNaN(aveBedrms) || aveBedrms < 0.5 || aveBedrms > 25) {
      errs.AveBedrms = 'Average bedrooms must be between 0.5 and 25.';
    } else if (!isNaN(aveRooms) && aveBedrms > aveRooms) {
      errs.AveBedrms = 'Bedrooms cannot exceed total rooms.';
    }

    const population = parseFloat(formData.Population);
    if (isNaN(population) || population < 1 || population > 50000) {
      errs.Population = 'Population must be between 1 and 50,000.';
    }

    const aveOccup = parseFloat(formData.AveOccup);
    if (isNaN(aveOccup) || aveOccup < 0.5 || aveOccup > 30) {
      errs.AveOccup = 'Average occupancy must be between 0.5 and 30.';
    } else if (!isNaN(population) && aveOccup > population) {
      errs.AveOccup = 'Average occupancy cannot exceed total population.';
    }

    const lat = parseFloat(formData.Latitude);
    if (isNaN(lat) || lat < 32.0 || lat > 42.5) {
      errs.Latitude = 'Latitude must be between 32.0° and 42.5° (California).';
    }

    const lon = parseFloat(formData.Longitude);
    if (isNaN(lon) || lon < -124.5 || lon > -114.0) {
      errs.Longitude = 'Longitude must be between -124.5° and -114.0° (California).';
    }

    if (!formData.OceanProximity) {
      errs.OceanProximity = 'Please select ocean proximity.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      showToast('Please fix the highlighted input errors.', 'error');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        MedInc: parseFloat(formData.MedInc),
        HouseAge: parseFloat(formData.HouseAge),
        AveRooms: parseFloat(formData.AveRooms),
        AveBedrms: parseFloat(formData.AveBedrms),
        Population: parseFloat(formData.Population),
        AveOccup: parseFloat(formData.AveOccup),
        Latitude: parseFloat(formData.Latitude),
        Longitude: parseFloat(formData.Longitude),
        OceanProximity: formData.OceanProximity,
      };

      const result = await api.predict(payload);
      sessionStorage.setItem('lastPrediction', JSON.stringify({ ...payload, result }));
      showToast('Prediction calculated successfully!', 'success');
      navigate('/prediction', { state: { prediction: result, formData: payload } });
    } catch (err) {
      showToast(err.message || 'Failed to predict house price.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData(INITIAL_FORM);
    setErrors({});
  };

  return (
    <>
      {/* ================= HERO ================= */}
      <section className="hero">
        <div className="container hero-grid">
          <div className="slide-up">
            <span className="hero-eyebrow">🤖 Machine Learning · California Housing Dataset</span>
            <h1>Predict Your Dream Home's Price with AI</h1>
            <p className="hero-subtitle">
              Get genuine, fast and intelligent house price estimates using our trained Machine Learning
              ensemble model on 20,640 California properties.
            </p>

            <div className="btn-row">
              <a href="#predict-section" className="btn btn-accent">
                🔮 Predict House Price
              </a>
              <Link
                to="/model-performance"
                className="btn btn-outline"
                style={{ borderColor: 'rgba(255,255,255,0.4)', color: '#fff' }}
              >
                📊 Model Performance
              </Link>
            </div>
          </div>

          <div className="hero-image-wrap slide-up slide-up-delay-1">
            <img
              src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80"
              alt="Modern house representing AI-estimated properties"
            />
            <div className="hero-float-card floaty">
              💰 $412,000
              <span>Estimated valuation</span>
            </div>
          </div>

          <div className="stats-bar" style={{ gridColumn: '1 / -1' }}>
            <div className="stat-item">
              <strong>20,640</strong>
              <span>Housing Records</span>
            </div>
            <div className="stat-item">
              <strong>9</strong>
              <span>Prediction Features</span>
            </div>
            <div className="stat-item">
              <strong>{modelSummary ? `${(modelSummary.metrics?.r2_score * 100).toFixed(1)}%` : '81.7%'}</strong>
              <span>R² Performance Score</span>
            </div>
            <div className="stat-item">
              <strong>&lt; 50ms</strong>
              <span>Fast ML Inference</span>
            </div>
          </div>
        </div>
      </section>

      {/* ================= INTERACTIVE IMAGE SLIDER ================= */}
      <section className="section slider-section" style={{ paddingBottom: '20px' }}>
        <div className="container">
          <div className="center" style={{ textAlign: 'center', marginBottom: '28px' }}>
            <span className="section-eyebrow">Featured Showcase</span>
            <h2 className="section-title">Explore California Properties</h2>
            <p className="section-subtitle center">
              Browse real-world property profiles and estimate similar values with 1 click.
            </p>
          </div>

          <div className="slider-container" aria-roledescription="carousel">
            <div className="slider-wrapper" style={{ transform: `translateX(-${slideIdx * 100}%)`, transition: 'transform 0.5s ease-in-out' }}>
              {SLIDES.map((slide, i) => (
                <div key={i} className="slider-slide" aria-hidden={i !== slideIdx}>
                  <div className="slide-image-box">
                    <img src={slide.img} alt={slide.title} loading="lazy" />
                    <span className="slide-badge">{slide.badge}</span>
                  </div>
                  <div className="slide-content-box">
                    <div className="slide-location">{slide.location}</div>
                    <h3 className="slide-title">{slide.title}</h3>
                    <p className="slide-desc">{slide.desc}</p>
                    <div className="slide-meta-row">
                      {slide.meta.map((m, idx) => (
                        <span key={idx} className="slide-meta-item">
                          {m}
                        </span>
                      ))}
                    </div>
                    <div className="slide-price-row">
                      <div className="slide-price">
                        {slide.price}
                        <span>Benchmark Valuation</span>
                      </div>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => applyPreset(slide.preset)}
                      >
                        Estimate Similar ⚡
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              className="slider-btn prev"
              aria-label="Previous Slide"
              onClick={() => setSlideIdx((prev) => (prev === 0 ? SLIDES.length - 1 : prev - 1))}
            >
              ❮
            </button>
            <button
              className="slider-btn next"
              aria-label="Next Slide"
              onClick={() => setSlideIdx((prev) => (prev + 1) % SLIDES.length)}
            >
              ❯
            </button>

            <div className="slider-dots" role="tablist">
              {SLIDES.map((_, i) => (
                <button
                  key={i}
                  className={`slider-dot ${i === slideIdx ? 'active' : ''}`}
                  onClick={() => setSlideIdx(i)}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================= PREDICTION FORM ================= */}
      <section className="section" id="predict-section">
        <div className="container">
          <div className="center" style={{ textAlign: 'center' }}>
            <span className="section-eyebrow">Instant Calculation</span>
            <h2 className="section-title">Predict Your House Price</h2>
            <p className="section-subtitle center">
              Enter the property parameters below to run our trained Machine Learning regression pipeline.
            </p>
          </div>

          {/* Quick preset chips */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', alignSelf: 'center' }}>
              Quick Presets:
            </span>
            <button
              type="button"
              className="btn btn-outline"
              style={{ fontSize: '13px', padding: '6px 14px' }}
              onClick={() => applyPreset(SLIDES[0].preset)}
            >
              🌊 Coastal Palisades Villa
            </button>
            <button
              type="button"
              className="btn btn-outline"
              style={{ fontSize: '13px', padding: '6px 14px' }}
              onClick={() => applyPreset(SLIDES[1].preset)}
            >
              🌉 SF Bay Contemporary
            </button>
            <button
              type="button"
              className="btn btn-outline"
              style={{ fontSize: '13px', padding: '6px 14px' }}
              onClick={() => applyPreset(SLIDES[3].preset)}
            >
              🌲 Inland Suburban Home
            </button>
          </div>

          <form className="card predict-form-card" onSubmit={handleSubmit} noValidate>
            <div className="form-grid">
              <div className={`input-group ${errors.MedInc ? 'has-error' : ''}`}>
                <label htmlFor="MedInc">Median Income ($10,000s) *</label>
                <input
                  type="number"
                  id="MedInc"
                  name="MedInc"
                  step="0.01"
                  min="0.1"
                  max="20"
                  value={formData.MedInc}
                  onChange={handleChange}
                  placeholder="e.g. 4.5"
                  required
                />
                <span className="field-hint">Block group income (e.g. 4.5 = $45,000/yr).</span>
                {errors.MedInc && <div className="field-error">⚠️ {errors.MedInc}</div>}
              </div>

              <div className={`input-group ${errors.HouseAge ? 'has-error' : ''}`}>
                <label htmlFor="HouseAge">House Age (Years) *</label>
                <input
                  type="number"
                  id="HouseAge"
                  name="HouseAge"
                  step="1"
                  min="1"
                  max="100"
                  value={formData.HouseAge}
                  onChange={handleChange}
                  placeholder="e.g. 25"
                  required
                />
                <span className="field-hint">Median age of houses in years.</span>
                {errors.HouseAge && <div className="field-error">⚠️ {errors.HouseAge}</div>}
              </div>

              <div className={`input-group ${errors.AveRooms ? 'has-error' : ''}`}>
                <label htmlFor="AveRooms">Average Rooms *</label>
                <input
                  type="number"
                  id="AveRooms"
                  name="AveRooms"
                  step="0.1"
                  min="0.5"
                  max="50"
                  value={formData.AveRooms}
                  onChange={handleChange}
                  placeholder="e.g. 5.2"
                  required
                />
                <span className="field-hint">Average rooms per household.</span>
                {errors.AveRooms && <div className="field-error">⚠️ {errors.AveRooms}</div>}
              </div>

              <div className={`input-group ${errors.AveBedrms ? 'has-error' : ''}`}>
                <label htmlFor="AveBedrms">Average Bedrooms *</label>
                <input
                  type="number"
                  id="AveBedrms"
                  name="AveBedrms"
                  step="0.1"
                  min="0.5"
                  max="20"
                  value={formData.AveBedrms}
                  onChange={handleChange}
                  placeholder="e.g. 1.1"
                  required
                />
                <span className="field-hint">Average bedrooms per household.</span>
                {errors.AveBedrms && <div className="field-error">⚠️ {errors.AveBedrms}</div>}
              </div>

              <div className={`input-group ${errors.Population ? 'has-error' : ''}`}>
                <label htmlFor="Population">Block Population *</label>
                <input
                  type="number"
                  id="Population"
                  name="Population"
                  step="1"
                  min="1"
                  value={formData.Population}
                  onChange={handleChange}
                  placeholder="e.g. 1200"
                  required
                />
                <span className="field-hint">Total block group population.</span>
                {errors.Population && <div className="field-error">⚠️ {errors.Population}</div>}
              </div>

              <div className={`input-group ${errors.AveOccup ? 'has-error' : ''}`}>
                <label htmlFor="AveOccup">Average Occupancy *</label>
                <input
                  type="number"
                  id="AveOccup"
                  name="AveOccup"
                  step="0.1"
                  min="0.5"
                  max="30"
                  value={formData.AveOccup}
                  onChange={handleChange}
                  placeholder="e.g. 3.0"
                  required
                />
                <span className="field-hint">Average household members.</span>
                {errors.AveOccup && <div className="field-error">⚠️ {errors.AveOccup}</div>}
              </div>

              <div className={`input-group ${errors.Latitude ? 'has-error' : ''}`}>
                <label htmlFor="Latitude">Latitude Coordinate *</label>
                <input
                  type="number"
                  id="Latitude"
                  name="Latitude"
                  step="0.01"
                  min="32.0"
                  max="42.5"
                  value={formData.Latitude}
                  onChange={handleChange}
                  placeholder="e.g. 34.05"
                  required
                />
                <span className="field-hint">California range: 32.0° to 42.5°.</span>
                {errors.Latitude && <div className="field-error">⚠️ {errors.Latitude}</div>}
              </div>

              <div className={`input-group ${errors.Longitude ? 'has-error' : ''}`}>
                <label htmlFor="Longitude">Longitude Coordinate *</label>
                <input
                  type="number"
                  id="Longitude"
                  name="Longitude"
                  step="0.01"
                  min="-124.5"
                  max="-114.0"
                  value={formData.Longitude}
                  onChange={handleChange}
                  placeholder="e.g. -118.25"
                  required
                />
                <span className="field-hint">California range: -124.5° to -114.0°.</span>
                {errors.Longitude && <div className="field-error">⚠️ {errors.Longitude}</div>}
              </div>

              <div className={`input-group full-width ${errors.OceanProximity ? 'has-error' : ''}`}>
                <label htmlFor="OceanProximity">Ocean Proximity *</label>
                <select
                  id="OceanProximity"
                  name="OceanProximity"
                  value={formData.OceanProximity}
                  onChange={handleChange}
                  required
                >
                  <option value="">-- Select Ocean Proximity --</option>
                  <option value="NEAR BAY">NEAR BAY (&lt; 5 miles to SF Bay)</option>
                  <option value="INLAND">INLAND (&gt; 30 miles from coast)</option>
                  <option value="NEAR OCEAN">NEAR OCEAN (&lt; 5 miles to Pacific Ocean)</option>
                  <option value="1H OCEAN">&lt; 1 HOUR TO OCEAN</option>
                  <option value="ISLAND">ISLAND (Catalina / Channel Islands)</option>
                </select>
                <span className="field-hint">Geographical relation to the California coastline.</span>
                {errors.OceanProximity && <div className="field-error">⚠️ {errors.OceanProximity}</div>}
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? '⏳ Calculating ML Valuation...' : '🔮 Predict House Price'}
                </button>
                <button type="button" className="btn btn-outline" onClick={handleReset} disabled={loading}>
                  Reset Form
                </button>
              </div>
            </div>
          </form>
        </div>
      </section>

      {/* ================= MODEL BANNER ================= */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div
            className="card"
            style={{
              background: 'var(--gradient-hero)',
              color: '#ffffff',
              padding: '32px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <span style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.85, fontWeight: '700' }}>
                  Model Transparency & Performance
                </span>
                <h3 style={{ fontSize: '24px', fontWeight: '700', marginTop: '4px' }}>
                  Powered by {modelSummary ? modelSummary.best_model : 'Random Forest Regressor'}
                </h3>
                <p style={{ opacity: 0.9, maxWidth: '640px', fontSize: '14px', lineHeight: 1.6, marginTop: '4px' }}>
                  Evaluated across 5 algorithms with an R² Score of {modelSummary ? modelSummary.metrics?.r2_score : '0.8172'} and
                  an MAE of ${modelSummary ? Math.round(modelSummary.metrics?.mae).toLocaleString() : '31,628'}.
                </p>
              </div>
              <Link to="/model-performance" className="btn btn-accent" style={{ whiteSpace: 'nowrap' }}>
                View Model Dashboard →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
