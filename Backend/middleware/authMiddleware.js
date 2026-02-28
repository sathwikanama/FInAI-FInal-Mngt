const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  // Read Authorization header
  const authHeader =
    req.headers.authorization ||
    req.headers.Authorization;

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: "Access token required"
    });
  }

  // Expect format: Bearer TOKEN
  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Invalid token format"
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "fallback-secret-key"
    );

    // Attach user info to request
    req.user = decoded;

    console.log("✅ Authenticated user:", decoded);

    next();

  } catch (err) {
    console.error("❌ JWT Error:", err.message);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired token"
    });
  }
};

module.exports = { authMiddleware: authenticateToken };