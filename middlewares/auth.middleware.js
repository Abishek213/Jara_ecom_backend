import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/constants.js';
import User from '../models/User.js';
import Admin from '../models/Admin.js';
import logger from '../utils/logger.js';
import { UnauthenticatedError, UnauthorizedError } from '../utils/errors.js';

export const authenticateUser = async (req, res, next) => {
  let token;
  
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.token) {
    token = req.cookies.token;
  }

  if (!token) {
    throw new UnauthenticatedError('Not authorized to access this route');
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    let user;
    if (decoded.userType === 'admin') {
      user = await Admin.findById(decoded.id).select('-password_hash');
    } else {
      user = await User.findById(decoded.id).select('-password_hash');
    }

    if (!user) {
      throw new UnauthenticatedError('User not found');
    }

    req.user = user;
    req.userType = decoded.userType;
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    throw new UnauthenticatedError('Not authorized to access this route');
  }
};

export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.user_type)) {
      throw new UnauthorizedError(
        `User role ${req.user.user_type} is not authorized to access this route`
      );
    }
    next();
  };
};