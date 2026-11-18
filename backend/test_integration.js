/**
 * Node.js Integration Test Script
 * Tests all requested endpoints on http://127.0.0.1:5000
 */

import axios from 'axios';

const BASE = 'http://127.0.0.1:5000/api';

async function runTests() {
  console.log('--- Testing House Price Prediction Node.js + Express API ---');

  // 1. Health check
  try {
    const health = await axios.get(`${BASE}/health`);
    console.log('✓ 1. GET /api/health:', health.data.status, '| DB:', health.data.database?.type);
  } catch (err) {
    console.error('✗ 1. GET /api/health FAILED:', err.message);
  }

  // 2. Model Info
  try {
    const model = await axios.get(`${BASE}/model-info`);
    console.log('✓ 2. GET /api/model-info: Best Model:', model.data.best_model, '| R2:', model.data.metrics?.r2_score);
  } catch (err) {
    console.error('✗ 2. GET /api/model-info FAILED:', err.message);
  }

  // 3. Locations
  try {
    const locs = await axios.get(`${BASE}/locations`);
    console.log('✓ 3. GET /api/locations: Total:', locs.data.locations?.length, '| First:', locs.data.locations?.[0]?.name);
  } catch (err) {
    console.error('✗ 3. GET /api/locations FAILED:', err.message);
  }

  // 4. Dashboard Stats
  try {
    const stats = await axios.get(`${BASE}/dashboard/stats`);
    console.log('✓ 4. GET /api/dashboard/stats:', stats.data.stats);
  } catch (err) {
    console.error('✗ 4. GET /api/dashboard/stats FAILED:', err.message);
  }

  // 5. Predict
  let predId = null;
  try {
    const pred = await axios.post(`${BASE}/predict`, {
      MedInc: 5.5,
      HouseAge: 25.0,
      AveRooms: 5.8,
      AveBedrms: 1.1,
      Population: 1300.0,
      AveOccup: 2.9,
      Latitude: 37.85,
      Longitude: -122.25,
      OceanProximity: 'NEAR BAY',
      property_type: 'Single Family Villa',
    });
    predId = pred.data.prediction_id;
    console.log('✓ 5. POST /api/predict: Price: $', pred.data.predicted_price, '| Confidence:', pred.data.confidence, '| ID:', predId);
  } catch (err) {
    console.error('✗ 5. POST /api/predict FAILED:', err.response?.data || err.message);
  }

  // 6. Get Predictions
  try {
    const preds = await axios.get(`${BASE}/predictions`);
    console.log('✓ 6. GET /api/predictions: Count:', preds.data.count, '| Total:', preds.data.total);
  } catch (err) {
    console.error('✗ 6. GET /api/predictions FAILED:', err.message);
  }

  // 7. Get Prediction by ID
  if (predId) {
    try {
      const single = await axios.get(`${BASE}/predictions/${predId}`);
      console.log('✓ 7. GET /api/predictions/:id: Retrieved ID:', single.data.prediction?.id, 'Price: $', single.data.prediction?.predicted_price);
    } catch (err) {
      console.error('✗ 7. GET /api/predictions/:id FAILED:', err.message);
    }
  }

  // 8. Delete Prediction by ID (optional test if predId created)
  if (predId) {
    try {
      const del = await axios.delete(`${BASE}/predictions/${predId}`);
      console.log('✓ 8. DELETE /api/predictions/:id: Deleted ID:', del.data.deleted_id);
    } catch (err) {
      console.error('✗ 8. DELETE /api/predictions/:id FAILED:', err.message);
    }
  }

  console.log('--- Integration Testing Completed ---');
}

runTests();

