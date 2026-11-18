import { Router } from 'express';
import { getProperties, getPropertyById, getLocations } from '../controllers/propertyController.js';

const router = Router();

router.get('/properties', getProperties);
router.get('/properties/:id', getPropertyById);
router.get('/locations', getLocations);

export default router;

