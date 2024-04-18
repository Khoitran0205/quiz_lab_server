import { Module } from '@nestjs/common';
import { PostgresDbConfig } from './config/database.config';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AutomapperModule } from '@automapper/nestjs';
import { classes } from '@automapper/classes';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      useClass: PostgresDbConfig,
    }),
    AutomapperModule.forRoot({
      strategyInitializer: classes(),
    }),
    AuthModule,
    UsersModule,
  ],
  controllers: [],
  providers: [PostgresDbConfig],
})
export class AppModule {}
