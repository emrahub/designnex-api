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
      dalle: '/api/v1/dalle'
    }
  });
});

// DALL-E API endpoint
app.get('/api/v1/dalle', (req, res) => {
  res.status(200).json({ message: "DALL-E API endpoint ready - use POST method" });
});

app.post('/api/v1/dalle', async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ 
        error: 'Prompt is required',
        message: 'Please provide a prompt in the request body'
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ 
        error: 'OpenAI API key not configured',
        message: 'Server configuration error'
      });
    }

    console.log('🎨 Generating image for prompt:', prompt);

    const response = await openai.images.generate({
      model: 'dall-e-2',
      prompt: `${prompt}, clean background, high quality`,
      n: 1,
      size: '1024x1024',
      response_format: 'b64_json'
    });

    const image = response.data[0].b64_json;

    console.log('✅ Image generated successfully');

    res.status(200).json({ 
      photo: image,
      prompt: prompt,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ DALL-E API Error:', error.message);
    
    res.status(500).json({ 
      error: 'Failed to generate image',
      message: error.message || 'Something went wrong with DALL-E API',
      timestamp: new Date().toISOString()
    });
  }
});

// Admin routes
app.use('/api/admin', adminRoutes);

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
  res.sendFile(path.join(__dirname, 'views', 'admin-dashboard.html'));
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
      adminAPI: 'GET /api/admin/*'
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