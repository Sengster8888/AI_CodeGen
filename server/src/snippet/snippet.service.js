import db from '../../models/index.cjs';

const { SavedSnippet } = db;

export const saveSnippet = async (userId, data) => {
  return await SavedSnippet.create({
    user_id: userId,
    message_id: data.messageId || null,
    title: data.title || 'Untitled Snippet',
    code_content: data.codeContent,
    language: data.language || 'text'
  });
};

export const getUserSnippets = async (userId) => {
  return await SavedSnippet.findAll({
    where: { user_id: userId },
    order: [['createdAt', 'DESC']]
  });
};

export const getSnippetById = async (snippetId, userId) => {
  const snippet = await SavedSnippet.findOne({
    where: { id: snippetId, user_id: userId }
  });
  if (!snippet) throw new Error('Snippet not found');
  return snippet;
};

export const updateSnippet = async (snippetId, userId, updateData) => {
  const snippet = await SavedSnippet.findOne({
    where: { id: snippetId, user_id: userId }
  });
  if (!snippet) throw new Error('Snippet not found');

  if (updateData.title) snippet.title = updateData.title;
  if (updateData.codeContent) snippet.code_content = updateData.codeContent;
  if (updateData.language) snippet.language = updateData.language;

  await snippet.save();
  return snippet;
};

export const deleteSnippet = async (snippetId, userId) => {
  const snippet = await SavedSnippet.findOne({
    where: { id: snippetId, user_id: userId }
  });
  if (!snippet) throw new Error('Snippet not found');
  
  await snippet.destroy();
  return { message: 'Snippet deleted successfully' };
};
