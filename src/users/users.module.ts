import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Users } from 'src/entities/Users';
import { UsersController } from './users.controller';
import { UsersService } from 'src/services/users.service';
import { CloudinaryService } from 'src/utils/cloudinary';
import { UserRooms } from 'src/entities/UserRooms';

@Module({
  imports: [TypeOrmModule.forFeature([Users, UserRooms])],
  controllers: [UsersController],
  providers: [UsersService, CloudinaryService],
})
export class UsersModule {}
