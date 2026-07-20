import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { OpenAI } from 'openai';

import * as prompts from './prompts/index.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['https://chatbot-ai-frontend-5oa3.onrender.com', 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000', 'http://localhost:3001']
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// OpenAI / Hugging Face Router Setup
const client = new OpenAI({
  baseURL: "https://router.huggingface.co/v1",
  apiKey: process.env.HF_TOKEN,
});

app.post('/api/chat', async (req, res) => {
  const { messages, type, lang } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Messages array is required' });
  }

  // Set headers for streaming (SSE)
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const requestedModel = "Qwen/Qwen2.5-Coder-32B-Instruct";
    
    // Select the appropriate prompt based on type
    let systemPrompt = prompts.baseContext;
    let finalMessages = [...messages];

    if (type && prompts[`${type}Prompt`] && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'user') {
        // Apply the specific prompt template to the last user message
        const promptFn = prompts[`${type}Prompt`];
        lastMessage.content = promptFn(lastMessage.content, lang);
        
        // Reinforce the language in the system prompt
        systemPrompt = `You are a senior AI coding assistant. You MUST provide the solution using ${lang} exclusively. Follow all instructions precisely.`;
      }
    }

    const systemMessage = {
      role: 'system',
      content: systemPrompt
    };

    const stream = await client.chat.completions.create({
      model: requestedModel,
      messages: [systemMessage, ...finalMessages],
      stream: true,
      max_tokens: 16384,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        // Express will chunk this automatically if we use write()
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('Full Error from OpenAI/HF Router:', error);
    
    const errorMessage = error.message || 'Unknown error';
    res.write(`data: ${JSON.stringify({ error: 'Failed to get response from AI', details: errorMessage })}\n\n`);
    res.end();
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});