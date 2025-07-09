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
Returns API status and version information.

### Root Info
```
GET /
```
Returns API information and available endpoints.

### DALL-E Image Generation
```
POST /api/v1/dalle
Content-Type: application/json

{
  "prompt": "mountain logo"
}
```

Response:
```json
{
  "photo": "base64_image_data",
  "prompt": "mountain logo",
  "timestamp": "2025-07-09T13:00:00.000Z"
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
3. Set environment variables in Railway dashboard:
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `PORT`: Auto-set by Railway
   - `NODE_ENV`: production
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

## API Documentation

The API serves CORS-enabled endpoints for the DesignNex Studio frontend application. All endpoints return JSON responses with appropriate HTTP status codes and error handling.