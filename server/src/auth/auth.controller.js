import * as authService from './auth.service.js';
import logger from '../../utils/logger.js';
import { blacklistToken } from '../../middleware/auth.middleware.js';

const setTokenCookies = (res, accessToken, refreshToken) => {
  res.cookie('access_token', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000 // 15 minutes
  });

  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
};

export const register = async (req, res) => {
  try {
    const { email, password, displayName } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const result = await authService.register(email, password, displayName);
    res.status(200).json(result);
  } catch (error) {
    logger.error(`Registration error: ${error.message}`, { stack: error.stack });
    res.status(400).json({ error: error.message || 'Registration failed' });
  }
};

export const verifyRegistration = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }
    const result = await authService.verifyRegistration(email, otp);
    setTokenCookies(res, result.accessToken, result.refreshToken);
    res.status(200).json({ message: 'Verified and logged in', user: result.user, accessToken: result.accessToken });
  } catch (error) {
    logger.error(`Verification error: ${error.message}`, { stack: error.stack });
    res.status(400).json({ error: error.message || 'Verification failed' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const result = await authService.login(email, password);
    setTokenCookies(res, result.accessToken, result.refreshToken);
    res.json({ message: 'Logged in successfully', user: result.user, accessToken: result.accessToken });
  } catch (error) {
    logger.error(`Login error: ${error.message}`, { stack: error.stack });
    res.status(401).json({ error: error.message || 'Login failed' });
  }
};

export const googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ error: 'Google credential is required' });
    }
    const result = await authService.googleLogin(credential);
    setTokenCookies(res, result.accessToken, result.refreshToken);
    res.json({ message: 'Logged in successfully', user: result.user, accessToken: result.accessToken });
  } catch (error) {
    logger.error(`Google login error: ${error.message}`, { stack: error.stack });
    res.status(401).json({ error: error.message || 'Google login failed' });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const token = req.cookies?.refresh_token;
    if (!token) return res.status(401).json({ error: 'No refresh token provided' });
    const result = await authService.refreshTokens(token);
    setTokenCookies(res, result.accessToken, result.refreshToken);
    res.json({ message: 'Token refreshed', user: result.user, accessToken: result.accessToken });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
};

export const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refresh_token;
    if (refreshToken) {
      await authService.logout(req.user.userId);
    }
    
    let accessToken = req.cookies?.access_token;
    if (!accessToken) {
      const authHeader = req.headers['authorization'];
      if (authHeader && authHeader.startsWith('Bearer ')) {
        accessToken = authHeader.split(' ')[1];
      }
    }
    if (accessToken) {
      blacklistToken(accessToken);
    }

    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    const result = await authService.forgotPassword(email);
    res.json(result);
  } catch (error) {
    logger.error(`Forgot password error: ${error.message}`, { stack: error.stack });
    res.status(400).json({ error: error.message });
  }
};

export const verifyResetOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }
    const result = await authService.verifyResetOtp(email, otp);
    res.json(result);
  } catch (error) {
    logger.error(`Verify reset OTP error: ${error.message}`, { stack: error.stack });
    res.status(400).json({ error: error.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: 'Email, OTP, and new password are required' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }
    const result = await authService.resetPassword(email, otp, newPassword);
    res.json(result);
  } catch (error) {
    logger.error(`Reset password error: ${error.message}`, { stack: error.stack });
    res.status(400).json({ error: error.message });
  }
};

export const getMe = async (req, res) => {
  try {
    const result = await authService.getMe(req.user.userId);
    res.json(result);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

export const updateMe = async (req, res) => {
  try {
    const result = await authService.updateMe(req.user.userId, req.body);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteMe = async (req, res) => {
  try {
    const result = await authService.deleteMe(req.user.userId);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
