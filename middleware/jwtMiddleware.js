const jwt = require('jsonwebtoken');
const JWT_SECRET = "mysecuredocs_secretkey"; // Must match token generation

function jwtMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ msg: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = { userId: decoded.userId }; // Make user ID available in request
    next();
  } catch (err) {
    console.error('JWT error:', err.message);
    return res.status(403).json({ msg: 'Invalid token' });
  }
}

module.exports = jwtMiddleware;
