/**
 * Property Catalogue & Location Analytics Controller
 */

import { query } from '../config/db.js';
import mlService from '../services/mlService.js';

export async function getProperties(req, res, next) {
  try {
    const limit = Math.min(Math.max(1, parseInt(req.query.limit || '20', 10)), 100);
    const category = req.query.category || req.query.property_type;

    try {
      let sql = 'SELECT * FROM properties';
      const params = [];

      if (category && category !== 'ALL') {
        sql += ' WHERE property_type = $1 ORDER BY id ASC LIMIT $2;';
        params.push(category, limit);
      } else {
        sql += ' ORDER BY id ASC LIMIT $1;';
        params.push(limit);
      }

      const result = await query(sql, params);
      if (result.rows && result.rows.length > 0) {
        return res.status(200).json({ success: true, count: result.rows.length, properties: result.rows });
      }
    } catch (err) {
      console.warn('[PostgreSQL Warning] Could not query properties table:', err.message);
    }

    return res.status(200).json({ success: true, count: 0, properties: [] });
  } catch (err) {
    next(err);
  }
}

export async function getPropertyById(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, error: 'Invalid property ID' });
    }

    const sql = 'SELECT * FROM properties WHERE id = $1;';
    const result = await query(sql, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Property not found' });
    }

    return res.status(200).json({ success: true, property: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

export async function getLocations(req, res, next) {
  try {
    const data = await mlService.getLocations();
    return res.status(200).json(data);
  } catch (err) {
    next(err);
  }
}
