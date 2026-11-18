/**
 * REST API client for House Price Prediction application.
 * Connects frontend UI to backend machine learning services.
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
        "Cannot connect to ML backend server. Ensure backend is running at http://127.0.0.1:5000"
      );
      netErr.isNetworkError = true;
      throw netErr;
    }
    throw err;
  }
}

export const api = {
  /** Check server health and status */
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

  /** Fetch historical predictions saved in database */
  getPredictions(limit = 50) {
    return request(`/api/predictions?limit=${limit}`);
  },

  /** Retrain models on the authorized dataset */
  retrain() {
    return request("/api/retrain", {
      method: "POST",
    });
  },
};

export default api;
