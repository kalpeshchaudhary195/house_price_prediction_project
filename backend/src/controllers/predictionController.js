/**
 * Prediction Controller
 * Handles prediction creation, retrieval, deletion, and model interaction.
 */

import { query, getDatabaseStatus } from '../config/db.js';
import mlService from '../services/mlService.js';

export async function createPrediction(req, res, next) {
  try {
    const features = req.validatedFeatures;

    // 1. Request real prediction from Python ML service
    const mlResult = await mlService.predict(features);

    const locationStr = `${features.OceanProximity}, CA (${features.Latitude.toFixed(2)}°, ${features.Longitude.toFixed(2)}°)`;
    const predictedPrice = mlResult.predicted_price;
    const modelName = mlResult.model_name || 'Random Forest Regressor';

    // 2. Persist in PostgreSQL database safely using parameterized query
    let dbRecord = null;
    let savedToDb = false;

    try {
      const insertSql = `
        INSERT INTO predictions (
          location, property_type, bedrooms, bathrooms, area_sqft, input_features, predicted_price, model_name, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
        RETURNING *;
      `;
      const params = [
        locationStr,
        features.property_type,
        Math.round(features.AveBedrms),
        Math.round(features.bathrooms),
        features.area_sqft,
        JSON.stringify(mlResult.input_features || features),
        predictedPrice,
        modelName,
      ];

      const dbRes = await query(insertSql, params);
      if (dbRes.rows && dbRes.rows.length > 0) {
        dbRecord = dbRes.rows[0];
        savedToDb = true;
      }
    } catch (dbErr) {
      console.warn('[PostgreSQL Warning] Could not persist prediction record:', dbErr.message);
    }

    // 3. Return comprehensive prediction response
    return res.status(200).json({
      success: true,
      predicted_price: predictedPrice,
      range_low: mlResult.range_low,
      range_high: mlResult.range_high,
      confidence: mlResult.confidence || 'Medium',
      model_name: modelName,
      prediction_id: dbRecord ? dbRecord.id : null,
      created_at: dbRecord ? dbRecord.created_at : new Date().toISOString(),
      saved_to_db: savedToDb,
      input_features: mlResult.input_features || features,
      property_summary: {
        location: locationStr,
        property_type: features.property_type,
        bedrooms: features.AveBedrms,
        bathrooms: features.bathrooms,
        area_sqft: features.area_sqft,
        ocean_proximity: features.OceanProximity,
        house_age: features.HouseAge,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getPredictions(req, res, next) {
  try {
    const limit = Math.min(Math.max(1, parseInt(req.query.limit || '50', 10)), 200);
    const offset = Math.max(0, parseInt(req.query.offset || '0', 10));

    try {
      const sql = `
        SELECT 
          id, 
          location as property_location, 
          property_type, 
          bedrooms, 
          bathrooms, 
          area_sqft, 
          input_features, 
          predicted_price, 
          model_name, 
          created_at
        FROM predictions
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2;
      `;
      const countSql = 'SELECT COUNT(*) FROM predictions;';

      const [dataRes, countRes] = await Promise.all([
        query(sql, [limit, offset]),
        query(countSql),
      ]);

      const total = parseInt(countRes.rows[0].count, 10);

      return res.status(200).json({
        success: true,
        count: dataRes.rows.length,
        total,
        limit,
        offset,
        predictions: dataRes.rows,
        database: getDatabaseStatus(),
      });
    } catch (dbErr) {
      console.warn('[PostgreSQL Warning] Failed to query predictions:', dbErr.message);
      return res.status(200).json({
        success: true,
        count: 0,
        total: 0,
        predictions: [],
        database: getDatabaseStatus(),
        notice: 'PostgreSQL offline or table uninitialized.',
      });
    }
  } catch (err) {
    next(err);
  }
}

export async function getPredictionById(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid prediction ID.' });
    }

    const sql = `
      SELECT 
        id, 
        location as property_location, 
        property_type, 
        bedrooms, 
        bathrooms, 
        area_sqft, 
        input_features, 
        predicted_price, 
        model_name, 
        created_at
      FROM predictions
      WHERE id = $1;
    `;
    const result = await query(sql, [id]);

    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({ success: false, error: `Prediction #${id} not found.` });
    }

    return res.status(200).json({
      success: true,
      prediction: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
}

export async function deletePredictionById(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid prediction ID.' });
    }

    const sql = 'DELETE FROM predictions WHERE id = $1 RETURNING id;';
    const result = await query(sql, [id]);

    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({ success: false, error: `Prediction #${id} not found or already deleted.` });
    }

    return res.status(200).json({
      success: true,
      message: `Prediction #${id} deleted successfully.`,
      deleted_id: id,
    });
  } catch (err) {
    next(err);
  }
}

export async function getModelInfo(req, res, next) {
  try {
    const mlInfo = await mlService.getModelInfo();

    // Query recent training history from PostgreSQL
    let trainingHistory = [];
    try {
      const histSql = `
        SELECT id, model_name, mae, rmse, r2_score, dataset_size, trained_at
        FROM model_training_history
        ORDER BY trained_at DESC
        LIMIT 10;
      `;
      const histRes = await query(histSql);
      trainingHistory = histRes.rows;
    } catch {}

    return res.status(200).json({
      success: true,
      ...mlInfo,
      training_history: trainingHistory,
      database: getDatabaseStatus(),
    });
  } catch (err) {
    next(err);
  }
}

export async function retrainModel(req, res, next) {
  try {
    const mlResult = await mlService.retrain();

    // Persist retraining run in PostgreSQL model_training_history
    if (mlResult.metrics) {
      try {
        const insertHist = `
          INSERT INTO model_training_history (model_name, mae, rmse, r2_score, dataset_size, trained_at)
          VALUES ($1, $2, $3, $4, $5, NOW())
          RETURNING *;
        `;
        const params = [
          mlResult.retrained_model || 'Random Forest Regressor',
          mlResult.metrics.mae,
          mlResult.metrics.rmse,
          mlResult.metrics.r2_score,
          mlResult.dataset_size || 20640,
        ];
        await query(insertHist, params);
      } catch (dbErr) {
        console.warn('[PostgreSQL Warning] Failed to log retraining run to database:', dbErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      message: mlResult.message || 'Model retrained successfully.',
      ...mlResult,
    });
  } catch (err) {
    next(err);
  }
}

