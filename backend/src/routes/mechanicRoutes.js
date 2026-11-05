import { Router } from 'express';
import {
  getAllMechanics,
  getMechanicById,
  getNearbyMechanics,
  updateLocation,
  getMechanicStats
} from '../controllers/mechanicController.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

// Mechanic dashboard live statistics (requires mechanic role)
router.get('/dashboard/stats', requireAuth, requireRole('mechanic'), getMechanicStats);

// Location-based mechanic discovery (requires authentication)
router.get('/nearby', requireAuth, getNearbyMechanics);

// Mechanic GPS location update (requires mechanic role)
router.patch('/location', requireAuth, requireRole('mechanic'), updateLocation);

// Public directory routes
router.get('/', getAllMechanics);
router.get('/:id', getMechanicById);

export default router;
