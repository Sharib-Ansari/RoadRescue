import { Router } from 'express';
import {
  createOrder,
  getMyOrders,
  getOrderById,
  getShopOrders,
  updateOrderStatus,
  getShopDashboardStats
} from '../controllers/orderController.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

// Customer Order placement & listing
router.post('/', requireAuth, createOrder);
router.get('/my-orders', requireAuth, getMyOrders);

// Shop Owner order endpoints
router.get('/shop-stats', requireAuth, requireRole('shop_owner'), getShopDashboardStats);
router.get('/shop-orders', requireAuth, requireRole('shop_owner'), getShopOrders);

// Order status updates (Shop owner or Customer cancellation)
router.patch('/:id/status', requireAuth, updateOrderStatus);

// Order Detail view (Customer or Shop Owner)
router.get('/:id', requireAuth, getOrderById);

export default router;
