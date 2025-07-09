import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';

// Load environment variables
dotenv.config();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
// Middleware
// Configure CORS allowed origins via environment variable for flexibility
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
  'https://designnex-studio.vercel.app',
  'https://canvas-project-emrahub-emrahs-projects-cc1a353c.vercel.app',
  'https://canvas-project-umber.vercel.app',
  'https://canvas-project-c8hufcuqt-emrahs-projects-cc1a353c.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000'
];
// Enable CORS for preflight and actual requests
app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400
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
      prompt: `A T-shirt logo design: ${prompt}, clean background, suitable for printing`,
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

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method,
    availableEndpoints: {
      health: 'GET /health',
      root: 'GET /',
      dalle: 'POST /api/v1/dalle'
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
app.listen(PORT, () => {
  console.log(`🚀 DesignNex API Backend running on port ${PORT}`);
  console.log('🔗 Health check: http://localhost:${PORT}/health');
  console.log('🎨 DALL-E API: http://localhost:${PORT}/api/v1/dalle');
});

export default app;