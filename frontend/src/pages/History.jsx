import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';

export default function History() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date_desc');

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await api.getPredictions(100, 0);
      if (res.success && res.predictions) {
        setPredictions(res.predictions);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load prediction history', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm(`Are you sure you want to delete prediction record #${id}?`)) return;

    try {
      const res = await api.deletePrediction(id);
      if (res.success) {
        showToast(`Prediction #${id} removed from database`, 'success');
        setPredictions((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (err) {
      showToast(err.message || 'Failed to delete prediction record', 'error');
    }
  };

  const formatUSD = (val) => {
    if (val == null || isNaN(val)) return '$0';
    return `$${Math.round(val).toLocaleString('en-US')}`;
  };

  const filteredPredictions = predictions
    .filter((p) => {
      const loc = (p.property_location || p.location || '').toLowerCase();
      const ptype = (p.property_type || '').toLowerCase();
      const s = searchTerm.toLowerCase();
      return loc.includes(s) || ptype.includes(s);
    })
    .sort((a, b) => {
      if (sortBy === 'price_desc') return b.predicted_price - a.predicted_price;
      if (sortBy === 'price_asc') return a.predicted_price - b.predicted_price;
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });

  return (
    <div className="container" style={{ paddingBottom: '60px' }}>
      {/* Header */}
      <header className="page-header" style={{ marginBottom: '24px' }}>
        <div className="container">
          <span className="hero-eyebrow">PostgreSQL Audit Trail</span>
          <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>
            Prediction History &amp; Valuation Logs
          </h1>
          <p className="section-subtitle center" style={{ maxWidth: '750px' }}>
            Complete historical record of residential valuations executed by the machine learning
            regression engine and stored persistently in PostgreSQL.
          </p>
        </div>
      </header>

      {/* Control Bar: Search, Sort, Actions */}
      <div
        className="card"
        style={{
          padding: '16px 20px',
          marginBottom: '24px',
          borderRadius: '16px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', gap: '12px', flex: '1 1 300px', flexWrap: 'wrap' }}>
          <input
            type="text"
            className="form-control"
            placeholder="🔍 Search by location or property type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ flex: '1 1 200px', padding: '9px 14px', borderRadius: '10px', fontSize: '13px' }}
          />
          <select
            className="form-control"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{ width: '190px', padding: '9px 12px', borderRadius: '10px', fontSize: '13px' }}
          >
            <option value="date_desc">Sort: Newest First</option>
            <option value="price_desc">Sort: Price (High to Low)</option>
            <option value="price_asc">Sort: Price (Low to High)</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="button" className="btn btn-outline" onClick={fetchHistory} style={{ padding: '9px 16px', fontSize: '13px' }}>
            ↺ Refresh
          </button>
          <Link to="/prediction" className="btn btn-primary" style={{ padding: '9px 16px', fontSize: '13px' }}>
            + New Prediction
          </Link>
        </div>
      </div>

      {/* Table Card */}
      <div className="card" style={{ padding: '24px', borderRadius: '16px', overflowX: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            Loading prediction records from PostgreSQL...
          </div>
        ) : filteredPredictions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>
              No prediction records match your query
            </div>
            <p>Try making a new property prediction to see it logged here.</p>
            <Link to="/prediction" className="btn btn-primary" style={{ marginTop: '12px' }}>
              Predict House Price
            </Link>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--card-border)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '12px 10px' }}>ID</th>
                <th style={{ padding: '12px 10px' }}>Location</th>
                <th style={{ padding: '12px 10px' }}>Category</th>
                <th style={{ padding: '12px 10px' }}>Configuration</th>
                <th style={{ padding: '12px 10px' }}>Area</th>
                <th style={{ padding: '12px 10px' }}>Estimated Price</th>
                <th style={{ padding: '12px 10px' }}>Model</th>
                <th style={{ padding: '12px 10px' }}>Timestamp</th>
                <th style={{ padding: '12px 10px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPredictions.map((pred) => (
                <tr
                  key={pred.id}
                  style={{
                    borderBottom: '1px solid var(--card-border)',
                    transition: 'background 0.15s ease',
                  }}
                >
                  <td style={{ padding: '12px 10px', fontWeight: '700', color: 'var(--text-muted)' }}>
                    #{pred.id}
                  </td>
                  <td style={{ padding: '12px 10px', fontWeight: '600', color: 'var(--primary)' }}>
                    {pred.property_location || pred.location}
                  </td>
                  <td style={{ padding: '12px 10px' }}>
                    <span
                      style={{
                        padding: '3px 8px',
                        background: 'rgba(37, 99, 235, 0.1)',
                        color: 'var(--primary)',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '700',
                      }}
                    >
                      {pred.property_type || 'Single Family'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 10px' }}>
                    {pred.bedrooms || 3} Beds · {pred.bathrooms || 2} Baths
                  </td>
                  <td style={{ padding: '12px 10px' }}>
                    {Math.round(pred.area_sqft || 1800)} sq.ft.
                  </td>
                  <td style={{ padding: '12px 10px', fontWeight: '800', color: 'var(--success)', fontSize: '14px' }}>
                    {formatUSD(pred.predicted_price)}
                  </td>
                  <td style={{ padding: '12px 10px', fontSize: '11px', color: 'var(--text-muted)' }}>
                    {pred.model_name || 'Random Forest'}
                  </td>
                  <td style={{ padding: '12px 10px', color: 'var(--text-muted)', fontSize: '12px' }}>
                    {pred.created_at ? new Date(pred.created_at).toLocaleString() : 'Recent'}
                  </td>
                  <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                    <button
                      type="button"
                      onClick={() => handleDelete(pred.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--danger)',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '12px',
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

