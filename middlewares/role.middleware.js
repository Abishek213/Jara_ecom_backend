import { UnauthorizedError  } from '../utils/errors.js';

export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.user_type)) {
      throw new UnauthorizedError('You do not have permission to perform this action');
    }
    next();
  };
};