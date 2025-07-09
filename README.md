# DesignNex API Backend

Backend API for DesignNex Studio - Product Customization Platform

## Features
- DALL-E 2 API integration for AI image generation
- Express.js REST API
- CORS enabled for frontend integration
- Health check endpoint
- Error handling and logging

## Endpoints

### Health Check
```
GET /health
```

### DALL-E Image Generation
```
POST /api/v1/dalle
Content-Type: application/json

{
  "prompt": "mountain logo"
}
```

## Environment Variables
```
OPENAI_API_KEY=your_openai_api_key
PORT=3000
NODE_ENV=production
```

## Deploy to Railway
1. Create new Railway project
2. Connect this GitHub repository
3. Set environment variables in Railway dashboard
4. Deploy automatically

## Local Development
```bash
npm install
npm run dev
```

## Production
```bash
npm start
```