import jwt from 'jsonwebtoken';

// In-memory blacklist for invalidated access tokens
const tokenBlacklist = new Set();

// Clean up expired tokens every hour to prevent memory leaks
setInterval(() => {
  const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_fallback_key';
  for (const token of tokenBlacklist) {
    jwt.verify(token, JWT_SECRET, (err) => {
      if (err) {
        // Token has expired naturally, no need to track it anymore
        tokenBlacklist.delete(token);
      }
    });
  }
}, 60 * 60 * 1000);

export const blacklistToken = (token) => {
  if (token) tokenBlacklist.add(token);
};

export const verifyToken = (req, res, next) => {
  const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_fallback_key';

  // First check cookie, fallback to Authorization header
  let token = req.cookies?.access_token;

  if (!token) {
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
  }

  if (!token) {
    return res.status(403).json({ error: 'No token provided' });
  }

  if (tokenBlacklist.has(token)) {
    return res.status(401).json({ error: 'Token has been revoked' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Unauthorized!' });
    }
    
    // Attach the decoded user payload to the request
    req.user = decoded;
    next();
  });
};
