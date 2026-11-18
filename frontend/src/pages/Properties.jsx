import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';

const CATEGORIES = [
  'ALL',
  'Luxury Villas',
  'Apartments',
  'Independent Houses',
  'Family Houses',
  'Modern Houses',
  'Small Houses',
  'Premium Properties',
];

export default function Properties() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [properties, setProperties] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState(null); // For modal

  const fetchProperties = async (cat = 'ALL') => {
    setLoading(true);
    try {
      const res = await api.getProperties(cat);
      if (res.success && res.properties) {
        setProperties(res.properties);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load properties', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties(selectedCategory);
  }, [selectedCategory]);

  const handlePredictPrice = (property) => {
    // Navigate to /prediction pre-filling the form with this property's preset
    const preset = property.preset_data || {
      MedInc: '6.5',
      HouseAge: '15',
      AveRooms: String(property.total_rooms || 6),
      AveBedrms: String(property.bedrooms || 3),
      Population: '1200',
      AveOccup: '2.8',
      Latitude: '37.88',
      Longitude: '-122.23',
      OceanProximity: property.location?.includes('Ocean') ? 'NEAR OCEAN' : 'NEAR BAY',
      property_type: property.property_type,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      area_sqft: property.area_sqft,
    };

    navigate('/prediction', {
      state: {
        formData: preset,
        sourceProperty: property.title,
      },
    });
  };

  const formatUSD = (val) => {
    if (val == null || isNaN(val)) return '$0';
    return `$${Math.round(val).toLocaleString('en-US')}`;
  };

  return (
    <div className="container" style={{ paddingBottom: '60px' }}>
      {/* Header */}
      <header className="page-header" style={{ marginBottom: '24px' }}>
        <div className="container">
          <span className="hero-eyebrow">Real Estate Showcase Catalogue</span>
          <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>
            Featured Properties &amp; Architectural Categories
          </h1>
          <p className="section-subtitle center" style={{ maxWidth: '750px' }}>
            Explore 7 distinct property categories across California coastal and metropolitan corridors.
            Each property features unique architecture and pre-calibrated valuation inputs.
          </p>
        </div>
      </header>

      {/* Category Filter Pills */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '10px',
          justifyContent: 'center',
          marginBottom: '32px',
        }}
      >
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            className={selectedCategory === cat ? 'btn btn-primary' : 'btn btn-outline'}
            onClick={() => setSelectedCategory(cat)}
            style={{
              padding: '8px 18px',
              borderRadius: '9999px',
              fontSize: '13px',
              fontWeight: '600',
              transition: 'all 0.2s ease',
            }}
          >
            {cat === 'ALL' ? '🏠 All Categories (7)' : cat}
          </button>
        ))}
      </div>

      {/* Properties Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '20px', marginBottom: '8px' }}>⚡ Loading property cards...</div>
          <p>Querying verified records from PostgreSQL</p>
        </div>
      ) : properties.length === 0 ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <h3>No properties found for category: {selectedCategory}</h3>
          <button className="btn btn-outline" style={{ marginTop: '16px' }} onClick={() => setSelectedCategory('ALL')}>
            View All Categories
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '24px',
          }}
        >
          {properties.map((prop) => (
            <div
              key={prop.id}
              className="card"
              style={{
                borderRadius: '16px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                border: '1px solid var(--card-border)',
                background: 'var(--card-bg-solid)',
              }}
            >
              {/* Image Container with Fallback */}
              <div style={{ position: 'relative', height: '220px', overflow: 'hidden', background: '#0f172a' }}>
                <img
                  src={prop.image_url}
                  alt={prop.title}
                  onError={(e) => {
                    e.target.src =
                      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80';
                  }}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transition: 'transform 0.4s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1.0)')}
                />
                <span
                  style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    backgroundColor: 'rgba(15, 23, 42, 0.85)',
                    color: '#fff',
                    padding: '4px 10px',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontWeight: '700',
                    letterSpacing: '0.04em',
                    backdropFilter: 'blur(4px)',
                  }}
                >
                  {prop.property_type}
                </span>

                <span
                  style={{
                    position: 'absolute',
                    bottom: '12px',
                    right: '12px',
                    backgroundColor: 'rgba(16, 185, 129, 0.95)',
                    color: '#fff',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '800',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                  }}
                >
                  {formatUSD(prop.price)}
                </span>
              </div>

              {/* Card Body */}
              <div style={{ padding: '20px', flex: '1', display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: '600', marginBottom: '4px' }}>
                  📍 {prop.location}
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px', lineHeight: '1.3' }}>
                  {prop.title}
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '16px', flex: '1' }}>
                  {prop.description}
                </p>

                {/* Specs Pill Grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '6px',
                    padding: '10px 0',
                    borderTop: '1px solid var(--card-border)',
                    borderBottom: '1px solid var(--card-border)',
                    marginBottom: '16px',
                    textAlign: 'center',
                    fontSize: '12px',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '700', color: 'var(--text)' }}>{prop.bedrooms || 3}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Beds</div>
                  </div>
                  <div>
                    <div style={{ fontWeight: '700', color: 'var(--text)' }}>{prop.bathrooms || 2}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Baths</div>
                  </div>
                  <div>
                    <div style={{ fontWeight: '700', color: 'var(--text)' }}>{prop.total_rooms || 6}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Rooms</div>
                  </div>
                  <div>
                    <div style={{ fontWeight: '700', color: 'var(--text)' }}>{Math.round(prop.area_sqft || 2000)}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>sq.ft.</div>
                  </div>
                </div>

                {/* Card Actions */}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setSelectedProperty(prop)}
                    style={{ flex: '1', padding: '9px 12px', fontSize: '13px' }}
                  >
                    View Details
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => handlePredictPrice(prop)}
                    style={{ flex: '1', padding: '9px 12px', fontSize: '13px' }}
                  >
                    Predict Price
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ================= VIEW DETAILS MODAL ================= */}
      {selectedProperty && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1050,
            padding: '20px',
          }}
          onClick={() => setSelectedProperty(null)}
        >
          <div
            className="card"
            style={{
              maxWidth: '600px',
              width: '100%',
              borderRadius: '20px',
              overflow: 'hidden',
              padding: '0',
              background: 'var(--card-bg-solid)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ height: '240px', position: 'relative' }}>
              <img
                src={selectedProperty.image_url}
                alt={selectedProperty.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <button
                type="button"
                onClick={() => setSelectedProperty(null)}
                style={{
                  position: 'absolute',
                  top: '14px',
                  right: '14px',
                  background: 'rgba(0,0,0,0.6)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  cursor: 'pointer',
                  fontSize: '16px',
                }}
              >
                ✕
              </button>
            </div>
            <div style={{ padding: '24px' }}>
              <span
                style={{
                  display: 'inline-block',
                  background: 'rgba(37, 99, 235, 0.12)',
                  color: 'var(--primary)',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '700',
                  marginBottom: '8px',
                }}
              >
                {selectedProperty.property_type}
              </span>
              <h2 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '8px' }}>
                {selectedProperty.title}
              </h2>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '14px' }}>
                📍 {selectedProperty.location}
              </div>
              <p style={{ fontSize: '14px', color: 'var(--text)', lineHeight: '1.6', marginBottom: '20px' }}>
                {selectedProperty.description}
              </p>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '12px',
                  padding: '14px',
                  background: 'var(--bg)',
                  borderRadius: '12px',
                  marginBottom: '20px',
                  fontSize: '13px',
                }}
              >
                <div>
                  <strong>Estimated Value:</strong> {formatUSD(selectedProperty.price)}
                </div>
                <div>
                  <strong>Living Area:</strong> {selectedProperty.area_sqft} sq.ft.
                </div>
                <div>
                  <strong>Bedrooms / Baths:</strong> {selectedProperty.bedrooms} Beds / {selectedProperty.bathrooms} Baths
                </div>
                <div>
                  <strong>Total Rooms:</strong> {selectedProperty.total_rooms || 6} Rooms
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setSelectedProperty(null)}
                  style={{ flex: 1 }}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    const p = selectedProperty;
                    setSelectedProperty(null);
                    handlePredictPrice(p);
                  }}
                  style={{ flex: 1 }}
                >
                  ⚡ Predict with these specs
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

