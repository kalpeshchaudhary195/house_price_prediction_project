import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';
import PriceSpreadGauge from '../components/Charts/PriceSpreadGauge.jsx';
import ComparisonBarChart from '../components/Charts/ComparisonBarChart.jsx';

const DEFAULT_PARAMS = {
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

export default function Prediction() {
  const routerLocation = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [predictionData, setPredictionData] = useState(null);
  const [formData, setFormData] = useState(DEFAULT_PARAMS);
  const [loading, setLoading] = useState(false);
  const [locationsList, setLocationsList] = useState([]);

  // Load prediction from router state or sessionStorage on mount
  useEffect(() => {
    let initialPred = routerLocation.state?.prediction;
    let initialForm = routerLocation.state?.formData;

    if (!initialPred) {
      const stored = sessionStorage.getItem('lastPrediction');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.result) {
            initialPred = parsed.result;
            initialForm = parsed;
          }
        } catch {}
      }
    }

    if (initialPred) {
      setPredictionData(initialPred);
      if (initialForm) {
        setFormData({
          MedInc: String(initialForm.MedInc || initialPred.input_features?.median_income || '4.5'),
          HouseAge: String(initialForm.HouseAge || initialPred.input_features?.house_age || '25'),
          AveRooms: String(initialForm.AveRooms || initialPred.input_features?.average_rooms || '5.2'),
          AveBedrms: String(initialForm.AveBedrms || initialPred.input_features?.average_bedrooms || '1.1'),
          Population: String(initialForm.Population || initialPred.input_features?.population || '1200'),
          AveOccup: String(initialForm.AveOccup || initialPred.input_features?.average_occupancy || '3.0'),
          Latitude: String(initialForm.Latitude || initialPred.input_features?.latitude || '37.88'),
          Longitude: String(initialForm.Longitude || initialPred.input_features?.longitude || '-122.23'),
          OceanProximity: initialForm.OceanProximity || initialPred.input_features?.ocean_proximity || 'NEAR BAY',
        });
      }
    } else {
      // Trigger initial calculation with defaults so page is never empty
      handleInitialPrediction(DEFAULT_PARAMS);
    }

    // Load actual locations for comparison chart
    api.getLocations()
      .then((res) => {
        if (res && res.locations) setLocationsList(res.locations);
      })
      .catch(() => {});
  }, [routerLocation.state]);

  const handleInitialPrediction = async (params) => {
    setLoading(true);
    try {
      const res = await api.predict(params);
      setPredictionData(res);
    } catch {
      showToast('Could not calculate initial prediction.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRecalculate = async (e) => {
    e.preventDefault();
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
      setPredictionData(result);
      sessionStorage.setItem('lastPrediction', JSON.stringify({ ...payload, result }));
      showToast('Estimate recalculated using ML model!', 'success');
      window.scrollTo({ top: 120, behavior: 'smooth' });
    } catch (err) {
      showToast(err.message || 'Recalculation failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const predictedPrice = predictionData?.predicted_price || 0;
  const features = predictionData?.input_features || {};

  // Build comparison data
  const comparisonData = locationsList.map((loc) => ({
    name: loc.name,
    avg_price: loc.avg_price,
    isCurrent: loc.value === (features.ocean_proximity || formData.OceanProximity),
  }));

  // Add this property's predicted price into the comparison
  if (predictedPrice > 0) {
    comparisonData.unshift({
      name: '⭐ This Property (Estimated)',
      avg_price: predictedPrice,
      isBest: true,
    });
  }

  return (
    <>
      {/* ================= RESULT HERO ================= */}
      <section className="result-hero">
        <div className="container">
          <div className="result-icon">🏠</div>
          <h1 style={{ fontSize: '28px' }}>Machine Learning Prediction Result</h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', marginTop: '8px' }}>
            Genuine continuous regression estimate computed by {predictionData?.model_name || 'Random Forest Regressor'}.
          </p>
        </div>
      </section>

      <div className="container">
        {/* ================= PRICE CARD ================= */}
        <div className="price-card slide-up">
          <div className="price-label">Estimated House Valuation</div>
          <div className="price-value" id="pred-price">
            {predictedPrice > 0 ? `$${Math.round(predictedPrice).toLocaleString()}` : '$---,---'}
          </div>
          <span className="confidence-pill">
            🎯 Model Confidence: {predictionData?.confidence || 'High'}
          </span>
          <div style={{ marginTop: '12px', fontSize: '13px', color: 'var(--text-muted)' }}>
            Model: <strong>{predictionData?.model_name || 'Random Forest Regressor'}</strong> · California Housing Census Block
          </div>
        </div>

        {/* ================= CONFIDENCE GAUGE ================= */}
        {predictionData && (
          <PriceSpreadGauge
            low={predictionData.range_low}
            price={predictedPrice}
            high={predictionData.range_high}
            confidence={predictionData.confidence}
          />
        )}

        {/* ================= PREDICTION SUMMARY ================= */}
        <section className="section" style={{ paddingBottom: '20px' }}>
          <span className="section-eyebrow">Summary</span>
          <h2 className="section-title">Prediction Breakdown</h2>
          <p className="section-subtitle">A comprehensive breakdown of the property features analyzed by the model.</p>

          <div className="summary-grid">
            <div className="card summary-item">
              <div className="summary-label">Estimated Valuation</div>
              <div className="summary-value">${Math.round(predictedPrice).toLocaleString()}</div>
            </div>
            <div className="card summary-item">
              <div className="summary-label">Ocean Proximity</div>
              <div className="summary-value">{features.ocean_proximity || formData.OceanProximity}</div>
            </div>
            <div className="card summary-item">
              <div className="summary-label">Median Income Block</div>
              <div className="summary-value">${Math.round((features.median_income || 4.5) * 10000).toLocaleString()}/yr</div>
            </div>
            <div className="card summary-item">
              <div className="summary-label">House Age</div>
              <div className="summary-value">{features.house_age || formData.HouseAge} years</div>
            </div>
            <div className="card summary-item">
              <div className="summary-label">Average Rooms</div>
              <div className="summary-value">{features.average_rooms || formData.AveRooms}</div>
            </div>
            <div className="card summary-item">
              <div className="summary-label">Average Bedrooms</div>
              <div className="summary-value">{features.average_bedrooms || formData.AveBedrms}</div>
            </div>
            <div className="card summary-item">
              <div className="summary-label">Estimated Area</div>
              <div className="summary-value">
                {predictionData?.property_summary?.area_sqft || Math.round((features.average_rooms || 5.2) * 380)} sqft
              </div>
            </div>
            <div className="card summary-item">
              <div className="summary-label">Coordinates</div>
              <div className="summary-value">
                {features.latitude || formData.Latitude}°, {features.longitude || formData.Longitude}°
              </div>
            </div>
          </div>

          <div className="result-actions" style={{ marginTop: '24px' }}>
            <Link to="/#predict-section" className="btn btn-primary">
              🔄 Predict Another Property
            </Link>
            <Link to="/profile" className="btn btn-outline">
              📊 View History in Profile
            </Link>
            <Link to="/model-performance" className="btn btn-outline">
              📈 Inspect Model Performance
            </Link>
          </div>
        </section>

        {/* ================= MARKET COMPARISON CHARTS ================= */}
        {comparisonData.length > 0 && (
          <section className="section" style={{ paddingTop: 0 }}>
            <div className="card" style={{ padding: '24px' }}>
              <span className="section-eyebrow">Market Context</span>
              <h3 style={{ fontSize: '18px', fontWeight: '700', marginTop: '4px' }}>
                California Regional Price Comparison
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Comparing this property against benchmark average sales prices across California geographical zones.
              </p>
              <ComparisonBarChart
                data={comparisonData}
                valueKey="avg_price"
                labelKey="name"
                formatValue={(v) => `$${Math.round(v).toLocaleString()}`}
                barColor="var(--primary)"
              />
            </div>
          </section>
        )}

        {/* ================= RECALCULATE / QUICK ESTIMATE FORM ================= */}
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="center" style={{ textAlign: 'center', marginBottom: '24px' }}>
            <span className="section-eyebrow">Adjust Parameters</span>
            <h2 className="section-title">Refine Property Details</h2>
            <p className="section-subtitle center">Update any value below to run an instant recalculation.</p>
          </div>

          <form className="card predict-form-card" onSubmit={handleRecalculate} noValidate>
            <div className="form-grid">
              <div className="input-group">
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
                  required
                />
              </div>

              <div className="input-group">
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
                  required
                />
              </div>

              <div className="input-group">
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
                  required
                />
              </div>

              <div className="input-group">
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
                  required
                />
              </div>

              <div className="input-group">
                <label htmlFor="Population">Population *</label>
                <input
                  type="number"
                  id="Population"
                  name="Population"
                  step="1"
                  min="1"
                  value={formData.Population}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="input-group">
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
                  required
                />
              </div>

              <div className="input-group">
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
                  required
                />
              </div>

              <div className="input-group">
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
                  required
                />
              </div>

              <div className="input-group full-width">
                <label htmlFor="OceanProximity">Ocean Proximity *</label>
                <select
                  id="OceanProximity"
                  name="OceanProximity"
                  value={formData.OceanProximity}
                  onChange={handleChange}
                  required
                >
                  <option value="NEAR BAY">NEAR BAY (&lt; 5 miles to SF Bay)</option>
                  <option value="INLAND">INLAND (&gt; 30 miles from coast)</option>
                  <option value="NEAR OCEAN">NEAR OCEAN (&lt; 5 miles to Pacific Ocean)</option>
                  <option value="1H OCEAN">&lt; 1 HOUR TO OCEAN</option>
                  <option value="ISLAND">ISLAND (Catalina / Channel Islands)</option>
                </select>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Recalculating...' : '🔮 Recalculate Estimate'}
                </button>
              </div>
            </div>
          </form>
        </section>
      </div>
    </>
  );
}
