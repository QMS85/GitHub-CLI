/**
 * Input Validators for the E-commerce API
 * Centralized validation functions for data integrity
 */

const Joi = require('joi');

/**
 * EMAIL VALIDATION
 * Validates email format
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * PHONE VALIDATION
 * Validates international phone format
 */
const isValidPhone = (phone) => {
  // Accepts formats like: +1234567890, (123) 456-7890, 123-456-7890
  const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

/**
 * STRONG PASSWORD VALIDATION
 * Password must have:
 * - Minimum 8 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 number
 * - At least 1 special character
 */
const isStrongPassword = (password) => {
  const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return strongPasswordRegex.test(password);
};

/**
 * ZIP CODE VALIDATION
 * Validates US zip code (5 or 9 digit format)
 */
const isValidZipCode = (zipCode) => {
  const zipRegex = /^\d{5}(-\d{4})?$/;
  return zipRegex.test(zipCode);
};

/**
 * URL VALIDATION
 * Validates if string is a valid URL
 */
const isValidURL = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * MONGOOSE OBJECT ID VALIDATION
 * Validates if string is valid MongoDB ObjectID
 */
const isValidObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

/**
 * SANITIZE STRING
 * Removes leading/trailing whitespace and converts to lowercase
 */
const sanitizeString = (str) => {
  return str.trim().toLowerCase();
};

/**
 * SANITIZE EMAIL
 * Removes whitespace and converts to lowercase
 */
const sanitizeEmail = (email) => {
  return email.trim().toLowerCase();
};

/**
 * VALIDATION SCHEMAS using Joi
 */

// User Registration Schema
const userRegistrationSchema = Joi.object({
  name: Joi.string()
    .min(3)
    .max(50)
    .required()
    .messages({
      'string.empty': 'Name is required',
      'string.min': 'Name must be at least 3 characters',
      'string.max': 'Name cannot exceed 50 characters'
    }),
  
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'string.empty': 'Email is required'
    }),
  
  password: Joi.string()
    .min(6)
    .required()
    .messages({
      'string.min': 'Password must be at least 6 characters',
      'string.empty': 'Password is required'
    }),
  
  phone: Joi.string()
    .optional()
    .messages({
      'string.pattern.base': 'Please provide a valid phone number'
    })
});

// User Login Schema
const userLoginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'string.empty': 'Email is required'
    }),
  
  password: Joi.string()
    .required()
    .messages({
      'string.empty': 'Password is required'
    })
});

// Product Creation Schema
const productSchema = Joi.object({
  name: Joi.string()
    .min(3)
    .max(100)
    .required()
    .messages({
      'string.empty': 'Product name is required',
      'string.min': 'Name must be at least 3 characters',
      'string.max': 'Name cannot exceed 100 characters'
    }),
  
  description: Joi.string()
    .min(10)
    .max(1000)
    .required()
    .messages({
      'string.empty': 'Description is required',
      'string.min': 'Description must be at least 10 characters'
    }),
  
  price: Joi.number()
    .positive()
    .required()
    .messages({
      'number.base': 'Price must be a number',
      'number.positive': 'Price must be greater than 0',
      'any.required': 'Price is required'
    }),
  
  category: Joi.string()
    .valid('Electronics', 'Clothing', 'Books', 'Food', 'Home', 'Sports', 'Other')
    .required()
    .messages({
      'any.only': 'Invalid category selected',
      'string.empty': 'Category is required'
    }),
  
  stock: Joi.number()
    .integer()
    .min(0)
    .required()
    .messages({
      'number.base': 'Stock must be a number',
      'number.min': 'Stock cannot be negative',
      'any.required': 'Stock is required'
    }),
  
  image: Joi.string()
    .uri()
    .optional()
    .messages({
      'string.uri': 'Image must be a valid URL'
    })
});

// Cart Item Schema
const cartItemSchema = Joi.object({
  productId: Joi.string()
    .required()
    .messages({
      'string.empty': 'Product ID is required'
    }),
  
  quantity: Joi.number()
    .integer()
    .min(1)
    .required()
    .messages({
      'number.base': 'Quantity must be a number',
      'number.min': 'Quantity must be at least 1',
      'any.required': 'Quantity is required'
    })
});

// Order Creation Schema
const orderSchema = Joi.object({
  shippingAddress: Joi.object({
    street: Joi.string().required().messages({
      'string.empty': 'Street address is required'
    }),
    city: Joi.string().required().messages({
      'string.empty': 'City is required'
    }),
    state: Joi.string().required().messages({
      'string.empty': 'State is required'
    }),
    zipCode: Joi.string().required().messages({
      'string.empty': 'Zip code is required'
    }),
    country: Joi.string().required().messages({
      'string.empty': 'Country is required'
    })
  }).required(),
  
  paymentMethod: Joi.string()
    .valid('credit_card', 'debit_card', 'paypal', 'stripe')
    .required()
    .messages({
      'any.only': 'Invalid payment method',
      'string.empty': 'Payment method is required'
    })
});

// Review Creation Schema
const reviewSchema = Joi.object({
  productId: Joi.string()
    .required()
    .messages({
      'string.empty': 'Product ID is required'
    }),
  
  rating: Joi.number()
    .integer()
    .min(1)
    .max(5)
    .required()
    .messages({
      'number.base': 'Rating must be a number',
      'number.min': 'Rating must be at least 1',
      'number.max': 'Rating cannot exceed 5',
      'any.required': 'Rating is required'
    }),
  
  title: Joi.string()
    .min(5)
    .max(100)
    .required()
    .messages({
      'string.empty': 'Review title is required',
      'string.min': 'Title must be at least 5 characters',
      'string.max': 'Title cannot exceed 100 characters'
    }),
  
  comment: Joi.string()
    .min(10)
    .max(1000)
    .required()
    .messages({
      'string.empty': 'Review comment is required',
      'string.min': 'Comment must be at least 10 characters',
      'string.max': 'Comment cannot exceed 1000 characters'
    })
});

// Update Profile Schema
const updateProfileSchema = Joi.object({
  name: Joi.string()
    .min(3)
    .max(50)
    .optional(),
  
  phone: Joi.string()
    .optional(),
  
  address: Joi.object({
    street: Joi.string().optional(),
    city: Joi.string().optional(),
    state: Joi.string().optional(),
    zipCode: Joi.string().optional(),
    country: Joi.string().optional()
  }).optional()
});

/**
 * Validation function with custom error handling
 * @param {Object} data - Data to validate
 * @param {Object} schema - Joi schema to validate against
 * @returns {Object} { isValid, errors }
 */
const validate = (data, schema) => {
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    const errors = error.details.reduce((acc, err) => {
      acc[err.path[0]] = err.message;
      return acc;
    }, {});

    return {
      isValid: false,
      errors
    };
  }

  return {
    isValid: true,
    value
  };
};

module.exports = {
  // String validators
  isValidEmail,
  isValidPhone,
  isStrongPassword,
  isValidZipCode,
  isValidURL,
  isValidObjectId,

  // String sanitizers
  sanitizeString,
  sanitizeEmail,

  // Joi schemas
  userRegistrationSchema,
  userLoginSchema,
  productSchema,
  cartItemSchema,
  orderSchema,
  reviewSchema,
  updateProfileSchema,

  // Validation function
  validate
};
