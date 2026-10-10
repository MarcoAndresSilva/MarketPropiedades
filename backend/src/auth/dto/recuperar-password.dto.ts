import { IsEmail } from 'class-validator';

export class RecuperarPasswordDto {
  @IsEmail()
  email: string;
}
