const Joi = require('joi');

// Validate request body
exports.validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const messages = error.details.map(detail => detail.message);
      return res.status(400).json({ 
        message: '❌ Validation error',
        errors: messages 
      });
    }

    req.validatedBody = value;
    next();
  };
};
