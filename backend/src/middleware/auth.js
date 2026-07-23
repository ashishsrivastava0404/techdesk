import jwt from 'jsonwebtoken';

/**
 * JWT Authentication Middleware
 * Verifies JWT token from Authorization header
 */
export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
}

/**
 * Optional authentication - doesn't fail if no token
 */
export function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
  } catch (error) {
    // Ignore invalid tokens for optional auth
  }
  
  next();
}

/**
 * Generate JWT token for user
 */
export function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      role: user.role
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRY || '24h' }
  );
}

/**
 * Generate refresh token for user (longer expiry)
 */
export function generateRefreshToken(user) {
  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      role: user.role,
      type: 'refresh'
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

/**
 * Role-based access control middleware
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
}

/**
 * Admin-only middleware
 */
export const requireAdmin = requireRole('admin');

/**
 * Tech-only middleware
 */
export const requireTech = requireRole('tech');

/**
 * Customer or above middleware
 */
export const requireCustomer = requireRole('customer', 'tech', 'admin');

/**
 * Resource ownership check
 * Verifies user owns the resource or is admin
 */
export function checkOwnership(getResource) {
  return async (req, res, next) => {
    try {
      const resource = await getResource(req);

      if (!resource) {
        return res.status(404).json({ error: 'Resource not found' });
      }

      // Admin has full access
      if (req.user.role === 'admin') {
        req.resource = resource;
        return next();
      }

      // Check ownership
      const isOwner = 
        resource.customer_name === req.user.name ||
        resource.tech_name === req.user.name ||
        resource.user_name === req.user.name ||
        resource.name === req.user.name;

      if (!isOwner) {
        return res.status(403).json({ error: 'Not authorized to access this resource' });
      }

      req.resource = resource;
      next();
    } catch (error) {
      next(error);
    }
  };
}
