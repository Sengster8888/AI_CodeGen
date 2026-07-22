import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import db from '../../models/index.cjs';
import { sendOTPEmail } from '../../services/email.service.js';

const { User } = db;

// In-memory store for pending registrations to avoid inserting into DB until verified
const pendingUsers = new Map();

// We fetch these inside the functions to ensure dotenv has fully loaded in server.js
const getEnv = () => ({
  JWT_SECRET: process.env.JWT_SECRET || 'super_secret_fallback_key',
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET || 'super_secret_refresh_key',
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID'
});

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const generateTokens = async (user) => {
  const { JWT_SECRET, REFRESH_TOKEN_SECRET } = getEnv();

  const accessToken = jwt.sign(
    { userId: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { userId: user.id },
    REFRESH_TOKEN_SECRET,
    { expiresIn: '7d' }
  );

  user.refresh_token = refreshToken;
  await user.save();

  return { accessToken, refreshToken };
};

export const register = async (email, password, displayName) => {
  const user = await User.findOne({ where: { email } });
  if (user) {
    throw new Error('User with this email already exists');
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);
  const otpCode = generateOTP();
  const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); 

  pendingUsers.set(email, {
    email,
    passwordHash,
    displayName: displayName || email.split('@')[0],
    otpCode,
    otpExpiresAt
  });

  await sendOTPEmail(email, otpCode);

  return { message: 'Registration initiated. Please check your email for the OTP.' };
};

export const verifyRegistration = async (email, otp) => {
  const pendingUser = pendingUsers.get(email);
  
  if (!pendingUser) {
    // Fallback for older registrations that might be in the DB
    const dbUser = await User.findOne({ where: { email } });
    if (!dbUser) throw new Error('No pending registration found for this email');
    if (dbUser.is_verified) throw new Error('User is already verified');
    if (dbUser.otp_code !== otp) throw new Error('Invalid OTP');
    if (new Date() > new Date(dbUser.otp_expires_at)) throw new Error('OTP has expired. Please register again.');

    dbUser.is_verified = true;
    dbUser.otp_code = null;
    dbUser.otp_expires_at = null;
    await dbUser.save();

    const tokens = await generateTokens(dbUser);
    return { ...tokens, user: { id: dbUser.id, email: dbUser.email, display_name: dbUser.display_name } };
  }

  // Handle new in-memory pending users
  if (pendingUser.otpCode !== otp) throw new Error('Invalid OTP');
  if (new Date() > new Date(pendingUser.otpExpiresAt)) {
    pendingUsers.delete(email);
    throw new Error('OTP has expired. Please register again.');
  }

  // Insert into database now!
  const user = await User.create({
    email: pendingUser.email,
    password_hash: pendingUser.passwordHash,
    display_name: pendingUser.displayName,
    plan_type: 'free',
    is_verified: true,
  });

  pendingUsers.delete(email);

  const tokens = await generateTokens(user);
  return { ...tokens, user: { id: user.id, email: user.email, display_name: user.display_name } };
};

export const login = async (email, password) => {
  const user = await User.findOne({ where: { email } });
  if (!user) throw new Error('Invalid email or password');
  if (!user.is_verified) throw new Error('Please verify your email address first');
  if (!user.password_hash) throw new Error('Please login with Google for this account');

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) throw new Error('Invalid email or password');

  const tokens = await generateTokens(user);
  return { ...tokens, user: { id: user.id, email: user.email, display_name: user.display_name } };
};

export const googleLogin = async (token) => {
  try {
    let email, name;
    
    // JWTs have 3 parts separated by dots
    if (token.split('.').length === 3) {
      const { GOOGLE_CLIENT_ID } = getEnv();
      const client = new OAuth2Client(GOOGLE_CLIENT_ID);
      
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: GOOGLE_CLIENT_ID
      });
      const payload = ticket.getPayload();
      email = payload.email;
      name = payload.name;
    } else {
      // It's an access token from useGoogleLogin
      const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch Google user info');
      const payload = await response.json();
      email = payload.email;
      name = payload.name;
    }

    let user = await User.findOne({ where: { email } });
    if (!user) {
      user = await User.create({
        email,
        display_name: name,
        plan_type: 'free',
        is_verified: true
      });
    }

    const tokens = await generateTokens(user);
    return { ...tokens, user: { id: user.id, email: user.email, display_name: user.display_name } };
  } catch (error) {
    console.error('Google verification error:', error);
    throw new Error('Invalid Google token');
  }
};

export const refreshTokens = async (refreshToken) => {
  if (!refreshToken) throw new Error('No refresh token provided');

  const { REFRESH_TOKEN_SECRET } = getEnv();
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
  } catch (err) {
    throw new Error('Invalid or expired refresh token');
  }

  const user = await User.findByPk(decoded.userId);
  if (!user || user.refresh_token !== refreshToken) {
    throw new Error('Invalid refresh token');
  }

  const tokens = await generateTokens(user);
  return { ...tokens, user: { id: user.id, email: user.email, display_name: user.display_name } };
};

export const logout = async (userId) => {
  const user = await User.findByPk(userId);
  if (user) {
    user.refresh_token = null;
    await user.save();
  }
};

// --- New CRUD Operations ---

export const forgotPassword = async (email) => {
  const user = await User.findOne({ where: { email } });
  if (!user) {
    throw new Error('User with this email does not exist.');
  }

  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  user.otp_code = otp;
  user.otp_expires_at = expiresAt;
  await user.save();

  await sendOTPEmail(email, otp);
  return { message: 'Password reset code sent to email.' };
};

export const verifyResetOtp = async (email, otp) => {
  const user = await User.findOne({ where: { email } });
  if (!user) throw new Error('User not found.');

  if (user.otp_code !== otp) {
    throw new Error('Invalid OTP code.');
  }
  
  if (!user.otp_expires_at || new Date() > new Date(user.otp_expires_at)) {
    throw new Error('OTP has expired. Please request a new one.');
  }

  return { message: 'OTP verified successfully.' };
};

export const resetPassword = async (email, otp, newPassword) => {
  const user = await User.findOne({ where: { email } });
  if (!user) throw new Error('User not found.');

  if (user.otp_code !== otp) {
    throw new Error('Invalid OTP code.');
  }
  
  if (!user.otp_expires_at || new Date() > new Date(user.otp_expires_at)) {
    throw new Error('OTP has expired. Please request a new one.');
  }

  const salt = await bcrypt.genSalt(10);
  user.password_hash = await bcrypt.hash(newPassword, salt);
  user.otp_code = null;
  user.otp_expires_at = null;
  await user.save();

  return { message: 'Password has been reset successfully.' };
};

export const getMe = async (userId) => {
  const user = await User.findByPk(userId, { attributes: { exclude: ['password_hash'] } });
  if (!user) throw new Error('User not found');
  return user;
};

export const updateMe = async (userId, updateData) => {
  const user = await User.findByPk(userId);
  if (!user) throw new Error('User not found');
  
  if (updateData.displayName) {
    user.display_name = updateData.displayName;
  }
  
  if (updateData.password) {
    const salt = await bcrypt.genSalt(10);
    user.password_hash = await bcrypt.hash(updateData.password, salt);
  }
  
  await user.save();
  return { id: user.id, email: user.email, display_name: user.display_name };
};

export const deleteMe = async (userId) => {
  const user = await User.findByPk(userId);
  if (!user) throw new Error('User not found');
  
  user.email = `${user.email}.delete.${user.id}`;
  user.display_name = 'delete_name';
  user.password_hash = 'deleted';
  await user.save();

  await user.destroy();
  return { message: 'User deleted and anonymized successfully' };
};
