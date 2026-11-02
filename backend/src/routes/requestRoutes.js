import { Router } from 'express';
import {
  createRequest,
  getMyRequests,
  getActiveRequest,
  getRequestById,
  updateRequestStatus
} from '../controllers/requestController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.use(requireAuth);

router.route('/')
  .get(getMyRequests)
  .post(createRequest);

router.get('/active', getActiveRequest);

router.route('/:id')
  .get(getRequestById);

router.patch('/:id/status', updateRequestStatus);

export default router;
