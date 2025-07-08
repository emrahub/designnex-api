import express from 'express';
import * as dotenv from 'dotenv';
import cors from 'cors';

import dalleRoutes from './routes/dalle.routes.js';

// Load environment variables from .env file
dotenv.config();

// Ensure OpenAI API key is provided
if (!process.env.OPENAI_API_KEY) {
  console.error(
    "Error: OPENAI_API_KEY is missing. Please set your OpenAI API key in the server/.env file."
  );
  process.exit(1);
}

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }))

app.use("/api/v1/dalle", dalleRoutes);

app.get('/', (req, res) => {
  res.status(200).json({ message: "Hello from DALL.E" })
})

app.listen(8080, () => console.log('Server has started on port 8080'))
