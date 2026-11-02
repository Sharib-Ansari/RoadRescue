import User from '../models/User.js';
import { verifyToken, COOKIE_NAME } from '../utils/jwt.js';
import { AppError } from './errorHandler.js';

/**
 * Middleware to authenticate requests using JWT from HttpOnly cookie (or Bearer header fallback).
 */
export const requireAuth = async (req, res, next) => {
  try {
    let token = null;

    // 1. Primary: HttpOnly cookie
    if (req.cookies && req.cookies[COOKIE_NAME]) {
      token = req.cookies[COOKIE_NAME];
    } else if (req.cookies && req.cookies.roadrescue_token) {
      token = req.cookies.roadrescue_token;
    }
    // 2. Secondary fallback: Bearer token in Authorization header (useful for API testing tools like Postman/curl)
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('Authentication required. Please log in.', 401));
    }

    // Verify token
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return next(new AppError('Authentication token has expired. Please log in again.', 401));
      }
      return next(new AppError('Invalid authentication token. Please log in again.', 401));
    }

    // Retrieve user from DB (excluding passwordHash)
    const user = await User.findById(decoded.sub);
    if (!user) {
      return next(new AppError('The account belonging to this token no longer exists.', 401));
    }

    if (!user.isActive) {
      return next(new AppError('Your account has been deactivated. Please contact support.', 403));
    }

    // Attach verified user to request
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware factory to enforce role-based access control.
 * @param  {...string} allowedRoles - List of permitted roles (e.g. 'customer', 'mechanic')
 */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          `Access forbidden: requires ${allowedRoles.join(' or ')} role, but current user is '${req.user.role}'`,
          403
        )
      );
    }

    next();
  };
};
