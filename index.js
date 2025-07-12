import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';

// Import admin functionality
import { initDB } from './database/init.js';
import adminRoutes from './routes/admin.routes.js';
import storeRoutes from './routes/store.routes.js';
import dalleRoutes from './routes/dalle.routes.js';
import { trackAPIUsage } from './middleware/admin-auth.js';

// Load environment variables
dotenv.config();

// ES module __dirname alternative
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
// Middleware
// Configure CORS allowed origins for production
const allowedOrigins = [
  'https://designnex-studio.vercel.app',
  'https://canvas-project-9vrmkghwx-emrahs-projects-cc1a353c.vercel.app',
  'https://admin.shopify.com'
];
// Enable CORS for preflight and actual requests
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Handle CORS preflight requests
app.options('*', cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400
}));

app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());

// API usage tracking middleware
app.use(trackAPIUsage);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    service: 'DesignNex API Backend'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'DesignNex API Backend',
    version: '1.0.0',
    description: 'Backend API for DesignNex Studio',
    endpoints: {
      health: '/health',
      dalle: '/api/v1/dalle',
      admin: '/admin',
      store: '/store/dashboard'
    }
  });
});

// DALL-E API routes (with multi-tenant support)
app.use('/api/v1/dalle', dalleRoutes);

// Admin routes
app.use('/api/admin', adminRoutes);

// Store routes (multi-tenant)
app.use('/api/store', storeRoutes);

// Serve admin static files
app.use('/admin', express.static(path.join(__dirname, 'views')));

// Admin login page
app.get('/admin', (req, res) => {
  res.redirect('/admin/login');
});

app.get('/admin/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'admin-login.html'));
});

app.get('/admin/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'enhanced-admin.html'));
});

// Store dashboard page
app.get('/store/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'store-dashboard.html'));
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method,
    availableEndpoints: {
      health: 'GET /health',
      root: 'GET /',
      dalle: 'POST /api/v1/dalle',
      admin: 'GET /admin',
      adminAPI: 'GET /api/admin/*',
      storeDashboard: 'GET /store/dashboard',
      storeAPI: 'GET /api/store/*'
    }
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Server Error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message || 'Something went wrong'
  });
});

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 DesignNex API Backend running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🎨 DALL-E API: http://localhost:${PORT}/api/v1/dalle`);
  console.log(`👤 Admin Panel: http://localhost:${PORT}/admin`);
  
  // Initialize database
  try {
    await initDB();
    console.log('✅ Admin panel ready');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
  }
});

export default app;