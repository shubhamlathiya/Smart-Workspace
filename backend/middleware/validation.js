const { body, param, query, validationResult } = require('express-validator');

// Validation result handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

// User validation rules
const validateUserRegistration = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  handleValidationErrors
];

const validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

// Workspace validation rules
const validateWorkspace = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Workspace name must be between 2 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  handleValidationErrors
];

const validateWorkspaceId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid workspace ID'),
  handleValidationErrors
];

// Project validation rules
const validateProject = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Project name must be between 2 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  body('workspace')
    .isMongoId()
    .withMessage('Invalid workspace ID'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Priority must be low, medium, or high'),
  handleValidationErrors
];

const validateProjectId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid project ID'),
  handleValidationErrors
];

// Task validation rules
const validateTask = [
  body('title')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Task title must be between 2 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  body('project')
    .isMongoId()
    .withMessage('Invalid project ID'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Priority must be low, medium, or high'),
  body('status')
    .optional()
    .isIn(['todo', 'in-progress', 'review', 'done'])
    .withMessage('Status must be todo, in-progress, review, or done'),
  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Due date must be a valid date'),
  handleValidationErrors
];

const validateTaskId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid task ID'),
  handleValidationErrors
];

// Comment validation rules
const validateComment = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Comment must be between 1 and 1000 characters'),
  handleValidationErrors
];

// Pagination validation
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  handleValidationErrors
];

// File upload validation
const validateFileUpload = [
  body('file')
    .custom((value, { req }) => {
      if (!req.file) {
        throw new Error('No file uploaded');
      }
      return true;
    }),
  handleValidationErrors
];

// Search validation
const validateSearch = [
  query('q')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters'),
  handleValidationErrors
];

module.exports = {
  validateUserRegistration,
  validateUserLogin,
  validateWorkspace,
  validateWorkspaceId,
  validateProject,
  validateProjectId,
  validateTask,
  validateTaskId,
  validateComment,
  validatePagination,
  validateFileUpload,
  validateSearch,
  handleValidationErrors
};
