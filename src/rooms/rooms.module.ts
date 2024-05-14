import { Module } from '@nestjs/common';
import { RoomsService } from '../services/rooms.service';
import { RoomsController } from './rooms.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Rooms } from 'src/entities/Rooms';
import { UserRooms } from 'src/entities/UserRooms';
import { QuizzesService } from 'src/services/quizzes.service';
import { Quizzes } from 'src/entities/Quizzes';
import { Questions } from 'src/entities/Questions';
import { Options } from 'src/entities/Options';
import { CloudinaryService } from 'src/utils/cloudinary';
import { UserAnswers } from 'src/entities/UserAnswers';
import { RoomsGateway } from './rooms.gateway';
import { UsersService } from 'src/services/users.service';
import { Users } from 'src/entities/Users';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Rooms,
      UserRooms,
      UserAnswers,
      Quizzes,
      Questions,
      Options,
      Users,
    ]),
  ],
  controllers: [RoomsController],
  providers: [
    RoomsService,
    UsersService,
    QuizzesService,
    CloudinaryService,
    RoomsGateway,
  ],
})
export class RoomsModule {}
