import { Expose } from 'class-transformer';
import { IsEmail, IsEnum, IsNumber } from 'class-validator';
import { UserRole } from './auth.types';

export class UserDto {
  @Expose()
  @IsNumber()
  id!: number;

  @Expose()
  @IsEmail()
  email!: string;

  @Expose()
  @IsEnum(UserRole)
  role!: UserRole;
}
