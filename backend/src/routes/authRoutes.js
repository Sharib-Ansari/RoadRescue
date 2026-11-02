import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, getMe, logout } from '../controllers/authController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

// Rate limiter for login endpoint to protect against brute-force attacks
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login requests per windowMs
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  message: {
    status: 'fail',
    message: 'Too many login attempts from this IP. Please try again after 15 minutes.'
  }
});

// Public authentication routes
router.post('/register', register);
router.post('/login', loginLimiter, login);

// Authenticated routes
router.get('/me', requireAuth, getMe);
router.post('/logout', requireAuth, logout);

export default router;
