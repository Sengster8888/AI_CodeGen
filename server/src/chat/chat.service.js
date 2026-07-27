import { GoogleGenAI } from '@google/genai';
import db from '../../models/index.cjs';

const { Chat, Message } = db;

const getAIClient = (customApiKey) => {
  const apiKey = customApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error('GEMINI_API_KEY is not configured in the environment');
  }
  return new GoogleGenAI({ apiKey });
};

export const createChat = async (userId, title, lang) => {
  return await Chat.create({
    user_id: userId,
    title: title || 'New Chat',
    current_language: lang || 'Python',
  });
};

export const getUserChats = async (userId) => {
  return await Chat.findAll({
    where: { user_id: userId },
    order: [['createdAt', 'DESC']],
  });
};

export const getChatMessages = async (chatId, userId) => {
  const chat = await Chat.findOne({ where: { id: chatId, user_id: userId } });
  if (!chat) throw new Error('Chat not found or unauthorized');

  const messages = await Message.findAll({
    where: { chat_id: chatId },
    order: [['createdAt', 'ASC']],
  });

  return { chat, messages };
};

export const deleteChat = async (chatId, userId) => {
  const chat = await Chat.findOne({ where: { id: chatId, user_id: userId } });
  if (!chat) throw new Error('Chat not found');
  await chat.destroy();
  return { message: 'Chat deleted' };
};

export const updateChat = async (chatId, userId, title) => {
  const chat = await Chat.findOne({ where: { id: chatId, user_id: userId } });
  if (!chat) throw new Error('Chat not found');
  if (title) chat.title = title;
  await chat.save();
  return chat;
};

export const generateAIResponseStream = async (chatId, userId, content, lang, res, customApiKey) => {
  if (!customApiKey) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const userChats = await Chat.findAll({ where: { user_id: userId }, attributes: ['id'] });
    const chatIds = userChats.map(c => c.id);
    
    if (chatIds.length > 0) {
      const messageCount = await Message.count({
        where: {
          chat_id: { [db.Sequelize.Op.in]: chatIds },
          role: 'user',
          createdAt: { [db.Sequelize.Op.gte]: today }
        }
      });
      
      if (messageCount >= 4) {
        throw new Error('LIMIT_REACHED');
      }
    }
  }

  let chat;
  let isNewChat = false;

  if (!chatId) {
    // Generate title from first 30 chars
    const title = content.length > 30 ? content.substring(0, 30) + '...' : content;
    chat = await createChat(userId, title, lang);
    chatId = chat.id;
    isNewChat = true;
  } else {
    chat = await Chat.findOne({ where: { id: chatId, user_id: userId } });
    if (!chat) throw new Error('Chat not found');
  }

  // Save user message
  await Message.create({
    chat_id: chatId,
    role: 'user',
    content: content,
  });

  // Prepare history for context
  const history = await Message.findAll({
    where: { chat_id: chatId },
    order: [['createdAt', 'ASC']],
  });

  // Convert history to Gemini format
  const geminiHistory = history.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }]
  }));
  const systemInstruction = `You are an expert AI programming assistant. You write clean, efficient, and well-documented code in ${lang || 'any language'}. ALWAYS wrap your code in standard markdown code blocks (e.g. \`\`\`${lang.toLowerCase()}\n...\n\`\`\`). Provide a brief explanation of the code outside the code block.`;

  const aiClient = getAIClient(customApiKey);
  
  // Create the stream using the new Google Gen AI SDK
  const stream = await aiClient.models.generateContentStream({
    model: 'gemini-3.5-flash',
    contents: [
      ...geminiHistory,
      { role: 'user', parts: [{ text: content }] }
    ],
    config: {
      systemInstruction,
    }
  });

  // Set SSE Headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Send metadata (chat ID if new)
  if (isNewChat) {
    res.write(`data: ${JSON.stringify({ meta: { chatId } })}\n\n`);
  }

  let fullResponse = '';

  try {
    for await (const chunk of stream) {
      const delta = chunk.text || '';
      if (delta) {
        fullResponse += delta;
        res.write(`data: ${JSON.stringify({ content: delta })}\n\n`);
      }
    }

    // Save AI response to DB
    await Message.create({
      chat_id: chatId,
      role: 'assistant',
      content: fullResponse,
    });

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    console.error('Streaming error:', err);
    res.write(`data: ${JSON.stringify({ error: 'AI Streaming failed' })}\n\n`);
    res.end();
  }
};
