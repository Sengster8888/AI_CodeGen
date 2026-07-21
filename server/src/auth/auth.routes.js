import express from 'express';
import * as authController from './auth.controller.js';
import { verifyToken } from '../../middleware/auth.middleware.js';

const router = express.Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user and send OTP to email
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: securePassword123
 *               displayName:
 *                 type: string
 *                 example: John Doe
 *     responses:
 *       200:
 *         description: Successfully initiated registration. Check email for OTP.
 *       400:
 *         description: Bad request or user already exists
 */
router.post('/register', authController.register);

/**
 * @swagger
 * /auth/verify-registration:
 *   post:
 *     summary: Verify the registration OTP sent to email
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               otp:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Successfully verified and logged in (sets HttpOnly cookies)
 *       400:
 *         description: Invalid OTP or expired
 */
router.post('/verify-registration', authController.verifyRegistration);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Log in an existing user with email and password
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: securePassword123
 *     responses:
 *       200:
 *         description: Successfully logged in (sets HttpOnly cookies)
 *       401:
 *         description: Unauthorized (Invalid credentials or not verified)
 */
router.post('/login', authController.login);

/**
 * @swagger
 * /auth/google:
 *   post:
 *     summary: Log in using a Google OAuth credential
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - credential
 *             properties:
 *               credential:
 *                 type: string
 *                 description: The ID token returned by Google
 *     responses:
 *       200:
 *         description: Successfully logged in (sets HttpOnly cookies)
 *       401:
 *         description: Invalid Google token
 */
router.post('/google', authController.googleLogin);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token using HttpOnly refresh token cookie
 *     tags: [Authentication]
 *     security: []
 *     responses:
 *       200:
 *         description: Successfully refreshed tokens
 *       401:
 *         description: Invalid or missing refresh token
 */
router.post('/refresh', authController.refreshToken);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Log out user and clear cookies
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully logged out
 *       400:
 *         description: Bad request
 */
router.post('/logout', verifyToken, authController.logout);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get the currently logged-in user's profile
 *     tags: [User Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved user profile
 *       401:
 *         description: Unauthorized
 */
router.get('/me', verifyToken, authController.getMe);

/**
 * @swagger
 * /auth/me:
 *   put:
 *     summary: Update the currently logged-in user's profile
 *     tags: [User Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               displayName:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successfully updated user profile
 *       401:
 *         description: Unauthorized
 */
router.put('/me', verifyToken, authController.updateMe);

/**
 * @swagger
 * /auth/me:
 *   delete:
 *     summary: Delete the currently logged-in user's account
 *     tags: [User Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully deleted account
 *       401:
 *         description: Unauthorized
 */
router.delete('/me', verifyToken, authController.deleteMe);

export default router;
