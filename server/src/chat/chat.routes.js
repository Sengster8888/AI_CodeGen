import express from 'express';
import * as chatController from './chat.controller.js';
import { verifyToken } from '../../middleware/auth.middleware.js';

const router = express.Router();

/**
 * @swagger
 * /chats:
 *   get:
 *     summary: Get all chats for the logged-in user
 *     tags: [Chats]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of chats
 */
router.get('/', verifyToken, chatController.getChats);

/**
 * @swagger
 * /chats/{id}:
 *   get:
 *     summary: Get specific chat and its messages
 *     tags: [Chats]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Chat details and messages
 */
router.get('/:id', verifyToken, chatController.getChatDetails);

/**
 * @swagger
 * /chats/{id}:
 *   delete:
 *     summary: Delete a specific chat
 *     tags: [Chats]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Chat deleted successfully
 */
router.delete('/:id', verifyToken, chatController.deleteChat);

/**
 * @swagger
 * /chats:
 *   post:
 *     summary: Send a message to the AI and receive a streamed response
 *     tags: [Chats]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               chatId:
 *                 type: string
 *                 description: ID of existing chat, or omit to create new
 *               content:
 *                 type: string
 *                 description: User prompt
 *               lang:
 *                 type: string
 *                 description: Target programming language
 *     responses:
 *       200:
 *         description: SSE Stream of AI response
 */
router.post('/', verifyToken, chatController.sendMessage);

export default router;
