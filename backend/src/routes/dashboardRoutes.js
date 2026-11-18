import { Router } from 'express';
import { getDashboardStats, getDashboardCharts } from '../controllers/dashboardController.js';

const router = Router();

router.get('/stats', getDashboardStats);
router.get('/charts', getDashboardCharts);

export default router;

