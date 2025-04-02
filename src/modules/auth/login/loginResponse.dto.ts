import { IsString, IsNotEmpty, ValidateNested } from 'class-validator';
import { Expose, Type } from 'class-transformer';
import { UserDto } from '../user.dto';

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
