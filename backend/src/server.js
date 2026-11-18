/**
 * House Price Prediction - Node.js Express Backend Server
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { initDatabase, getDatabaseStatus } from './config/db.js';
import mlService from './services/mlService.js';
import predictionRoutes from './routes/predictionRoutes.js';
import propertyRoutes from './routes/propertyRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const PORT = parseInt(process.env.PORT || '5000', 10);

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check Endpoint
app.get('/api/health', async (req, res) => {
  const dbStatus = getDatabaseStatus();
  const mlStatus = await mlService.getHealth();

  const isHealthy = mlStatus.connected;
  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'degraded',
    service: 'House Price Prediction Backend (Node.js + Express)',
    timestamp: new Date().toISOString(),
    database: {
      type: 'PostgreSQL',
      ...dbStatus,
    },
    ml_service: mlStatus,
  });
});

// Mount API routes
app.use('/api', predictionRoutes);
app.use('/api', propertyRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Serve static React frontend if built
const frontendDist = path.resolve(__dirname, '../../frontend/dist');
const altFrontendDist = path.resolve(__dirname, '../../react-app/dist');
const distPath = [frontendDist, altFrontendDist].find((p) => {
  try {
    return express.static(p);
  } catch {
    return false;
  }
});

if (distPath) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// 404 for unhandled API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: `API endpoint '${req.originalUrl}' not found.`,
  });
});

// Global Error Handler
app.use(errorHandler);

// Start Server and Initialize Database
async function startServer() {
  await initDatabase();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`=======================================================`);
    console.log(`Node.js Express Server running at http://127.0.0.1:${PORT}`);
    console.log(`Connected Architecture: React -> Node.js -> Python ML`);
    console.log(`=======================================================`);
  });
}

startServer().catch((err) => {
  console.error('[Startup Error]:', err);
});

export default app;

