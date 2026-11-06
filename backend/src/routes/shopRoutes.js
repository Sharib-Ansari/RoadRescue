import { Router } from 'express';
import {
  createShop,
  getMyShop,
  updateMyShop,
  getShopById,
  getAllShops
} from '../controllers/shopController.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

// Shop owner operations (authenticated & role-guarded)
router.post('/', requireAuth, requireRole('shop_owner'), createShop);
router.get('/me', requireAuth, requireRole('shop_owner'), getMyShop);
router.patch('/me', requireAuth, requireRole('shop_owner'), updateMyShop);

// Public shop discovery
router.get('/', getAllShops);
router.get('/:id', getShopById);

export default router;
