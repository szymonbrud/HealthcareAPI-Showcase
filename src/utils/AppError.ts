// src/utils/AppError.ts
export class AppError extends Error {
  statusCode: number;
  status: string;
  errors?: never[];
  isOperational: boolean;

  constructor(message: string, statusCode: number, errors?: never[]) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.errors = errors;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}
