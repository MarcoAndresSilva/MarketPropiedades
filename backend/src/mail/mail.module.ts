import { Global, Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { PlantillasCorreo } from './plantillas-correo';

// Global como PrismaModule: varios módulos mandan correos (auth, consultas, moderación).
@Global()
@Module({
  providers: [MailService, PlantillasCorreo],
  exports: [MailService, PlantillasCorreo],
})
export class MailModule {}
