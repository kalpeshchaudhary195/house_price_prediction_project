/**
 * Advanced Real Estate Analytics powered by Chart.js.
 * Renders all 12 required visualizations from real PostgreSQL & ML evaluation data:
 * 1. City-wise average house price
 * 2. Locality-wise price comparison (Ahmedabad corridor highlighting Bopal)
 * 3. Area vs house price scatter plot
 * 4. Bedroom vs price comparison
 * 5. Property type distribution
 * 6. Monthly prediction trends
 * 7. Actual vs predicted price (with 45° line)
 * 8. ML algorithm performance comparison (5 models: GBR, XGB, RF, DT, LR)
 * 9. Feature importance ranking
 * 10. Price per sq.ft. comparison across micro-markets
 * 11. City-to-city multi-metric investment radar
 * 12. Property age vs predicted price trend
 *
 * Includes Dynamic / Real-Time polling auto-refresh every 30s with manual trigger.
 */

let chartInstances = {};
let autoRefreshTimer = null;
let isAutoRefreshActive = true;

document.addEventListener('DOMContentLoaded', async () => {
  await fetchAndRenderAnalytics();
  setupAutoRefresh();
  setupRetrainButton();
});

function setupAutoRefresh() {
  // Start polling every 30 seconds
  if (autoRefreshTimer) clearInterval(autoRefreshTimer);
  autoRefreshTimer = setInterval(() => {
    if (isAutoRefreshActive) {
      fetchAndRenderAnalytics(true);
    }
  }, 30000);
}

function toggleAutoRefresh() {
  isAutoRefreshActive = !isAutoRefreshActive;
  const toggleBtn = document.getElementById('auto-refresh-toggle');
  const pulseBadge = document.getElementById('live-pulse-indicator');

  if (toggleBtn) {
    toggleBtn.textContent = isAutoRefreshActive ? 'Auto-Refresh: ON' : 'Auto-Refresh: OFF';
    toggleBtn.className = isAutoRefreshActive ? 'btn btn-sm btn-success rounded-pill px-3' : 'btn btn-sm btn-outline-secondary rounded-pill px-3';
  }
  if (pulseBadge) {
    pulseBadge.style.display = isAutoRefreshActive ? 'inline-flex' : 'none';
  }
}

async function fetchAndRenderAnalytics(isBackground = false) {
  const refreshBtn = document.getElementById('refresh-analytics-btn');
  if (refreshBtn && !isBackground) {
    refreshBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status"></span> Updating...';
    refreshBtn.disabled = true;
  }

  try {
    const res = await fetch('/api/analytics/charts');
    const json = await res.json();
    if (!json.success) return;

    const d = json.data;

    // 1. City-wise average price
    renderCityPriceChart(d.city_prices);

    // 2. Locality-wise price comparison (Ahmedabad)
    renderAhmedabadLocalityChart(d.locality_prices_ahmedabad);

    // 3. Area vs Price Scatter
    renderAreaScatterChart(d.area_vs_price);

    // 4. Bedroom-wise average price
    renderBedroomChart(d.bedroom_prices);

    // 5. Property Types Doughnut
    renderPropertyTypeChart(d.property_types);

    // 6. Monthly Trend Chart
    renderMonthlyTrendChart(d.monthly_trend);

    // 7. Actual vs Predicted Scatter
    renderActualVsPredChart(d.actual_vs_predicted);

    // 8. Model Evaluation Comparison (5 Models)
    renderModelComparisonChart(d.model_comparison);

    // 9. Feature Importance Chart
    renderFeatureImportanceChart(d.feature_importances);

    // 10. Price per sq.ft. Comparison
    renderPricePerSqftChart(d.price_per_sqft);

    // 11. City-to-City Investment Radar
    renderCityRadarChart(d.radar_benchmark);

    // 12. Property Age vs Price Trend
    renderAgeVsPriceChart(d.age_vs_price);

    // Update Last Updated Timestamp
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const updateEl = document.getElementById('last-updated-timestamp');
    if (updateEl) {
      updateEl.textContent = `Last updated: ${timeStr}`;
    }

  } catch (err) {
    console.error('Failed to load chart analytics:', err);
  } finally {
    if (refreshBtn && !isBackground) {
      refreshBtn.innerHTML = '<i class="bi bi-arrow-clockwise me-1"></i> Refresh Data';
      refreshBtn.disabled = false;
    }
  }
}

