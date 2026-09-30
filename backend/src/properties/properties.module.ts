import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { IndicadoresModule } from '../indicadores/indicadores.module';
import { PropertiesController } from './properties.controller';
import { PropertiesService } from './properties.service';

@Module({
  imports: [AuthModule, IndicadoresModule],
  controllers: [PropertiesController],
  providers: [PropertiesService],
})
export class PropertiesModule {}
