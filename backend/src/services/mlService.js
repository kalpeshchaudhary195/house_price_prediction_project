/**
 * Python ML Service Client
 * Communicates with the Python FastAPI ML microservice via HTTP.
 */

import axios from 'axios';

const ML_SERVICE_URL = (process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');

const client = axios.create({
  baseURL: ML_SERVICE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

export const mlService = {
  /**
   * Health check of Python ML service
   */
  async getHealth() {
    try {
      const res = await client.get('/health');
      return { connected: true, data: res.data };
    } catch (err) {
      return {
        connected: false,
        error: `Python ML service unreachable at ${ML_SERVICE_URL} (${err.message})`,
      };
    }
  },

  /**
   * Send property features to Python ML service for real inference
   */
  async predict(features) {
    try {
      const res = await client.post('/predict', features);
      return res.data;
    } catch (err) {
      if (err.response?.data?.detail) {
        const detail = err.response.data.detail;
        const msg = Array.isArray(detail.errors)
          ? detail.errors.join(' | ')
          : typeof detail === 'string'
          ? detail
          : JSON.stringify(detail);
        const customErr = new Error(msg);
        customErr.status = err.response.status;
        throw customErr;
      }
      if (err.code === 'ECONNREFUSED') {
        const customErr = new Error(
          `Cannot connect to Python ML microservice at ${ML_SERVICE_URL}. Please ensure Python ML service is running.`
        );
        customErr.status = 503;
        throw customErr;
      }
      throw err;
    }
  },

  /**
   * Fetch active model information and comparison metrics
   */
  async getModelInfo() {
    try {
      const res = await client.get('/model-info');
      return res.data;
    } catch (err) {
      if (err.code === 'ECONNREFUSED') {
        return {
          success: false,
          error: `Python ML service offline at ${ML_SERVICE_URL}`,
        };
      }
      throw err;
    }
  },

  /**
   * Fetch available location options with dataset price statistics
   */
  async getLocations() {
    try {
      const res = await client.get('/locations');
      return res.data;
    } catch (err) {
      return {
        success: false,
        error: err.message,
      };
    }
  },

  /**
   * Fetch aggregated dataset analytics and distribution data for dashboard graphs
   */
  async getDatasetCharts(filters = {}) {
    try {
      const params = {};
      if (filters.location && filters.location !== 'ALL') params.location = filters.location;
      if (filters.min_price) params.min_price = filters.min_price;
      if (filters.max_price) params.max_price = filters.max_price;

      const res = await client.get('/dataset-charts', { params });
      return res.data;
    } catch (err) {
      console.warn('[ML Service Warning] /dataset-charts unavailable:', err.message);
      return { success: false, error: err.message };
    }
  },

  /**
   * Retrain machine learning models
   */
  async retrain() {
    try {
      const res = await client.post('/retrain');
      return res.data;
    } catch (err) {
      throw new Error(`Retraining request failed: ${err.message}`);
    }
  },
};

export default mlService;