// 1. City-wise Average Price
function renderCityPriceChart(cityData) {
  const ctx = document.getElementById('cityPriceChart');
  if (!ctx || !cityData) return;
  if (chartInstances.city) chartInstances.city.destroy();

  chartInstances.city = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: cityData.labels,
      datasets: [{
        label: 'Average Price (₹ in Lakhs)',
        data: cityData.avg_price_lakhs,
        backgroundColor: 'rgba(37, 99, 235, 0.8)',
        borderColor: '#2563eb',
        borderWidth: 1.5,
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: { label: (ctx) => `₹ ${ctx.parsed.y.toLocaleString('en-IN')} Lakhs` }
        }
      },
      scales: {
        y: {
          title: { display: true, text: 'Average Price (₹ Lakhs)' },
          grid: { color: 'rgba(200, 200, 200, 0.15)' }
        },
        x: { grid: { display: false } }
      }
    }
  });
}

// 2. Locality-wise Pricing (Ahmedabad corridor highlighting Bopal)
function renderAhmedabadLocalityChart(locData) {
  const ctx = document.getElementById('ahmedabadLocalityChart');
  if (!ctx || !locData) return;
  if (chartInstances.locality) chartInstances.locality.destroy();

  const bgColors = locData.labels.map(l => l.toLowerCase() === 'bopal' ? 'rgba(16, 185, 129, 0.95)' : 'rgba(14, 165, 233, 0.7)');

  chartInstances.locality = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: locData.labels,
      datasets: [{
        label: 'Average Price (₹ Lakhs)',
        data: locData.avg_price_lakhs,
        backgroundColor: bgColors,
        borderRadius: 6
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => `₹ ${ctx.parsed.x.toLocaleString('en-IN')} Lakhs ${ctx.label.toLowerCase() === 'bopal' ? '(Default Benchmark Hub)' : ''}`
          }
        }
      },
      scales: {
        x: {
          title: { display: true, text: 'Valuation (₹ Lakhs)' },
          grid: { color: 'rgba(200, 200, 200, 0.15)' }
        },
        y: { grid: { display: false } }
      }
    }
  });
}

// 3. Area vs Price Scatter Plot
function renderAreaScatterChart(scatterPoints) {
  const ctx = document.getElementById('areaScatterChart');
  if (!ctx || !scatterPoints) return;
  if (chartInstances.scatter) chartInstances.scatter.destroy();

  chartInstances.scatter = new Chart(ctx, {
    type: 'scatter',
    data: {
      datasets: [{
        label: 'Residential Property Comps',
        data: scatterPoints,
        backgroundColor: 'rgba(99, 102, 241, 0.65)',
        borderColor: '#6366f1',
        pointRadius: 4.5,
        pointHoverRadius: 7
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const p = ctx.raw;
              return `${p.locality || ''}, ${p.city || ''}: ${p.x} sq.ft. → ₹ ${p.y} Lakhs`;
            }
          }
        }
      },
      scales: {
        x: {
          title: { display: true, text: 'Living Area (sq.ft.)' },
          grid: { color: 'rgba(200, 200, 200, 0.15)' }
        },
        y: {
          title: { display: true, text: 'Predicted Price (₹ Lakhs)' },
          grid: { color: 'rgba(200, 200, 200, 0.15)' }
        }
      }
    }
  });
}

// 4. Bedroom-wise Average Price
function renderBedroomChart(bhkData) {
  const ctx = document.getElementById('bedroomChart');
  if (!ctx || !bhkData) return;
  if (chartInstances.bhk) chartInstances.bhk.destroy();

  chartInstances.bhk = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: bhkData.labels,
      datasets: [{
        label: 'Average Price (₹ in Lakhs)',
        data: bhkData.avg_price_lakhs,
        backgroundColor: 'rgba(245, 158, 11, 0.85)',
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: { label: (ctx) => `₹ ${ctx.parsed.y.toLocaleString('en-IN')} Lakhs` }
        }
      },
      scales: {
        y: {
          title: { display: true, text: 'Average Price (₹ Lakhs)' },
          grid: { color: 'rgba(200, 200, 200, 0.15)' }
        },
        x: { grid: { display: false } }
      }
    }
  });
}

