import * as snippetService from './snippet.service.js';
import logger from '../../utils/logger.js';

export const createSnippet = async (req, res) => {
  try {
    const { messageId, title, codeContent, language } = req.body;
    if (!codeContent) {
      return res.status(400).json({ error: 'Code content is required' });
    }
    const snippet = await snippetService.saveSnippet(req.user.userId, { messageId, title, codeContent, language });
    res.status(201).json(snippet);
  } catch (error) {
    logger.error(`Create snippet error: ${error.message}`, { stack: error.stack });
    res.status(500).json({ error: 'Failed to create snippet', details: error.message });
  }
};

export const getSnippets = async (req, res) => {
  try {
    const snippets = await snippetService.getUserSnippets(req.user.userId);
    res.json(snippets);
  } catch (error) {
    logger.error(`Get snippets error: ${error.message}`, { stack: error.stack });
    res.status(500).json({ error: 'Failed to retrieve snippets', details: error.message });
  }
};

export const getSnippet = async (req, res) => {
  try {
    const snippet = await snippetService.getSnippetById(req.params.id, req.user.userId);
    res.json(snippet);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

export const updateSnippet = async (req, res) => {
  try {
    const snippet = await snippetService.updateSnippet(req.params.id, req.user.userId, req.body);
    res.json(snippet);
  } catch (error) {
    logger.error(`Update snippet error: ${error.message}`, { stack: error.stack });
    res.status(400).json({ error: error.message });
  }
};

export const deleteSnippet = async (req, res) => {
  try {
    const result = await snippetService.deleteSnippet(req.params.id, req.user.userId);
    res.json(result);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};
