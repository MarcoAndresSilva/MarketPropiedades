import { IsString, Length, MaxLength, MinLength } from 'class-validator';

// Token de 32 bytes en base64url = 43 caracteres. El largo exacto corta de entrada
// cualquier valor que no pueda ser un token emitido por TokensCuentaService.
export class VerificarEmailDto {
  @IsString()
  @Length(43, 43)
  token: string;
}

export class RestablecerPasswordDto extends VerificarEmailDto {
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;
}
