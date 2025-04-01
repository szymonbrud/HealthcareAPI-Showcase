import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

export const notFoundHandler = (_req: Request, _res: Response, next: NextFunction): void => {
  const error = new AppError('Nie znaleziono zasobu', 404);
  next(error);
};
