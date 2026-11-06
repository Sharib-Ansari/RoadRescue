import { Router } from 'express';
import {
  createProduct,
  getMyProducts,
  updateProduct,
  deleteProduct,
  getPublicProducts,
  getProductById
} from '../controllers/productController.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

// Shop Owner protected routes
router.get('/my-products', requireAuth, requireRole('shop_owner'), getMyProducts);
router.post('/', requireAuth, requireRole('shop_owner'), createProduct);
router.put('/:id', requireAuth, requireRole('shop_owner'), updateProduct);
router.delete('/:id', requireAuth, requireRole('shop_owner'), deleteProduct);

// Public product directory
router.get('/', getPublicProducts);
router.get('/:id', getProductById);

export default router;
