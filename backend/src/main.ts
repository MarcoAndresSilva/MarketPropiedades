import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
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
