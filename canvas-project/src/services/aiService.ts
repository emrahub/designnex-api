// AI Service for DALL-E Integration
// This service handles AI image generation using OpenAI's DALL-E API

import config from '../config/config.js';

interface AIGenerationRequest {
  prompt: string;
  size?: '256x256' | '512x512' | '1024x1024';
  n?: number; // number of images to generate (1-10)
}

interface AIGenerationResponse {
  data: Array<{
    url: string;
    revised_prompt?: string;
  }>;
}

class AIService {
  private apiKey: string;
  private baseURL: string;

  constructor() {
    // In production, this should be loaded from environment variables
    // For security, the API key should be stored in your backend and calls should be proxied
    // Vite uses import.meta.env instead of process.env
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
    
    // Set the correct backend URL based on environment
    const isDevelopment = import.meta.env.MODE === 'development';
    this.baseURL = isDevelopment ? '/api/v1/dalle' : config.production.backendUrl;
    
    if (!this.apiKey) {
      console.warn('⚠️ OpenAI API key not found. AI generation will use mock data.');
    }
  }

  async generateImage(request: AIGenerationRequest): Promise<AIGenerationResponse> {
    const { prompt, size = '512x512', n = 1 } = request;

    // If no API key, return mock data for development
    

    try {
      console.log('🤖 Generating AI image with DALL-E:', prompt);

      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: this.enhancePrompt(prompt),
          size,
          n,
          response_format: 'url'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`DALL-E API Error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ AI image generated successfully');
      
      return { data: [{ url: `data:image/png;base64,${data.photo}` }] };
    } catch (error) {
      console.error('❌ AI generation failed:', error);
      
      // Fallback to mock data if API fails
      console.log('🎭 Falling back to mock data');
      return this.getMockResponse(prompt);
    }
  }

  private enhancePrompt(prompt: string): string {
    // Enhance the user prompt for better design results
    const enhancements = [
      'high quality',
      'professional design',
      'clean background',
      'suitable for t-shirt printing',
      'vector style',
      'minimalist'
    ];
    
    // Add enhancements if the prompt is short
    if (prompt.length < 50) {
      return `${prompt}, ${enhancements.slice(0, 3).join(', ')}`;
    }
    
    return prompt;
  }

  private getMockResponse(prompt: string): AIGenerationResponse {
    // Generate mock data for development/demo purposes
    // Use a more reliable placeholder service
    const mockImageUrl = `https://placehold.co/512x512/3b82f6/ffffff?text=${encodeURIComponent(prompt.slice(0, 20).replace(/[^a-zA-Z0-9\s]/g, ''))}`;

    return {
      data: [{
        url: mockImageUrl,
        revised_prompt: `Mock AI generation for: ${prompt}`
      }]
    };
  }

  // Method to validate if AI service is properly configured
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  // Method to get service status
  getStatus(): { configured: boolean; provider: string; mock: boolean } {
    return {
      configured: this.isConfigured(),
      provider: 'OpenAI DALL-E',
      mock: !this.isConfigured()
    };
  }
}

// Export singleton instance
export const aiService = new AIService();

// Export types for use in components
export type { AIGenerationRequest, AIGenerationResponse };