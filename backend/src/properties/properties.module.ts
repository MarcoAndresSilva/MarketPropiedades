import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { IndicadoresModule } from '../indicadores/indicadores.module';
import { PropertiesController } from './properties.controller';
import { PropertiesService } from './properties.service';
import { MisPropiedadesController } from './mis-propiedades.controller';
import { MisPropiedadesService } from './mis-propiedades.service';

@Module({
  imports: [AuthModule, IndicadoresModule],
  controllers: [PropertiesController, MisPropiedadesController],
  providers: [PropertiesService, MisPropiedadesService],
})
export class PropertiesModule {}
