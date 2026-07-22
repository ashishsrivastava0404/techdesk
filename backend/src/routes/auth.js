import { Router } from 'express';
import pool from '../db/index.js';
import { generateToken } from '../middleware/auth.js';

const router = Router();

// Google OAuth Configuration Check
function isGoogleOAuthConfigured() {
  return process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET;
}

/**
 * Get Google OAuth URL for login
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
 * Google OAuth Callback
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
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    });

    if (!userInfoResponse.ok) {
      throw new Error('Failed to get user info');
    }

    const googleUser = await userInfoResponse.json();

    // Find or create user
    let [users] = await pool.query(
      'SELECT * FROM users WHERE google_id = ? OR email = ?',
      [googleUser.id, googleUser.email]
    );

    let user;
    if (users.length === 0) {
      // Create new user
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

    // Generate JWT
    const token = generateToken(user);

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar_url: googleUser.picture
      }
    });
  } catch (error) {
    console.error('Google OAuth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

/**
 * Refresh JWT token
 */
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token is required' });
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

    // Generate new tokens
    const token = generateToken(user);

    res.json({ token });
  } catch (error) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

/**
 * Verify token endpoint
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
 * Logout (client-side token removal, server can add to blacklist if needed)
 */
router.post('/logout', (req, res) => {
  // For JWT, logout is typically handled client-side
  // If using session or token blacklist, implement here
  res.json({ message: 'Logged out successfully' });
});

export default router;
