const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers['Authorization'];
  
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: "Access token required"
    });
  }

  const token = authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Invalid token format"
    });
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');

  req.user = decoded;

  console.log("JWT USER:", decoded);

  next();
};

module.exports = { authMiddleware: authenticateToken };
