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
import { RoomsService } from 'src/services/rooms.service';
import { QuizzesService } from 'src/services/quizzes.service';
import { Quizzes } from 'src/entities/Quizzes';
import { Options } from 'src/entities/Options';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Users,
      UserRooms,
      Rooms,
      Questions,
      UserAnswers,
      Quizzes,
      Options,
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersService, RoomsService, QuizzesService, CloudinaryService],
})
export class UsersModule {}
