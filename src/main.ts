import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { addProfile } from '@automapper/core';
import { mapper } from './config/mapper';
import { authProfile } from './auth/auth.profile';
import { json, urlencoded } from 'express';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));
  app.enableCors(configureCors(app));

  configAutoMapper();
  configSwagger(app);

  await app.listen(process.env.APP_PORT || 3001, () => {
    console.log(`App listening in ${process.env.APP_PORT || 3001}`);
  });
}
bootstrap();

function configAutoMapper() {
  addProfile(mapper, authProfile);
}

function configSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('CineWorld')
    .setDescription('CineWorld APIs document')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });
}

function configureCors(app: INestApplication) {
  return {
    allowedHeaders: '*',
    origin: '*',
  };
}
