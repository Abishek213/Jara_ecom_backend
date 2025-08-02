import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/constants.js';
import User from '../models/User.js';
import Admin from '../models/Admin.js';
import logger from '../utils/logger.js';
import { UnauthenticatedError, UnauthorizedError } from '../utils/errors.js';

export const authenticateUser = async (req, res, next) => {
  let token;
  console.log('Auth header:', req.headers.authorization);
  console.log('Cookie token:', req.cookies?.token);

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.token) {
    token = req.cookies.token;
  }

  if (!token) {
    throw new UnauthenticatedError('Not authorized to access this route');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded Token:', decoded);
    
    let user;
    // Check for both userType (old) and user_type (new) for backward compatibility
    const role = decoded.user_type || decoded.userType;
    
    if (role === 'admin') {
      user = await Admin.findById(decoded.id).select('-password_hash');
    } else {
      user = await User.findById(decoded.id).select('-password_hash');
    }

    if (!user) {
      throw new UnauthenticatedError('User not found');
    }

    // Assign the consistent role to req.user
    req.user = user;
    req.user.user_type = role;  // Now using user_type consistently
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    throw new UnauthenticatedError('Not authorized to access this route');
  }
};

export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    console.log('AuthorizeRoles - User role:', req.user.user_type);
    console.log('AuthorizeRoles - Allowed roles:', roles);
    if (!roles.includes(req.user.user_type)) {
      return res.status(403).json({ success: false, error: `User role ${req.user.user_type} is not authorized to access this route` });
    }
    next();
  };
};
