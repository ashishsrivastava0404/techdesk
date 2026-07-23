import { Router } from 'express';
import crypto from 'crypto';
import pool from '../db/index.js';
import { generateToken, generateRefreshToken } from '../middleware/auth.js';

const router = Router();

// In-memory refresh token blacklist (use Redis in production)
const refreshTokenBlacklist = new Set();

/**
 * Hash password using PBKDF2 with salt
 */
function hashPassword(password, salt = null) {
  const generatedSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, generatedSalt, 100000, 64, 'sha512').toString('hex');
  return { hash, salt: generatedSalt };
}

/**
 * Verify password against hash
 */
function verifyPassword(password, hash, salt) {
  try {
    const { hash: computedHash } = hashPassword(password, salt);
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(computedHash));
  } catch {
    return false;
  }
}

// Google OAuth Configuration Check
function isGoogleOAuthConfigured() {
  return process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET;
}

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user (customer or tech only)
 * @access  Public
 */
router.post('/register', async (req, res) => {
  const { email, password, name, role } = req.body;

  // Validation
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Email, password, and name are required' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  // Only allow customer and tech roles
  const allowedRoles = ['customer', 'tech'];
  const userRole = allowedRoles.includes(role) ? role : 'customer';

  // Admins cannot self-register
  if (userRole === 'admin') {
    return res.status(403).json({ error: 'Admin accounts cannot be self-registered' });
  }

  try {
    // Check if email already exists
    const [existingUsers] = await pool.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const { hash, salt } = hashPassword(password);

    // Create user
    const [result] = await pool.query(
      `INSERT INTO users (name, email, password_hash, password_salt, role, status) 
       VALUES (?, ?, ?, ?, ?, 'active')`,
      [name, email, hash, salt, userRole]
    );

    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
    const user = users[0];

    // Generate tokens
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    // Set httpOnly cookie for refresh token
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar_url: user.avatar_url
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Login user with email and password
 * @access  Public
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // Find user by email
    const [users] = await pool.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = users[0];

    // Verify password
    if (!user.password_hash || !user.password_salt) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isValid = verifyPassword(password, user.password_hash, user.password_salt);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check if user is suspended/banned
    if (user.status !== 'active') {
      return res.status(403).json({ 
        error: `Account is ${user.status}`,
        message: 'Please contact support'
      });
    }

    // Generate tokens
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    // Set httpOnly cookie for refresh token
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar_url: user.avatar_url
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * @route   GET /api/auth/google
 * @desc    Get Google OAuth URL for login
 * @access  Public
 */
router.get('/google', (req, res) => {
  if (!isGoogleOAuthConfigured()) {
    return res.status(503).json({ 
      error: 'Google OAuth is not configured',
      message: 'Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in environment'
    });
  }

  const redirectUri = process.env.GOOGLE_CALLBACK_URL;
  const scope = encodeURIComponent('https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile');
  
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${process.env.GOOGLE_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=code` +
    `&scope=${scope}` +
    `&access_type=offline` +
    `&prompt=consent`;

  res.json({ authUrl });
});

/**
 * @route   POST /api/auth/google/callback
 * @desc    Handle Google OAuth callback
 * @access  Public
 */
router.post('/google/callback', async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'Authorization code is required' });
  }

  if (!isGoogleOAuthConfigured()) {
    return res.status(503).json({ error: 'Google OAuth is not configured' });
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: process.env.GOOGLE_CALLBACK_URL
      })
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for tokens');
    }

    const tokens = await tokenResponse.json();

    // Get user info from Google
    const userInfoResponse = await fetch('https://oauth2.googleapis.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    });

    if (!userInfoResponse.ok) {
      throw new Error('Failed to get user info');
    }

    const googleUser = await userInfoResponse.json();

    // Find or create user (only as customer or tech)
    let [users] = await pool.query(
      'SELECT * FROM users WHERE google_id = ? OR email = ?',
      [googleUser.id, googleUser.email]
    );

    let user;
    if (users.length === 0) {
      // Create new user as customer by default
      const [result] = await pool.query(
        `INSERT INTO users (name, email, google_id, role, status) 
         VALUES (?, ?, ?, 'customer', 'active')`,
        [googleUser.name || googleUser.email.split('@')[0], googleUser.email, googleUser.id]
      );
      
      [users] = await pool.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
      user = users[0];
    } else {
      // Update existing user with Google ID if not set
      user = users[0];
      if (!user.google_id) {
        await pool.query(
          'UPDATE users SET google_id = ? WHERE id = ?',
          [googleUser.id, user.id]
        );
      }
    }

    // Check if user is suspended/banned
    if (user.status !== 'active') {
      return res.status(403).json({ 
        error: 'Account is ' + user.status,
        message: 'Please contact support'
      });
    }

    // Admins cannot login via OAuth
    if (user.role === 'admin') {
      return res.status(403).json({ 
        error: 'Admin accounts must use direct login',
        message: 'Please use email/password login'
      });
    }

    // Generate tokens
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    // Set httpOnly cookie for refresh token
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar_url: googleUser.picture || user.avatar_url
      }
    });
  } catch (error) {
    console.error('Google OAuth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token using refresh token from httpOnly cookie
 * @access  Public (but requires valid refresh token cookie)
 */
router.post('/refresh', async (req, res) => {
  // Try to get refresh token from cookie first, then from body
  let refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token is required' });
  }

  // Check if token is blacklisted
  if (refreshTokenBlacklist.has(refreshToken)) {
    return res.status(401).json({ error: 'Refresh token has been revoked' });
  }

  try {
    // Verify refresh token
    const jwt = await import('jsonwebtoken');
    const decoded = jwt.default.verify(refreshToken, process.env.JWT_SECRET);

    // Get current user
    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [decoded.id]);

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];

    if (user.status !== 'active') {
      return res.status(403).json({ error: 'Account is ' + user.status });
    }

    // Generate new access token
    const token = generateToken(user);

    res.json({ token });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Refresh token expired', expired: true });
    }
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

/**
 * @route   GET /api/auth/verify
 * @desc    Verify JWT token and return user info
 * @access  Protected (requires valid token)
 */
router.get('/verify', async (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const jwt = await import('jsonwebtoken');
    const decoded = jwt.default.verify(token, process.env.JWT_SECRET);

    // Get full user info
    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [decoded.id]);

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
  
    const user = users[0];

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar_url: user.avatar_url
      }
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired', expired: true });
    }
    res.status(401).json({ error: 'Invalid token' });
  }
});

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user and invalidate refresh token
 * @access  Protected (requires valid token)
 */
router.post('/logout', async (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    
    try {
      const jwt = await import('jsonwebtoken');
      const decoded = jwt.default.verify(token, process.env.JWT_SECRET, { ignoreExpiration: true });
      
      // Add refresh token to blacklist if present
      const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
      if (refreshToken) {
        // Calculate remaining time and set timeout
        const expiresIn = decoded.exp * 1000 - Date.now();
        if (expiresIn > 0) {
          refreshTokenBlacklist.add(refreshToken);
          setTimeout(() => refreshTokenBlacklist.delete(refreshToken), expiresIn);
        }
      }
    } catch (error) {
      // Token verification failed, but still clear cookies
    }
  }

  // Clear refresh token cookie
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });

  res.json({ message: 'Logged out successfully' });
});

/**
 * @route   POST /api/auth/change-password
 * @desc    Change user password
 * @access  Protected (requires valid token)
 */
router.post('/change-password', async (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.split(' ')[1];
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current password and new password are required' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters' });
  }

  try {
    const jwt = await import('jsonwebtoken');
    const decoded = jwt.default.verify(token, process.env.JWT_SECRET);

    // Get user
    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [decoded.id]);

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];

    // Verify current password
    if (user.password_hash && user.password_salt) {
      const isValid = verifyPassword(currentPassword, user.password_hash, user.password_salt);
      if (!isValid) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }
    }

    // Hash new password
    const { hash, salt } = hashPassword(newPassword);

    // Update password
    await pool.query(
      'UPDATE users SET password_hash = ?, password_salt = ? WHERE id = ?',
      [hash, salt, user.id]
    );

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Create first admin (only allowed when no admin exists)
router.post('/create-admin', async (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Email, password, and name are required' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  try {
    // Check if any admin exists
    const [admins] = await pool.query(
      "SELECT id FROM users WHERE role = 'admin'"
    );

    if (admins.length > 0) {
      return res.status(403).json({ error: 'Admin already exists. Contact existing admin for access.' });
    }

    // Check if email already exists
    const [existingUsers] = await pool.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const { hash, salt } = hashPassword(password);

    // Create admin user
    const [result] = await pool.query(
      `INSERT INTO users (name, email, password_hash, password_salt, role, status)
       VALUES (?, ?, ?, ?, 'admin', 'active')`,
      [name, email, hash, salt]
    );

    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
    const user = users[0];

    // Generate tokens
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    // Set httpOnly cookie for refresh token
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(201).json({
      message: 'Admin created successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({ error: 'Failed to create admin' });
  }
});

export default router;
