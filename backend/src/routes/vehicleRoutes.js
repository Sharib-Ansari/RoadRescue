import { Router } from 'express';
import {
  getMyVehicles,
  addVehicle,
  updateVehicle,
  deleteVehicle
} from '../controllers/vehicleController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

// All vehicle routes require user authentication
router.use(requireAuth);

router.route('/')
  .get(getMyVehicles)
  .post(addVehicle);

router.route('/:id')
  .put(updateVehicle)
  .delete(deleteVehicle);

export default router;
