import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Users } from 'src/entities/Users';
import { UsersController } from './users.controller';
import { UsersService } from 'src/services/users.service';
import { CloudinaryService } from 'src/utils/cloudinary';
import { UserRooms } from 'src/entities/UserRooms';
import { Rooms } from 'src/entities/Rooms';
import { Questions } from 'src/entities/Questions';
import { UserAnswers } from 'src/entities/UserAnswers';

@Module({
  imports: [
    TypeOrmModule.forFeature([Users, UserRooms, Rooms, Questions, UserAnswers]),
  ],
  controllers: [UsersController],
  providers: [UsersService, CloudinaryService],
})
export class UsersModule {}
