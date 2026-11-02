import jwt from 'jsonwebtoken';

const COOKIE_NAME = 'token';

/**
 * Parses duration string (e.g. '7d', '24h', '60m') to milliseconds.
 */
const parseDurationToMs = (durationStr) => {
  if (!durationStr) return 7 * 24 * 60 * 60 * 1000; // default 7 days
  const match = durationStr.match(/^(\d+)([smhd])$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const value = parseInt(match[1], 10);
  const unit = match[2];
  switch (unit) {
    case 's': return value * 1000;
    case 'm': return value * 60 * 1000;
    case 'h': return value * 60 * 60 * 1000;
    case 'd': return value * 24 * 60 * 60 * 1000;
    default: return 7 * 24 * 60 * 60 * 1000;
  }
};

/**
 * Generate a JWT signed with HS256 containing userId (sub) and role.
 */
export const generateToken = (user) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured in environment variables');
  }

  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  const payload = {
    sub: user._id ? user._id.toString() : user.id,
    role: user.role
  };

  return jwt.sign(payload, secret, {
    algorithm: 'HS256',
    expiresIn
  });
};

/**
 * Verify a JWT using HS256.
 */
export const verifyToken = (token) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured in environment variables');
  }

  return jwt.verify(token, secret, {
    algorithms: ['HS256']
  });
};

/**
 * Generate standard cookie options.
 */
export const getCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === 'production';

  // Respect COOKIE_SECURE if explicitly set, else true only in production
  const secure = process.env.COOKIE_SECURE !== undefined
    ? process.env.COOKIE_SECURE === 'true'
    : isProduction;

  // sameSite: in development over HTTP, 'lax' is best; if cross-site over HTTPS, 'none'
  const sameSite = process.env.COOKIE_SAME_SITE || (secure ? 'none' : 'lax');

  // Max age based on JWT_EXPIRES_IN or COOKIE_EXPIRES_IN (in days)
  let maxAge;
  if (process.env.COOKIE_EXPIRES_IN) {
    maxAge = parseInt(process.env.COOKIE_EXPIRES_IN, 10) * 24 * 60 * 60 * 1000;
  } else {
    maxAge = parseDurationToMs(process.env.JWT_EXPIRES_IN || '7d');
  }

  return {
    httpOnly: true,
    secure,
    sameSite,
    maxAge,
    path: '/'
  };
};

/**
 * Set the authentication HttpOnly cookie on response.
 */
export const setAuthCookie = (res, token) => {
  const options = getCookieOptions();
  res.cookie(COOKIE_NAME, token, options);
};

/**
 * Clear the authentication cookie on response.
 */
export const clearAuthCookie = (res) => {
  const options = getCookieOptions();
  // For clearing, maxAge is set to 0 and expires is past
  const { maxAge: _, ...clearOptions } = options;
  res.clearCookie(COOKIE_NAME, clearOptions);
};

export { COOKIE_NAME };
