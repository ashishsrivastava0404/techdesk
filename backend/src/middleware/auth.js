import jwt from 'jsonwebtoken';

const DEBUG = process.env.DEBUG === 'true' || process.env.NODE_ENV !== 'production';

/**
 * JWT Authentication Middleware
 * Verifies JWT token from Authorization header
 */
export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (DEBUG) {
    console.log(`[AUTH] ${req.method} ${req.path} - Checking authentication...`);
  }

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    if (DEBUG) {
      console.log(`[AUTH] ${req.method} ${req.path} - ❌ No token provided`);
    }
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    if (DEBUG) {
      console.log(`[AUTH] ${req.method} ${req.path} - ✅ Authenticated as: ${decoded.name} (${decoded.role})`);
    }
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      if (DEBUG) {
        console.log(`[AUTH] ${req.method} ${req.path} - ❌ Token expired`);
      }
      return res.status(401).json({ error: 'Token expired' });
    }
    if (DEBUG) {
      console.log(`[AUTH] ${req.method} ${req.path} - ❌ Invalid token: ${error.message}`);
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
    if (DEBUG) {
      console.log(`[AUTH] ${req.method} ${req.path} - No token (optional)`);
    }
    return next();
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    if (DEBUG) {
      console.log(`[AUTH] ${req.method} ${req.path} - ✅ Optional auth as: ${decoded.name}`);
    }
  } catch (error) {
    if (DEBUG) {
      console.log(`[AUTH] ${req.method} ${req.path} - Invalid token (ignored): ${error.message}`);
    }
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
      if (DEBUG) {
        console.log(`[ROLE] ${req.method} ${req.path} - ❌ No user (authenticate first)`);
      }
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      if (DEBUG) {
        console.log(`[ROLE] ${req.method} ${req.path} - ❌ Forbidden: ${req.user.role} not in [${roles.join(', ')}]`);
      }
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    if (DEBUG) {
      console.log(`[ROLE] ${req.method} ${req.path} - ✅ Allowed for ${req.user.role}`);
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
        if (DEBUG) {
          console.log(`[OWNERSHIP] ${req.method} ${req.path} - ❌ User ${req.user.name} doesn't own resource`);
        }
        return res.status(403).json({ error: 'Not authorized to access this resource' });
      }

      if (DEBUG) {
        console.log(`[OWNERSHIP] ${req.method} ${req.path} - ✅ User owns resource`);
      }

      req.resource = resource;
      next();
    } catch (error) {
      next(error);
    }
  };
}
