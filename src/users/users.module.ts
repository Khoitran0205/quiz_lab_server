import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Users } from 'src/entities/Users';
import { UsersController } from './users.controller';
import { UsersService } from 'src/services/users.service';
import { CloudinaryService } from 'src/utils/cloudinary';

@Module({
  imports: [TypeOrmModule.forFeature([Users])],
  controllers: [UsersController],
  providers: [UsersService, CloudinaryService],
})
export class UsersModule {}
