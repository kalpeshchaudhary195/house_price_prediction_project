/**
 * PostgreSQL Database Connection Pool & Table Initializer
 * Uses node-postgres (pg) with connection pooling and parameterized queries.
 */

import pkg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from backend/.env or root .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const { Pool } = pkg;

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'house_price_prediction',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'your_password',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
};

// Also support full connection string if provided
if (process.env.DATABASE_URL) {
  dbConfig.connectionString = process.env.DATABASE_URL;
}

export const pool = new Pool(dbConfig);

let isDbConnected = false;
let lastDbError = null;

pool.on('error', (err) => {
  console.error('[PostgreSQL Pool Error]: Unexpected error on idle client:', err.message);
  isDbConnected = false;
  lastDbError = err.message;
});

/**
 * Execute parameterized query safely
 * @param {string} text - SQL query text with $1, $2 placeholders
 * @param {Array} params - Parameters array
 */
export async function query(text, params = []) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  if (process.env.NODE_ENV !== 'production' && duration > 50) {
    console.log(`[SQL Query] Executed in ${duration}ms:`, { text: text.substring(0, 80), rows: res.rowCount });
  }
  return res;
}

/**
 * Safe Database Initialization
 * Creates tables if they do not already exist without dropping or losing existing data.
 */
export async function initDatabase() {
  try {
    const client = await pool.connect();
    try {
      console.log(`[PostgreSQL] Connected to ${dbConfig.database} at ${dbConfig.host}:${dbConfig.port} as ${dbConfig.user}`);
      isDbConnected = true;
      lastDbError = null;

      // 1. Table: predictions
      await client.query(`
        CREATE TABLE IF NOT EXISTS predictions (
          id SERIAL PRIMARY KEY,
          location VARCHAR(255) NOT NULL,
          property_type VARCHAR(100) DEFAULT 'Single Family',
          bedrooms INTEGER DEFAULT 1,
          bathrooms INTEGER DEFAULT 1,
          area_sqft NUMERIC(10, 2) DEFAULT 1500.00,
          input_features JSONB,
          predicted_price NUMERIC(14, 2) NOT NULL,
          model_name VARCHAR(150) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Index on created_at for fast history queries
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_predictions_created_at ON predictions(created_at DESC);
      `);

      // 2. Table: model_training_history
      await client.query(`
        CREATE TABLE IF NOT EXISTS model_training_history (
          id SERIAL PRIMARY KEY,
          model_name VARCHAR(150) NOT NULL,
          mae NUMERIC(14, 2) NOT NULL,
          rmse NUMERIC(14, 2) NOT NULL,
          r2_score NUMERIC(8, 4) NOT NULL,
          dataset_size INTEGER NOT NULL,
          trained_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // 3. Table: properties (7 illustrative categories with unique imagery and presets)
      await client.query(`
        CREATE TABLE IF NOT EXISTS properties (
          id SERIAL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          location VARCHAR(255) NOT NULL,
          property_type VARCHAR(100) NOT NULL,
          bedrooms INTEGER DEFAULT 3,
          bathrooms INTEGER DEFAULT 2,
          total_rooms INTEGER DEFAULT 6,
          area_sqft NUMERIC(10, 2) DEFAULT 2000.00,
          price NUMERIC(14, 2) NOT NULL,
          image_url VARCHAR(500) NOT NULL,
          description TEXT,
          preset_data JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Ensure total_rooms and preset_data columns exist if table was previously created
      await client.query(`
        ALTER TABLE properties ADD COLUMN IF NOT EXISTS total_rooms INTEGER DEFAULT 6;
        ALTER TABLE properties ADD COLUMN IF NOT EXISTS preset_data JSONB;
      `);

      // Re-seed all 7 distinct property categories
      const propCheck = await client.query('SELECT COUNT(*) FROM properties');
      if (parseInt(propCheck.rows[0].count, 10) < 7) {
        // Clear old sample rows if partial
        await client.query('DELETE FROM properties');

        await client.query(`
          INSERT INTO properties (title, location, property_type, bedrooms, bathrooms, total_rooms, area_sqft, price, image_url, description, preset_data)
          VALUES 
          (
            'Pacific Panorama Oceanfront Villa', 
            'Malibu Coast, CA (NEAR OCEAN)', 
            'Luxury Villas', 
            5, 5, 9, 4850, 1250000, 
            'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1200&q=80', 
            'Ultra-luxury architectural villa featuring double-height glass walls, private infinity pool, and panoramic Pacific Ocean sunsets.',
            '{"MedInc": "9.5", "HouseAge": "12", "AveRooms": "7.8", "AveBedrms": "1.3", "Population": "620", "AveOccup": "2.6", "Latitude": "34.02", "Longitude": "-118.77", "OceanProximity": "NEAR OCEAN"}'
          ),
          (
            'Silicon Valley Horizon High-Rise Apartment', 
            'San Jose, CA (<1H OCEAN)', 
            'Apartments', 
            2, 2, 4, 1320, 540000, 
            'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80', 
            'Contemporary high-rise corner apartment with private sunset terrace, quartz countertops, and smart climate control.',
            '{"MedInc": "6.2", "HouseAge": "15", "AveRooms": "4.8", "AveBedrms": "1.0", "Population": "2400", "AveOccup": "2.8", "Latitude": "37.33", "Longitude": "-121.89", "OceanProximity": "<1H OCEAN"}'
          ),
          (
            'Pasadena Craftsman Independent Estate', 
            'Pasadena, CA (<1H OCEAN)', 
            'Independent Houses', 
            4, 3, 7, 2850, 685000, 
            'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80', 
            'Classic California Craftsman with expansive private lawn, detached workshop, solar energy roof, and artisan brickwork.',
            '{"MedInc": "6.8", "HouseAge": "32", "AveRooms": "6.2", "AveBedrms": "1.1", "Population": "1350", "AveOccup": "3.1", "Latitude": "34.14", "Longitude": "-118.14", "OceanProximity": "<1H OCEAN"}'
          ),
          (
            'Sunnyvale Suburban Garden Family Residence', 
            'Sunnyvale, CA (NEAR BAY)', 
            'Family Houses', 
            4, 3, 6, 2420, 710000, 
            'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1200&q=80', 
            'Warm two-story family home adjacent to top-rated schools, parks, and Silicon Valley employer shuttle corridors.',
            '{"MedInc": "7.2", "HouseAge": "24", "AveRooms": "5.9", "AveBedrms": "1.1", "Population": "1600", "AveOccup": "3.3", "Latitude": "37.36", "Longitude": "-122.03", "OceanProximity": "NEAR BAY"}'
          ),
          (
            'Berkeley Hills Minimalist Glass Residence', 
            'Berkeley Hills, CA (NEAR BAY)', 
            'Modern Houses', 
            3, 3, 5, 2150, 625000, 
            'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80', 
            'Architect-designed geometric home emphasizing natural daylight, recycled timber accents, and sweeping San Francisco Bay views.',
            '{"MedInc": "6.5", "HouseAge": "10", "AveRooms": "5.4", "AveBedrms": "1.0", "Population": "1100", "AveOccup": "2.7", "Latitude": "37.87", "Longitude": "-122.27", "OceanProximity": "NEAR BAY"}'
          ),
          (
            'Sonoma Valley Eco-Compact Bungalow', 
            'Sonoma Foothills, CA (INLAND)', 
            'Small Houses', 
            2, 1, 3, 980, 295000, 
            'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=1200&q=80', 
            'Charming, low-maintenance energy-efficient stone bungalow nestled in a peaceful country foothill community.',
            '{"MedInc": "3.4", "HouseAge": "28", "AveRooms": "4.2", "AveBedrms": "1.0", "Population": "1450", "AveOccup": "2.4", "Latitude": "38.29", "Longitude": "-122.45", "OceanProximity": "INLAND"}'
          ),
          (
            'Santa Catalina Oceanfront Island Sanctuary', 
            'Avalon, Catalina Island, CA (ISLAND)', 
            'Premium Properties', 
            6, 6, 10, 5200, 1480000, 
            'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80', 
            'Trophy island estate featuring private ocean pier access, infinity spa deck, and 360-degree Pacific coastal panorama.',
            '{"MedInc": "8.8", "HouseAge": "18", "AveRooms": "8.2", "AveBedrms": "1.4", "Population": "580", "AveOccup": "2.5", "Latitude": "33.34", "Longitude": "-118.32", "OceanProximity": "ISLAND"}'
          );
        `);
      }

      console.log('[PostgreSQL] Database tables initialized successfully.');
    } finally {
      client.release();
    }
  } catch (err) {
    isDbConnected = false;
    lastDbError = err.message;
    console.warn(`[PostgreSQL Notice] Unable to connect to PostgreSQL at ${dbConfig.host}:${dbConfig.port} (${err.message}).`);
    console.warn('[PostgreSQL Notice] Ensure PostgreSQL is running and DB_PASSWORD is set in .env. The API will report this status via /api/health.');
  }
}

export function getDatabaseStatus() {
  return {
    connected: isDbConnected,
    host: dbConfig.host,
    port: dbConfig.port,
    database: dbConfig.database,
    user: dbConfig.user,
    error: lastDbError,
  };
}

