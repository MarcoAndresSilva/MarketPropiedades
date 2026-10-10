import { Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CuentaVerificadaGuard } from '../auth/roles';
import { UploadsService } from './uploads.service';

// Admin y anunciantes: cualquier cuenta con el correo verificado puede subir fotos.
@UseGuards(JwtAuthGuard, CuentaVerificadaGuard)
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploads: UploadsService) {}

  /** Datos firmados para que un panel suba una foto/video de propiedad directo a
   * Cloudinary (el archivo nunca pasa por el backend). */
  @Post('signature')
  createSignature() {
    return this.uploads.createPropertyMediaSignature();
  }
}