// 5. Property Type Distribution
function renderPropertyTypeChart(typeData) {
  const ctx = document.getElementById('propertyTypeChart');
  if (!ctx || !typeData) return;
  if (chartInstances.propType) chartInstances.propType.destroy();

  chartInstances.propType = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: typeData.labels,
      datasets: [{
        data: typeData.counts,
        backgroundColor: [
          '#2563eb',
          '#10b981',
          '#f59e0b',
          '#8b5cf6',
          '#ec4899'
        ],
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom' }
      },
      cutout: '62%'
    }
  });
}

// 6. Monthly Prediction Trends
function renderMonthlyTrendChart(trendData) {
  const ctx = document.getElementById('monthlyTrendChart');
  if (!ctx || !trendData) return;
  if (chartInstances.trend) chartInstances.trend.destroy();

  chartInstances.trend = new Chart(ctx, {
    type: 'line',
    data: {
      labels: trendData.labels || ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'],
      datasets: [
        {
          label: 'Price per Sq.Ft. Index (₹)',
          data: trendData.price_per_sqft || [4800, 4920, 5080, 5150, 5290, 5420],
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.12)',
          fill: true,
          tension: 0.35,
          yAxisID: 'y'
        },
        {
          label: 'Prediction Volume',
          data: trendData.prediction_volume || [120, 180, 240, 310, 420, 560],
          borderColor: '#2563eb',
          backgroundColor: 'rgba(37, 99, 235, 0.08)',
          fill: true,
          tension: 0.35,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          title: { display: true, text: 'Price / Sq.Ft. (₹)' }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          grid: { drawOnChartArea: false },
          title: { display: true, text: 'Requests' }
        }
      }
    }
  });
}

// 7. Actual vs Predicted Prices
function renderActualVsPredChart(avpData) {
  const ctx = document.getElementById('actualVsPredChart');
  if (!ctx || !avpData) return;
  if (chartInstances.avp) chartInstances.avp.destroy();

  const maxVal = Math.max(...avpData.map(p => Math.max(p.x, p.y)), 200);

  chartInstances.avp = new Chart(ctx, {
    type: 'scatter',
    data: {
      datasets: [
        {
          label: 'Ideal 45° Fit Line',
          data: [{ x: 0, y: 0 }, { x: maxVal, y: maxVal }],
          type: 'line',
          borderColor: 'rgba(239, 68, 68, 0.8)',
          borderDash: [6, 6],
          fill: false,
          pointRadius: 0
        },
        {
          label: 'Test-Set Comps',
          data: avpData,
          backgroundColor: 'rgba(37, 99, 235, 0.65)',
          pointRadius: 4.5
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        tooltip: {
          callbacks: {
            label: (ctx) => {
              if (ctx.datasetIndex === 0) return 'Ideal fit line (y = x)';
              const p = ctx.raw;
              return `Actual: ₹ ${p.x}L | Pred: ₹ ${p.y}L (${p.city || ''})`;
            }
          }
        }
      },
      scales: {
        x: {
          title: { display: true, text: 'Actual Market Price (₹ Lakhs)' },
          grid: { color: 'rgba(200, 200, 200, 0.15)' }
        },
        y: {
          title: { display: true, text: 'Model Predicted Price (₹ Lakhs)' },
          grid: { color: 'rgba(200, 200, 200, 0.15)' }
        }
      }
    }
  });
}

// 8. Model Evaluation Comparison (5 Models)
function renderModelComparisonChart(compData) {
  const ctx = document.getElementById('modelComparisonChart');
  if (!ctx || !compData) return;
  if (chartInstances.modelComp) chartInstances.modelComp.destroy();

  const labels = Object.keys(compData);
  const r2Scores = labels.map(k => (compData[k].r2_score * 100).toFixed(1));
  const maes = labels.map(k => (compData[k].mae / 100000.0).toFixed(1));

  chartInstances.modelComp = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'R² Accuracy Score (%)',
          data: r2Scores,
          backgroundColor: 'rgba(16, 185, 129, 0.85)',
          borderRadius: 6
        },
        {
          label: 'MAE (₹ Lakhs)',
          data: maes,
          backgroundColor: 'rgba(239, 68, 68, 0.75)',
          borderRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          grid: { color: 'rgba(200, 200, 200, 0.15)' }
        }
      }
    }
  });
}

