import { IsInt, IsString, Min } from 'class-validator';

export class CreatePropertyFotoDto {
  @IsString()
  cloudinaryPublicId: string;

  @IsInt()
  @Min(0)
  orden: number;
}
