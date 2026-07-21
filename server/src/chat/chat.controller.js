import * as chatService from './chat.service.js';

export const getChats = async (req, res) => {
  try {
    const chats = await chatService.getUserChats(req.user.userId);
    res.json(chats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getChatDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await chatService.getChatMessages(id, req.user.userId);
    res.json(result);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

export const deleteChat = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await chatService.deleteChat(id, req.user.userId);
    res.json(result);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { chatId, content, lang } = req.body;
    if (!content) {
      return res.status(400).json({ error: 'Message content is required' });
    }
    
    // This will take over the response stream using Server-Sent Events (SSE)
    await chatService.generateAIResponseStream(
      chatId, 
      req.user.userId, 
      content, 
      lang, 
      res
    );
  } catch (error) {
    console.error('Chat generation error:', error);
    res.status(500).json({ error: 'Failed to generate response', details: error.message });
  }
};
