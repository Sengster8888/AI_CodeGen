import express from 'express';
import * as snippetController from './snippet.controller.js';
import { verifyToken } from '../../middleware/auth.middleware.js';

const router = express.Router();

/**
 * @swagger
 * /snippets:
 *   get:
 *     summary: Get all saved snippets for the logged-in user
 *     tags: [Snippets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of saved snippets
 */
router.get('/', verifyToken, snippetController.getSnippets);

/**
 * @swagger
 * /snippets/{id}:
 *   get:
 *     summary: Get specific saved snippet
 *     tags: [Snippets]
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
 *         description: Snippet details
 */
router.get('/:id', verifyToken, snippetController.getSnippet);

/**
 * @swagger
 * /snippets:
 *   post:
 *     summary: Save a new code snippet
 *     tags: [Snippets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - codeContent
 *             properties:
 *               messageId:
 *                 type: string
 *               title:
 *                 type: string
 *               codeContent:
 *                 type: string
 *               language:
 *                 type: string
 *     responses:
 *       201:
 *         description: Snippet saved successfully
 */
router.post('/', verifyToken, snippetController.createSnippet);

/**
 * @swagger
 * /snippets/{id}:
 *   put:
 *     summary: Update a saved snippet
 *     tags: [Snippets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               codeContent:
 *                 type: string
 *               language:
 *                 type: string
 *     responses:
 *       200:
 *         description: Snippet updated
 */
router.put('/:id', verifyToken, snippetController.updateSnippet);

/**
 * @swagger
 * /snippets/{id}:
 *   delete:
 *     summary: Delete a specific saved snippet
 *     tags: [Snippets]
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
 *         description: Snippet deleted successfully
 */
router.delete('/:id', verifyToken, snippetController.deleteSnippet);

export default router;
