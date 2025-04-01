import { Expose } from 'class-transformer';
import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';

export class ErrorResponseDto {
  @Expose()
  @IsString()
  status: string;

  @Expose()
  @IsNumber()
  statusCode: number;

  @Expose()
  @IsString()
  message: string;

  @Expose()
  @IsOptional()
  @IsArray()
  errors?: never[];

  @Expose()
  @IsOptional()
  @IsString()
  stack?: string;

  constructor(
    status: string,
    statusCode: number,
    message: string,
    errors?: never[],
    stack?: string,
  ) {
    this.status = status;
    this.statusCode = statusCode;
    this.message = message;
    this.errors = errors;
    this.stack = stack;
  }
}
