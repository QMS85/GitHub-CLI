const jwt = require('jsonwebtoken');

// Verify JWT Token
exports.verifyToken = (req, res, next) => {
  // Get token from header
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: '❌ No token provided. Access denied.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: '❌ Invalid or expired token' });
  }
};

// Check if user is admin
exports.isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: '❌ Only admins can access this resource' });
  }
  next();
};

// Check if user is owner or admin
exports.isOwnerOrAdmin = (req, res, next) => {
  if (req.user.id !== req.params.userId && req.user.role !== 'admin') {
    return res.status(403).json({ message: '❌ You do not have permission to access this resource' });
  }
  next();
};