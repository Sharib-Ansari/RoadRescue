import { Router } from 'express';
import {
  createRequest,
  getMyRequests,
  getActiveRequest,
  getRequestById,
  updateRequestStatus,
  reassignRequest
} from '../controllers/requestController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.use(requireAuth);

router.route('/')
  .get(getMyRequests)
  .post(createRequest);

router.get('/active', getActiveRequest);

router.patch('/:id/reassign', reassignRequest);
router.patch('/:id/status', updateRequestStatus);

router.route('/:id')
  .get(getRequestById);

export default router;
