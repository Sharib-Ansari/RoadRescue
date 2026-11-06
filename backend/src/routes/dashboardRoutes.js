import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';
import { getCustomerDashboard } from '../controllers/dashboardController.js';

const router = Router();

/**
 * Customer dashboard API — returns real aggregated MongoDB data
 * GET /api/customer/dashboard
 */
router.get(
  '/customer/dashboard',
  requireAuth,
  requireRole('customer'),
  getCustomerDashboard
);

/**
 * Mechanic dashboard API (Mechanic role only)
 * GET /api/mechanic/dashboard
 */
router.get('/mechanic/dashboard', requireAuth, requireRole('mechanic'), (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Welcome to Mechanic Partner Dashboard',
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      mechanicProfile: req.user.mechanicProfile
    },
    data: {
      isOnline: true,
      pendingRequests: 0,
      activeJobs: 0,
      completedJobs: 0,
      earnings: 0
    }
  });
});

export default router;
