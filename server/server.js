import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './src/auth/auth.routes.js';
import chatRoutes from './src/chat/chat.routes.js';
import snippetRoutes from './src/snippet/snippet.routes.js';
import { setupSwagger } from './swagger.js';
import logger from './utils/logger.js';



const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000', 'http://localhost:3001'],
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
app.use('/api/v1/chats', chatRoutes);
app.use('/api/v1/snippets', snippetRoutes);

app.listen(port, () => {
  logger.info(`Server running on http://localhost:${port}`);
  logger.info(`Swagger Docs available at http://localhost:${port}/api-docs`);
});