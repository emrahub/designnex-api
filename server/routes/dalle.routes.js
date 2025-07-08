import express from 'express';
import * as dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();

const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

router.route('/').get((req, res) => {
  res.status(200).json({ message: "Hello from DALL.E ROUTES" })
})

router.route('/').post(async (req, res) => {
  try {
    const { prompt } = req.body;

    // generate a design image without text overlay on transparent background using DALL·E 3
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: `no text, transparent background, plain design, ${prompt}`,
      n: 1,
      size: '1024x1024',
      response_format: 'b64_json'
    });

    const image = response.data[0].b64_json;

    res.status(200).json({ photo: image });
  } catch (error) {
    console.error('DALL-E API Error:', error.response?.data || error.message);
    res.status(500).json({ message: error.message || "Something went wrong with DALL-E API" })
  }
})

export default router;
