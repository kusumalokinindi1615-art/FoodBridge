const jwt = require('jsonwebtoken');
const User = require('../models/User');

/** Verify JWT and attach req.user; blocks unauthenticated requests */
const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: 'User no longer exists' });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Not authorized, invalid token' });
  }
};

/** Restrict route to specific roles, e.g. authorize('NGO','VOLUNTEER') */
const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: `Access denied. Allowed roles: ${roles.join(', ')}` });
  }
  next();
};

/** Allow public discovery while still authenticating requests that provide a token. */
const optionalProtect = async (req, res, next) => {
  if (!req.headers.authorization?.startsWith('Bearer')) return next();
  return protect(req, res, next);
};

module.exports = { protect, authorize, optionalProtect };
