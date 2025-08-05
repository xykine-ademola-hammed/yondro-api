import { Request, Response, NextFunction } from 'express';

export interface ApiError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  error: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let { statusCode = 500, message } = error;

  // Handle Sequelize validation errors
  if (error.name === 'SequelizeValidationError') {
    statusCode = 400;
    message = 'Validation error';
  }

  // Handle Sequelize unique constraint errors
  if (error.name === 'SequelizeUniqueConstraintError') {
    statusCode = 409;
    message = 'Resource already exists';
  }

  // Handle Sequelize foreign key constraint errors
  if (error.name === 'SequelizeForeignKeyConstraintError') {
    statusCode = 400;
    message = 'Invalid foreign key reference';
  }

  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', error);
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
};

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: `Route ${req.originalUrl} not found`
  });
};