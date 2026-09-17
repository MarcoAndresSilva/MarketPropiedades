import { Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UploadsService } from './uploads.service';

@UseGuards(JwtAuthGuard)
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploads: UploadsService) {}

  /** Datos firmados para que el panel suba una foto/video de propiedad directo a
   * Cloudinary (el archivo nunca pasa por el backend). */
  @Post('signature')
  createSignature() {
    return this.uploads.createPropertyMediaSignature();
  }
}
