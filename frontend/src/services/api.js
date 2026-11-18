/**
 * REST API client for House Price Prediction application.
 * Connects React frontend UI to the Node.js Express backend.
 */

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const defaultHeaders = {
    "Accept": "application/json",
    "Content-Type": "application/json",
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers || {}),
    },
  };

  try {
    const res = await fetch(url, config);
    let data;
    try {
      data = await res.json();
    } catch {
      data = { success: false, error: "Invalid JSON response from server" };
    }

    if (!res.ok) {
      const errorMsg =
        data.error ||
        (Array.isArray(data.errors) ? data.errors.join(" | ") : null) ||
        `HTTP Error ${res.status}: ${res.statusText}`;
      const err = new Error(errorMsg);
      err.status = res.status;
      err.data = data;
      throw err;
    }

    return data;
  } catch (err) {
    if (err.name === "TypeError" && err.message.includes("fetch")) {
      const netErr = new Error(
        "Cannot connect to Node.js backend server. Ensure server is running at http://127.0.0.1:5000"
      );
      netErr.isNetworkError = true;
      throw netErr;
    }
    throw err;
  }
}

export const api = {
  /** Check Node.js and PostgreSQL connectivity */
  checkHealth() {
    return request("/api/health");
  },

  /** Predict house price based on property parameters */
  predict(payload) {
    return request("/api/predict", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  /** Fetch active model performance and algorithm comparisons */
  getModelInfo() {
    return request("/api/model-info");
  },

  /** Fetch available locations and dataset-driven valuation statistics */
  getLocations() {
    return request("/api/locations");
  },

  /** Fetch property showcase catalogue with optional category filter */
  getProperties(category = null, limit = 20) {
    const params = new URLSearchParams();
    if (category && category !== 'ALL') params.append('category', category);
    if (limit) params.append('limit', limit);
    const qs = params.toString();
    return request(`/api/properties${qs ? `?${qs}` : ''}`);
  },

  /** Fetch single property by ID */
  getPropertyById(id) {
    return request(`/api/properties/${id}`);
  },

  /** Fetch live database statistics for dashboard */
  getDashboardStats() {
    return request("/api/dashboard/stats");
  },

  /** Fetch all 12 interconnected dashboard chart datasets with coordinated filters */
  getDashboardCharts(filters = {}) {
    const params = new URLSearchParams();
    if (filters.location && filters.location !== 'ALL') params.append('location', filters.location);
    if (filters.min_price) params.append('min_price', filters.min_price);
    if (filters.max_price) params.append('max_price', filters.max_price);
    const qs = params.toString();
    return request(`/api/dashboard/charts${qs ? `?${qs}` : ''}`);
  },

  /** Fetch historical predictions saved in PostgreSQL database */
  getPredictions(limit = 50, offset = 0) {
    return request(`/api/predictions?limit=${limit}&offset=${offset}`);
  },

  /** Fetch single prediction by ID */
  getPredictionById(id) {
    return request(`/api/predictions/${id}`);
  },

  /** Delete a prediction record by ID */
  deletePrediction(id) {
    return request(`/api/predictions/${id}`, {
      method: "DELETE",
    });
  },

  /** Trigger model retraining */
  retrain() {
    return request("/api/model/retrain", {
      method: "POST",
    });
  },
};

export default api;
