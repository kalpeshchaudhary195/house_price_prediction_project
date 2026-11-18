import { Router } from 'express';
import {
  createPrediction,
  getPredictions,
  getPredictionById,
  deletePredictionById,
  getModelInfo,
  retrainModel,
} from '../controllers/predictionController.js';
import { validatePredictionInput } from '../middleware/validator.js';

const router = Router();

// Prediction endpoints
router.post('/predict', validatePredictionInput, createPrediction);
router.get('/predictions', getPredictions);
router.get('/predictions/:id', getPredictionById);
router.delete('/predictions/:id', deletePredictionById);

// Model info & Retraining endpoints
router.get('/model-info', getModelInfo);
router.post('/model/retrain', retrainModel);
router.post('/retrain', retrainModel); // Alias for frontend compatibility

export default router;

