import express from 'express';
import * as dotenv from 'dotenv';
import OpenAI from 'openai';
import { dbHelpers } from '../database/init.js';

dotenv.config();

const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

router.route('/').get((req, res) => {
  res.status(200).json({ 
    message: "OpenAI 2025 Image Generation API Ready",
    status: "operational",
    models: ["gpt-image-1", "dall-e-3", "dall-e-2"],
    timestamp: new Date().toISOString()
  })
})

// Enhanced image generation with 2025 OpenAI features
router.route('/').post(async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { 
      prompt, 
      size = '1024x1024', 
      quality = 'hd',
      style = 'vivid',
      background = 'transparent',
      model_preference = 'auto'
    } = req.body;

    console.log('🎨 Image generation request:', { prompt, size, quality, style, background, model_preference });
    
    // Log request start
    await dbHelpers.logSystem(
      'info',
      `AI generation started: "${prompt.substring(0, 50)}..."`,
      '/api/v1/dalle',
      'POST',
      req.ip,
      req.get('User-Agent')
    );

    let response;
    let modelUsed;
    let enhancedPrompt;

    // Enhanced prompt for clean design generation
    enhancedPrompt = `${prompt}, clean vector style, high contrast, no background elements`;
    
    if (background === 'transparent') {
      enhancedPrompt += ', transparent background, isolated design';
    }

    // Try GPT Image first (2025 model) with Responses API
    if (model_preference === 'gpt-image' || model_preference === 'auto') {
      try {
        console.log('🚀 Attempting GPT Image generation...');
        
        // Using the new Responses API for GPT Image
        response = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Generate a high-quality image: ${enhancedPrompt}`
                }
              ]
            }
          ],
          tools: [
            {
              type: "image_generation",
              image_generation: {
                quality: quality,
                size: size,
                background: background
              }
            }
          ],
          tool_choice: { type: "function", function: { name: "image_generation" } }
        });

        // Extract image from tool call response
        const toolCall = response.choices[0].message.tool_calls?.[0];
        if (toolCall && toolCall.function.name === 'image_generation') {
          const imageData = JSON.parse(toolCall.function.arguments);
          modelUsed = 'gpt-image-1';
          console.log('✅ GPT Image generation successful');
          
          // Log successful generation
          const responseTime = Date.now() - startTime;
          await dbHelpers.logAIGeneration({
            prompt,
            modelUsed,
            responseTime,
            success: true,
            errorMessage: null,
            imageSize: size,
            quality,
            style,
            ipAddress: req.ip
          });
          
          return res.status(200).json({ 
            photo: imageData.image,
            model_used: modelUsed,
            enhanced_prompt: enhancedPrompt,
            quality: quality,
            size: size,
            api_version: "2025"
          });
        }
        
        throw new Error('GPT Image tool call failed');
        
      } catch (gptError) {
        console.log('⚠️ GPT Image failed, falling back to DALL-E 3:', gptError.message);
      }
    }

    // Fallback to DALL-E 3 with enhanced 2025 features
    try {
      console.log('🎯 Using DALL-E 3 with enhanced features...');
      
      const dalleParams = {
        model: 'dall-e-3',
        prompt: enhancedPrompt,
        n: 1,
        size: size,
        quality: quality, // 'standard' or 'hd'
        style: style, // 'vivid' or 'natural'
        response_format: 'b64_json'
      };

      response = await openai.images.generate(dalleParams);
      modelUsed = 'dall-e-3';
      
      const image = response.data[0].b64_json;
      const revisedPrompt = response.data[0].revised_prompt;
      
      console.log('✅ DALL-E 3 generation successful');
      
      // Log successful generation
      const responseTime = Date.now() - startTime;
      await dbHelpers.logAIGeneration({
        prompt,
        modelUsed,
        responseTime,
        success: true,
        errorMessage: null,
        imageSize: size,
        quality,
        style,
        ipAddress: req.ip
      });
      
      return res.status(200).json({ 
        photo: image,
        model_used: modelUsed,
        enhanced_prompt: enhancedPrompt,
        revised_prompt: revisedPrompt,
        quality: quality,
        style: style,
        size: size,
        api_version: "2025"
      });
      
    } catch (dalle3Error) {
      console.log('⚠️ DALL-E 3 failed, falling back to DALL-E 2:', dalle3Error.message);
    }

    // Final fallback to DALL-E 2 (reliable but basic)
    try {
      console.log('🔄 Final fallback to DALL-E 2...');
      
      response = await openai.images.generate({
        model: 'dall-e-2',
        prompt: enhancedPrompt.substring(0, 1000), // DALL-E 2 has shorter prompt limit
        n: 1,
        size: size === '1792x1024' ? '1024x1024' : size, // DALL-E 2 doesn't support 1792x1024
        response_format: 'b64_json'
      });

      modelUsed = 'dall-e-2';
      const image = response.data[0].b64_json;
      
      console.log('✅ DALL-E 2 fallback successful');
      
      // Log successful generation
      const responseTime = Date.now() - startTime;
      await dbHelpers.logAIGeneration({
        prompt,
        modelUsed,
        responseTime,
        success: true,
        errorMessage: null,
        imageSize: size,
        quality: 'standard',
        style,
        ipAddress: req.ip
      });
      
      return res.status(200).json({ 
        photo: image,
        model_used: modelUsed,
        enhanced_prompt: enhancedPrompt,
        quality: 'standard',
        size: size,
        api_version: "2025",
        fallback: true
      });
      
    } catch (dalle2Error) {
      console.error('❌ All models failed:', dalle2Error.message);
      throw new Error(`All image generation models failed. Last error: ${dalle2Error.message}`);
    }

  } catch (error) {
    console.error('❌ Image Generation Error:', error.response?.data || error.message);
    
    // Log failed generation
    const responseTime = Date.now() - startTime;
    await dbHelpers.logAIGeneration({
      prompt: req.body.prompt || 'unknown',
      modelUsed: 'failed',
      responseTime,
      success: false,
      errorMessage: error.message,
      imageSize: req.body.size || 'unknown',
      quality: req.body.quality || 'unknown',
      style: req.body.style || 'unknown',
      ipAddress: req.ip
    }).catch(console.error);
    
    // Log system error
    await dbHelpers.logSystem(
      'error',
      `AI generation failed: ${error.message}`,
      '/api/v1/dalle',
      'POST',
      req.ip,
      req.get('User-Agent')
    ).catch(console.error);
    
    res.status(500).json({ 
      message: error.message || "Image generation failed",
      error_type: error.code || 'unknown',
      timestamp: new Date().toISOString()
    });
  }
})

// Health check endpoint for monitoring
router.route('/health').get(async (req, res) => {
  try {
    // Test API key validity
    const testResponse = await openai.models.list();
    const availableModels = testResponse.data
      .filter(model => model.id.includes('dall-e') || model.id.includes('gpt-4'))
      .map(model => model.id);

    res.status(200).json({
      status: 'healthy',
      api_connected: true,
      available_models: availableModels,
      timestamp: new Date().toISOString(),
      version: '2025.1'
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      api_connected: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
})

export default router;
