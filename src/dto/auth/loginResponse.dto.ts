import { IsString, IsEmail, IsEnum, IsNotEmpty, IsNumber, ValidateNested } from 'class-validator';
import { Expose, Type } from 'class-transformer';
import { UserRole } from '../../constants/types/authTypes';

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

export class LoginSuccessResponseDto {
  @Expose()
  @IsString()
  @IsNotEmpty()
  message: string = 'Zalogowano pomyślnie';

  @Expose()
  @IsString()
  @IsNotEmpty()
  accessToken!: string;

  @Expose()
  @ValidateNested()
  @Type(() => UserDto)
  user!: UserDto;
}
