import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import authRoutes from './src/auth/auth.routes.js';
import { setupSwagger } from './swagger.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['https://chatbot-ai-frontend-5oa3.onrender.com', 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000', 'http://localhost:3001'],
  credentials: true // Important for cookies
}));
app.use(express.json());
app.use(cookieParser());

// Setup Swagger Docs (available at http://localhost:3001/api-docs)
setupSwagger(app);

// Health check
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// API Routes
app.use('/api/v1/auth', authRoutes);

// We removed the chat routes temporarily to focus exclusively on Auth

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
  console.log(`Swagger Docs available at http://localhost:${port}/api-docs`);
});