import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PropertiesModule } from './properties/properties.module';
import { UploadsModule } from './uploads/uploads.module';
import { LocationsModule } from './locations/locations.module';
import { ConsultasModule } from './consultas/consultas.module';
import { MetricasModule } from './metricas/metricas.module';
import { ProyectosModule } from './proyectos/proyectos.module';
import { IndicadoresModule } from './indicadores/indicadores.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
    PrismaModule,
    AuthModule,
    UsersModule,
    PropertiesModule,
    UploadsModule,
    LocationsModule,
    ConsultasModule,
    MetricasModule,
    ProyectosModule,
    IndicadoresModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