// 9. Feature Importance Chart
function renderFeatureImportanceChart(features) {
  const ctx = document.getElementById('featureImportanceChart');
  if (!ctx || !features) return;
  if (chartInstances.fi) chartInstances.fi.destroy();

  const top10 = features.slice(0, 8);
  const labels = top10.map(f => f.feature.replace(/_/g, ' ').toUpperCase());
  const values = top10.map(f => (f.importance * 100).toFixed(1));

  chartInstances.fi = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Feature Impact Weight (%)',
        data: values,
        backgroundColor: 'rgba(139, 92, 246, 0.8)',
        borderRadius: 6
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: {
          title: { display: true, text: 'Relative Weight (%)' },
          grid: { color: 'rgba(200, 200, 200, 0.15)' }
        },
        y: { grid: { display: false } }
      }
    }
  });
}

// 10. Price per Sq.Ft. Comparison
function renderPricePerSqftChart(rateData) {
  const ctx = document.getElementById('pricePerSqftChart');
  if (!ctx || !rateData) return;
  if (chartInstances.rateChart) chartInstances.rateChart.destroy();

  chartInstances.rateChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: rateData.labels,
      datasets: [{
        label: 'Average Rate / Sq.Ft. (₹)',
        data: rateData.rates,
        backgroundColor: 'rgba(14, 165, 233, 0.85)',
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => `₹ ${ctx.parsed.y.toLocaleString('en-IN')}/sq.ft.`
          }
        }
      },
      scales: {
        y: {
          title: { display: true, text: 'Rate per Sq.Ft. (₹)' },
          grid: { color: 'rgba(200, 200, 200, 0.15)' }
        },
        x: { grid: { display: false } }
      }
    }
  });
}

// 11. City-to-City Investment Radar Benchmark
function renderCityRadarChart(radarData) {
  const ctx = document.getElementById('cityRadarChart');
  if (!ctx || !radarData) return;
  if (chartInstances.radar) chartInstances.radar.destroy();

  chartInstances.radar = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: radarData.categories,
      datasets: [
        {
          label: 'Ahmedabad (Default Benchmark)',
          data: radarData.Ahmedabad,
          backgroundColor: 'rgba(37, 99, 235, 0.25)',
          borderColor: 'rgba(37, 99, 235, 1)',
          pointBackgroundColor: 'rgba(37, 99, 235, 1)'
        },
        {
          label: 'Mumbai',
          data: radarData.Mumbai,
          backgroundColor: 'rgba(239, 68, 68, 0.2)',
          borderColor: 'rgba(239, 68, 68, 0.8)',
          pointBackgroundColor: 'rgba(239, 68, 68, 1)'
        },
        {
          label: 'Surat',
          data: radarData.Surat,
          backgroundColor: 'rgba(16, 185, 129, 0.2)',
          borderColor: 'rgba(16, 185, 129, 0.8)',
          pointBackgroundColor: 'rgba(16, 185, 129, 1)'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          angleLines: { color: 'rgba(200, 200, 200, 0.2)' },
          grid: { color: 'rgba(200, 200, 200, 0.2)' },
          suggestedMin: 20,
          suggestedMax: 100
        }
      }
    }
  });
}

// 12. Property Age vs Predicted Price Trend
function renderAgeVsPriceChart(ageData) {
  const ctx = document.getElementById('ageVsPriceChart');
  if (!ctx || !ageData) return;
  if (chartInstances.ageChart) chartInstances.ageChart.destroy();

  chartInstances.ageChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: ageData.labels,
      datasets: [{
        label: 'Average Price (₹ in Lakhs)',
        data: ageData.avg_price_lakhs,
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.15)',
        fill: true,
        tension: 0.35,
        pointRadius: 5
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: { label: (ctx) => `₹ ${ctx.parsed.y} Lakhs` }
        }
      },
      scales: {
        y: {
          title: { display: true, text: 'Average Price (₹ Lakhs)' },
          grid: { color: 'rgba(200, 200, 200, 0.15)' }
        },
        x: {
          title: { display: true, text: 'Property Age Category' },
          grid: { display: false }
        }
      }
    }
  });
}

// Retrain Model Trigger Handler
function setupRetrainButton() {
  const btn = document.getElementById('retrain-model-btn');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status"></span> Retraining Pipeline...';

    try {
      const res = await fetch('/api/model/retrain', { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        showToast('ML Regression pipeline retrained successfully!', 'success');
        await fetchAndRenderAnalytics();
      } else {
        showToast(json.message || 'Retraining failed', 'danger');
      }
    } catch (err) {
      showToast('Error connecting to retraining service', 'danger');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="bi bi-arrow-repeat me-1"></i> Retrain Model Pipeline';
    }
  });
}
