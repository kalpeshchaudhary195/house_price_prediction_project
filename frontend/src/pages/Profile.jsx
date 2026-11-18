import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';

export default function Profile() {
  const { showToast } = useToast();

  const [userProfile, setUserProfile] = useState(() => {
    const saved = localStorage.getItem('user-profile');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return {
      name: 'Kalpesh Chaudhary',
      email: 'kalpesh@example.com',
      phone: '+91 79849 51326',
      location: 'Ahmedabad, India',
    };
  });

  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editForm, setEditForm] = useState(userProfile);

  const fetchPredictions = () => {
    setLoading(true);
    api.getPredictions(50)
      .then((res) => {
        if (res.success && Array.isArray(res.predictions)) {
          setPredictions(res.predictions);
        }
      })
      .catch(() => {
        showToast('Could not load prediction history from database.', 'error');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchPredictions();
  }, []);

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setUserProfile(editForm);
    localStorage.setItem('user-profile', JSON.stringify(editForm));
    setModalOpen(false);
    showToast('Profile updated successfully!', 'success');
  };

  const handleDeletePrediction = async (id) => {
    if (!window.confirm(`Are you sure you want to delete prediction #${id}? This action cannot be undone.`)) {
      return;
    }
    try {
      await api.deletePrediction(id);
      setPredictions((prev) => prev.filter((p) => p.id !== id));
      showToast(`Prediction #${id} deleted successfully.`, 'info');
    } catch (err) {
      showToast(err.message || 'Could not delete prediction.', 'error');
    }
  };

  return (
    <div className="container">
      <section className="section">
        {/* ================= PROFILE HEADER ================= */}
        <div className="card profile-header slide-up">
          <div className="profile-avatar">🏠</div>
          <div className="profile-header-info">
            <h1>{userProfile.name}</h1>
            <p>House Price Prediction User</p>
          </div>
          <div className="profile-header-actions">
            <button
              type="button"
              className="btn btn-outline btn-edit-profile"
              onClick={() => {
                setEditForm(userProfile);
                setModalOpen(true);
              }}
            >
              ✏️ Edit Profile
            </button>
            <Link to="/login" className="btn btn-primary">
              Logout
            </Link>
          </div>
        </div>

        {/* ================= PROFILE INFO ================= */}
        <div className="profile-info-grid">
          <div className="card profile-info-item">
            <div className="info-label">Full Name</div>
            <div className="info-value">{userProfile.name}</div>
          </div>
          <div className="card profile-info-item">
            <div className="info-label">Email</div>
            <div className="info-value">{userProfile.email}</div>
          </div>
          <div className="card profile-info-item">
            <div className="info-label">Phone</div>
            <div className="info-value">{userProfile.phone}</div>
          </div>
          <div className="card profile-info-item">
            <div className="info-label">Location</div>
            <div className="info-value">{userProfile.location}</div>
          </div>
        </div>

        {/* ================= STATS ================= */}
        <div className="profile-stats">
          <div className="card profile-stat">
            <strong>{predictions.length}</strong>
            <span>Predictions Stored</span>
          </div>
          <div className="card profile-stat">
            <strong>6</strong>
            <span>Saved Homes</span>
          </div>
          <div className="card profile-stat">
            <strong>3</strong>
            <span>Feedback Submitted</span>
          </div>
        </div>
        <p style={{ marginTop: '10px', fontSize: '13px', color: 'var(--text-muted)' }}>
          Member since: <strong style={{ color: 'var(--text)' }}>January 2026</strong>
        </p>
      </section>

      {/* ================= RECENT PREDICTIONS HISTORY ================= */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <span className="section-eyebrow">Database History</span>
            <h2 className="section-title" style={{ margin: '4px 0 0' }}>Recent Predictions</h2>
            <p className="section-subtitle">Real-time property evaluations saved to persistent database storage.</p>
          </div>
          <button
            type="button"
            className="btn btn-outline"
            style={{ fontSize: '13px', padding: '8px 16px' }}
            onClick={fetchPredictions}
            disabled={loading}
          >
            {loading ? 'Refreshing...' : '🔄 Refresh History'}
          </button>
        </div>

        <div className="card predictions-table-wrap" style={{ padding: '8px 20px', overflowX: 'auto' }}>
          {predictions.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: '36px', marginBottom: '8px' }}>📋</div>
              <h3 style={{ fontSize: '18px', fontWeight: '700' }}>No predictions yet</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: '6px 0 16px' }}>
                Run your first property price calculation to see it saved here.
              </p>
              <Link to="/#predict-section" className="btn btn-primary">
                🔮 Make a Prediction Now
              </Link>
            </div>
          ) : (
            <table className="predictions-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Location</th>
                  <th>Property Type</th>
                  <th>Bedrooms</th>
                  <th>Estimated Price</th>
                  <th>Model Used</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {predictions.map((p) => {
                  const dateStr = p.created_at
                    ? new Date(p.created_at).toLocaleDateString(undefined, {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })
                    : 'Recent';

                  return (
                    <tr key={p.id}>
                      <td>{dateStr}</td>
                      <td>{p.property_location}</td>
                      <td>{p.property_type || 'Single Family'}</td>
                      <td>{p.bedrooms ? `${p.bedrooms} bd` : '-'}</td>
                      <td style={{ fontWeight: '700', color: 'var(--primary)' }}>
                        ${Math.round(p.predicted_price).toLocaleString()}
                      </td>
                      <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                        {p.model_name || 'Random Forest'}
                      </td>
                      <td>
                        <span className="status-pill status-completed">Completed</span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-outline"
                          style={{ padding: '3px 8px', fontSize: '12px', borderColor: 'var(--danger)', color: 'var(--danger)' }}
                          title="Delete prediction record"
                          onClick={() => handleDeletePrediction(p.id)}
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* ================= EDIT PROFILE MODAL ================= */}
      {modalOpen && (
        <div
          className="modal-backdrop active"
          id="profile-modal"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={(e) => {
            if (e.target.id === 'profile-modal') setModalOpen(false);
          }}
        >
          <div className="modal-box" role="dialog" aria-labelledby="modal-title">
            <div className="modal-header">
              <h3 className="modal-title" id="modal-title">Edit Profile Information</h3>
              <button
                type="button"
                className="modal-close"
                aria-label="Close modal"
                onClick={() => setModalOpen(false)}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveProfile} noValidate>
              <div className="input-group" style={{ marginBottom: '16px' }}>
                <label htmlFor="pe-name">Full Name *</label>
                <input
                  type="text"
                  id="pe-name"
                  name="name"
                  value={editForm.name}
                  onChange={handleEditChange}
                  required
                />
              </div>

              <div className="input-group" style={{ marginBottom: '16px' }}>
                <label htmlFor="pe-email">Email Address *</label>
                <input
                  type="email"
                  id="pe-email"
                  name="email"
                  value={editForm.email}
                  onChange={handleEditChange}
                  required
                />
              </div>

              <div className="input-group" style={{ marginBottom: '16px' }}>
                <label htmlFor="pe-phone">Phone *</label>
                <input
                  type="tel"
                  id="pe-phone"
                  name="phone"
                  value={editForm.phone}
                  onChange={handleEditChange}
                  required
                />
              </div>

              <div className="input-group" style={{ marginBottom: '24px' }}>
                <label htmlFor="pe-location">Location</label>
                <input
                  type="text"
                  id="pe-location"
                  name="location"
                  value={editForm.location}
                  onChange={handleEditChange}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
