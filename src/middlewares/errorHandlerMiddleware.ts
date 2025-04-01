// src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { plainToInstance } from 'class-transformer';
import { AppError } from '../utils/AppError';
import { ErrorResponseDto } from '../dto/errors/ErrorResponseDto';

export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  next: NextFunction,
): void => {
  // Jeśli nagłówki zostały już wysłane, deleguj do domyślnego handlera Express
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = 'statusCode' in err ? err.statusCode : 500;
  const status = 'status' in err ? err.status : 'error';
  const message = err.message || 'Wystąpił błąd wewnętrzny';
  const errors = 'errors' in err ? err.errors : undefined;

  // W środowisku produkcyjnym nie zwracaj stack trace
  const stack = process.env.NODE_ENV === 'development' ? err.stack : undefined;

  const errorResponse = new ErrorResponseDto(status, statusCode, message, errors, stack);

  // Transformacja do DTO
  const formattedError = plainToInstance(ErrorResponseDto, errorResponse, {
    excludeExtraneousValues: true,
  });

  res.status(statusCode).json(formattedError);
};
