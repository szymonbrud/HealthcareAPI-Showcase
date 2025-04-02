import { Expose, Type } from 'class-transformer';
import { IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { UserDto } from '../user.dto';

export class RegisterSuccessResponseDto {
  @Expose()
  @IsString()
  @IsNotEmpty()
  message: string = 'Użytkownik został zarejestrowany pomyślnie';

  @Expose()
  @ValidateNested()
  @Type(() => UserDto)
  user!: UserDto;
}
