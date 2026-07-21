import OpenAI from 'openai';
import db from '../../models/index.cjs';

const { Chat, Message } = db;

// High-quality open-source coding model
const AI_MODEL = 'meta-llama/Meta-Llama-3-8B-Instruct';

const getAIClient = () => {
  const hfToken = process.env.HF_TOKEN;
  if (!hfToken) {
    throw new Error('HF_TOKEN is not configured in the environment');
  }
  return new OpenAI({
    baseURL: 'https://api-inference.huggingface.co/v1/',
    apiKey: hfToken,
  });
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

export const generateAIResponseStream = async (chatId, userId, content, lang, res) => {
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

  const messages = [
    { role: 'system', content: `You are an expert AI programming assistant. You write clean, efficient, and well-documented code in ${lang || 'any language'}.` }
  ];

  history.forEach(msg => {
    messages.push({ role: msg.role, content: msg.content });
  });

  const aiClient = getAIClient();
  const stream = await aiClient.chat.completions.create({
    model: AI_MODEL,
    messages: messages,
    stream: true,
    max_tokens: 2048,
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
      const delta = chunk.choices[0]?.delta?.content || '';
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
