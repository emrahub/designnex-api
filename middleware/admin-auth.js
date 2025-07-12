import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { dbHelpers } from '../database/init.js';

const JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'your-secret-key-change-in-production';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'; // Change in production

// Admin authentication middleware
export const requireAdmin = (req, res, next) => {
  try {
    // Check for JWT token in cookies or Authorization header
    const token = req.cookies?.admin_token || 
                 req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ 
        error: 'Authentication required',
        redirectTo: '/admin/login' 
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    
    // Log admin access
    dbHelpers.logSystem(
      'info', 
      `Admin access: ${req.method} ${req.path}`,
      req.path,
      req.method,
      req.ip,
      req.get('User-Agent')
    ).catch(console.error);

    next();
  } catch (error) {
    console.error('❌ Admin auth error:', error);
    return res.status(401).json({ 
      error: 'Invalid authentication token',
      redirectTo: '/admin/login' 
    });
  }
};

// Admin login function
export const adminLogin = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password required' });
    }

    // Simple password check (in production, use proper user management)
    if (password !== ADMIN_PASSWORD) {
      // Log failed login attempt
      await dbHelpers.logSystem(
        'warn',
        'Failed admin login attempt',
        '/admin/login',
        'POST',
        req.ip,
        req.get('User-Agent')
      );

      return res.status(401).json({ error: 'Invalid password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        admin: true, 
        ip: req.ip,
        loginTime: new Date().toISOString()
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Log successful login
    await dbHelpers.logSystem(
      'info',
      'Admin login successful',
      '/admin/login',
      'POST',
      req.ip,
      req.get('User-Agent')
    );

    // Set HTTP-only cookie
    res.cookie('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'lax'
    });

    res.json({ 
      success: true, 
      message: 'Login successful',
      redirectTo: '/admin/dashboard'
    });

  } catch (error) {
    console.error('❌ Admin login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

// Admin logout function
export const adminLogout = (req, res) => {
  try {
    // Clear the admin token cookie
    res.clearCookie('admin_token');
    
    // Log logout
    dbHelpers.logSystem(
      'info',
      'Admin logout',
      '/admin/logout',
      'POST',
      req.ip,
      req.get('User-Agent')
    ).catch(console.error);

    res.json({ 
      success: true, 
      message: 'Logged out successfully',
      redirectTo: '/admin/login'
    });

  } catch (error) {
    console.error('❌ Admin logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
};

// Middleware to track API usage
export const trackAPIUsage = (req, res, next) => {
  const startTime = Date.now();
  
  // Override res.end to capture response time and status
  const originalEnd = res.end;
  res.end = function(...args) {
    const responseTime = Date.now() - startTime;
    
    // Log API usage (async, don't block response)
    dbHelpers.logAPIUsage(
      req.path,
      req.method,
      res.statusCode,
      responseTime,
      req.ip
    ).catch(console.error);
    
    originalEnd.apply(res, args);
  };
  
  next();
};