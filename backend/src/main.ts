import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // En Render la API está detrás de un proxy: sin esto, Express ve la IP del proxy en
  // todas las requests y el rate limit (login, consultas, métricas) se compartiría entre
  // todos los visitantes a la vez. Se confía en un salto: el del proxy de Render.
  app.set('trust proxy', 1);
  const config = app.get(ConfigService);

  // FRONTEND_URL admite varios orígenes separados por coma - hace falta mientras el
  // frontend vive temporalmente en Render (puente hasta que Netlify desbloquee sus
  // deploys) además del dominio real, sin tener que elegir uno solo.
  const frontendUrls = config
    .get<string>('FRONTEND_URL')
    ?.split(',')
    .map((url) => url.trim());
  app.enableCors({ origin: frontendUrls });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  await app.listen(config.get<number>('PORT') ?? 3002);
}
bootstrap();
