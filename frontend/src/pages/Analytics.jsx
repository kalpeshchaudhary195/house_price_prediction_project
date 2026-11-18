import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Cell,
} from 'recharts';

const LOCATION_OPTIONS = [
  { value: 'ALL', label: 'All Locations (California Overall)' },
  { value: 'NEAR BAY', label: 'Near Bay (< 5 miles to SF Bay)' },
  { value: '<1H OCEAN', label: '< 1 Hour to Ocean (Suburban Corridor)' },
  { value: 'INLAND', label: 'Inland Valley (Interior California)' },
  { value: 'NEAR OCEAN', label: 'Near Ocean (Coastal Corridor)' },
  { value: 'ISLAND', label: 'Island (Catalina Island Waterfront)' },
];

const PRICE_RANGE_OPTIONS = [
  { label: 'All Price Ranges', min: null, max: null },
  { label: 'Under $150,000 (Entry Level)', min: 0, max: 150000 },
  { label: '$150,000 - $300,000 (Mid Market)', min: 150000, max: 300000 },
  { label: '$300,000 - $450,000 (Upper Market)', min: 300000, max: 450000 },
  { label: '$450,000+ (Luxury & District Cap)', min: 450000, max: 550000 },
];

export default function Analytics() {
  const { showToast } = useToast();

  // Coordinated Filter State
  const [selectedLocation, setSelectedLocation] = useState('ALL');
  const [selectedPriceRangeIndex, setSelectedPriceRangeIndex] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Data States
  const [chartsData, setChartsData] = useState(null);
  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchCharts = useCallback(async (isSilent = false) => {
    if (!isSilent) setRefreshing(true);
    const range = PRICE_RANGE_OPTIONS[selectedPriceRangeIndex];

    try {
      const [chartsRes, statsRes] = await Promise.all([
        api.getDashboardCharts({
          location: selectedLocation,
          min_price: range.min,
          max_price: range.max,
        }),
        api.getDashboardStats(),
      ]);

      if (chartsRes.success) {
        setChartsData(chartsRes.charts);
        setLastUpdated(new Date());
      }
      if (statsRes.success) {
        setStatsData(statsRes.stats);
      }
    } catch (err) {
      if (!isSilent) {
        showToast(err.message || 'Failed to fetch analytics charts', 'error');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedLocation, selectedPriceRangeIndex, showToast]);

  useEffect(() => {
    fetchCharts();
  }, [fetchCharts]);

  // Auto-refresh polling every 25 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchCharts(true);
    }, 25000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchCharts]);

  const handleResetFilters = () => {
    setSelectedLocation('ALL');
    setSelectedPriceRangeIndex(0);
    showToast('Filters reset to default California dataset overview', 'info');
  };

  const formatUSD = (val) => {
    if (val == null || isNaN(val)) return '$0';
    return `$${Math.round(val).toLocaleString('en-US')}`;
  };

  const charts = chartsData || {};

  return (
    <div className="container" style={{ paddingBottom: '60px' }}>
      {/* Header Banner */}
      <header className="page-header" style={{ marginBottom: '24px' }}>
        <div className="container">
          <span className="hero-eyebrow">Interactive Visual Intelligence</span>
          <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>
            Connected Real Estate Analytics Studio
          </h1>
          <p className="section-subtitle center" style={{ maxWidth: '780px' }}>
            12 synchronized data visualizations analyzing 20,640 California properties,
            model accuracy benchmarks, and live PostgreSQL prediction records.
          </p>
        </div>
      </header>

      {/* ================= COORDINATED FILTER BAR ================= */}
      <div
        className="card"
        style={{
          padding: '18px 24px',
          marginBottom: '28px',
          borderRadius: '16px',
          border: '1px solid var(--card-border)',
          background: 'var(--card-bg-solid)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          {/* Location Dropdown */}
          <div style={{ flex: '1 1 240px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-muted)' }}>
              📍 FILTER LOCATION / OCEAN PROXIMITY
            </label>
            <select
              className="form-control"
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', fontSize: '14px' }}
            >
              {LOCATION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Price Range Filter */}
          <div style={{ flex: '1 1 240px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-muted)' }}>
              💵 FILTER PRICE RANGE
            </label>
            <select
              className="form-control"
              value={selectedPriceRangeIndex}
              onChange={(e) => setSelectedPriceRangeIndex(Number(e.target.value))}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', fontSize: '14px' }}
            >
              {PRICE_RANGE_OPTIONS.map((opt, idx) => (
                <option key={idx} value={idx}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Controls & Live Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', alignSelf: 'flex-end' }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={handleResetFilters}
              title="Reset all coordinated filters"
              style={{ padding: '9px 18px', fontSize: '13px' }}
            >
              ↺ Reset Filters
            </button>

            <button
              type="button"
              className="btn btn-primary"
              onClick={() => fetchCharts(false)}
              disabled={refreshing}
              style={{ padding: '9px 18px', fontSize: '13px' }}
            >
              {refreshing ? 'Refreshing...' : '⚡ Refresh Data'}
            </button>

            <button
              type="button"
              className={autoRefresh ? 'btn btn-outline' : 'btn btn-outline'}
              onClick={() => setAutoRefresh((a) => !a)}
              style={{
                padding: '9px 14px',
                fontSize: '12px',
                borderColor: autoRefresh ? 'var(--success)' : 'var(--card-border)',
                color: autoRefresh ? 'var(--success)' : 'var(--text-muted)',
              }}
              title="Toggle automatic 25-second chart polling"
            >
              ● {autoRefresh ? 'Auto-Refresh: ON' : 'Auto-Refresh: OFF'}
            </button>
          </div>
        </div>

        {/* Live Filter Indicator Status */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--card-border)', fontSize: '12px', color: 'var(--text-muted)' }}>
          <div>
            Active Filter: <strong style={{ color: 'var(--primary)' }}>{selectedLocation}</strong> | Range:{' '}
            <strong style={{ color: 'var(--primary)' }}>{PRICE_RANGE_OPTIONS[selectedPriceRangeIndex].label}</strong>
          </div>
          <div>
            Last synced: {lastUpdated.toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* ================= SUMMARY STAT CARDS ================= */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px',
          marginBottom: '32px',
        }}
      >
        <div className="card" style={{ padding: '18px', textAlign: 'center', borderRadius: '14px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>TOTAL PROPERTIES</div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--primary)', marginTop: '4px' }}>
            20,640
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>California District Blocks</div>
        </div>

        <div className="card" style={{ padding: '18px', textAlign: 'center', borderRadius: '14px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>DATABASE PREDICTIONS</div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--success)', marginTop: '4px' }}>
            {statsData?.total_predictions_stored || 0}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Saved in PostgreSQL</div>
        </div>

        <div className="card" style={{ padding: '18px', textAlign: 'center', borderRadius: '14px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>AVERAGE PREDICTED PRICE</div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--accent)', marginTop: '4px' }}>
            {formatUSD(statsData?.average_predicted_price || 206855)}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>District Valuation Baseline</div>
        </div>

        <div className="card" style={{ padding: '18px', textAlign: 'center', borderRadius: '14px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>HIGHEST EVALUATED PRICE</div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--danger)', marginTop: '4px' }}>
            {formatUSD(statsData?.max_predicted_price || 500001)}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Coastal Luxury Peak</div>
        </div>

        <div className="card" style={{ padding: '18px', textAlign: 'center', borderRadius: '14px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>MODEL R² ACCURACY</div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#8b5cf6', marginTop: '4px' }}>
            81.7%
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Random Forest Champion</div>
        </div>

        <div className="card" style={{ padding: '18px', textAlign: 'center', borderRadius: '14px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>AVERAGE ERROR (MAE)</div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#0ea5e9', marginTop: '4px' }}>
            $31,628
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Test-set Variance</div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>⚡ Loading 12 interconnected charts...</div>
          <p>Synthesizing 20,640 records and PostgreSQL predictions</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(520px, 1fr))', gap: '24px' }}>
          {/* ================= CHART 1: Actual vs Predicted ================= */}
          <div className="card" style={{ padding: '20px', borderRadius: '16px' }}>
            <div style={{ marginBottom: '12px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: '700', marginBottom: '4px' }}>
                1. Actual vs. Predicted House Prices
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Test-set validation sample plotted against the ideal prediction diagonal line (y = x).
              </p>
            </div>
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis
                    type="number"
                    dataKey="actual"
                    name="Actual Price"
                    tickFormatter={(v) => `$${v / 1000}k`}
                    domain={[0, 520000]}
                  />
                  <YAxis
                    type="number"
                    dataKey="predicted"
                    name="Predicted Price"
                    tickFormatter={(v) => `$${v / 1000}k`}
                    domain={[0, 520000]}
                  />
                  <Tooltip
                    formatter={(val, name) => [formatUSD(val), name]}
                    labelFormatter={() => ''}
                  />
                  <ReferenceLine x={250000} stroke="#ef4444" strokeDasharray="4 4" label="Midpoint" />
                  <Scatter name="Properties" data={charts.actualVsPredicted || []} fill="#2563eb" fillOpacity={0.7} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ================= CHART 2: House Price Distribution ================= */}
          <div className="card" style={{ padding: '20px', borderRadius: '16px' }}>
            <div style={{ marginBottom: '12px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: '700', marginBottom: '4px' }}>
                2. House Price Distribution (USD Ranges)
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Frequency distribution of housing prices across calibrated value tiers.
              </p>
            </div>
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.priceDistribution || []} margin={{ top: 10, right: 10, bottom: 20, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(v) => `${v}`} />
                  <Tooltip formatter={(val, name, item) => [`${val} properties (${item.payload.percentage}%)`, 'Count']} />
                  <Bar dataKey="count" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ================= CHART 3: Location-wise Price Analysis ================= */}
          <div className="card" style={{ padding: '20px', borderRadius: '16px' }}>
            <div style={{ marginBottom: '12px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: '700', marginBottom: '4px' }}>
                3. Location-wise Price Analysis (Ocean Proximity)
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Average and median district house valuations across California coastal and inland corridors.
              </p>
            </div>
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.locationAnalysis || []} margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(v) => `$${v / 1000}k`} />
                  <Tooltip formatter={(val) => [formatUSD(val)]} />
                  <Legend />
                  <Bar dataKey="avgPrice" name="Average Price" fill="#2563eb" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="medianPrice" name="Median Price" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ================= CHART 4: Income vs House Price ================= */}
          <div className="card" style={{ padding: '20px', borderRadius: '16px' }}>
            <div style={{ marginBottom: '12px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: '700', marginBottom: '4px' }}>
                4. Median Income vs. House Price
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Strong positive correlation showing price progression by household median income tier.
              </p>
            </div>
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={charts.incomeVsPrice || []} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="bracket" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(v) => `$${v / 1000}k`} />
                  <Tooltip formatter={(val) => [formatUSD(val), 'Avg Value']} />
                  <Line type="monotone" dataKey="avgPrice" stroke="#2563eb" strokeWidth={3} dot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ================= CHART 5: Housing Age vs House Price ================= */}
          <div className="card" style={{ padding: '20px', borderRadius: '16px' }}>
            <div style={{ marginBottom: '12px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: '700', marginBottom: '4px' }}>
                5. Housing Age vs. House Price Curve
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Evaluation across property age groups reflecting mature historic and coastal construction.
              </p>
            </div>
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={charts.ageVsPrice || []} margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="ageGroup" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(v) => `$${v / 1000}k`} />
                  <Tooltip formatter={(val) => [formatUSD(val), 'Avg Price']} />
                  <Area type="monotone" dataKey="avgPrice" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.25} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ================= CHART 6: Rooms vs House Price ================= */}
          <div className="card" style={{ padding: '20px', borderRadius: '16px' }}>
            <div style={{ marginBottom: '12px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: '700', marginBottom: '4px' }}>
                6. Total Rooms per Household vs. House Price
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Correlation between average rooms available in district dwellings and valuation.
              </p>
            </div>
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.roomsVsPrice || []} margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="roomCategory" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(v) => `$${v / 1000}k`} />
                  <Tooltip formatter={(val) => [formatUSD(val), 'Avg Price']} />
                  <Bar dataKey="avgPrice" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ================= CHART 7: Bedrooms vs House Price ================= */}
          <div className="card" style={{ padding: '20px', borderRadius: '16px' }}>
            <div style={{ marginBottom: '12px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: '700', marginBottom: '4px' }}>
                7. Average Bedrooms vs. House Price
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Analysis of average bedroom ratios and typical family living density.
              </p>
            </div>
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.bedroomsVsPrice || []} margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="bedCategory" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(v) => `$${v / 1000}k`} />
                  <Tooltip formatter={(val) => [formatUSD(val), 'Avg Price']} />
                  <Bar dataKey="avgPrice" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ================= CHART 8: Population Density vs House Price ================= */}
          <div className="card" style={{ padding: '20px', borderRadius: '16px' }}>
            <div style={{ marginBottom: '12px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: '700', marginBottom: '4px' }}>
                8. District Population vs. House Price
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Impact of district population density on residential property values.
              </p>
            </div>
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.populationVsPrice || []} margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="density" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(v) => `$${v / 1000}k`} />
                  <Tooltip formatter={(val) => [formatUSD(val), 'Avg Price']} />
                  <Bar dataKey="avgPrice" fill="#ec4899" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ================= CHART 9: Feature Importance ================= */}
          <div className="card" style={{ padding: '20px', borderRadius: '16px' }}>
            <div style={{ marginBottom: '12px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: '700', marginBottom: '4px' }}>
                9. Machine Learning Feature Importance Ranking
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Relative percentage weight of features determining price decisions in the Random Forest model.
              </p>
            </div>
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={charts.featureImportances || []}
                  margin={{ top: 10, right: 20, bottom: 10, left: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis type="number" tickFormatter={(v) => `${v}%`} domain={[0, 60]} />
                  <YAxis type="category" dataKey="feature" tick={{ fontSize: 11 }} width={120} />
                  <Tooltip formatter={(val) => [`${val}%`, 'Weight']} />
                  <Bar dataKey="weight" fill="#6366f1" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ================= CHART 10: Prediction History ================= */}
          <div className="card" style={{ padding: '20px', borderRadius: '16px' }}>
            <div style={{ marginBottom: '12px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: '700', marginBottom: '4px' }}>
                10. Live Prediction History Timeline (PostgreSQL)
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Chronological sequence of valuations performed by users and persisted in database.
              </p>
            </div>
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                {charts.predictionHistory && charts.predictionHistory.length > 0 ? (
                  <LineChart data={charts.predictionHistory} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="index" tickFormatter={(v) => `#${v}`} />
                    <YAxis tickFormatter={(v) => `$${v / 1000}k`} />
                    <Tooltip
                      formatter={(val, name, item) => [
                        formatUSD(val),
                        `${item.payload.propertyType || 'Property'} (${item.payload.location || ''})`,
                      ]}
                    />
                    <Line type="monotone" dataKey="predictedPrice" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} />
                  </LineChart>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                    No predictions logged yet. Try predicting a property price to see it charted here!
                  </div>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          {/* ================= CHART 11: Model Performance Comparison ================= */}
          <div className="card" style={{ padding: '20px', borderRadius: '16px' }}>
            <div style={{ marginBottom: '12px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: '700', marginBottom: '4px' }}>
                11. Multi-Model Performance Comparison (4 Algorithms)
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                R² accuracy percentages across Random Forest, Gradient Boosting, Decision Tree, and Linear Regression.
              </p>
            </div>
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.modelPerformance || []} margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="algorithm" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(v) => `${v}%`} domain={[0, 100]} />
                  <Tooltip formatter={(val) => [`${val}%`, 'R² Score']} />
                  <Bar dataKey="r2" radius={[6, 6, 0, 0]}>
                    {(charts.modelPerformance || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.isChampion ? '#10b981' : '#3b82f6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ================= CHART 12: Prediction Trends Over Time ================= */}
          <div className="card" style={{ padding: '20px', borderRadius: '16px' }}>
            <div style={{ marginBottom: '12px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: '700', marginBottom: '4px' }}>
                12. Prediction Trends Over Time
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Monthly volume of valuation requests and aggregate price index progression.
              </p>
            </div>
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={charts.predictionTrends || []} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" tickFormatter={(v) => `${v}`} />
                  <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `$${v / 1000}k`} />
                  <Tooltip
                    formatter={(val, name) => [
                      name === 'avgPrice' ? formatUSD(val) : `${val} requests`,
                      name === 'avgPrice' ? 'Average Price' : 'Requests Volume',
                    ]}
                  />
                  <Legend />
                  <Area yAxisId="left" type="monotone" dataKey="requests" name="Requests Volume" stroke="#2563eb" fill="#2563eb" fillOpacity={0.2} />
                  <Line yAxisId="right" type="monotone" dataKey="avgPrice" name="Average Price ($)" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

