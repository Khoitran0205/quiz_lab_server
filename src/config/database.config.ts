import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { join } from 'path';

@Injectable()
export class PostgresDbConfig implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      type: 'postgres',
      host: this.configService.get<string>('DATABASE_HOST'),
      port: this.configService.get<number>('DATABASE_PORT'),
      username: this.configService.get<string>('DATABASE_UID'),
      password: this.configService.get<string>('DATABASE_PWD'),
      database: this.configService.get<string>('DATABASE_NAME'),
      entities: [join(__dirname, '..', '/entities/*.{ts,js}')],
      synchronize: this.configService.get<string>('DATABASE_SYNC') === 'true',
      logging: true,
      ssl: {
        rejectUnauthorized: false,
      },
    };
  }
}
