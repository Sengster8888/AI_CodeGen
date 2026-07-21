import jwt from 'jsonwebtoken';

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

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Unauthorized!' });
    }
    
    // Attach the decoded user payload to the request
    req.user = decoded;
    next();
  });
};
