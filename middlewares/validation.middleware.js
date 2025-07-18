import Joi from 'joi';
import { BadRequestError } from '../utils/errors.js';

// Generic Joi validator middleware
export const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { 
      abortEarly: false, // Return ALL errors (not just the first one)
      allowUnknown: false // Reject unknown fields
    });

    if (error) {
      const errorMessages = error.details.map(detail => detail.message);
      throw new BadRequestError(`Validation failed: ${errorMessages.join(', ')}`);
    }

    next();
  };
};